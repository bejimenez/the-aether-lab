from functools import wraps
import os
from flask import request, jsonify
from src.models.user import User, db
import requests

def verify_supabase_token(token):
    """Verify token with Supabase Auth API"""
    try:
        # Get the correct Supabase project URL (not DATABASE_URL)
        supabase_url = os.environ.get('SUPABASE_URL', 'https://vbkzzbrrvullqlcdpxhb.supabase.co')
        supabase_anon_key = os.environ.get('SUPABASE_ANON_KEY')
        
        # Verify the token with Supabase Auth API
        response = requests.get(
            f"{supabase_url}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": supabase_anon_key
            }
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Token verification failed: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        try:
            # Extract token from Bearer scheme
            parts = auth_header.split(' ')
            if len(parts) != 2 or parts[0] != 'Bearer':
                return jsonify({'error': 'Invalid authorization header format'}), 401
                
            token = parts[1]
            
            # Verify with Supabase
            user_data = verify_supabase_token(token)
            
            if not user_data:
                return jsonify({'error': 'Invalid or expired token'}), 401
            
            # Get user profile from database
            auth_user_id = user_data.get('id')
            if not auth_user_id:
                return jsonify({'error': 'No user ID in token'}), 401
                
            user = User.query.filter_by(auth_user_id=auth_user_id).first()
            
            if not user:
                # If user doesn't exist, create them
                # This handles the case where Supabase auth succeeds but local user doesn't exist
                user = User(
                    auth_user_id=auth_user_id,
                    email=user_data.get('email', ''),
                    username=user_data.get('email', '').split('@')[0]  # Default username from email
                )
                db.session.add(user)
                db.session.commit()
                print(f"Created new user: {user.email}")
            
            # Add user to request context
            request.current_user = user
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"Auth error: {e}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function