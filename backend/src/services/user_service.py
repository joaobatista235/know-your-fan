import firebase_admin
from firebase_admin import auth, firestore
from typing import Dict, Any, Optional
from datetime import datetime
import base64
import os
import json

# Dictionary to temporarily store profile images if Firestore is not available
# Key: user_id, Value: image_data
profile_image_cache = {}

# Firestore document size limit (in bytes) - approx 1MB
FIRESTORE_DOC_SIZE_LIMIT = 900000  # Using 900KB to be safe

# Try to get Firestore database instance, but don't fail if not available
try:
    db = firestore.client()
except Exception as e:
    print(f"Error initializing Firestore client: {e}")
    db = None

def _format_user_response(uid: str, user_data: Dict[str, Any] = None, fan_data: Dict[str, Any] = None) -> Dict[str, Any]:
    user = auth.get_user(uid)
    
    response_data = {
        "uid": uid,
        "email": user.email,
        "display_name": user.display_name,
        "email_verified": user.email_verified,
    }
    
    if not fan_data:
        response_data["profileComplete"] = False
        return response_data
    
    if fan_data.get('has_profile_image') == True:
        response_data['has_profile_image'] = True
    
    for key, value in fan_data.items():
        if key not in ['user_id', 'created_at', 'updated_at', 'address', 'profile_image_base64']:
            response_data[key] = value
    
    if 'address' in fan_data and fan_data['address']:
        address = fan_data['address']
        response_data['street'] = address.get('street')
        response_data['number'] = address.get('number')
        response_data['complement'] = address.get('complement')
        response_data['neighborhood'] = address.get('neighborhood')
        response_data['city'] = address.get('city')
        response_data['state'] = address.get('state')
        response_data['cep'] = address.get('postal_code')
    
    if 'birth_date' in fan_data:
        response_data['date_of_birth'] = fan_data['birth_date']
        
    if 'name' in fan_data and not response_data.get('display_name'):
        response_data['display_name'] = fan_data['name']
    
    required_fields = ['cpf', 'date_of_birth', 'street', 'city', 'state', 'cep']
    response_data["profileComplete"] = all(field in response_data and response_data[field] for field in required_fields)
    
    return response_data

def update_user_profile(uid: str, profile_data: Dict[str, Any], profile_image=None) -> Dict[str, Any]:
    try:
        auth_update = {}
        if 'display_name' in profile_data:
            auth_update['display_name'] = profile_data['display_name']
            
        if auth_update:
            auth.update_user(uid, **auth_update)
        
        if db is None:
            print("Firestore database is not available. Profile data will not be stored.")
            
            if profile_image and isinstance(profile_image, str):
                profile_image_cache[uid] = profile_image
                print(f"Cached profile image for user {uid}")
            
            user = auth.get_user(uid)
            response_data = _format_user_response(uid)
            
            if profile_image:
                response_data['has_profile_image'] = True
                
            for key, value in profile_data.items():
                if value is not None:
                    response_data[key] = value
            
            response_data["profileComplete"] = True
            return response_data
        
        fan_ref = db.collection('fans').document(uid)
        fan_doc = fan_ref.get()
        
        field_mapping = {
            'cpf': 'cpf',
            'date_of_birth': 'birth_date',
            'display_name': 'name',
            'cep': 'address.postal_code',
            'street': 'address.street',
            'number': 'address.number',
            'complement': 'address.complement',
            'neighborhood': 'address.neighborhood',
            'city': 'address.city',
            'state': 'address.state',
            'favorite_games': 'favorite_games',
            'favorite_teams': 'favorite_teams',
            'recent_events': 'recent_events'
        }
        
        fan_data = {
            'user_id': uid,
            'updated_at': datetime.now(),
            'profile_completeness': 100,
        }
        
        if profile_image and isinstance(profile_image, str):
            try:
                if ',' in profile_image:
                    base64_content = profile_image.split(',')[1]
                else:
                    base64_content = profile_image

                estimated_size = len(base64_content)
                
                if estimated_size > FIRESTORE_DOC_SIZE_LIMIT:
                    print(f"Profile image is too large ({estimated_size} bytes), resizing...")
                    fan_data['profile_image_size_exceeded'] = True
                    fan_data['has_profile_image'] = False
                    print("Profile image exceeds Firestore document size limit and cannot be stored.")
                else:
                    fan_data['profile_image_base64'] = base64_content
                    fan_data['has_profile_image'] = True
                    print(f"Profile image stored successfully in Firestore ({estimated_size} bytes)")
                    profile_image_cache[uid] = base64_content
            except Exception as img_error:
                print(f"Error processing profile image: {img_error}")
        
        address_fields = {}
        
        for frontend_key, value in profile_data.items():
            if value is None:
                continue
                
            if frontend_key in field_mapping:
                backend_key = field_mapping[frontend_key]
                
                if '.' in backend_key:
                    parent_key, child_key = backend_key.split('.', 1)
                    if parent_key == 'address':
                        address_fields[child_key] = value
                else:
                    fan_data[backend_key] = value
        
        if address_fields:
            if fan_doc.exists and fan_doc.to_dict().get('address'):
                existing_address = fan_doc.to_dict().get('address', {})
                address_fields = {**existing_address, **address_fields}
            
            fan_data['address'] = address_fields
        
        if fan_doc.exists:
            fan_ref.update(fan_data)
        else:
            fan_data['created_at'] = datetime.now()
            user = auth.get_user(uid)
            fan_data['email'] = user.email
            fan_ref.set(fan_data)
        
        updated_fan = fan_ref.get().to_dict()
        return _format_user_response(uid, profile_data, updated_fan)
    except Exception as e:
        print(f"Error updating user profile: {e}")
        raise ValueError(f"Failed to update user profile: {str(e)}")
        
def get_user_profile_image(uid: str) -> str:
    try:
        if uid in profile_image_cache:
            print(f"Using cached profile image for user {uid}")
            return profile_image_cache[uid]
            
        if db is not None:
            fan_doc = db.collection('fans').document(uid).get()
            if fan_doc.exists:
                fan_data = fan_doc.to_dict()
                if fan_data.get('profile_image_base64'):
                    print(f"Found profile image in Firestore for user {uid}")
                    
                    image_data = fan_data.get('profile_image_base64')
                    if not image_data.startswith('data:'):
                        image_data = f"data:image/jpeg;base64,{image_data}"
                        
                    profile_image_cache[uid] = image_data
                    return image_data
        
        print(f"No profile image found for user {uid}")
        return None
    except Exception as e:
        print(f"Error getting profile image: {e}")
        return None

def get_user_profile(uid: str) -> Dict[str, Any]:
    try:
        if db is None:
            print("Firestore database is not available. Only basic profile data will be returned.")
            return _format_user_response(uid)
        
        fan_ref = db.collection('fans').document(uid)
        fan_doc = fan_ref.get()
        
        if not fan_doc.exists:
            print(f"No fan document exists for user {uid}")
            return _format_user_response(uid)
            
        fan_data = fan_doc.to_dict()
        return _format_user_response(uid, None, fan_data)
        
    except Exception as e:
        print(f"Error getting user profile: {e}")
        raise ValueError(f"Failed to get user profile: {str(e)}") 