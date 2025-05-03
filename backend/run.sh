#!/bin/bash
# Script para executar o backend do Know Your Fan

# Verifica se o ambiente virtual existe
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual..."
    python3 -m venv venv
fi

# Ativa o ambiente virtual
source venv/bin/activate

# Instala ou atualiza dependências
echo "Instalando dependências..."
pip install -r requirements.txt

# Define PYTHONPATH
export PYTHONPATH=.

# Executa a aplicação
echo "Iniciando a aplicação..."
python run.py 