import firebase_admin
from firebase_admin import credentials, auth, firestore, storage
import os
from pathlib import Path


class FirebaseApp:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseApp, cls).__new__(cls)
            cls._instance._initialize_app()
        return cls._instance
    
    def _initialize_app(self):
        try:
            if not firebase_admin._apps:
                service_account_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
                
                if not service_account_path:
                    parent_dir = Path(__file__).parent.parent.parent.parent
                    default_path = parent_dir / 'firebase-service-account.json'
                    
                    if default_path.exists():
                        service_account_path = str(default_path)
                    else:
                        raise ValueError("Firebase service account file not found. Please set FIREBASE_SERVICE_ACCOUNT environment variable.")
                
                cred = credentials.Certificate(service_account_path)
                self.app = firebase_admin.initialize_app(cred, {
                    'storageBucket': os.environ.get('FIREBASE_STORAGE_BUCKET', 'know-your-fan.appspot.com')
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