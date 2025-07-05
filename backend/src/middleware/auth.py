from functools import wraps
import jwt
import os
from flask import request, jsonify
from src.models.user import User

def verify_jwt_token(token):
    """Verify Supabase JWT token"""
    try:
        # Get your Supabase JWT secret from environment
        secret = os.environ.get('SUPABASE_ANON_KEY')
        decoded = jwt.decode(token, secret, algorithms=['HS256'])
        return decoded
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        try:
            token = auth_header.split(' ')[1]  # Remove 'Bearer ' prefix
            payload = verify_jwt_token(token)
            if not payload:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Get user profile from database
            user = User.query.filter_by(auth_user_id=payload['sub']).first()
            if not user:
                return jsonify({'error': 'User not found'}), 401
            
            # Add user to request context
            request.current_user = user
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function