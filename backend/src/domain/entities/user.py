from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class User(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    password: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None 