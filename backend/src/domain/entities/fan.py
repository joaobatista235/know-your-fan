from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Address(BaseModel):
    street: Optional[str] = None
    number: Optional[str] = None
    complement: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "Brasil"


class Fan(BaseModel):
    id: Optional[str] = None
    user_id: str  # Firebase Auth UID
    name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    birth_date: Optional[datetime] = None
    address: Optional[Address] = None
    cpf: Optional[str] = None
    
    # Dados de interesses
    favorite_games: Optional[List[str]] = []
    favorite_teams: Optional[List[str]] = []
    recent_events: Optional[List[str]] = []
    
    # Metadados
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    
    # Dados do perfil
    profile_completeness: int = 0  # Porcentagem de preenchimento do perfil
    profile_image_base64: Optional[str] = None  # Imagem do perfil em formato base64 