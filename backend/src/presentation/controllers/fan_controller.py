from flask import Flask, request, jsonify, g, send_file
from werkzeug.utils import secure_filename
import os
import tempfile
from datetime import datetime

from src.domain.entities.fan import Fan
from src.application.usecases.fan_usecase_impl import FanUseCaseImpl
from src.infrastructure.repositories.fan_repository_firestore import FirestoreFanRepository
from src.infrastructure.middlewares.auth_middleware import token_required
from src.infrastructure.services.ai_service import AIService

# Dependency injection
fan_repository = FirestoreFanRepository()
fan_usecase = FanUseCaseImpl(fan_repository)
ai_service = AIService()


def setup_fan_routes(app: Flask):
    """Configure fan-related routes"""
    
    @app.route('/api/fans/profile', methods=['POST'])
    @token_required
    def create_profile():
        """Create a new fan profile for the authenticated user"""
        data = request.json
        
        try:
            # Adicionar user_id do token
            data['user_id'] = g.user_id
            
            # Se o email não foi fornecido, usar o do token
            if 'email' not in data:
                data['email'] = g.user_email
                
            # Criar perfil
            fan = fan_usecase.create_profile(data)
            return jsonify(fan.dict(exclude={'documents'})), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/fans/profile', methods=['GET'])
    @token_required
    def get_profile():
        """Get the authenticated user's fan profile"""
        try:
            fan = fan_usecase.get_profile(g.user_id)
            
            if not fan:
                return jsonify({"error": "Profile not found"}), 404
                
            return jsonify(fan.dict(exclude={'documents'})), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/fans/profile', methods=['PUT'])
    @token_required
    def update_profile():
        """Update the authenticated user's fan profile"""
        data = request.json
        
        try:
            # Remover dados que não podem ser atualizados pelo usuário
            for field in ['id', 'user_id', 'created_at']:
                if field in data:
                    del data[field]
                    
            # Atualizar perfil
            fan = fan_usecase.update_profile(g.user_id, data)
            return jsonify(fan.dict(exclude={'documents'})), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/fans/documents', methods=['POST'])
    @token_required
    def upload_document():
        """Upload a document for verification"""
        try:
            # Verificar se o arquivo foi enviado
            if 'file' not in request.files:
                return jsonify({"error": "No file part"}), 400
                
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "No selected file"}), 400
                
            # Obter dados do formulário
            doc_type = request.form.get('doc_type')
            doc_number = request.form.get('doc_number')
            
            if not doc_type or not doc_number:
                return jsonify({"error": "Document type and number are required"}), 400
                
            # Ler dados do arquivo
            file_data = file.read()
            
            # Fazer upload do documento
            document = fan_usecase.upload_document(g.user_id, doc_type, doc_number, file_data)
            
            return jsonify(document.dict()), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/fans/social-media', methods=['POST'])
    @token_required
    def connect_social_media():
        """Connect a social media account"""
        data = request.json
        
        try:
            # Verificar dados obrigatórios
            if 'platform' not in data or 'profile_url' not in data:
                return jsonify({"error": "Platform and profile URL are required"}), 400
                
            # Conectar mídia social
            social_media = fan_usecase.connect_social_media(
                g.user_id,
                data['platform'],
                data['profile_url'],
                data.get('access_token')
            )
            
            return jsonify(social_media.dict()), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/fans/social-media/<platform>/sync', methods=['POST'])
    @token_required
    def sync_social_media(platform):
        """Synchronize data from a connected social media account"""
        try:
            # Sincronizar dados
            result = fan_usecase.sync_social_media_data(g.user_id, platform)
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/fans/esports-profiles', methods=['POST'])
    @token_required
    def add_esports_profile():
        """Add an esports profile for verification"""
        data = request.json
        
        try:
            # Verificar dados obrigatórios
            if not all(k in data for k in ['platform', 'profile_url', 'username']):
                return jsonify({"error": "Platform, profile URL and username are required"}), 400
                
            # Adicionar perfil
            profile = fan_usecase.add_esports_profile(
                g.user_id,
                data['platform'],
                data['profile_url'],
                data['username']
            )
            
            return jsonify(profile.dict()), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/fans/esports-profiles/<platform>/verify', methods=['POST'])
    @token_required
    def verify_esports_profile(platform):
        """Trigger verification of an esports profile"""
        try:
            # Iniciar verificação
            result = fan_usecase.verify_esports_profile(g.user_id, platform)
            return jsonify({"success": result}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/fans/events', methods=['POST'])
    @token_required
    def add_event_interest():
        """Add an event interest"""
        data = request.json
        
        try:
            # Adicionar interesse em evento
            event = fan_usecase.add_event_interest(g.user_id, data)
            return jsonify(event.dict()), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/fans/purchases', methods=['POST'])
    @token_required
    def add_purchase():
        """Record a purchase"""
        data = request.json
        
        try:
            # Registrar compra
            purchase = fan_usecase.add_purchase(g.user_id, data)
            return jsonify(purchase.dict()), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/fans/completeness', methods=['GET'])
    @token_required
    def get_profile_completeness():
        """Get the profile completeness percentage"""
        try:
            # Calcular completude
            completeness = fan_usecase.calculate_profile_completeness(g.user_id)
            return jsonify({"completeness": completeness}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/fans/analytics', methods=['GET'])
    @token_required
    def get_analytics():
        """Get analytics about fan preferences and activities"""
        try:
            # Obter analíticos
            analytics = fan_usecase.get_fan_analytics(g.user_id)
            return jsonify(analytics), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400 