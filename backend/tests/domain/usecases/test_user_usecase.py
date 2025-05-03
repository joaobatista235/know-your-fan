import pytest
from datetime import datetime

from src.domain.entities.user import User
from src.application.usecases.user_usecase_impl import UserUseCaseImpl
from src.infrastructure.repositories.user_repository_impl import InMemoryUserRepository


@pytest.fixture
def user_repository():
    return InMemoryUserRepository()


@pytest.fixture
def user_usecase(user_repository):
    return UserUseCaseImpl(user_repository)


@pytest.fixture
def sample_user():
    return User(
        name="Test User",
        email="test@example.com",
        password="password123"
    )


def test_create_user(user_usecase, sample_user):
    created_user = user_usecase.create(sample_user)
    
    assert created_user.id is not None
    assert created_user.name == "Test User"
    assert created_user.email == "test@example.com"
    assert created_user.created_at is not None


def test_get_user_by_id(user_usecase, sample_user):
    created_user = user_usecase.create(sample_user)
    retrieved_user = user_usecase.get_by_id(created_user.id)
    
    assert retrieved_user is not None
    assert retrieved_user.id == created_user.id
    assert retrieved_user.name == created_user.name


def test_get_all_users(user_usecase, sample_user):
    user_usecase.create(sample_user)
    user_usecase.create(User(name="Another User", email="another@example.com", password="pass456"))
    
    users = user_usecase.get_all()
    
    assert len(users) == 2


def test_update_user(user_usecase, sample_user):
    created_user = user_usecase.create(sample_user)
    
    created_user.name = "Updated Name"
    updated_user = user_usecase.update(created_user)
    
    assert updated_user.name == "Updated Name"
    assert updated_user.updated_at is not None


def test_delete_user(user_usecase, sample_user):
    created_user = user_usecase.create(sample_user)
    result = user_usecase.delete(created_user.id)
    
    assert result is True
    assert user_usecase.get_by_id(created_user.id) is None 