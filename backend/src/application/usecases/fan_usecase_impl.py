from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import uuid
import requests
from io import BytesIO
from PIL import Image

from src.domain.entities.fan import Fan, Document, SocialMedia, EsportsActivity, EventInterest, Purchase
from src.domain.usecases.fan_usecase import FanUseCase
from src.domain.repositories.fan_repository import FanRepository
from src.infrastructure.config.firebase import FirebaseApp


class FanUseCaseImpl(FanUseCase):
    def __init__(self, fan_repository: FanRepository):
        self.fan_repository = fan_repository
        self.firebase = FirebaseApp()
        self.bucket = self.firebase.bucket
    
    def create_profile(self, fan_data: Dict[str, Any]) -> Fan:
        """Create a new fan profile"""
        try:
            # Criar objeto Fan
            fan = Fan(**fan_data)
            
            # Calcular completude do perfil
            fan.profile_completeness = self._calculate_profile_completeness_for_fan(fan)
            
            # Salvar no repositório
            return self.fan_repository.create(fan)
        except Exception as e:
            raise ValueError(f"Error creating fan profile: {str(e)}")
    
    def get_profile(self, user_id: str) -> Optional[Fan]:
        """Get fan profile by user ID"""
        return self.fan_repository.find_by_user_id(user_id)
    
    def update_profile(self, user_id: str, fan_data: Dict[str, Any]) -> Fan:
        """Update fan profile data"""
        # Buscar perfil existente
        fan = self.fan_repository.find_by_user_id(user_id)
        if not fan:
            raise ValueError(f"Fan profile not found for user ID: {user_id}")
        
        # Atualizar campos
        for key, value in fan_data.items():
            if hasattr(fan, key) and key not in ['id', 'user_id', 'created_at']:
                setattr(fan, key, value)
        
        # Recalcular completude
        fan.profile_completeness = self._calculate_profile_completeness_for_fan(fan)
        
        # Salvar no repositório
        return self.fan_repository.update(fan)
    
    def _upload_file_to_storage(self, file_data: bytes, path: str, content_type: str = 'application/octet-stream') -> str:
        """Upload file to Firebase Storage and return public URL"""
        try:
            # Criar referência para o arquivo
            blob = self.bucket.blob(path)
            
            # Fazer upload
            blob.upload_from_string(file_data, content_type=content_type)
            
            # Tornar o arquivo público e retornar URL
            blob.make_public()
            return blob.public_url
        except Exception as e:
            print(f"Error uploading file: {e}")
            raise
    
    def upload_document(self, user_id: str, doc_type: str, doc_number: str, file_data: bytes) -> Document:
        """Upload a document for verification"""
        # Buscar perfil existente
        fan = self.fan_repository.find_by_user_id(user_id)
        if not fan:
            raise ValueError(f"Fan profile not found for user ID: {user_id}")
        
        # Criar path para o arquivo
        path = f"documents/{user_id}/{doc_type.lower()}_{uuid.uuid4()}.jpg"
        
        # Fazer upload do arquivo
        try:
            document_url = self._upload_file_to_storage(file_data, path, 'image/jpeg')
            
            # Criar documento
            document = Document(
                doc_type=doc_type,
                doc_number=doc_number,
                verified=False,
                document_url=document_url
            )
            
            # Adicionar ao perfil
            updated_fan = self.fan_repository.add_document(fan.id, document)
            
            # Iniciar verificação assíncrona (em uma implementação real, isto seria uma tarefa de fundo)
            self.verify_document_async(fan.id, doc_number)
            
            return document
            
        except Exception as e:
            raise ValueError(f"Error uploading document: {str(e)}")
    
    def verify_document_async(self, fan_id: str, doc_id: str):
        """Simulate async document verification with AI (in real implementation this would be a background task)"""
        try:
            # Simular verificação por AI (em uma implementação real, isto chamaria um serviço de IA)
            # Aqui estamos apenas simulando um resultado positivo após 'processamento'
            is_valid = True
            
            # Atualizar documento como verificado
            self.fan_repository.verify_document(fan_id, doc_id, is_valid)
            
            # Recalcular completude do perfil
            fan = self.fan_repository.find_by_id(fan_id)
            if fan:
                fan.profile_completeness = self._calculate_profile_completeness_for_fan(fan)
                self.fan_repository.update(fan)
                
        except Exception as e:
            print(f"Error in document verification: {e}")
    
    def verify_document(self, doc_id: str) -> bool:
        """Manually verify a document (would be done by AI in real implementation)"""
        # Nota: Esta é uma simplificação. Em um sistema real,
        # este método seria chamado por um webhook após o processamento de IA
        return True
    
    def connect_social_media(self, user_id: str, platform: str, profile_url: str, access_token: str = None) -> SocialMedia:
        """Connect a social media account"""
        # Buscar perfil existente
        fan = self.fan_repository.find_by_user_id(user_id)
        if not fan:
            raise ValueError(f"Fan profile not found for user ID: {user_id}")
        
        # Extrair username do profile_url (simplificação)
        username = profile_url.split('/')[-1]
        
        # Criar objeto de mídia social
        social_media = SocialMedia(
            platform=platform,
            profile_url=profile_url,
            username=username,
            connected=True,
            last_sync=datetime.now()
        )
        
        # Adicionar ao perfil
        updated_fan = self.fan_repository.add_social_media(fan.id, social_media)
        
        # Sincronizar dados (em uma implementação real, isto seria assíncrono)
        self.sync_social_media_data(user_id, platform)
        
        # Recalcular completude
        updated_fan.profile_completeness = self._calculate_profile_completeness_for_fan(updated_fan)
        self.fan_repository.update(updated_fan)
        
        return social_media
    
    def sync_social_media_data(self, user_id: str, platform: str) -> Dict[str, Any]:
        """Sync data from connected social media"""
        # Buscar perfil existente
        fan = self.fan_repository.find_by_user_id(user_id)
        if not fan:
            raise ValueError(f"Fan profile not found for user ID: {user_id}")
        
        # Encontrar conta de mídia social
        social_media = None
        for sm in fan.social_media:
            if sm.platform == platform:
                social_media = sm
                break
                
        if not social_media:
            raise ValueError(f"Social media platform {platform} not connected")
        
        if not social_media.connected:
            raise ValueError(f"Social media platform {platform} is not connected")
        
        # Em uma implementação real, aqui faríamos chamadas para a API da plataforma
        # para extrair dados relevantes como interesses, times seguidos, etc.
        # Aqui, apenas simulamos a atualização de alguns dados
        
        # Simular dados obtidos (por exemplo, times de esports seguidos)
        if platform == "twitter":
            esports_teams = ["FURIA", "Team Liquid", "G2 Esports"]
        elif platform == "instagram":
            esports_teams = ["FURIA", "Cloud9", "FaZe Clan"]
        else:
            esports_teams = ["FURIA"]
        
        # Atualizar times favoritos
        for team in esports_teams:
            if team not in fan.favorite_teams:
                fan.favorite_teams.append(team)
        
        # Atualizar data de sincronização
        for sm in fan.social_media:
            if sm.platform == platform:
                sm.last_sync = datetime.now()
                break
        
        # Salvar mudanças
        self.fan_repository.update(fan)
        
        return {
            "synced_data": {
                "teams": esports_teams
            },
            "last_sync": datetime.now().isoformat()
        }
    
    def add_esports_profile(self, user_id: str, platform: str, profile_url: str, username: str) -> EsportsActivity:
        """Add an esports profile for verification"""
        # Buscar perfil existente
        fan = self.fan_repository.find_by_user_id(user_id)
        if not fan:
            raise ValueError(f"Fan profile not found for user ID: {user_id}")
        
        # Criar objeto de perfil de esports
        profile = EsportsActivity(
            platform=platform,
            profile_url=profile_url,
            username=username,
            games=[],  # Será preenchido durante a verificação
            verified=False
        )
        
        # Adicionar ao perfil
        updated_fan = self.fan_repository.add_esports_profile(fan.id, profile)
        
        # Iniciar verificação (em uma implementação real, isto seria assíncrono)
        self.verify_esports_profile_async(fan.id, platform)
        
        return profile
    
    def verify_esports_profile_async(self, fan_id: str, platform: str):
        """Simulate async esports profile verification with AI"""
        try:
            # Simular verificação por AI
            # Aqui estamos apenas simulando um resultado positivo após 'processamento'
            is_valid = True
            
            # Buscar perfil
            fan = self.fan_repository.find_by_id(fan_id)
            if not fan:
                return
            
            # Encontrar perfil de esports
            for profile in fan.esports_profiles:
                if profile.platform == platform:
                    # Simular jogos detectados
                    if platform == "twitch":
                        profile.games = ["CS:GO", "Valorant", "League of Legends"]
                    elif platform == "steam":
                        profile.games = ["CS:GO", "Dota 2"]
                    else:
                        profile.games = ["League of Legends"]
                    
                    # Adicionar jogos aos favoritos
                    for game in profile.games:
                        if game not in fan.favorite_games:
                            fan.favorite_games.append(game)
                    
                    break
            
            # Atualizar perfil como verificado
            self.fan_repository.verify_esports_profile(fan_id, platform, is_valid)
            
            # Recalcular completude do perfil
            fan.profile_completeness = self._calculate_profile_completeness_for_fan(fan)
            self.fan_repository.update(fan)
                
        except Exception as e:
            print(f"Error in esports profile verification: {e}")
    
    def verify_esports_profile(self, user_id: str, platform: str) -> bool:
        """Manually verify an esports profile"""
        # Buscar perfil existente
        fan = self.fan_repository.find_by_user_id(user_id)
        if not fan:
            raise ValueError(f"Fan profile not found for user ID: {user_id}")
        
        # Iniciar verificação assíncrona
        self.verify_esports_profile_async(fan.id, platform)
        
        return True
    
    def add_event_interest(self, user_id: str, event_data: Dict[str, Any]) -> EventInterest:
        """Add an event interest"""
        # Buscar perfil existente
        fan = self.fan_repository.find_by_user_id(user_id)
        if not fan:
            raise ValueError(f"Fan profile not found for user ID: {user_id}")
        
        # Criar objeto de interesse em evento
        event_interest = EventInterest(**event_data)
        
        # Adicionar ao perfil
        fan.event_interests.append(event_interest)
        
        # Recalcular completude
        fan.profile_completeness = self._calculate_profile_completeness_for_fan(fan)
        
        # Salvar
        self.fan_repository.update(fan)
        
        return event_interest
    
    def add_purchase(self, user_id: str, purchase_data: Dict[str, Any]) -> Purchase:
        """Record a purchase"""
        # Buscar perfil existente
        fan = self.fan_repository.find_by_user_id(user_id)
        if not fan:
            raise ValueError(f"Fan profile not found for user ID: {user_id}")
        
        # Criar objeto de compra
        purchase = Purchase(**purchase_data)
        
        # Adicionar ao perfil
        fan.purchases.append(purchase)
        
        # Recalcular completude
        fan.profile_completeness = self._calculate_profile_completeness_for_fan(fan)
        
        # Salvar
        self.fan_repository.update(fan)
        
        return purchase
    
    def _calculate_profile_completeness_for_fan(self, fan: Fan) -> int:
        """Calculate profile completeness percentage for a Fan object"""
        total_points = 0
        max_points = 100
        
        # Informações básicas (50 pontos)
        if fan.name:
            total_points += 10
        if fan.email:
            total_points += 5
        if fan.phone:
            total_points += 5
        if fan.birth_date:
            total_points += 5
        if fan.address:
            total_points += 10
        if fan.cpf:
            total_points += 5
        if fan.profile_image_url:
            total_points += 10
            
        # Documentos verificados (10 pontos)
        if any(doc.verified for doc in fan.documents):
            total_points += 10
            
        # Redes sociais conectadas (15 pontos)
        social_media_points = min(15, len([sm for sm in fan.social_media if sm.connected]) * 5)
        total_points += social_media_points
        
        # Perfis de esports verificados (15 pontos)
        esports_points = min(15, len([p for p in fan.esports_profiles if p.verified]) * 5)
        total_points += esports_points
        
        # Interesses e preferências (10 pontos)
        if fan.favorite_games:
            total_points += min(5, len(fan.favorite_games))
        if fan.favorite_teams:
            total_points += min(5, len(fan.favorite_teams))
            
        return min(100, total_points)
    
    def calculate_profile_completeness(self, user_id: str) -> int:
        """Calculate profile completeness percentage"""
        fan = self.fan_repository.find_by_user_id(user_id)
        if not fan:
            raise ValueError(f"Fan profile not found for user ID: {user_id}")
        
        completeness = self._calculate_profile_completeness_for_fan(fan)
        
        # Atualizar o valor no perfil
        fan.profile_completeness = completeness
        self.fan_repository.update(fan)
        
        return completeness
    
    def get_fan_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get analytics about fan preferences and activities"""
        fan = self.fan_repository.find_by_user_id(user_id)
        if not fan:
            raise ValueError(f"Fan profile not found for user ID: {user_id}")
        
        # Calcular métricas e estatísticas
        verified_documents = len([doc for doc in fan.documents if doc.verified])
        connected_platforms = len([sm for sm in fan.social_media if sm.connected])
        verified_esports = len([p for p in fan.esports_profiles if p.verified])
        total_purchases = len(fan.purchases)
        total_events = len(fan.event_interests)
        
        # Calcular gasto total
        total_spent = sum(purchase.amount for purchase in fan.purchases)
        
        # Analíticos por tipo de interesse
        favorite_games_count = {}
        for game in fan.favorite_games:
            favorite_games_count[game] = favorite_games_count.get(game, 0) + 1
            
        favorite_teams_count = {}
        for team in fan.favorite_teams:
            favorite_teams_count[team] = favorite_teams_count.get(team, 0) + 1
        
        return {
            "profile_completeness": fan.profile_completeness,
            "verified_documents": verified_documents,
            "connected_platforms": connected_platforms,
            "verified_esports_profiles": verified_esports,
            "total_purchases": total_purchases,
            "total_spent": total_spent,
            "total_events": total_events,
            "favorite_games": favorite_games_count,
            "favorite_teams": favorite_teams_count
        } 