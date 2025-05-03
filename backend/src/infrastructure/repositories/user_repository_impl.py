from typing import List, Optional, Dict
import uuid
from datetime import datetime

from src.domain.entities.user import User
from src.domain.repositories.user_repository import UserRepository


class InMemoryUserRepository(UserRepository):
    def __init__(self):
        self.users: Dict[str, User] = {}

    def create(self, user: User) -> User:
        if not user.id:
            user.id = str(uuid.uuid4())
        
        user.created_at = datetime.now()
        self.users[user.id] = user
        return user

    def find_by_id(self, user_id: str) -> Optional[User]:
        return self.users.get(user_id)

    def find_all(self) -> List[User]:
        return list(self.users.values())

    def update(self, user: User) -> User:
        if user.id not in self.users:
            raise ValueError(f"User with id {user.id} not found")
        
        user.updated_at = datetime.now()
        self.users[user.id] = user
        return user

    def delete(self, user_id: str) -> bool:
        if user_id not in self.users:
            return False
        
        del self.users[user_id]
        return True 