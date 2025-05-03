from functools import wraps
from flask import request, jsonify, g
from src.infrastructure.config.firebase import FirebaseApp


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        firebase = FirebaseApp()
        
        auth_header = request.headers.get('Authorization')
        if auth_header:
            if auth_header.startswith('Bearer '):
                token = auth_header.split('Bearer ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        
        try:
            decoded_token = firebase.verify_id_token(token)
            if not decoded_token:
                return jsonify({'error': 'Invalid token!'}), 401
            
            g.user_id = decoded_token.get('uid')
            g.user_email = decoded_token.get('email')
            g.user_data = decoded_token
            
        except Exception as e:
            return jsonify({'error': f'Authentication failed: {str(e)}'}), 401
        
        return f(*args, **kwargs)
    
    return decorated