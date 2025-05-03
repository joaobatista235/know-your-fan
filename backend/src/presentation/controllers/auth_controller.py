from flask import Flask, request, jsonify
from firebase_admin import auth
from src.infrastructure.config.firebase import FirebaseApp


def setup_auth_routes(app: Flask):
    firebase = FirebaseApp()
    
    @app.route('/api/auth/token-verify', methods=['POST'])
    def verify_token():
        data = request.json
        
        if not data or 'token' not in data:
            return jsonify({"error": "No token provided"}), 400
            
        try:
            decoded_token = firebase.verify_id_token(data['token'])
            
            if not decoded_token:
                return jsonify({"error": "Invalid token"}), 401
                
            return jsonify({
                "user_id": decoded_token.get('uid'),
                "email": decoded_token.get('email'),
                "email_verified": decoded_token.get('email_verified', False),
                "name": decoded_token.get('name'),
                "picture": decoded_token.get('picture')
            }), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 401
    
    @app.route('/api/auth/user', methods=['GET'])
    def get_user_info():
        token = None
        
        auth_header = request.headers.get('Authorization')
        if auth_header:
            if auth_header.startswith('Bearer '):
                token = auth_header.split('Bearer ')[1]
        
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            decoded_token = firebase.verify_id_token(token)
            
            if not decoded_token:
                return jsonify({"error": "Invalid token"}), 401
                
            user_record = auth.get_user(decoded_token.get('uid'))
            
            return jsonify({
                "user_id": user_record.uid,
                "email": user_record.email,
                "email_verified": user_record.email_verified,
                "display_name": user_record.display_name,
                "photo_url": user_record.photo_url,
                "disabled": user_record.disabled,
                "provider_data": [
                    {
                        "provider_id": provider.provider_id,
                        "display_name": provider.display_name,
                        "email": provider.email
                    } for provider in user_record.provider_data
                ]
            }), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 401 