# Deploy no Hostinger Business Web Hosting

Domínio: `unicap.spacered.com.br`

## 1. Banco MySQL

No hPanel, crie um banco e um usuário em **Bancos de dados → Gerenciamento MySQL**. Guarde host, banco, usuário e senha.

## 2. Aplicação Node.js

Em **Sites → Adicionar site → Deploy Web App**, escolha upload de ZIP e envie `unicap-hostinger-business.zip`.

Configuração:

- Framework: Express.js (ou Other, se não for detectado)
- Node.js: 22.x
- Build command: `npm run hostinger:build`
- Entry file: `server/server.js`
- Output directory, se solicitado: `client/dist`

## 3. Variáveis de ambiente

Configure antes de redeployar:

```env
NODE_ENV=production
DATABASE_URL=mysql://USUARIO:SENHA@localhost:3306/BANCO
JWT_SECRET=CHAVE_ALEATORIA_COM_PELO_MENOS_32_CARACTERES
CPF_HASH_SECRET=OUTRA_CHAVE_ALEATORIA_COM_PELO_MENOS_32_CARACTERES
JWT_EXPIRES_IN=8h
FRONTEND_URL=https://unicap.spacered.com.br
TRUST_PROXY=true
APP_TIMEZONE=America/Sao_Paulo
ADMIN_NAME=Administrador
ADMIN_EMAIL=SEU_EMAIL_ADMINISTRATIVO
ADMIN_PASSWORD=SENHA_INICIAL_FORTE
```

Não altere `CPF_HASH_SECRET` depois de importar os alunos. Não defina `PORT` quando a Hostinger fornecer essa variável automaticamente.

Se usuário ou senha do MySQL contiver caracteres especiais, aplique URL encoding ao montar `DATABASE_URL`.

## 4. Deploy e dados

O build executa `prisma migrate deploy` automaticamente. No primeiro start, o administrador é criado somente se a tabela ainda não possuir administradores.

Depois que o primeiro deploy terminar com sucesso, abra o banco no phpMyAdmin e importe `alunos-planilha-hostinger.sql`. Esse arquivo é sensível e não deve ser enviado ao diretório público do site.

## 5. Verificação

- `https://unicap.spacered.com.br/`
- `https://unicap.spacered.com.br/api/v1/health`
- `https://unicap.spacered.com.br/admin/login`

Ative o SSL antes do teste de câmera; navegadores exigem HTTPS para liberar a câmera.
