# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Hospedagem do Frontend

### Preparação para hospedagem

1. Configuração de variáveis de ambiente:
   - Copie o arquivo `env.example` para `.env.production`
   - Preencha todas as variáveis de ambiente necessárias, especialmente a URL da API
   - Para desenvolvimento local, crie um arquivo `.env.development`

2. Construa o projeto para produção:
   ```bash
   npm run build
   ```

### Opções de hospedagem

#### Vercel (Recomendado)

1. Crie uma conta em [Vercel](https://vercel.com)
2. Instale a CLI do Vercel: `npm i -g vercel`
3. Execute `vercel login`
4. Execute `vercel` na raiz do projeto para fazer deploy
5. Configure as variáveis de ambiente na interface da Vercel

#### Netlify

1. Crie uma conta em [Netlify](https://netlify.com)
2. Faça o upload da pasta `dist` ou configure para deploy automático do GitHub
3. Configure as variáveis de ambiente na interface do Netlify

#### Firebase Hosting

1. Instale o Firebase CLI: `npm install -g firebase-tools`
2. Faça login: `firebase login`
3. Inicialize o projeto: `firebase init`
   - Selecione "Hosting"
   - Escolha a pasta `dist` como diretório público
4. Faça deploy: `firebase deploy`

### Configurações importantes

1. Roteamento do lado do cliente
   - Certifique-se de que a plataforma está configurada para o roteamento de SPA
   - Para Netlify, crie um arquivo `_redirects` na pasta `public` com:
     ```
     /* /index.html 200
     ```

2. Configuração CORS no backend
   - Certifique-se de que o domínio do frontend está permitido na configuração CORS do backend

3. Configuração de API
   - Verifique se a URL da API está corretamente configurada no ambiente de produção
