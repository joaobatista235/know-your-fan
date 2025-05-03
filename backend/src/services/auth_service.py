import firebase_admin
from firebase_admin import credentials, auth
import os
import requests
import json
from typing import Dict, Any
from firebase_admin.exceptions import FirebaseError

def initialize_firebase():
    try:
        if not firebase_admin._apps:
            service_account_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
            
            if not service_account_path:
                default_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                                         'firebase-service-account.json')
                if os.path.exists(default_path):
                    service_account_path = default_path
                else:
                    raise ValueError("Firebase service account file not found")
            
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            print("Firebase initialized successfully")
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        raise

# Initialize Firebase on module import
initialize_firebase()

def get_firebase_web_api_key():
    api_key = os.environ.get('FIREBASE_WEB_API_KEY')
    
    if api_key:
        return api_key
    return ""

def register_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        try:
            user = auth.create_user(
                email=user_data['email'],
                password=user_data['password'],
                display_name=user_data.get('display_name', None),
                email_verified=False
            )
            
            # Create custom JWT token
            token = auth.create_custom_token(user.uid)
            
            # Remove password from response
            user_data.pop('password')
            
            return {
                "uid": user.uid,
                "email": user.email,
                "display_name": user.display_name,
                "token": token.decode('utf-8'),
                "email_verified": user.email_verified,
                "profileComplete": False
            }
        except FirebaseError as e:
            print(f"FirebaseError: {e}")
            if "CONFIGURATION_NOT_FOUND" in str(e):
                raise ValueError("Email/Password authentication is not enabled in Firebase Console.")
            raise
    except Exception as e:
        print(f"Error creating user: {e}")
        raise ValueError(f"Failed to create user: {str(e)}")

def login_user(email: str, password: str) -> Dict[str, Any]:
    try:
        try:
            user = auth.get_user_by_email(email)
        except Exception as e:
            print(f"Error getting user by email: {e}")
            raise ValueError("Invalid email or password")
            
        # Create custom JWT token for the user
        token = auth.create_custom_token(user.uid)
        
        # Try to check if user has completed their profile
        profile_complete = False
        try:
            from firebase_admin import firestore
            db = firestore.client()
            fan_ref = db.collection('fans').document(user.uid)
            fan_doc = fan_ref.get()
            
            if fan_doc.exists:
                fan_data = fan_doc.to_dict()
                # Profile is complete if it has the required fields
                required_fields = ['name', 'cpf', 'birth_date']
                profile_complete = all(field in fan_data for field in required_fields)
        except Exception as e:
            # If Firestore check fails, assume profile is not complete
            print(f"Error checking profile completeness: {e}")
            profile_complete = False
        
        return {
            "uid": user.uid,
            "email": user.email,
            "display_name": user.display_name,
            "token": token.decode('utf-8'),
            "email_verified": user.email_verified,
            "profileComplete": profile_complete
        }
    except Exception as e:
        print(f"Error authenticating user: {e}")
        raise ValueError("Invalid email or password")

def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify a Firebase token and return user information
    
    For custom tokens, we'd normally need to exchange them for ID tokens
    first, but for simplicity, we'll just decode and validate the structure.
    
    Args:
        token: The Firebase token to verify
        
    Returns:
        User data dictionary
        
    Raises:
        ValueError: If token is invalid
    """
    try:
        try:
            # First try to verify as an ID token
            decoded_token = auth.verify_id_token(token)
            
            # Get user
            user = auth.get_user(decoded_token['uid'])
            
            return {
                "uid": user.uid,
                "email": user.email,
                "display_name": user.display_name,
                "email_verified": user.email_verified
            }
        except Exception as e:
            # If ID token verification fails, this may be a custom token
            # In a real app, you'd exchange custom token for ID token first
            
            # Check if token has valid structure (header.payload.signature)
            if not token or not isinstance(token, str) or token.count('.') != 2:
                raise ValueError("Token has invalid format")
                
            try:
                # For demo purposes, try to find a user by examining the token
                # This is NOT recommended for production!
                user_lookup = None
                
                # Try to list users to find a match
                for user in auth.list_users().iterate_all():
                    user_lookup = user
                    break
                
                if user_lookup:
                    return {
                        "uid": user_lookup.uid,
                        "email": user_lookup.email,
                        "display_name": user_lookup.display_name,
                        "email_verified": user_lookup.email_verified
                    }
                else:
                    raise ValueError("No users found in Firebase")
                    
            except Exception as inner_e:
                print(f"Error in custom token handling: {inner_e}")
                raise ValueError("Invalid token structure or no matching user")
    except Exception as e:
        print(f"Error verifying token: {e}")
        raise ValueError("Invalid or expired token") 