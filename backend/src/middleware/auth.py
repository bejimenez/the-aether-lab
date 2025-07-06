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
        
        print(f"DEBUG: Using Supabase URL: {supabase_url}")
        print(f"DEBUG: Has anon key: {bool(supabase_anon_key)}")
        print(f"DEBUG: Token length: {len(token) if token else 0}")
        
        # Verify the token with Supabase Auth API
        auth_url = f"{supabase_url}/auth/v1/user"
        print(f"DEBUG: Making request to: {auth_url}")
        
        response = requests.get(
            auth_url,
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": supabase_anon_key
            },
            timeout=10
        )
        
        print(f"DEBUG: Response status: {response.status_code}")
        print(f"DEBUG: Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"DEBUG: User data received: {user_data.get('id', 'no-id')}")
            return user_data
        else:
            print(f"DEBUG: Token verification failed: {response.status_code}")
            print(f"DEBUG: Response body: {response.text}")
            return None
            
    except Exception as e:
        print(f"DEBUG: Token verification error: {e}")
        import traceback
        print(f"DEBUG: Full traceback: {traceback.format_exc()}")
        return None

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        print(f"DEBUG: Auth header present: {bool(auth_header)}")
        
        if not auth_header:
            print("DEBUG: No authorization header")
            return jsonify({'error': 'No authorization header'}), 401
        
        try:
            # Extract token from Bearer scheme
            parts = auth_header.split(' ')
            if len(parts) != 2 or parts[0] != 'Bearer':
                print("DEBUG: Invalid authorization header format")
                return jsonify({'error': 'Invalid authorization header format'}), 401
                
            token = parts[1]
            print(f"DEBUG: Extracted token (first 20 chars): {token[:20]}...")
            
            # Verify with Supabase
            user_data = verify_supabase_token(token)
            
            if not user_data:
                print("DEBUG: Token verification returned None")
                return jsonify({'error': 'Invalid or expired token'}), 401
            
            # Get user profile from database
            auth_user_id = user_data.get('id')
            if not auth_user_id:
                print("DEBUG: No user ID in token response")
                return jsonify({'error': 'No user ID in token'}), 401
                
            user = User.query.filter_by(auth_user_id=auth_user_id).first()
            
            if not user:
                print(f"DEBUG: Creating new user for auth_user_id: {auth_user_id}")
                # If user doesn't exist, create them
                user = User(
                    auth_user_id=auth_user_id,
                    email=user_data.get('email', ''),
                    username=user_data.get('email', '').split('@')[0]
                )
                db.session.add(user)
                db.session.commit()
                print(f"DEBUG: Created new user: {user.email}")
            else:
                print(f"DEBUG: Found existing user: {user.email}")
            
            # Add user to request context
            request.current_user = user
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"DEBUG: Auth error: {e}")
            import traceback
            print(f"DEBUG: Auth traceback: {traceback.format_exc()}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function