"""
Script para verificar a configuração do Firebase e fornecer orientações para resolver problemas comuns
"""
import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv

def check_firebase_config():
    """Verifica a configuração do Firebase e imprime orientações"""
    print("=== Verificando configuração do Firebase ===")
    
    # Carrega variáveis de ambiente do arquivo .env
    try:
        load_dotenv()
        print("✅ Arquivo .env carregado com sucesso")
    except Exception as e:
        print(f"⚠️ Aviso ao carregar .env: {e}")
    
    # 1. Verificar existência das variáveis de ambiente necessárias
    required_env_vars = [
        "FIREBASE_PROJECT_ID",
        "FIREBASE_PRIVATE_KEY_ID",
        "FIREBASE_PRIVATE_KEY",
        "FIREBASE_CLIENT_EMAIL",
        "FIREBASE_CLIENT_ID",
        "FIREBASE_CLIENT_CERT_URL"
    ]
    
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ ERRO: Variáveis de ambiente obrigatórias não definidas: {', '.join(missing_vars)}")
        print("\nSOLUÇÃO:")
        print("Adicione as seguintes variáveis ao seu arquivo .env:")
        for var in missing_vars:
            print(f"- {var}")
        return False
    else:
        print("✅ Todas as variáveis de ambiente obrigatórias estão definidas")
    
    # 2. Criar um objeto de credenciais para testar
    try:
        # Cria um objeto de credenciais a partir das variáveis de ambiente
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
            
        print(f"✅ Credenciais configuradas para o projeto: {firebase_credentials.get('project_id')}")
            
        # 3. Lembrar sobre configuração do Authentication
        print("\n=== Configuração do Firebase Authentication ===")
        print("Verifique se o método de autenticação Email/Senha está habilitado:")
        print("1. Acesse o console do Firebase: https://console.firebase.google.com/")
        print(f"2. Selecione o projeto: {firebase_credentials.get('project_id')}")
        print("3. Vá para Authentication > Sign-in method")
        print("4. Ative o provedor 'Email/Password'")
        
        # 4. Web API Key
        print("\n=== Firebase Web API Key ===")
        web_api_key = os.getenv('FIREBASE_WEB_API_KEY')
        if web_api_key:
            print("✅ Variável de ambiente FIREBASE_WEB_API_KEY definida")
        else:
            print("❓ Variável de ambiente FIREBASE_WEB_API_KEY não definida (pode ser necessária para algumas operações)")
            print("Para obter a Web API Key, acesse:")
            print("1. Console do Firebase > Configurações do Projeto > Configurações gerais")
            print("2. Em 'Seus aplicativos', encontre a seção 'SDK de configuração' e procure por 'apiKey'")
        
        # 5. Verificar Firestore
        print("\n=== Configuração do Firestore ===")
        print("É necessário criar um banco de dados Firestore para que a aplicação funcione corretamente.")
        print("Verifique se você já criou um banco de dados Firestore:")
        print("1. Acesse o console do Firebase: https://console.firebase.google.com/")
        print(f"2. Selecione o projeto: {firebase_credentials.get('project_id')}")
        print("3. Na barra lateral, clique em 'Firestore Database'")
        print("4. Se você não tiver criado um banco de dados, será solicitado a criar um")
        print(f"5. URL para criar o banco de dados: https://console.cloud.google.com/firestore/setup?project={firebase_credentials.get('project_id')}")
        
        # Verificar se o Firestore está funcionando
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore
            
            # Inicializar o Firebase temporariamente
            if not firebase_admin._apps:
                cred = credentials.Certificate(firebase_credentials)
                firebase_admin.initialize_app(cred, name='check')
            
            # Tentar acessar o Firestore
            db = firestore.client(app=firebase_admin.get_app(name='check'))
            # Tentar uma operação simples
            collections = [col.id for col in db.collections()]
            print(f"✅ Conexão com Firestore estabelecida. Coleções existentes: {collections or 'Nenhuma'}")
            
            # Limpar o app temporário
            firebase_admin.delete_app(firebase_admin.get_app(name='check'))
            
        except Exception as e:
            print(f"❌ ERRO ao conectar ao Firestore: {e}")
            print("\nSOLUÇÃO:")
            print("1. Verifique se o Firestore foi criado no console do Firebase")
            print("2. Se você acabou de criar o banco de dados, pode levar alguns minutos para que ele seja ativado")
            print("3. Verifique se as regras de segurança do Firestore permitem acesso de conta de serviço")
            print("4. Verifique se o formato da chave privada está correto (substitua \\n por quebras de linha reais)")
            if 'check' in firebase_admin._apps:
                firebase_admin.delete_app(firebase_admin.get_app(name='check'))
            
        return True
            
    except Exception as e:
        print(f"❌ ERRO ao configurar credenciais do Firebase: {e}")
        return False

if __name__ == "__main__":
    success = check_firebase_config()
    if not success:
        print("\nVerificação falhou. Corrija os problemas antes de executar a aplicação.")
        sys.exit(1)
    else:
        print("\nVerificação concluída. Você pode executar a aplicação agora.")
        sys.exit(0) 