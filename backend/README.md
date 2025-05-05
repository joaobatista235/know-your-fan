# Know Your Fan - Backend

API RESTful simplificada para o projeto Know Your Fan, com foco em autenticação usando Firebase.

## Estrutura do Projeto

```
backend/
├── uploads/               # Pasta para upload de arquivos (criada automaticamente)
├── src/
│   ├── domain/            # Regras de negócio e entidades
│   │   ├── entities/      # Modelos de dados
│   │   └── repositories/  # Interfaces de repositórios
│   ├── infrastructure/    # Implementações concretas
│   │   └── repositories/  # Implementações de repositórios
│   ├── main/              # Ponto de entrada da aplicação
│   │   ├── app.py         # Configuração do Flask
│   │   └── routes.py      # Rotas da aplicação
│   └── services/          # Serviços da aplicação
│       ├── auth_service.py # Serviço de autenticação com Firebase
│       └── user_service.py # Serviço de gerenciamento de usuários
├── run.py                 # Script para executar a aplicação
├── run.bat                # Script para execução no Windows
├── run.sh                 # Script para execução no Linux/macOS
└── requirements.txt       # Dependências do projeto
```

## Funcionalidades

### Autenticação com Firebase
- Registro de usuários
- Login de usuários
- Verificação de tokens

### Gerenciamento de Perfil
- Atualização de dados do perfil
- Armazenamento de imagem de perfil como base64
- Armazenamento de preferências do usuário

## Configuração do Firebase

### Requisitos
Para executar o projeto, você precisa de um projeto Firebase configurado com:
- Firebase Authentication ativado
- Cloud Firestore ativado

### Arquivo de Credenciais
Você precisa de um arquivo de credenciais do Firebase Service Account, que deve ser salvo na raiz do projeto como `firebase-service-account.json` ou especificado através da variável de ambiente `FIREBASE_SERVICE_ACCOUNT`.

### Variáveis de Ambiente
- `FIREBASE_SERVICE_ACCOUNT`: Caminho para o arquivo de credenciais do Firebase.

## Hospedagem do Backend

### Preparação para hospedagem

1. Configuração de variáveis de ambiente:
   - Copie o arquivo `env.example` para `.env`
   - Preencha todas as variáveis de ambiente necessárias
   - **IMPORTANTE**: Nunca compartilhe ou cometa o arquivo `.env` no Git

2. Segurança do Firebase:
   - Em produção, use variáveis de ambiente para as credenciais do Firebase
   - Remova ou proteja o arquivo `firebase-service-account.json`

### Opções de hospedagem

#### Render

1. Crie uma conta em [Render](https://render.com)
2. Crie um novo Web Service
3. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn run:app`
   - Adicione todas as variáveis de ambiente do arquivo `.env`

#### Railway

1. Crie uma conta em [Railway](https://railway.app)
2. Crie um novo projeto a partir do GitHub
3. Configure as variáveis de ambiente
4. O deploy ocorrerá automaticamente

#### Heroku

1. Instale o Heroku CLI
2. Faça login no Heroku: `heroku login`
3. Crie um novo app: `heroku create know-your-fan-api`
4. Configure as variáveis de ambiente: `heroku config:set ENVIRONMENT=production`
5. Faça deploy: `git push heroku main`

### Testando o deploy

1. Verifique se a API está respondendo corretamente nos endpoints
2. Teste a conexão com o Firebase
3. Verifique se o CORS está configurado para permitir o domínio do frontend

## Executando o Projeto

### Instalação

```bash
# Clonar o repositório
git clone [url-do-repositório]
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt
```

### Executando a aplicação

```bash
# No Windows:
run.bat

# No Linux/macOS:
./run.sh

# Ou diretamente com Python:
python run.py
```

A API estará disponível em http://localhost:5000

## Endpoints da API

### Health Check
- GET /health - Verificar estado da API

### Autenticação
- POST /api/auth/register - Registrar um novo usuário
  ```json
  {
    "email": "usuario@exemplo.com",
    "password": "senha123",
    "display_name": "Nome do Usuário"
  }
  ```

- POST /api/auth/login - Fazer login
  ```json
  {
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }
  ```

- POST /api/auth/verify - Verificar token
  ```json
  {
    "token": "seu-token-aqui"
  }
  ```

### Perfil do Usuário
- PUT /api/users/profile - Atualizar perfil (requer autenticação)
  
  ```json
  {
    "display_name": "Nome do Usuário",
    "cpf": "123.456.789-00",
    "date_of_birth": "1990-01-01",
    "cep": "12345-678",
    "street": "Rua Exemplo",
    "number": "123",
    "complement": "Apto 101",
    "neighborhood": "Bairro",
    "city": "São Paulo",
    "state": "SP",
    "favorite_games": ["CS:GO", "Valorant"],
    "favorite_teams": ["FURIA CS:GO"],
    "recent_events": ["Major 2023"],
    "profileImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQI..."
  }
  ```
  
  O campo `profileImage` deve conter a imagem codificada em base64, que será armazenada diretamente no documento do usuário.

- GET /api/users/profile/image - Obter imagem do perfil (requer autenticação)

  Resposta:
  ```json
  {
    "profile_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQI..."
  }
  ``` 