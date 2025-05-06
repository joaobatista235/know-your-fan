# Know Your Fan - Frontend

O **Know Your Fan** é uma aplicação web que permite que organizadores de eventos esportivos e e-sports identifiquem e conheçam melhor seus fãs, facilitando a entrada nos eventos através de verificação de documentos e análise facial, além de integrar com redes sociais para ampliar o engajamento.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Instalação e Execução](#instalação-e-execução)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Integração com Backend](#integração-com-backend)
- [Deploy](#deploy)
- [Testes](#testes)
- [Contribuição](#contribuição)

## 🌟 Visão Geral

O Know Your Fan é uma plataforma que conecta organizadores de eventos esportivos e e-sports com seus fãs, oferecendo:

- Verificação de documentos e identidade
- Integração com redes sociais
- Estatísticas e análises de público
- Interface moderna e responsiva
- Segurança e privacidade dos dados dos usuários

## 🚀 Funcionalidades

### Autenticação e Perfil de Usuário

- **Login e Registro**: Sistema completo de autenticação com email/senha
- **Cadastro de Perfil**: Formulário com validação para dados pessoais
- **Upload de Foto**: Captura e upload de foto para o perfil
- **Gerenciamento de Conta**: Edição de informações e preferências

### Digitalização de Documentos

- **Upload de Documentos**: Sistema para envio de documentos (RG, CPF, etc.)
- **Análise Automática**: Processamento de documentos com verificação de autenticidade
- **Validação de Identidade**: Comparação entre foto do perfil e documento

### Integração com Redes Sociais

- **Conexão com Twitter/X**: Autenticação OAuth para integração com Twitter/X
- **Sincronização de Conteúdo**: Exibição de atividades recentes nas redes
- **Compartilhamento**: Funcionalidade para compartilhar eventos

### Gerenciamento de Eventos

- **Listagem de Eventos**: Exibição de eventos disponíveis
- **Filtros e Pesquisa**: Busca e filtragem por categorias, datas e locais
- **Detalhes do Evento**: Visualização completa das informações do evento

### Busca e Preenchimento Automático de Endereço

- **Autocomplete de CEP**: Preenchimento automático de endereço a partir do CEP
- **Validação de Endereço**: Verificação de endereços usando múltiplas APIs

## 💻 Tecnologias

- **React**: Biblioteca JavaScript para construção de interfaces
- **Vite**: Build tool e servidor de desenvolvimento
- **Tailwind CSS**: Framework CSS para estilização responsiva
- **Axios**: Cliente HTTP para comunicação com o backend
- **React Router**: Sistema de roteamento para navegação
- **Headless UI**: Componentes acessíveis sem estilo predefinido
- **React Hook Form**: Gerenciamento de formulários
- **Context API**: Gerenciamento de estado global
- **OAuth 2.0**: Autenticação com provedores externos

## 🔧 Configuração do Ambiente

### Requisitos

- Node.js 18.x ou superior
- npm 9.x ou superior

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
VITE_API_URL=http://localhost:5000
```

Para produção, as variáveis são configuradas no arquivo `netlify.toml`.

## 📦 Instalação e Execução

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/know-your-fan.git
cd know-your-fan/frontend

# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Construir para produção
npm run build

# Visualizar build de produção localmente
npm run preview
```

## 📂 Estrutura do Projeto

```
frontend/
├── public/                  # Arquivos estáticos
├── src/
│   ├── assets/              # Imagens, fontes e outros recursos
│   ├── components/          # Componentes reutilizáveis
│   ├── contexts/            # Contextos React para estado global
│   ├── hooks/               # Custom hooks
│   ├── pages/               # Componentes de página
│   ├── presentation/        # Componentes de apresentação
│   ├── services/            # Serviços e APIs
│   ├── utils/               # Funções utilitárias
│   ├── App.jsx              # Componente principal
│   ├── main.jsx             # Ponto de entrada
│   └── routes.jsx           # Configuração de rotas
├── .env.example             # Exemplo de variáveis de ambiente
├── index.html               # Template HTML
├── netlify.toml             # Configuração para deploy no Netlify
├── package.json             # Dependências e scripts
└── vite.config.js           # Configuração do Vite
```

## 🔌 Integração com Backend

O frontend se comunica com o backend através de uma API RESTful. A configuração da URL da API é feita através da variável de ambiente `VITE_API_URL`.

### Principais Endpoints Utilizados

- **Autenticação**: `/api/auth/login`, `/api/auth/register`, `/api/auth/verify`
- **Perfil de Usuário**: `/api/users/profile`, `/api/users/profile/image`
- **Documentos**: `/api/document/analyze`
- **Redes Sociais**: `/api/oauth/x/v2/request-token`, `/api/oauth/x/v2/callback`

A implementação dos serviços de API pode ser encontrada em `src/services/api.js`.

## 🚢 Deploy

O projeto está configurado para deploy no Netlify, utilizando integração contínua a partir do GitHub.

### Configuração do Netlify

O arquivo `netlify.toml` contém as configurações necessárias para:

- Build e diretório de publicação
- Variáveis de ambiente
- Redirecionamentos para suportar SPA
- Cabeçalhos de segurança e CORS

### Passos para Deploy Manual

1. Faça build do projeto: `npm run build`
2. Faça deploy para o Netlify usando a interface web ou CLI:
   ```bash
   npx netlify-cli deploy --prod
   ```

## 🧪 Testes

```bash
# Executar testes unitários
npm run test

# Executar testes com watch mode
npm run test:watch

# Verificar cobertura de testes
npm run test:coverage
```

## 👥 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
3. Faça commit das alterações: `git commit -m 'Adiciona nova funcionalidade'`
4. Faça push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

Desenvolvido com ❤️ por João Batista