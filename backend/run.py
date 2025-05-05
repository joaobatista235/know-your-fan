import os
import sys
# Adiciona o diretório atual ao caminho de importação
sys.path.append(os.path.abspath("."))

from src.main.app import app
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

if __name__ == "__main__":
    # Obtém configurações do ambiente ou usa valores padrão
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("ENVIRONMENT", "development").lower() == "development"
    
    app.run(host=host, port=port, debug=debug) 