from flask import Flask, jsonify, request
from datetime import datetime
from src.services.auth_service import register_user, login_user, verify_token
from src.services.user_service import update_user_profile, get_user_profile_image
from functools import wraps

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({"error": "Authorization header is missing"}), 401
            
        try:
            # Extract token from Bearer header
            token_parts = auth_header.split()
            if len(token_parts) != 2 or token_parts[0].lower() != 'bearer':
                return jsonify({"error": "Invalid authorization header format"}), 401
                
            token = token_parts[1]
            user = verify_token(token)
            return f(user, *args, **kwargs)
        except Exception as e:
            return jsonify({"error": str(e)}), 401
    
    return decorated

def setup_routes(app: Flask):
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "ok",
            "timestamp": datetime.now().isoformat()
        }), 200
    
    @app.route('/api/auth/register', methods=['POST'])
    def register():
        data = request.json
        
        if not data:
            return jsonify({"error": "Request body is empty"}), 400
            
        if 'email' not in data:
            return jsonify({"error": "Email is required"}), 400
            
        if 'password' not in data:
            return jsonify({"error": "Password is required"}), 400
        
        try:
            user = register_user(data)
            return jsonify({
                "message": "User registered successfully",
                "user": user
            }), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            app.logger.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        data = request.json
        
        if not data:
            return jsonify({"error": "Request body is empty"}), 400
            
        if 'email' not in data:
            return jsonify({"error": "Email is required"}), 400
            
        if 'password' not in data:
            return jsonify({"error": "Password is required"}), 400
        
        try:
            user = login_user(data['email'], data['password'])
            return jsonify({
                "message": "Login successful",
                "user": user
            }), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 401
        except Exception as e:
            app.logger.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500
            
    @app.route('/api/auth/verify', methods=['POST'])
    def verify():
        data = request.json
        
        if not data or 'token' not in data:
            return jsonify({"error": "Token is required"}), 400
            
        try:
            user = verify_token(data['token'])
            return jsonify({
                "valid": True,
                "message": "Token is valid",
                "user": user
            }), 200
        except ValueError as e:
            return jsonify({
                "valid": False, 
                "error": str(e)
            }), 401
        except Exception as e:
            app.logger.error(f"Unexpected error: {str(e)}")
            return jsonify({
                "valid": False,
                "error": "An unexpected error occurred. Please try again later."
            }), 500
    
    @app.route('/api/users/profile', methods=['PUT'])
    @token_required
    def update_profile(user):
        try:
            profile_data = request.json if request.is_json else {}
            profile_image = None
            
            if profile_data and 'profileImage' in profile_data and isinstance(profile_data['profileImage'], str):
                profile_image = profile_data.pop('profileImage')
                app.logger.info("Profile image received for processing")
            
            updated_user = update_user_profile(user['uid'], profile_data, profile_image)
            
            # Check if profile image was processed successfully
            if profile_image and not updated_user.get('has_profile_image', False):
                app.logger.warning("Profile image was not stored in Firestore due to size constraints")
                
            return jsonify({
                "message": "Profile updated successfully",
                "user": updated_user
            }), 200
        except ValueError as e:
            app.logger.error(f"Error updating profile: {str(e)}")
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            app.logger.error(f"Unexpected error updating profile: {str(e)}")
            return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500
    
    @app.route('/api/users/profile/image', methods=['GET'])
    @token_required
    def get_profile_image(user):
        try:
            user_id = user['uid']
            app.logger.info(f"Retrieving profile image for user: {user_id}")
            
            try:
                # Get profile image using the user service
                image_data = get_user_profile_image(user_id)
                
                if not image_data:
                    app.logger.warning(f"No profile image found for user: {user_id}")
                    return jsonify({
                        "error": "Profile image not found",
                        "message": "User has not uploaded a profile image yet."
                    }), 404
                
                app.logger.info(f"Successfully retrieved profile image for user: {user_id}")
                return jsonify({
                    "profile_image": image_data
                }), 200
            except ValueError as e:
                app.logger.error(f"Database error: {str(e)}")
                return jsonify({
                    "error": str(e),
                    "message": "Could not access the database. Please check Firestore settings."
                }), 503
            except Exception as e:
                app.logger.error(f"Error accessing database: {str(e)}")
                return jsonify({
                    "error": "Database service unavailable",
                    "message": "Could not access Firestore database. Please check your Firebase settings."
                }), 503
            
        except Exception as e:
            app.logger.error(f"Error getting profile image: {str(e)}")
            return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500 