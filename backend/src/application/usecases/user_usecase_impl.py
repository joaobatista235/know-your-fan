from typing import List, Optional

from src.domain.entities.user import User
from src.domain.usecases.user_usecase import UserUseCase
from src.domain.repositories.user_repository import UserRepository


class UserUseCaseImpl(UserUseCase):
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def create(self, user: User) -> User:
        return self.user_repository.create(user)

    def get_by_id(self, user_id: str) -> Optional[User]:
        return self.user_repository.find_by_id(user_id)

    def get_all(self) -> List[User]:
        return self.user_repository.find_all()

    def update(self, user: User) -> User:
        return self.user_repository.update(user)

    def delete(self, user_id: str) -> bool:
        return self.user_repository.delete(user_id) 