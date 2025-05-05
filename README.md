# Know Your Fan

## Sobre o Projeto

Know Your Fan é uma plataforma completa para gerenciamento de comunidades de fãs, permitindo que organizadores de eventos possam conhecer melhor seu público e oferecer experiências mais personalizadas. O projeto utiliza uma arquitetura moderna com backend em Python/Flask e frontend em React.

## Funcionalidades Principais

### Para Fãs
- **Autenticação Segura**: Registro e login através do Firebase Authentication
- **Perfil Personalizado**: Configuração detalhada de perfil com imagem, dados pessoais e preferências
- **Documentos**: Upload e gestão de documentos pessoais
- **Eventos**: Visualização e inscrição em eventos disponíveis
- **Redes Sociais**: Integração com redes sociais e compartilhamento de conteúdo

### Para Organizadores
- **Dashboard**: Visão geral da comunidade e estatísticas
- **Gerenciamento de Usuários**: Visualização e administração dos fãs
- **Análise de Dados**: Insights sobre preferências e comportamentos dos fãs
- **Configurações**: Personalização da plataforma

## Tecnologias Utilizadas

### Backend
- **Python/Flask**: Framework web para API RESTful
- **Firebase**: Autenticação e armazenamento de dados
- **Firebase Admin SDK**: Gerenciamento de usuários e verificação de tokens
- **OpenCV & NumPy**: Processamento e análise de imagens
- **Gunicorn**: Servidor HTTP WSGI para produção

### Frontend
- **React/Vite**: Biblioteca JavaScript para construção de interfaces
- **Chakra UI**: Biblioteca de componentes para UI moderna e acessível
- **React Router**: Navegação e roteamento na aplicação
- **Axios**: Cliente HTTP para comunicação com a API
- **React Hook Form & Zod**: Gerenciamento e validação de formulários
- **Framer Motion**: Animações fluidas e interativas

### DevOps & Infraestrutura
- **Vercel/Netlify**: Hospedagem do frontend
- **Render/Railway/Heroku**: Hospedagem do backend
- **Git & GitHub**: Controle de versão e colaboração

## Arquitetura do Projeto

O projeto segue uma arquitetura limpa (Clean Architecture) com separação clara de responsabilidades:

### Backend
```
backend/
├── src/
│   ├── domain/            # Regras de negócio e entidades
│   ├── application/       # Casos de uso da aplicação
│   ├── infrastructure/    # Implementações de repositórios
│   ├── services/          # Serviços externos (Firebase, etc)
│   ├── main/              # Configuração e inicialização
│   └── config/            # Configurações da aplicação
└── ...
```

### Frontend
```
frontend/
├── src/
│   ├── domain/            # Modelos e regras de negócio
│   ├── services/          # Serviços de API e externos
│   ├── presentation/      # Componentes de UI e páginas
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── layouts/       # Layouts compartilhados
│   │   └── hooks/         # React hooks personalizados
│   └── ...
└── ...
```

## Configuração e Execução

### Pré-requisitos
- Node.js (v18+)
- Python (3.10+)
- Conta no Firebase com Authentication e Firestore habilitados

### Backend
```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/know-your-fan.git
cd know-your-fan/backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
# Copie o arquivo de exemplo e ajuste as configurações
cp env.example .env

# Executar a aplicação
# No Windows:
run.bat

# No Linux/macOS:
./run.sh
```

### Frontend
```bash
# Navegar para a pasta do frontend
cd ../frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Copie o arquivo de exemplo e ajuste as configurações
cp env.example .env

# Iniciar o servidor de desenvolvimento
npm run dev
```

## Deployment

O projeto está configurado para fácil implantação em diversas plataformas:

### Frontend
- **Vercel**: Configurado com `vercel.json`
- **Netlify**: Configurado com `netlify.toml`

### Backend
- **Heroku**: Configurado com `Procfile`
- **Render/Railway**: Automaticamente detectado pelo `requirements.txt`

## Licença
Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.