@echo off
REM Script para executar o backend do Know Your Fan

REM Verifica se o ambiente virtual existe
if not exist venv (
    echo Criando ambiente virtual...
    python -m venv venv
)

REM Ativa o ambiente virtual
call venv\Scripts\activate

REM Instala ou atualiza dependências
echo Instalando dependências...
pip install -r requirements.txt

REM Define PYTHONPATH
set PYTHONPATH=.

REM Executa a aplicação
echo Iniciando a aplicação...
python run.py

REM Pausa para ver mensagens de erro
pause 