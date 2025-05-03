from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from src.domain.entities.fan import Fan, Document, SocialMedia, EsportsActivity
from src.domain.repositories.fan_repository import FanRepository
from src.infrastructure.config.firebase import FirebaseApp


class FirestoreFanRepository(FanRepository):
    def __init__(self):
        self.firebase = FirebaseApp()
        self.db = self.firebase.db
        self.collection = self.db.collection('fans')
    
    def _convert_to_fan(self, doc_dict: Dict, doc_id: str = None) -> Fan:
        """Convert Firestore dict to Fan entity"""
        if not doc_dict:
            return None
        
        # Adicionar id se disponível
        if doc_id:
            doc_dict['id'] = doc_id
            
        # Converter timestamps
        for key in ['created_at', 'updated_at', 'birth_date']:
            if key in doc_dict and doc_dict[key]:
                if isinstance(doc_dict[key], (int, float)):
                    doc_dict[key] = datetime.fromtimestamp(doc_dict[key])
        
        # Converter timestamps em sub-objetos
        if 'documents' in doc_dict and doc_dict['documents']:
            for doc in doc_dict['documents']:
                if 'verification_date' in doc and doc['verification_date']:
                    if isinstance(doc['verification_date'], (int, float)):
                        doc['verification_date'] = datetime.fromtimestamp(doc['verification_date'])
        
        if 'social_media' in doc_dict and doc_dict['social_media']:
            for social in doc_dict['social_media']:
                if 'last_sync' in social and social['last_sync']:
                    if isinstance(social['last_sync'], (int, float)):
                        social['last_sync'] = datetime.fromtimestamp(social['last_sync'])
        
        if 'esports_profiles' in doc_dict and doc_dict['esports_profiles']:
            for profile in doc_dict['esports_profiles']:
                if 'verification_date' in profile and profile['verification_date']:
                    if isinstance(profile['verification_date'], (int, float)):
                        profile['verification_date'] = datetime.fromtimestamp(profile['verification_date'])
        
        if 'event_interests' in doc_dict and doc_dict['event_interests']:
            for event in doc_dict['event_interests']:
                if 'date' in event and event['date']:
                    if isinstance(event['date'], (int, float)):
                        event['date'] = datetime.fromtimestamp(event['date'])
        
        if 'purchases' in doc_dict and doc_dict['purchases']:
            for purchase in doc_dict['purchases']:
                if 'purchase_date' in purchase and purchase['purchase_date']:
                    if isinstance(purchase['purchase_date'], (int, float)):
                        purchase['purchase_date'] = datetime.fromtimestamp(purchase['purchase_date'])
        
        # Converter para objeto Fan
        try:
            return Fan(**doc_dict)
        except Exception as e:
            print(f"Error converting to Fan: {e}")
            print(f"Document data: {doc_dict}")
            return None
    
    def _convert_to_dict(self, fan: Fan) -> Dict:
        """Convert Fan entity to Firestore dict"""
        fan_dict = fan.dict()
        
        # Remover id se for None
        if 'id' in fan_dict and fan_dict['id'] is None:
            del fan_dict['id']
            
        return fan_dict
        
    def create(self, fan: Fan) -> Fan:
        fan_dict = self._convert_to_dict(fan)
        
        # Definir timestamp de criação
        fan_dict['created_at'] = datetime.now()
        
        # Adicionar ao Firestore
        doc_ref = self.collection.document()
        doc_ref.set(fan_dict)
        
        # Atualizar com ID gerado
        fan.id = doc_ref.id
        return fan
    
    def find_by_id(self, fan_id: str) -> Optional[Fan]:
        doc = self.collection.document(fan_id).get()
        if doc.exists:
            return self._convert_to_fan(doc.to_dict(), doc.id)
        return None
    
    def find_by_user_id(self, user_id: str) -> Optional[Fan]:
        # Consultar por user_id
        query = self.collection.where('user_id', '==', user_id).limit(1)
        docs = query.stream()
        
        for doc in docs:
            return self._convert_to_fan(doc.to_dict(), doc.id)
        
        return None
    
    def find_all(self, filters: Dict[str, Any] = None, limit: int = 100) -> List[Fan]:
        # Iniciar consulta
        query = self.collection
        
        # Aplicar filtros se fornecidos
        if filters:
            for field, value in filters.items():
                query = query.where(field, '==', value)
        
        # Limitar resultados
        query = query.limit(limit)
        
        # Executar consulta
        docs = query.stream()
        
        # Converter resultados
        fans = []
        for doc in docs:
            fan = self._convert_to_fan(doc.to_dict(), doc.id)
            if fan:
                fans.append(fan)
        
        return fans
    
    def update(self, fan: Fan) -> Fan:
        if not fan.id:
            raise ValueError("Fan ID is required for update operation")
        
        fan_dict = self._convert_to_dict(fan)
        fan_dict['updated_at'] = datetime.now()
        
        # Atualizar no Firestore
        self.collection.document(fan.id).update(fan_dict)
        return fan
    
    def delete(self, fan_id: str) -> bool:
        try:
            self.collection.document(fan_id).delete()
            return True
        except Exception as e:
            print(f"Error deleting fan: {e}")
            return False
    
    def add_document(self, fan_id: str, document: Document) -> Fan:
        fan = self.find_by_id(fan_id)
        if not fan:
            raise ValueError(f"Fan with ID {fan_id} not found")
        
        # Adicionar documento à lista
        fan.documents.append(document)
        
        # Atualizar no Firestore
        return self.update(fan)
    
    def verify_document(self, fan_id: str, doc_id: str, verified: bool) -> Fan:
        fan = self.find_by_id(fan_id)
        if not fan:
            raise ValueError(f"Fan with ID {fan_id} not found")
        
        # Encontrar documento por ID (assumindo que doc_id é o doc_number)
        for doc in fan.documents:
            if doc.doc_number == doc_id:
                doc.verified = verified
                doc.verification_date = datetime.now()
                break
        
        # Atualizar no Firestore
        return self.update(fan)
    
    def add_social_media(self, fan_id: str, social_media: SocialMedia) -> Fan:
        fan = self.find_by_id(fan_id)
        if not fan:
            raise ValueError(f"Fan with ID {fan_id} not found")
        
        # Verificar se já existe uma conta para esta plataforma
        for i, sm in enumerate(fan.social_media):
            if sm.platform == social_media.platform:
                # Atualizar existente
                fan.social_media[i] = social_media
                return self.update(fan)
        
        # Adicionar nova
        fan.social_media.append(social_media)
        return self.update(fan)
    
    def update_social_media(self, fan_id: str, platform: str, connected: bool) -> Fan:
        fan = self.find_by_id(fan_id)
        if not fan:
            raise ValueError(f"Fan with ID {fan_id} not found")
        
        # Encontrar conta de mídia social
        for sm in fan.social_media:
            if sm.platform == platform:
                sm.connected = connected
                sm.last_sync = datetime.now() if connected else sm.last_sync
                break
        
        # Atualizar no Firestore
        return self.update(fan)
    
    def add_esports_profile(self, fan_id: str, profile: EsportsActivity) -> Fan:
        fan = self.find_by_id(fan_id)
        if not fan:
            raise ValueError(f"Fan with ID {fan_id} not found")
        
        # Verificar se já existe um perfil para esta plataforma
        for i, p in enumerate(fan.esports_profiles):
            if p.platform == profile.platform:
                # Atualizar existente
                fan.esports_profiles[i] = profile
                return self.update(fan)
        
        # Adicionar novo
        fan.esports_profiles.append(profile)
        return self.update(fan)
    
    def verify_esports_profile(self, fan_id: str, platform: str, verified: bool) -> Fan:
        fan = self.find_by_id(fan_id)
        if not fan:
            raise ValueError(f"Fan with ID {fan_id} not found")
        
        # Encontrar perfil de esports
        for profile in fan.esports_profiles:
            if profile.platform == platform:
                profile.verified = verified
                profile.verification_date = datetime.now()
                break
        
        # Atualizar no Firestore
        return self.update(fan) 