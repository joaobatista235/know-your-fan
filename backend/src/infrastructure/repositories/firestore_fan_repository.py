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
        fan_dict = fan.dict(exclude_none=True)
        
        fan_dict['created_at'] = datetime.now()
        
        if fan.address:
            fan_dict['address'] = fan.address.dict(exclude_none=True)
        
        doc_ref = self.collection.document(fan.user_id)
        doc_ref.set(fan_dict)
        
        created_fan = doc_ref.get().to_dict()
        return Fan(**created_fan)
    
    def find_by_user_id(self, user_id: str) -> Optional[Fan]:
        doc_ref = self.collection.document(user_id)
        doc = doc_ref.get()
        
        if doc.exists:
            fan_data = doc.to_dict()
            
            if 'created_at' in fan_data and isinstance(fan_data['created_at'], firestore.Timestamp):
                fan_data['created_at'] = fan_data['created_at'].datetime
            
            if 'updated_at' in fan_data and isinstance(fan_data['updated_at'], firestore.Timestamp):
                fan_data['updated_at'] = fan_data['updated_at'].datetime
            
            if 'birth_date' in fan_data and isinstance(fan_data['birth_date'], firestore.Timestamp):
                fan_data['birth_date'] = fan_data['birth_date'].datetime
            
            if 'address' in fan_data and fan_data['address']:
                address_data = fan_data['address']
                fan_data['address'] = Address(**address_data)
            
            return Fan(**fan_data)
        
        return None
    
    def update(self, fan: Fan) -> Fan:
        fan_dict = fan.dict(exclude_none=True)
        
        fan_dict['updated_at'] = datetime.now()
        
        if fan.address:
            fan_dict['address'] = fan.address.dict(exclude_none=True)
        
        doc_ref = self.collection.document(fan.user_id)
        doc_ref.update(fan_dict)
        
        updated_fan = doc_ref.get().to_dict()
        return Fan(**updated_fan)
    
    def update_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Fan:
        doc_ref = self.collection.document(user_id)
        doc = doc_ref.get()
        
        if doc.exists:
            fan_data = doc.to_dict()
            
            if 'address' in profile_data:
                if 'address' in fan_data and fan_data['address']:
                    fan_data['address'].update(profile_data['address'])
                else:
                    fan_data['address'] = profile_data['address']
                
                del profile_data['address']
            
            fan_data.update(profile_data)
            
            fan_data['updated_at'] = datetime.now()
            
            doc_ref.update(fan_data)
        else:
            fan_data = {
                'user_id': user_id,
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
                **profile_data
            }
            
            doc_ref.set(fan_data)
        
        updated_fan = doc_ref.get().to_dict()
        
        if 'created_at' in updated_fan and isinstance(updated_fan['created_at'], firestore.Timestamp):
            updated_fan['created_at'] = updated_fan['created_at'].datetime
        
        if 'updated_at' in updated_fan and isinstance(updated_fan['updated_at'], firestore.Timestamp):
            updated_fan['updated_at'] = updated_fan['updated_at'].datetime
        
        if 'birth_date' in updated_fan and isinstance(updated_fan['birth_date'], firestore.Timestamp):
            updated_fan['birth_date'] = updated_fan['birth_date'].datetime
        
        if 'address' in updated_fan and updated_fan['address']:
            address_data = updated_fan['address']
            updated_fan['address'] = Address(**address_data)
        
        return Fan(**updated_fan) 