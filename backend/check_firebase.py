"""
Script para verificar a configuração do Firebase e fornecer orientações para resolver problemas comuns
"""
import os
import json
import sys
from pathlib import Path

def check_firebase_config():
    """Verifica a configuração do Firebase e imprime orientações"""
    print("=== Verificando configuração do Firebase ===")
    
    # 1. Verificar existência do arquivo de credenciais
    service_account_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
    
    if service_account_path:
        print(f"✅ Variável de ambiente FIREBASE_SERVICE_ACCOUNT definida: {service_account_path}")
        if not os.path.exists(service_account_path):
            print(f"❌ ERRO: Arquivo não encontrado em: {service_account_path}")
    else:
        print("❌ Variável de ambiente FIREBASE_SERVICE_ACCOUNT não definida")
        
        # Verificar na raiz do projeto
        default_path = Path.cwd() / 'firebase-service-account.json'
        if default_path.exists():
            print(f"✅ Encontrado arquivo de credenciais na raiz: {default_path}")
            service_account_path = str(default_path)
        else:
            print("❌ ERRO: Arquivo firebase-service-account.json não encontrado na raiz do projeto")
            print("\nSOLUÇÃO:")
            print("1. Acesse o console do Firebase: https://console.firebase.google.com/")
            print("2. Vá para Configurações do Projeto > Contas de serviço")
            print("3. Clique em 'Gerar nova chave privada'")
            print("4. Salve o arquivo JSON baixado como 'firebase-service-account.json' na raiz do projeto (backend/)")
            print("   OU defina a variável de ambiente FIREBASE_SERVICE_ACCOUNT com o caminho completo para o arquivo")
            return False
    
    # 2. Verificar conteúdo do arquivo de credenciais
    try:
        with open(service_account_path, 'r') as f:
            credentials = json.load(f)
            
        required_fields = ['type', 'project_id', 'private_key', 'client_email']
        missing_fields = [field for field in required_fields if field not in credentials]
        
        if missing_fields:
            print(f"❌ ERRO: Arquivo de credenciais incompleto. Campos ausentes: {', '.join(missing_fields)}")
            return False
        else:
            print(f"✅ Arquivo de credenciais válido para o projeto: {credentials.get('project_id')}")
            
        # 3. Lembrar sobre configuração do Authentication
        print("\n=== Configuração do Firebase Authentication ===")
        print("Verifique se o método de autenticação Email/Senha está habilitado:")
        print("1. Acesse o console do Firebase: https://console.firebase.google.com/")
        print(f"2. Selecione o projeto: {credentials.get('project_id')}")
        print("3. Vá para Authentication > Sign-in method")
        print("4. Ative o provedor 'Email/Password'")
        
        # 4. Web API Key
        print("\n=== Firebase Web API Key ===")
        web_api_key = os.environ.get('FIREBASE_WEB_API_KEY')
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
        print(f"2. Selecione o projeto: {credentials.get('project_id')}")
        print("3. Na barra lateral, clique em 'Firestore Database'")
        print("4. Se você não tiver criado um banco de dados, será solicitado a criar um")
        print(f"5. URL para criar o banco de dados: https://console.cloud.google.com/firestore/setup?project={credentials.get('project_id')}")
        
        # Verificar se o Firestore está funcionando
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore
            
            # Inicializar o Firebase temporariamente
            if not firebase_admin._apps:
                cred = credentials.Certificate(service_account_path)
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
            firebase_admin.delete_app(firebase_admin.get_app(name='check')) if 'check' in firebase_admin._apps else None
            
        return True
            
    except json.JSONDecodeError:
        print(f"❌ ERRO: O arquivo de credenciais não é um JSON válido: {service_account_path}")
        return False
    except Exception as e:
        print(f"❌ ERRO ao ler o arquivo de credenciais: {e}")
        return False

if __name__ == "__main__":
    success = check_firebase_config()
    if not success:
        print("\nVerificação falhou. Corrija os problemas antes de executar a aplicação.")
        sys.exit(1)
    else:
        print("\nVerificação concluída. Você pode executar a aplicação agora.")
        sys.exit(0) 