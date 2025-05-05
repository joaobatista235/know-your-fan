import os
import json
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv
import logging
import os.path

logger = logging.getLogger(__name__)

def initialize_firebase():
    """
    Inicializa o Firebase utilizando credenciais de variáveis de ambiente
    ou arquivo de credenciais, dependendo do ambiente.
    """
    # Tenta carregar variáveis de ambiente do arquivo .env, se ele existir
    try:
        load_dotenv()
    except Exception as e:
        logger.warning(f"Erro ao carregar .env: {e}")
    
    # Verifica se está em ambiente de produção
    is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
    
    try:
        # Se o app já está inicializado, não faz nada
        if firebase_admin._apps:
            logger.info("Firebase já inicializado")
            return
            
        if is_production or not os.path.exists('firebase-service-account.json'):
            # Em produção ou se o arquivo não existe, usa variáveis de ambiente
            logger.info("Inicializando Firebase com credenciais de variáveis de ambiente")
            
            # Valores padrão para desenvolvimento
            firebase_credentials = {
                "type": "service_account",
                "project_id": os.getenv("FIREBASE_PROJECT_ID", "know-your-fan-77392"),
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID", "b2e938fe6fdeec077ce95128d88e4e31768a1858"),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCk979UNn5hEGV+\nv5btxTSMPs3p7EIGxCw5+t0pk1AbzC0M+4tsO1jPcJVfEAVDoVhhSfh0EbAVyLi9\nIs9SsIdD4+9cp9hfhWZxC7iwbn1nqz2Bgz6PokEGdDBRP6cHvsA2l8kQzbFk5huz\nw7M1qEZ5ziEBDuDkSghcqQGfB4oNssWiABiH1eN87rqu3UIriphZxZSx35xkcE0e\nik+Y5x/Gh+7cJaWzgRhv9PFOApfkjfDoIkl1bw5oHsErqh6bVt1nl5DlhMstG1PA\njr+uzdfyc07s/3xQ8eLizcjac/tuwKCH8qQDD7Sj3wjsGrKox+LHEG6Xqqn1zcWS\neOLN/ZrXAgMBAAECggEARdGZB3I80KXY3ukFXsJ89/JIwf09AJIcSbmzyrnPSMSE\nOJ9ppbgEYV87yM0F/VaXCi39Wlp2FPIrxdiquEuAJCqfDq72846JCcU1OG664ppl\n4J+EZdP9A1c/b9OpxKxlu3VIIrV7o8GD7fQgr8/1a+3iqAj9A4GVwmnBBuZw9lSJ\n1q/g/P9CjOKoCvjqhmczW30bWuTxCzu4jpMYhxh3sfDq4zKkurdi/ziepItcMkQ4\n8F74botqBuoeNlgiFbhdLbI+mnagBOWr7HDeNo8IEPHkywtImdeLqQKDGNCQ4ued\nNL4dB4l3Ahg/VXqfN5vfmYZ9VUAMh4mBza4CP3BFKQKBgQDcDCgkkKyTBbDfE7r8\nEP/mBsSrTuxgBA5cuIbKXUXWDAGWYVpNhvEB0ySrYhD0sVaP2/wP2/jxlGEnWpRu\nlpp3EYjayAJQCe9GNsT5LO8Q1g1oRKe8Q3lAZASITwQzyJJWmIBaYzINdOUHnC/N\nNKXPWfOwM6mFm0L6YK/i53c0ywKBgQC/68qvE8epH51IZeqroo9n5meG+MoEaocs\nSUtq7UyEOx+oxDXhvLfVWqHLXGfqo+Vhwwr7LzsOglDzDZARQytw/uh9Mwfoe/jw\n+MQmCdZya7n0+SM1rD7tTgsV5FRclQAAaNI/02+dBEAqCRTIZZrey6/H7Vrmwm38\nM5+iKTs8pQKBgQCzCoEvHzgLeDntiFQ//GT6eM9Uw6a4iRRWhR3HUhUckDBKd3PO\nWNmILpBLkkNRlWllLAzvqn/nsF9McfsL8CZGc1HzEYIwNaUmcDHcvJ7YCBJooFQK\nbqwdpEO71O8KY0wOgY8N/GAhatdfVcnfIdM332zUFXT9bNMWfc0exk7L+QKBgEun\n/Pd1ebDe6JbArnjIlXWk60zWyHRjNjQsFJHrR82crQdPidoaFfICT2OmYsSppWQb\nijmozcQTdSvLPe7AJuDda/Lm6ggozuLXfiNsn1/tvZmnmMywwQG1UUNpBiSVDDId\nIDzO8eHY6h5oBAxXmWyYqQvMMphjLw5Ln3NCg7qNAoGASFfR1Irqt1IIl0k5EaJy\nNeA8aIAg+RoJxr1Gzspdj9uYMWSXKExqN+BcZxu8gq9Yttqqz9Pz8nwrabpPwzJR\noCS69S0WrodiEfQ3WBZ7CZjjR3h4qz+IPNl6tjrgLybqlfo6ck6GSCFzTcM1niJv\n6Uzm8ri068ShnlvmrMu5V6I=\n-----END PRIVATE KEY-----\n").replace("\\n", "\n"),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL", "firebase-adminsdk-fbsvc@know-your-fan-77392.iam.gserviceaccount.com"),
                "client_id": os.getenv("FIREBASE_CLIENT_ID", "108960465442689904836"),
                "auth_uri": os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
                "token_uri": os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
                "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_CERT_URL", "https://www.googleapis.com/oauth2/v1/certs"),
                "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL", "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40know-your-fan-77392.iam.gserviceaccount.com"),
                "universe_domain": "googleapis.com"
            }
            
            # Valida informações críticas
            if not firebase_credentials["project_id"] or not firebase_credentials["private_key"]:
                raise ValueError("Credenciais do Firebase incompletas nas variáveis de ambiente")
                
            cred = credentials.Certificate(firebase_credentials)
        else:
            # Em desenvolvimento, usa arquivo de credenciais
            logger.info("Inicializando Firebase com arquivo de credenciais local")
            service_account_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                'firebase-service-account.json'
            )
            cred = credentials.Certificate(service_account_path)
        
        # Inicializa o Firebase com as credenciais
        firebase_admin.initialize_app(cred)
        logger.info("Firebase inicializado com sucesso")
        
    except Exception as e:
        logger.error(f"Erro ao inicializar o Firebase: {str(e)}")
        raise 