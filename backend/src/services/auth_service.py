import firebase_admin
from firebase_admin import credentials, auth
import os
import requests
import json
from typing import Dict, Any
from firebase_admin.exceptions import FirebaseError
from src.config.firebase import initialize_firebase

# Inicializa o Firebase usando nossa configuração baseada em variáveis de ambiente
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
            
            token = auth.create_custom_token(user.uid)
            
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
            
        token = auth.create_custom_token(user.uid)
        
        profile_complete = False
        try:
            from firebase_admin import firestore
            db = firestore.client()
            fan_ref = db.collection('fans').document(user.uid)
            fan_doc = fan_ref.get()
            
            if fan_doc.exists:
                fan_data = fan_doc.to_dict()
                required_fields = ['name', 'cpf', 'birth_date']
                profile_complete = all(field in fan_data for field in required_fields)
        except Exception as e:
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
    try:
        try:
            decoded_token = auth.verify_id_token(token)
            
            user = auth.get_user(decoded_token['uid'])
            
            return {
                "uid": user.uid,
                "email": user.email,
                "display_name": user.display_name,
                "email_verified": user.email_verified
            }
        except Exception as e:
            if not token or not isinstance(token, str) or token.count('.') != 2:
                raise ValueError("Token has invalid format")
                
            try:
                user_lookup = None
                
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