import os
import sys
# Adiciona o diretório atual ao caminho de importação
sys.path.append(os.path.abspath("."))

from src.main.app import app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True) 