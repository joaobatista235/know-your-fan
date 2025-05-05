import firebase_admin
from firebase_admin import credentials, auth, firestore, storage
import os
from pathlib import Path
from dotenv import load_dotenv


class FirebaseApp:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseApp, cls).__new__(cls)
            cls._instance._initialize_app()
        return cls._instance
    
    def _initialize_app(self):
        try:
            # Carrega as variáveis de ambiente
            load_dotenv()
            
            if not firebase_admin._apps:
                # Usa as variáveis de ambiente para configurar as credenciais
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
                self.app = firebase_admin.initialize_app(cred, {
                    'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'know-your-fan.appspot.com')
                })
                print("Firebase initialized successfully")
            else:
                self.app = firebase_admin.get_app()
                print("Using existing Firebase app")
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            self.app = None
    
    def verify_id_token(self, id_token):
        try:
            return auth.verify_id_token(id_token)
        except Exception as e:
            print(f"Error verifying token: {e}")
            return None 