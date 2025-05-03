from typing import List, Optional, Dict, Any
from datetime import datetime
from firebase_admin import firestore

from src.domain.entities.fan import Fan, Address
from src.domain.repositories.fan_repository import FanRepository


class FirestoreFanRepository(FanRepository):
    def __init__(self):
        self.db = firestore.client()
        self.collection = self.db.collection('fans')
    
    def create(self, fan: Fan) -> Fan:
        """Create a new fan in Firestore"""
        fan_dict = fan.dict(exclude_none=True)
        
        # Add created_at timestamp
        fan_dict['created_at'] = datetime.now()
        
        # Convert address to dict if exists
        if fan.address:
            fan_dict['address'] = fan.address.dict(exclude_none=True)
        
        # Use user_id as document ID for easy retrieval
        doc_ref = self.collection.document(fan.user_id)
        doc_ref.set(fan_dict)
        
        # Retrieve the created document
        created_fan = doc_ref.get().to_dict()
        return Fan(**created_fan)
    
    def find_by_id(self, fan_id: str) -> Optional[Fan]:
        """Find fan by id - not used in this implementation"""
        pass
    
    def find_by_user_id(self, user_id: str) -> Optional[Fan]:
        """Find fan by user_id (Firebase Auth UID)"""
        doc_ref = self.collection.document(user_id)
        doc = doc_ref.get()
        
        if doc.exists:
            fan_data = doc.to_dict()
            
            # Convert Firestore timestamps to datetime objects
            if 'created_at' in fan_data and isinstance(fan_data['created_at'], firestore.Timestamp):
                fan_data['created_at'] = fan_data['created_at'].datetime
            
            if 'updated_at' in fan_data and isinstance(fan_data['updated_at'], firestore.Timestamp):
                fan_data['updated_at'] = fan_data['updated_at'].datetime
            
            if 'birth_date' in fan_data and isinstance(fan_data['birth_date'], firestore.Timestamp):
                fan_data['birth_date'] = fan_data['birth_date'].datetime
            
            # Handle nested address if it exists
            if 'address' in fan_data and fan_data['address']:
                address_data = fan_data['address']
                fan_data['address'] = Address(**address_data)
            
            return Fan(**fan_data)
        
        return None
    
    def update(self, fan: Fan) -> Fan:
        """Update fan"""
        fan_dict = fan.dict(exclude_none=True)
        
        # Add updated_at timestamp
        fan_dict['updated_at'] = datetime.now()
        
        # Convert address to dict if exists
        if fan.address:
            fan_dict['address'] = fan.address.dict(exclude_none=True)
        
        # Update document in Firestore
        doc_ref = self.collection.document(fan.user_id)
        doc_ref.update(fan_dict)
        
        # Retrieve the updated document
        updated_fan = doc_ref.get().to_dict()
        return Fan(**updated_fan)
    
    def update_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Fan:
        """Update fan profile data"""
        # Reference to the fan document
        doc_ref = self.collection.document(user_id)
        doc = doc_ref.get()
        
        # Check if fan document exists
        if doc.exists:
            # Update the existing document
            fan_data = doc.to_dict()
            
            # Handle address as a nested object
            if 'address' in profile_data:
                # If fan_data already has an address, update it
                if 'address' in fan_data and fan_data['address']:
                    fan_data['address'].update(profile_data['address'])
                else:
                    # Otherwise create a new address object
                    fan_data['address'] = profile_data['address']
                
                # Remove address from profile_data as it's handled separately
                del profile_data['address']
            
            # Update other fields
            fan_data.update(profile_data)
            
            # Add updated_at timestamp
            fan_data['updated_at'] = datetime.now()
            
            # Update Firestore
            doc_ref.update(fan_data)
        else:
            # Create a new fan document
            fan_data = {
                'user_id': user_id,
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
                **profile_data
            }
            
            # Set the document
            doc_ref.set(fan_data)
        
        # Retrieve the updated document
        updated_fan = doc_ref.get().to_dict()
        
        # Convert timestamps to datetime objects
        if 'created_at' in updated_fan and isinstance(updated_fan['created_at'], firestore.Timestamp):
            updated_fan['created_at'] = updated_fan['created_at'].datetime
        
        if 'updated_at' in updated_fan and isinstance(updated_fan['updated_at'], firestore.Timestamp):
            updated_fan['updated_at'] = updated_fan['updated_at'].datetime
        
        if 'birth_date' in updated_fan and isinstance(updated_fan['birth_date'], firestore.Timestamp):
            updated_fan['birth_date'] = updated_fan['birth_date'].datetime
        
        # Handle nested address if it exists
        if 'address' in updated_fan and updated_fan['address']:
            address_data = updated_fan['address']
            updated_fan['address'] = Address(**address_data)
        
        return Fan(**updated_fan) 