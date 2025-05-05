import os
import json
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

def initialize_firebase():
    """
    Inicializa o Firebase utilizando credenciais de variáveis de ambiente.
    """
    # Carrega variáveis de ambiente do arquivo .env
    try:
        load_dotenv()
    except Exception as e:
        logger.warning(f"Erro ao carregar .env: {e}")
    
    try:
        # Se o app já está inicializado, não faz nada
        if firebase_admin._apps:
            logger.info("Firebase já inicializado")
            return
            
        # Usa variáveis de ambiente para as credenciais
        logger.info("Inicializando Firebase com credenciais de variáveis de ambiente")
        
        firebase_credentials = {
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace("\\n", "\n") if os.getenv("FIREBASE_PRIVATE_KEY") else None,
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
            "token_uri": os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
            "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_CERT_URL", "https://www.googleapis.com/oauth2/v1/certs"),
            "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL"),
            "universe_domain": "googleapis.com"
        }
        
        # Valida informações críticas
        if not firebase_credentials["project_id"] or not firebase_credentials["private_key"]:
            raise ValueError("Credenciais do Firebase incompletas nas variáveis de ambiente")
            
        cred = credentials.Certificate(firebase_credentials)
        
        # Inicializa o Firebase com as credenciais
        firebase_admin.initialize_app(cred)
        logger.info("Firebase inicializado com sucesso")
        
    except Exception as e:
        logger.error(f"Erro ao inicializar o Firebase: {str(e)}")
        raise 