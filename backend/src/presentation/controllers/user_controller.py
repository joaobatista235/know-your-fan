from flask import Flask, request, jsonify

from src.domain.entities.user import User
from src.application.usecases.user_usecase_impl import UserUseCaseImpl
from src.infrastructure.repositories.user_repository_impl import InMemoryUserRepository


# Dependency injection
user_repository = InMemoryUserRepository()
user_usecase = UserUseCaseImpl(user_repository)


def setup_user_routes(app: Flask):
    @app.route('/api/users', methods=['POST'])
    def create_user():
        data = request.json
        try:
            user = User(**data)
            created_user = user_usecase.create(user)
            return jsonify(created_user.dict(exclude={'password'})), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @app.route('/api/users/<user_id>', methods=['GET'])
    def get_user(user_id):
        user = user_usecase.get_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify(user.dict(exclude={'password'})), 200

    @app.route('/api/users', methods=['GET'])
    def get_all_users():
        users = user_usecase.get_all()
        return jsonify([user.dict(exclude={'password'}) for user in users]), 200

    @app.route('/api/users/<user_id>', methods=['PUT'])
    def update_user(user_id):
        data = request.json
        try:
            user = User(**data, id=user_id)
            updated_user = user_usecase.update(user)
            return jsonify(updated_user.dict(exclude={'password'})), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @app.route('/api/users/<user_id>', methods=['DELETE'])
    def delete_user(user_id):
        success = user_usecase.delete(user_id)
        if not success:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"message": "User deleted"}), 200 