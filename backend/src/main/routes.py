from flask import Flask, jsonify, request
from datetime import datetime
from src.services.auth_service import register_user, login_user, verify_token
from src.services.user_service import update_user_profile, get_user_profile_image, get_user_profile
from src.services.document_service import analyze_document
from functools import wraps
import firebase_admin
from firebase_admin import firestore
import time
import requests
import hmac
import hashlib
import base64
import urllib.parse
import uuid
import secrets
import os
import json

# Twitter OAuth 2.0 credentials (atualizadas para a nova API)
TWITTER_CLIENT_ID = "VjdFM2RVWXFmUjF5WnYzR3FoeDU6MTpjaQ"
TWITTER_CLIENT_SECRET = "2sIQNujrw0XRdSxHG_YJUUMu8q0Q9GjR0I5YnHAJWsWXU7oRCw"
TWITTER_BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAJHJpAEAAAAAH7oG8rmqlpUKXL%2FqqNp0rXvCndM%3DrFhYZjgRTQLsPWKlJk1IDYDt7L7S4wLs9xQFkPvQzuP86cIRP4"

# Temporary storage for token secrets (in a real app, use Redis or a database)
# Format: {'user_id': {'oauth_token': 'oauth_token_secret'}}
TOKEN_SECRETS = {}

# Try to get Firestore database instance
try:
    db = firestore.client()
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    db = None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({"error": "Authorization header is missing"}), 401
            
        try:
            token_parts = auth_header.split()
            if len(token_parts) != 2 or token_parts[0].lower() != 'bearer':
                return jsonify({"error": "Invalid authorization header format"}), 401
                
            token = token_parts[1]
            user = verify_token(token)
            return f(user, *args, **kwargs)
        except Exception as e:
            return jsonify({"error": str(e)}), 401
    
    return decorated

def setup_routes(app: Flask):
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "ok",
            "timestamp": datetime.now().isoformat()
        }), 200
    
    @app.route('/api/auth/register', methods=['POST'])
    def register():
        data = request.json
        
        if not data:
            return jsonify({"error": "Request body is empty"}), 400
            
        if 'email' not in data:
            return jsonify({"error": "Email is required"}), 400
            
        if 'password' not in data:
            return jsonify({"error": "Password is required"}), 400
        
        try:
            user = register_user(data)
            return jsonify({
                "message": "User registered successfully",
                "user": user
            }), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            app.logger.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        data = request.json
        
        if not data:
            return jsonify({"error": "Request body is empty"}), 400
            
        if 'email' not in data:
            return jsonify({"error": "Email is required"}), 400
            
        if 'password' not in data:
            return jsonify({"error": "Password is required"}), 400
        
        try:
            user = login_user(data['email'], data['password'])
            return jsonify({
                "message": "Login successful",
                "user": user
            }), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 401
        except Exception as e:
            app.logger.error(f"Unexpected error: {str(e)}")
            return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500
            
    @app.route('/api/auth/verify', methods=['POST'])
    def verify():
        data = request.json
        
        if not data or 'token' not in data:
            return jsonify({"error": "Token is required"}), 400
            
        try:
            user = verify_token(data['token'])
            return jsonify({
                "valid": True,
                "message": "Token is valid",
                "user": user
            }), 200
        except ValueError as e:
            return jsonify({
                "valid": False, 
                "error": str(e)
            }), 401
        except Exception as e:
            app.logger.error(f"Unexpected error: {str(e)}")
            return jsonify({
                "valid": False,
                "error": "An unexpected error occurred. Please try again later."
            }), 500
    
    @app.route('/api/users/profile', methods=['GET'])
    @token_required
    def get_profile(user):
        try:
            user_id = user['uid']
            app.logger.info(f"Retrieving profile for user: {user_id}")
            
            try:
                profile_data = get_user_profile(user_id)
                
                if not profile_data:
                    app.logger.warning(f"No profile found for user: {user_id}")
                    return jsonify({
                        "error": "Profile not found",
                        "message": "User profile is not completed yet."
                    }), 404
                
                app.logger.info(f"Successfully retrieved profile for user: {user_id}")
                return jsonify({
                    "user": profile_data
                }), 200
            except ValueError as e:
                app.logger.error(f"Database error: {str(e)}")
                return jsonify({
                    "error": str(e),
                    "message": "Could not access the database. Please check Firestore settings."
                }), 503
            except Exception as e:
                app.logger.error(f"Error accessing database: {str(e)}")
                return jsonify({
                    "error": "Database service unavailable",
                    "message": "Could not access Firestore database. Please check your Firebase settings."
                }), 503
            
        except Exception as e:
            app.logger.error(f"Error getting user profile: {str(e)}")
            return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500
    
    @app.route('/api/users/profile', methods=['PUT'])
    @token_required
    def update_profile(user):
        try:
            profile_data = {}
            profile_image = None
            
            # Verificar se é um FormData (multipart/form-data)
            content_type = request.headers.get('Content-Type', '')
            is_multipart = content_type.startswith('multipart/form-data')
            
            if is_multipart:
                app.logger.info("Receiving multipart form data")
                
                # Pegar JSON dos dados do perfil
                if 'profileData' in request.form:
                    try:
                        profile_data = json.loads(request.form['profileData'])
                        app.logger.info("Successfully parsed profile data from form")
                    except Exception as e:
                        app.logger.error(f"Error parsing profileData JSON: {str(e)}")
                
                # Verificar se há um arquivo de imagem
                if 'profileImage' in request.files:
                    file = request.files['profileImage']
                    if file.filename != '':
                        # Ler a imagem do arquivo e convertê-la para base64
                        image_bytes = file.read()
                        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                        mime_type = file.content_type or 'image/jpeg'
                        profile_image = f"data:{mime_type};base64,{image_b64}"
                        app.logger.info(f"Received profile image file: {file.filename}, {len(image_bytes)} bytes")
                # Verificar fallback para base64 direto
                elif 'profileImageBase64' in request.form:
                    profile_image = request.form['profileImageBase64']
                    app.logger.info("Received profile image as base64 string from form data")
            else:
                # Processar como JSON normal
                profile_data = request.json if request.is_json else {}
                
                if profile_data and 'profileImage' in profile_data and isinstance(profile_data['profileImage'], str):
                    profile_image = profile_data.pop('profileImage')
                    app.logger.info("Profile image received for processing from JSON")
            
            updated_user = update_user_profile(user['uid'], profile_data, profile_image)
            
            if profile_image and not updated_user.get('has_profile_image', False):
                app.logger.warning("Profile image was not stored in Firestore due to size constraints")
                
            return jsonify({
                "message": "Profile updated successfully",
                "user": updated_user
            }), 200
        except ValueError as e:
            app.logger.error(f"Error updating profile: {str(e)}")
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            app.logger.error(f"Unexpected error updating profile: {str(e)}")
            return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500
    
    @app.route('/api/users/profile/image', methods=['GET'])
    @token_required
    def get_profile_image(user):
        try:
            user_id = user['uid']
            app.logger.info(f"Retrieving profile image for user: {user_id}")
            
            try:
                image_data = get_user_profile_image(user_id)
                
                if not image_data:
                    app.logger.warning(f"No profile image found for user: {user_id}")
                    return jsonify({
                        "error": "Profile image not found",
                        "message": "User has not uploaded a profile image yet."
                    }), 404
                
                app.logger.info(f"Successfully retrieved profile image for user: {user_id}")
                return jsonify({
                    "profile_image": image_data
                }), 200
            except ValueError as e:
                app.logger.error(f"Database error: {str(e)}")
                return jsonify({
                    "error": str(e),
                    "message": "Could not access the database. Please check Firestore settings."
                }), 503
            except Exception as e:
                app.logger.error(f"Error accessing database: {str(e)}")
                return jsonify({
                    "error": "Database service unavailable",
                    "message": "Could not access Firestore database. Please check your Firebase settings."
                }), 503
            
        except Exception as e:
            app.logger.error(f"Error getting profile image: {str(e)}")
            return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500
    
    @app.route('/api/document/analyze', methods=['POST'])
    @token_required
    def analyze_user_document(user):
        app.logger.info("Document analyze request received")
        
        if not request.is_json:
            app.logger.error("Request is not JSON")
            return jsonify({"error": "Formato inválido. Esperado JSON."}), 400

        data = request.json
        document = data.get('document')
        selfie = data.get('selfie')
        
        if not document:
            app.logger.error("Missing 'document' field in request")
            return jsonify({"error": "Campo 'document' obrigatório."}), 400

        for field in ['content', 'file_name']:
            if field not in document:
                app.logger.error(f"Missing '{field}' in document data")
                return jsonify({"error": f"Campo '{field}' ausente no documento."}), 400

        try:
            result = analyze_document(document, selfie)
            result.update({
                "user_id": user['uid'],
                "analyzed_at": datetime.now().isoformat()
            })

            status_code = 200 if result.get('success', False) else 400
            return jsonify({
                "message": result.get('message', 'Documento analisado.'),
                "result": result
            }), status_code

        except Exception as e:
            app.logger.error(f"Erro inesperado: {e}")
            return jsonify({
                "error": "Erro inesperado durante análise.",
                "details": str(e)
            }), 500

    @app.route('/api/document', methods=['GET'])
    @token_required
    def get_user_document(user):
        return jsonify({"document": None}), 200

    @app.route('/api/document', methods=['DELETE'])
    @token_required
    def delete_user_document(user):
        return jsonify({"message": "Documento removido (simulado)"}), 200

    # ===== ENDPOINTS DE REDES SOCIAIS =====
    
    @app.route('/api/oauth/x/request-token', methods=['GET'])
    def get_x_request_token():
        try:
            # Usar a API do Twitter para obter um request token via OAuth 1.0a
            # https://developer.twitter.com/en/docs/authentication/api-reference/request_token
            
            # Implementação real com as credenciais da aplicação
            callback_url = request.args.get('callback_url')
            
            if not callback_url:
                return jsonify({"error": "Callback URL is required"}), 400
            
            # Log the callback URL for debugging
            app.logger.info(f"Using callback URL: {callback_url}")
            app.logger.info(f"Using Twitter API Key: {TWITTER_CLIENT_ID[:5]}...")
            
            # Gerar um nonce único para esta requisição
            nonce = secrets.token_hex(16)
            # Timestamp atual em segundos
            timestamp = str(int(time.time()))
            
            # Parâmetros do OAuth 1.0a
            oauth_params = {
                'oauth_callback': callback_url,
                'oauth_consumer_key': TWITTER_CLIENT_ID,
                'oauth_nonce': nonce,
                'oauth_signature_method': 'HMAC-SHA1',
                'oauth_timestamp': timestamp,
                'oauth_version': '1.0'
            }
            
            # Criar a string base para assinatura
            base_url = 'https://api.twitter.com/oauth/request_token'
            method = 'POST'
            
            # Combinar e ordenar os parâmetros
            param_string = '&'.join([
                f"{urllib.parse.quote(k)}={urllib.parse.quote(v)}"
                for k, v in sorted(oauth_params.items())
            ])
            
            # Criar a string base
            signature_base = f"{method}&{urllib.parse.quote(base_url)}&{urllib.parse.quote(param_string)}"
            app.logger.info(f"Signature base: {signature_base[:50]}...")
            
            # Criar a chave de assinatura
            signing_key = f"{urllib.parse.quote(TWITTER_CLIENT_SECRET)}&"  # Sem token secret neste estágio
            
            # Gerar a assinatura
            signature = hmac.new(
                signing_key.encode('utf-8'),
                signature_base.encode('utf-8'),
                hashlib.sha1
            ).digest()
            
            signature = base64.b64encode(signature).decode('utf-8')
            app.logger.info(f"Generated signature: {signature}")
            
            # Adicionar a assinatura aos parâmetros
            oauth_params['oauth_signature'] = signature
            
            # Criar o cabeçalho de autorização
            auth_header = 'OAuth ' + ', '.join([
                f'{urllib.parse.quote(k)}="{urllib.parse.quote(v)}"'
                for k, v in oauth_params.items()
            ])
            app.logger.info(f"Auth header: {auth_header[:50]}...")
            
            # Fazer a requisição para o Twitter
            app.logger.info(f"Sending request to Twitter API: {base_url}")
            response = requests.post(
                base_url,
                headers={'Authorization': auth_header}
            )
            
            app.logger.info(f"Twitter API response status: {response.status_code}")
            app.logger.info(f"Twitter API response body: {response.text[:200]}")
            
            if response.status_code == 200:
                # Parse da resposta
                response_params = dict(param.split('=') for param in response.text.split('&'))
                app.logger.info(f"Successfully obtained request token")
                
                # Armazenar o token secret para uso posterior
                oauth_token = response_params.get('oauth_token')
                oauth_token_secret = response_params.get('oauth_token_secret')
                
                # Gerar um user_id temporário para armazenar o token
                temp_id = str(uuid.uuid4())
                
                if temp_id not in TOKEN_SECRETS:
                    TOKEN_SECRETS[temp_id] = {}
                
                TOKEN_SECRETS[temp_id][oauth_token] = {
                    'secret': oauth_token_secret,
                    'expires_at': int(time.time()) + 300  # 5 minutos
                }
                
                return jsonify({
                    "oauth_token": oauth_token,
                    "oauth_token_secret": oauth_token_secret,
                    "oauth_callback_confirmed": response_params.get('oauth_callback_confirmed'),
                    "token_id": temp_id,  # Enviar o ID temporário para o cliente
                    "expires_in": 300  # Token válido por 5 minutos
                }), 200
            else:
                app.logger.error(f"Twitter API error: {response.status_code} - {response.text}")
                return jsonify({
                    "error": "Failed to get request token from Twitter",
                    "details": response.text
                }), response.status_code
                
        except Exception as e:
            app.logger.error(f"Error getting X request token: {e}")
            return jsonify({
                "error": "Failed to get request token",
                "details": str(e)
            }), 500
    
    @app.route('/api/users/social-accounts', methods=['GET'])
    @token_required
    def get_social_accounts(user):
        try:
            user_id = user['uid']
            # Em uma implementação real, buscar as contas conectadas do banco de dados
            # Exemplo: accounts = db.collection('social_accounts').where('user_id', '==', user_id).get()
            
            # Como não temos banco de dados, retornar lista vazia
            return jsonify({
                "accounts": []
            }), 200
        except Exception as e:
            app.logger.error(f"Error getting social accounts: {e}")
            return jsonify({"error": "An unexpected error occurred"}), 500
    
    @app.route('/api/users/social-accounts/connect', methods=['POST'])
    @token_required
    def connect_social_account(user):
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
            
        data = request.json
        platform = data.get('platform')
        
        if not platform:
            return jsonify({"error": "Platform is required"}), 400
            
        try:
            # Handle different OAuth flows based on platform
            if platform == 'X':
                # X (Twitter) uses OAuth 1.0a with oauth_token and oauth_verifier
                oauth_token = data.get('oauth_token')
                oauth_verifier = data.get('oauth_verifier')
                token_id = data.get('token_id')  # Novo campo para identificar o token temporário
                
                if not oauth_token or not oauth_verifier:
                    return jsonify({"error": "OAuth token and verifier are required for X"}), 400
                
                # Obter o token secret armazenado anteriormente usando token_id se disponível
                user_id = user['uid']
                token_secret = ""
                
                # Primeiro tentar token_id, depois user_id como fallback
                if token_id and token_id in TOKEN_SECRETS and oauth_token in TOKEN_SECRETS[token_id]:
                    token_data = TOKEN_SECRETS[token_id][oauth_token]
                    
                    # Verificar se o token ainda é válido
                    if token_data['expires_at'] > int(time.time()):
                        token_secret = token_data['secret']
                    else:
                        # Remover token expirado
                        del TOKEN_SECRETS[token_id][oauth_token]
                        return jsonify({"error": "OAuth token has expired. Please try again."}), 400
                elif user_id in TOKEN_SECRETS and oauth_token in TOKEN_SECRETS[user_id]:
                    token_data = TOKEN_SECRETS[user_id][oauth_token]
                    
                    # Verificar se o token ainda é válido
                    if token_data['expires_at'] > int(time.time()):
                        token_secret = token_data['secret']
                    else:
                        # Remover token expirado
                        del TOKEN_SECRETS[user_id][oauth_token]
                        return jsonify({"error": "OAuth token has expired. Please try again."}), 400
                else:
                    return jsonify({"error": "OAuth token not found or expired. Please try again."}), 400
                
                # Trocar o oauth_token e oauth_verifier por um token de acesso
                try:
                    # Parâmetros para a requisição de access token
                    timestamp = str(int(time.time()))
                    nonce = secrets.token_hex(16)
                    
                    oauth_params = {
                        'oauth_consumer_key': TWITTER_CLIENT_ID,
                        'oauth_nonce': nonce,
                        'oauth_signature_method': 'HMAC-SHA1',
                        'oauth_timestamp': timestamp,
                        'oauth_token': oauth_token,
                        'oauth_verifier': oauth_verifier,
                        'oauth_version': '1.0'
                    }
                    
                    # URL da API para obter o access token
                    access_token_url = 'https://api.twitter.com/oauth/access_token'
                    method = 'POST'
                    
                    # Combinar e ordenar os parâmetros
                    param_string = '&'.join([
                        f"{urllib.parse.quote(k)}={urllib.parse.quote(v)}"
                        for k, v in sorted(oauth_params.items())
                    ])
                    
                    # Criar a string base
                    signature_base = f"{method}&{urllib.parse.quote(access_token_url)}&{urllib.parse.quote(param_string)}"
                    
                    # Criar a chave de assinatura usando o token_secret obtido
                    signing_key = f"{urllib.parse.quote(TWITTER_CLIENT_SECRET)}&{urllib.parse.quote(token_secret)}"
                    
                    # Gerar a assinatura
                    signature = hmac.new(
                        signing_key.encode('utf-8'),
                        signature_base.encode('utf-8'),
                        hashlib.sha1
                    ).digest()
                    
                    signature = base64.b64encode(signature).decode('utf-8')
                    
                    # Adicionar a assinatura aos parâmetros
                    oauth_params['oauth_signature'] = signature
                    
                    # Criar o cabeçalho de autorização
                    auth_header = 'OAuth ' + ', '.join([
                        f'{urllib.parse.quote(k)}="{urllib.parse.quote(v)}"'
                        for k, v in oauth_params.items()
                    ])
                    
                    # Fazer a requisição para o Twitter
                    response = requests.post(
                        access_token_url,
                        headers={'Authorization': auth_header}
                    )
                    
                    if response.status_code == 200:
                        # Parse da resposta
                        response_params = dict(param.split('=') for param in response.text.split('&'))
                        
                        # Armazenar os tokens de acesso
                        access_token = response_params.get('oauth_token')
                        access_token_secret = response_params.get('oauth_token_secret')
                        screen_name = response_params.get('screen_name')
                        twitter_user_id = response_params.get('user_id')
                        
                        app.logger.info(f"Successfully obtained access token for Twitter user: {screen_name}")
                        
                        # Limpar tokens temporários
                        if token_id and token_id in TOKEN_SECRETS and oauth_token in TOKEN_SECRETS[token_id]:
                            del TOKEN_SECRETS[token_id][oauth_token]
                            if not TOKEN_SECRETS[token_id]:  # Se estiver vazio, remover completamente
                                del TOKEN_SECRETS[token_id]
                        elif user_id in TOKEN_SECRETS and oauth_token in TOKEN_SECRETS[user_id]:
                            del TOKEN_SECRETS[user_id][oauth_token]
                            if not TOKEN_SECRETS[user_id]:  # Se estiver vazio, remover completamente
                                del TOKEN_SECRETS[user_id]
                        
                        # Em uma implementação real, salvar os tokens no banco
                        # db.collection('social_accounts').add({
                        #    'user_id': user_id,
                        #    'platform': 'X',
                        #    'access_token': access_token,
                        #    'access_token_secret': access_token_secret,
                        #    'platform_user_id': twitter_user_id,
                        #    'screen_name': screen_name,
                        #    'created_at': datetime.now()
                        # })
                        
                        # Buscar contas seguidas usando a API do Twitter
                        followed_accounts = get_twitter_followed_accounts(access_token, access_token_secret, twitter_user_id)
                        
                        return jsonify({
                            "success": True,
                            "message": f"Successfully connected X account for @{screen_name}",
                            "followedAccounts": followed_accounts,
                            "userInfo": {
                                "screenName": screen_name,
                                "userId": twitter_user_id
                            }
                        }), 200
                    else:
                        app.logger.error(f"Twitter API error: {response.status_code} - {response.text}")
                        return jsonify({
                            "error": "Failed to get access token from Twitter",
                            "details": response.text
                        }), 400
                except Exception as e:
                    app.logger.error(f"Error exchanging Twitter tokens: {e}")
                    return jsonify({"error": f"Error connecting to Twitter: {str(e)}"}), 500
            else:
                # Instagram e outras plataformas usam OAuth 2.0 com code
                code = data.get('code')
                
                if not code:
                    return jsonify({"error": "Code is required"}), 400
                
                # Para Instagram, seria necessário implementar a troca do código por um token de acesso
                # e usar esse token para buscar dados da conta via API do Instagram
                
                return jsonify({
                    "error": "Instagram integration not implemented yet",
                    "message": "Instagram API integration is in development"
                }), 501
                
        except Exception as e:
            app.logger.error(f"Error connecting social account: {e}")
            return jsonify({"error": f"Failed to connect {platform} account: {str(e)}"}), 500
    
    @app.route('/api/users/social-accounts/<platform>', methods=['DELETE'])
    @token_required
    def disconnect_social_account(user, platform):
        try:
            user_id = user['uid']
            
            # Em uma implementação real, remover a conexão do banco de dados
            # db.collection('social_accounts')
            #   .where('user_id', '==', user_id)
            #   .where('platform', '==', platform)
            #   .delete()
            
            # E possivelmente revogar o token de acesso na API da plataforma
            
            return jsonify({
                "success": True,
                "message": f"Successfully disconnected {platform} account"
            }), 200
            
        except Exception as e:
            app.logger.error(f"Error disconnecting social account: {e}")
            return jsonify({"error": f"Failed to disconnect {platform} account: {str(e)}"}), 500
    
    # Função auxiliar para buscar contas seguidas no Twitter
    def get_twitter_followed_accounts(access_token, access_token_secret, user_id):
        try:
            # URL para buscar contas seguidas
            friends_url = 'https://api.twitter.com/1.1/friends/list.json'
            method = 'GET'
            
            # Parâmetros da requisição
            params = {
                'user_id': user_id,
                'count': 10,  # Limitar a 10 contas para evitar problemas de performance
                'skip_status': 'true',
                'include_user_entities': 'false'
            }
            
            # Gerar parâmetros OAuth para autenticação
            timestamp = str(int(time.time()))
            nonce = secrets.token_hex(16)
            
            oauth_params = {
                'oauth_consumer_key': TWITTER_CLIENT_ID,
                'oauth_nonce': nonce,
                'oauth_signature_method': 'HMAC-SHA1',
                'oauth_timestamp': timestamp,
                'oauth_token': access_token,
                'oauth_version': '1.0'
            }
            
            # Combinar todos os parâmetros para a assinatura
            all_params = {**params, **oauth_params}
            
            # Criar string de parâmetros ordenada
            param_string = '&'.join([
                f"{urllib.parse.quote(k)}={urllib.parse.quote(str(v))}"
                for k, v in sorted(all_params.items())
            ])
            
            # URL com query params para a assinatura
            url_with_params = f"{friends_url}?{urllib.parse.urlencode(params)}"
            
            # Criar a string base para assinatura
            signature_base = f"{method}&{urllib.parse.quote(friends_url)}&{urllib.parse.quote(param_string)}"
            
            # Criar a chave de assinatura
            signing_key = f"{urllib.parse.quote(TWITTER_CLIENT_SECRET)}&{urllib.parse.quote(access_token_secret)}"
            
            # Gerar a assinatura
            signature = hmac.new(
                signing_key.encode('utf-8'),
                signature_base.encode('utf-8'),
                hashlib.sha1
            ).digest()
            
            signature = base64.b64encode(signature).decode('utf-8')
            
            # Adicionar a assinatura aos parâmetros OAuth
            oauth_params['oauth_signature'] = signature
            
            # Criar o cabeçalho de autorização
            auth_header = 'OAuth ' + ', '.join([
                f'{urllib.parse.quote(k)}="{urllib.parse.quote(str(v))}"'
                for k, v in oauth_params.items()
            ])
            
            # Fazer a requisição para o Twitter
            response = requests.get(
                url_with_params,
                headers={'Authorization': auth_header}
            )
            
            if response.status_code == 200:
                data = response.json()
                users = data.get('users', [])
                
                # Formatar os dados para o formato esperado pelo frontend
                formatted_accounts = []
                for user in users:
                    formatted_accounts.append({
                        "id": user.get('id_str'),
                        "name": user.get('name'),
                        "username": f"@{user.get('screen_name')}",
                        "profileImage": user.get('profile_image_url_https'),
                        "followers": f"{user.get('followers_count'):,}".replace(',', '.')
                    })
                
                return formatted_accounts
            else:
                app.logger.error(f"Twitter API error: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            app.logger.error(f"Error fetching Twitter followed accounts: {e}")
            return []

    @app.route('/api/oauth/x/v2/request-token', methods=['GET'])
    def get_x_request_token_v2():
        try:
            # Implementação usando OAuth 2.0 com PKCE para o Twitter/X
            callback_url = request.args.get('callback_url')
            debug_mode = request.args.get('debug', 'false').lower() == 'true'
            
            if not callback_url:
                return jsonify({"error": "Callback URL is required"}), 400
            
            # Log the callback URL for debugging
            app.logger.info(f"Using callback URL for OAuth 2.0: {callback_url}")
            app.logger.info(f"Using Twitter Client ID: {TWITTER_CLIENT_ID[:10]}...")
            
            if debug_mode:
                app.logger.info("MODO DE DEPURAÇÃO ATIVADO para solicitação de token")
                print("MODO DE DEPURAÇÃO ATIVADO para solicitação de token")
            
            # Gerar um code verifier para PKCE (Proof Key for Code Exchange)
            code_verifier = secrets.token_urlsafe(64)
            
            # Calcular code challenge (SHA256 do code verifier, codificado em base64)
            code_challenge = base64.urlsafe_b64encode(
                hashlib.sha256(code_verifier.encode('utf-8')).digest()
            ).decode('utf-8').rstrip('=')
            
            # Armazenar temporariamente o code_verifier para uso futuro
            temp_id = str(uuid.uuid4())
            
            TOKEN_SECRETS[temp_id] = {
                'code_verifier': code_verifier,
                'expires_at': int(time.time()) + 300  # 5 minutos
            }
            
            # Parâmetros para a URL de autorização do Twitter
            auth_params = {
                'client_id': TWITTER_CLIENT_ID,
                'response_type': 'code',
                'redirect_uri': callback_url,
                'state': temp_id,
                'code_challenge': code_challenge,
                'code_challenge_method': 'S256',
                'scope': 'tweet.read users.read follows.read',
                'force_login': 'true'
            }
            
            # Construir a URL de autorização
            auth_url = 'https://twitter.com/i/oauth2/authorize?' + urllib.parse.urlencode(auth_params)
            
            # Log da URL para depuração
            app.logger.info(f"Auth URL constructed: {auth_url[:100]}...")
            
            return jsonify({
                "auth_url": auth_url,
                "state": temp_id,
                "expires_in": 300  # 5 minutos
            }), 200
                
        except Exception as e:
            app.logger.error(f"Error getting X OAuth 2.0 request token: {e}")
            return jsonify({
                "error": "Failed to get request token",
                "details": str(e)
            }), 500

    @app.route('/api/oauth/x/v2/callback', methods=['POST'])
    def oauth2_callback():
        try:
            if not request.is_json:
                app.logger.error("OAuth callback request is not JSON")
                return jsonify({"error": "Request must be JSON"}), 400
            
            data = request.json
            app.logger.info(f"OAuth callback request data: {json.dumps(data)}")
            print(f"OAuth callback data: {json.dumps(data)}")
            
            code = data.get('code')
            state = data.get('state')
            
            if not code:
                app.logger.error("Missing authorization code in callback")
                return jsonify({"error": "Authorization code is required"}), 400
            
            if not state:
                app.logger.error("Missing state parameter in callback")
                return jsonify({"error": "State parameter is required"}), 400
            
            # Log dos tokens armazenados para debug
            app.logger.info(f"TOKEN_SECRETS keys: {list(TOKEN_SECRETS.keys())}")
            print(f"TOKEN_SECRETS keys: {list(TOKEN_SECRETS.keys())}")
            
            # Para o método simples, aceitamos qualquer state válido
            # Verificamos apenas se o state existe em TOKEN_SECRETS
            if state not in TOKEN_SECRETS:
                app.logger.error(f"Invalid state parameter: {state}")
                return jsonify({"error": "Invalid or expired state parameter", "details": f"State {state} not found in stored tokens"}), 400
            
            token_data = TOKEN_SECRETS[state]
            app.logger.info(f"Token data: {token_data}")
            
            if token_data['expires_at'] < int(time.time()):
                del TOKEN_SECRETS[state]
                app.logger.error(f"Expired state token, expired at: {token_data['expires_at']}")
                return jsonify({"error": "Authorization flow has expired. Please try again."}), 400
            
            # Verificar se o token_data contém code_verifier (método PKCE)
            # Se não, estamos usando o método simples e podemos pular a verificação
            code_verifier = token_data.get('code_verifier')
            
            if not code_verifier:
                app.logger.error("Missing code_verifier in token data")
                return jsonify({"error": "Invalid OAuth flow. Code verifier is required."}), 400
            
            # Preparar requisição para obter o token
            token_url = 'https://api.twitter.com/2/oauth2/token'
            redirect_uri = data.get('redirect_uri')
            
            app.logger.info(f"Callback redirect URI: {redirect_uri}")
            print(f"Callback redirect URI: {redirect_uri}")
            
            # Verificação adicional do redirect_uri
            if not redirect_uri or not redirect_uri.startswith(("http://", "https://")):
                app.logger.error(f"Invalid redirect_uri: {redirect_uri}")
                return jsonify({"error": "Invalid redirect_uri provided"}), 400
            
            # Parâmetros para obter o token
            token_params = {
                'client_id': TWITTER_CLIENT_ID,
                'client_secret': TWITTER_CLIENT_SECRET,
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': redirect_uri,
                'code_verifier': code_verifier
            }
            
            app.logger.info(f"Sending token request to Twitter API with: client_id={TWITTER_CLIENT_ID[:5]}..., code={code[:5]}..., redirect_uri={redirect_uri}")
            
            # Solicitar o token
            token_headers = {'Content-Type': 'application/x-www-form-urlencoded'}
            response = requests.post(
                token_url,
                data=token_params,
                headers=token_headers
            )
            
            app.logger.info(f"Twitter API token response status: {response.status_code}")
            
            if response.status_code != 200:
                app.logger.error(f"Error response from Twitter: {response.text}")
                try:
                    error_json = response.json()
                    app.logger.error(f"Parsed error: {json.dumps(error_json)}")
                    error_message = error_json.get('error_description', error_json.get('error', 'Unknown error'))
                    
                    # Verificar se o erro está relacionado a permissões negadas
                    if 'access_denied' in error_message.lower() or 'denied' in error_message.lower() or 'declined' in error_message.lower():
                        app.logger.warning("User denied permission access")
                        return jsonify({
                            "error": "Authentication failed",
                            "details": "Você não conseguiu dar acesso ao aplicativo. Todas as permissões solicitadas são necessárias."
                        }), 403
                except:
                    error_message = f"HTTP {response.status_code}: {response.text}"
                
                return jsonify({
                    "error": "Failed to get access token from Twitter",
                    "details": error_message
                }), response.status_code
            
            token_response = response.json()
            
            # Extrair o token de acesso e informações relevantes
            access_token = token_response.get('access_token')
            refresh_token = token_response.get('refresh_token')
            expires_in = token_response.get('expires_in')
            
            app.logger.info(f"Received access token (first 10 chars): {access_token[:10] if access_token else 'None'}...")
            
            # Limpar o token temporário
            del TOKEN_SECRETS[state]
            
            # Obter detalhes do usuário
            app.logger.info("Getting user info with access token...")
            user_info = get_twitter_user_info_oauth2(access_token)
            
            if not user_info:
                app.logger.error("Failed to retrieve user info from Twitter")
                return jsonify({
                    "error": "Failed to retrieve user information",
                    "details": "Could not fetch user profile from Twitter"
                }), 500
            
            app.logger.info(f"Successfully retrieved user info: @{user_info.get('screenName')}")
            
            # Obter seguidores do usuário
            app.logger.info("Getting followed accounts...")
            followed_accounts = get_twitter_followed_accounts_oauth2(access_token)
            
            app.logger.info(f"Retrieved {len(followed_accounts)} followed accounts")
            
            # Armazenar na Firestore
            firebase_user_id = None
            try:
                # Get user ID from token
                auth_header = request.headers.get('Authorization')
                if auth_header:
                    token_parts = auth_header.split()
                    if len(token_parts) == 2 and token_parts[0].lower() == 'bearer':
                        token = token_parts[1]
                        user = verify_token(token)
                        firebase_user_id = user.get('uid')
            
                app.logger.info(f"Firebase user ID for storage: {firebase_user_id}")
            except Exception as e:
                app.logger.warning(f"Could not get Firebase user ID: {e}")
            
            # Aqui você deve armazenar o token no banco de dados (Firestore)
            if db:
                try:
                    # Create document data
                    social_account_data = {
                        'platform': 'X',
                        'user_id': firebase_user_id or user_info.get('userId'),
                        'platform_user_id': user_info.get('userId'),
                        'screen_name': user_info.get('screenName'),
                        'access_token': access_token,
                        'refresh_token': refresh_token,
                        'expires_in': expires_in,
                        'expires_at': int(time.time()) + expires_in,
                        'connected_at': datetime.now().isoformat(),
                        'followed_accounts_count': len(followed_accounts)
                    }
                    
                    # Simplified storage approach - always create a new document
                    db.collection('social_accounts').add(social_account_data)
                    app.logger.info(f"Created social account record for @{user_info.get('screenName')}")
                    
                except Exception as e:
                    app.logger.error(f"Error storing social account in Firestore: {e}")
                    # Continue mesmo com erro no banco, para não impactar a experiência do usuário
            
            # Responde com sucesso
            return jsonify({
                "success": True,
                "message": "Successfully connected X account",
                "tokens": {
                    "access_token": access_token,
                    "token_type": token_response.get('token_type'),
                    "expires_in": expires_in
                },
                "userInfo": user_info,
                "followedAccounts": followed_accounts
            }), 200
            
        except Exception as e:
            app.logger.error(f"Error processing OAuth 2.0 callback: {str(e)}")
            import traceback
            app.logger.error(traceback.format_exc())
            return jsonify({
                "error": "Failed to process callback",
                "details": str(e)
            }), 500
            
    # Função auxiliar para obter informações do usuário via OAuth 2.0
    def get_twitter_user_info_oauth2(access_token):
        try:
            user_url = 'https://api.twitter.com/2/users/me'
            
            # Request more fields for detailed user information
            params = {
                'user.fields': 'id,name,username,profile_image_url,public_metrics,verified,description,created_at,location,url,entities'
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}'
            }
            
            app.logger.info(f"Requesting detailed user info from Twitter API with fields: {params['user.fields']}")
            response = requests.get(user_url, params=params, headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                app.logger.info(f"Received user data from Twitter API: {json.dumps(user_data)[:200]}...")
                
                if 'data' in user_data:
                    # Extract more detailed information
                    public_metrics = user_data['data'].get('public_metrics', {})
                    following_count = public_metrics.get('following_count', 0)
                    followers_count = public_metrics.get('followers_count', 0)
                    tweet_count = public_metrics.get('tweet_count', 0)
                    
                    # Log detailed user information
                    app.logger.info(f"User @{user_data['data']['username']} has {followers_count} followers, " + 
                                    f"follows {following_count} accounts, and has {tweet_count} tweets")
                    
                    return {
                        'userId': user_data['data']['id'],
                        'name': user_data['data']['name'],
                        'screenName': user_data['data']['username'],
                        'profileImageUrl': user_data['data'].get('profile_image_url', ''),
                        'verified': user_data['data'].get('verified', False),
                        'description': user_data['data'].get('description', ''),
                        'followersCount': followers_count,
                        'followingCount': following_count,
                        'tweetCount': tweet_count,
                        'location': user_data['data'].get('location', ''),
                        'url': user_data['data'].get('url', ''),
                        'createdAt': user_data['data'].get('created_at', '')
                    }
            else:
                app.logger.error(f"Twitter API error: {response.status_code} - {response.text}")
            
            return None
        except Exception as e:
            app.logger.error(f"Error getting Twitter user info: {e}")
            return None
            
    # Função auxiliar para obter contas seguidas via OAuth 2.0
    def get_twitter_followed_accounts_oauth2(access_token):
        try:
            # Primeiro precisamos pegar o ID do usuário
            user_info = get_twitter_user_info_oauth2(access_token)
            
            if not user_info or 'userId' not in user_info:
                app.logger.error("Não foi possível obter o ID do usuário para buscar seguidores")
                return []
                
            user_id = user_info['userId']
            
            # Agora podemos obter os seguidores
            follows_url = f'https://api.twitter.com/2/users/{user_id}/following'
            
            params = {
                'max_results': 50,  # Aumentado para 50 (máximo permitido pela API)
                'user.fields': 'id,name,username,profile_image_url,public_metrics,verified,description'
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}'
            }
            
            app.logger.info(f"Buscando contas seguidas para o usuário {user_id}")
            response = requests.get(follows_url, params=params, headers=headers)
            
            app.logger.info(f"Resposta da API do Twitter (following): {response.status_code}")
            
            if response.status_code == 200:
                follows_data = response.json()
                app.logger.info(f"Número de contas seguidas encontradas: {len(follows_data.get('data', []))}")
                
                # Logar dados para fins de depuração
                for user in follows_data.get('data', [])[:5]:  # Limitando a 5 para não sobrecarregar o log
                    app.logger.info(f"Conta seguida: @{user.get('username')} - {user.get('name')}")
                
                if 'data' in follows_data:
                    formatted_accounts = []
                    
                    for user in follows_data['data']:
                        followers_count = user.get('public_metrics', {}).get('followers_count', 0)
                        is_verified = user.get('verified', False)
                        
                        formatted_accounts.append({
                            "id": user.get('id'),
                            "name": user.get('name'),
                            "username": f"@{user.get('username')}",
                            "profileImage": user.get('profile_image_url'),
                            "followers": f"{followers_count:,}".replace(',', '.'),
                            "isVerified": is_verified,
                            "description": user.get('description', '')
                        })
                    
                    return formatted_accounts
            else:
                app.logger.error(f"Erro ao obter seguidores: {response.status_code} - {response.text}")
            
            return []
        except Exception as e:
            app.logger.error(f"Error getting Twitter followed accounts: {e}")
            return []

    @app.route('/api/oauth/x/v2/current-user', methods=['GET'])
    @token_required
    def get_current_x_user(user):
        try:
            if not db:
                return jsonify({"error": "Database connection is not available"}), 500
                
            # Get the authenticated user's ID
            user_id = user.get('uid') if isinstance(user, dict) else user
            
            if not user_id:
                return jsonify({"error": "User ID not found in authentication token"}), 401
                
            app.logger.info(f"Looking for X account for user ID: {user_id}")
            
            # Modify query to avoid composite index requirement
            # First get all X accounts for this user without sorting
            try:
                social_accounts = db.collection('social_accounts')\
                    .where('user_id', '==', user_id)\
                    .where('platform', '==', 'X')\
                    .get()
                    
                # Manually filter and sort if we have results
                if social_accounts and len(social_accounts) > 0:
                    # Convert to list and sort manually
                    accounts_list = list(social_accounts)
                    if len(accounts_list) > 1:
                        # Sort by connected_at time if it exists
                        accounts_list.sort(
                            key=lambda doc: doc.to_dict().get('connected_at', ''), 
                            reverse=True
                        )
                    
                    # Get the most recent one
                    account_data = accounts_list[0].to_dict()
                    app.logger.info(f"Found X account for user: {account_data.get('screen_name')}")
                else:
                    # No accounts found for this user, try fallback
                    app.logger.warning(f"No X account found for user {user_id}. Trying fallback...")
                    raise ValueError("No accounts found for this user")
                    
            except Exception as e:
                app.logger.warning(f"Error in primary query: {str(e)}")
                # Fallback: try alternative approach without composite index
                try:
                    # Get all X platform accounts
                    platform_accounts = db.collection('social_accounts')\
                        .where('platform', '==', 'X')\
                        .get()
                    
                    # Manually filter for the current user_id
                    user_accounts = [doc for doc in platform_accounts if doc.to_dict().get('user_id') == user_id]
                    
                    if user_accounts:
                        # Sort by connected_at time if multiple accounts
                        if len(user_accounts) > 1:
                            user_accounts.sort(
                                key=lambda doc: doc.to_dict().get('connected_at', ''), 
                                reverse=True
                            )
                        account_data = user_accounts[0].to_dict()
                        app.logger.info(f"Found X account for user using fallback: {account_data.get('screen_name')}")
                    else:
                        # Final fallback: any X account
                        app.logger.warning(f"No X account found for this user at all. Using any available X account as fallback.")
                        if platform_accounts and len(platform_accounts) > 0:
                            # Sort platform accounts by connected_at
                            platform_accounts_list = list(platform_accounts)
                            if len(platform_accounts_list) > 1:
                                platform_accounts_list.sort(
                                    key=lambda doc: doc.to_dict().get('connected_at', ''), 
                                    reverse=True
                                )
                            account_data = platform_accounts_list[0].to_dict()
                            app.logger.info(f"Using fallback X account: {account_data.get('screen_name')}")
                        else:
                            app.logger.error("No X accounts found in database at all.")
                            return jsonify({
                                "success": False,
                                "error": "No connected X account found"
                            }), 404
                except Exception as inner_e:
                    app.logger.error(f"Fallback query also failed: {str(inner_e)}")
                    return jsonify({
                        "success": False,
                        "error": "Failed to query database for X accounts",
                        "details": str(inner_e)
                    }), 500
            
            # Continue with the existing code to check token expiration and get user info
            
            # Check if token is expired
            current_time = int(time.time())
            token_expires_at = account_data.get('expires_at', 0)
            
            access_token = account_data.get('access_token')
            
            if token_expires_at <= current_time or not access_token:
                app.logger.warning(f"Token expired at {token_expires_at}, current time is {current_time}")
                # Token expired or missing, try to refresh or ask user to reconnect
                return jsonify({
                    "success": False,
                    "error": "X account session expired. Please reconnect your account."
                }), 401
                
            # Get user info
            app.logger.info("Retrieving user info with access token")
            user_info = get_twitter_user_info_oauth2(access_token)
            
            if not user_info:
                app.logger.error("Failed to retrieve user info from Twitter API")
                return jsonify({
                    "success": False,
                    "error": "Failed to retrieve user information from X"
                }), 500
                
            # Get followed accounts
            app.logger.info("Retrieving followed accounts with access token")
            followed_accounts = get_twitter_followed_accounts_oauth2(access_token)
            
            return jsonify({
                "success": True,
                "message": "Successfully retrieved X account data",
                "userInfo": user_info,
                "followedAccounts": followed_accounts
            }), 200
                
        except Exception as e:
            app.logger.error(f"Error retrieving current X user: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Failed to retrieve X account information",
                "details": str(e)
            }), 500