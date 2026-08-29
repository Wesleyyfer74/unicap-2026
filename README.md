# Sistema de Transporte

Fundação de um sistema web responsivo para frequência e gestão de transporte por QR Code.

## Arquitetura

O projeto usa npm workspaces:

- `client`: React + Vite, React Router, Axios e CSS responsivo.
- `server`: Node.js + Express, API REST versionada, Zod e Prisma/MySQL.
- `server/prisma`: modelo inicial do domínio e futuras migrations.

A API seguirá `route -> validator/middleware -> controller -> service -> Prisma`. O frontend separa páginas, componentes, layouts, serviços, hooks, utilitários e rotas.

O QR Code deverá carregar somente o UUID público do aluno. A API resolverá esse identificador no banco; nenhum dado pessoal será codificado no QR.

## Pré-requisitos

- Node.js 20.19 ou superior
- npm
- MySQL 8 ou compatível

## Execução local

```bash
npm install
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Para desenvolvimento local, altere `NODE_ENV=development`, `FRONTEND_URL=http://localhost:5173`, `VITE_API_URL=http://localhost:3000/api` e configure `DATABASE_URL` e `JWT_SECRET`. Depois execute:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

Para criar ou atualizar o administrador inicial após aplicar as migrations:

```bash
npm run prisma:seed
```

As credenciais são lidas de `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` no arquivo `server/.env`. A senha é transformada em hash bcrypt antes de ser persistida.

Frontend: `http://localhost:5173`. API: `http://localhost:3000/api/v1`. Health check: `GET /api/v1/health`.

## Autenticação administrativa

- `POST /api/auth/login` — recebe `email` e `password`.
- `GET /api/auth/me` — exige `Authorization: Bearer TOKEN`.
- `PUT /api/auth/password` — exige Bearer token e recebe `currentPassword`, `newPassword` e `confirmPassword`.

O frontend administrativo está disponível em `/admin/login`; `/admin` é protegido e revalida a sessão com a API.

### Gestão de fiscais

Todos os endpoints exigem Bearer token:

- `GET /api/fiscais?page=1&limit=10&search=&ativo=true`
- `POST /api/fiscais`
- `PUT /api/fiscais/:id`
- `PATCH /api/fiscais/:id/status`

A interface está disponível em `/admin/fiscais`. Fiscais são ativados ou desativados; não há endpoint de exclusão física.

### Gestão de alunos

Todos os endpoints exigem Bearer token:

- `GET /api/alunos` — paginação, busca por nome e filtro de status.
- `POST /api/alunos` — recebe somente `nomeCompleto`; o UUID é automático.
- `GET /api/alunos/:id`
- `PUT /api/alunos/:id` — permite alterar somente `nomeCompleto`.
- `PATCH /api/alunos/:id/status`
- `GET /api/alunos/:id/historico/presencas`
- `GET /api/alunos/:id/historico/ocorrencias`

A interface está disponível em `/admin/alunos`, com QR Code baseado exclusivamente no UUID e históricos paginados.

### Chamadas

Todos os endpoints exigem Bearer token:

- `GET /api/chamadas` — paginação e filtros `data`, `turno`, `status` e `fiscalId`.
- `POST /api/chamadas` — recebe somente `fiscalId` e `turno`; data e início vêm do servidor.
- `GET /api/chamadas/:id`
- `PATCH /api/chamadas/:id/finalizar`
- `POST /api/chamadas/:id/viagem` — cria a viagem somente após envio manual do formulário.
- `GET /api/chamadas/:id/viagem` — consulta a viagem da chamada.
- `PUT /api/chamadas/:id/viagem` — atualiza o registro existente.
- `POST /api/chamadas/:id/presencas` — recebe o UUID e rejeita duplicidade ou chamada finalizada.
- `GET /api/chamadas/:id/presencas` — lista paginada com pesquisa por aluno.
- `DELETE /api/chamadas/:id/presencas/:presencaId` — remove somente enquanto a chamada estiver aberta.
- `GET /api/chamadas/:id/scanner/alunos/:uuid` — identifica e valida o aluno antes da confirmação.

A interface está em `/admin/chamadas` e o scanner móvel em `/admin/chamadas/:id/scanner`. O scanner usa a câmera traseira preferencial, permite trocar de câmera e mantém lock entre leituras.

### Ocorrências

- `POST /api/chamadas/:id/ocorrencias` — registra observação para aluno presente após a finalização.
- `GET /api/ocorrencias` — paginação e filtros por aluno, fiscal, período e turno.
- `GET /api/ocorrencias/:id` — detalhes.
- `PUT /api/ocorrencias/:id` — edição da observação.

A gestão está em `/admin/ocorrencias`. Não existe endpoint de exclusão de ocorrências.

### Dashboard

- `GET /api/dashboard` — retorna métricas agregadas, cinco chamadas e cinco ocorrências recentes.

O dashboard protegido está em `/admin`. O card de ocorrências considera os últimos sete dias.

Para iniciar separadamente, use `npm run dev:client` e `npm run dev:server`.

### Relatórios

- `GET /api/relatorios` retorna presenças consolidadas e paginadas.
- `GET /api/relatorios/pdf` transmite o PDF completo usando os mesmos filtros.
- Filtros disponíveis: período, aluno, turno, fiscal e motorista.
- A interface protegida está disponível em `/admin/relatorios`.

### Segurança para produção

- Todas as rotas administrativas exigem JWT Bearer válido; somente login e health são públicos.
- JWT usa HS256, expiração máxima de 24 horas, issuer, audience e versão de sessão. Alterar a senha revoga tokens anteriores.
- Senhas usam bcrypt com custo 12 e nunca são retornadas pela API.
- Login possui limite de 10 tentativas malsucedidas a cada 15 minutos. O limitador de cadastro público permite 10 cadastros por hora e já está preparado no caminho `/api/public/alunos`.
- Helmet, limite global de requisições e limites de corpo estão habilitados.
- `FRONTEND_URL` define a única origem autorizada pelo CORS em produção.
- Logs HTTP não incluem query string, corpo, JWT ou senha. Erros de produção não retornam stack trace.
- Entradas são validadas por Zod; UUIDs do scanner são validados antes do Prisma.
- O projeto utiliza somente consultas parametrizadas do Prisma, sem SQL bruto baseado em entrada do usuário.
- O token do frontend fica em `sessionStorage` e é removido ao encerrar a sessão do navegador.
- `.env` e variações estão ignorados pelo Git; somente `.env.example` deve ser versionado.

Antes do deploy, configure `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` com valores reais. Após atualizar o código, execute `npm run prisma:deploy` para adicionar o controle de versão das sessões administrativas.

### Testes integrados

Use sempre um banco MySQL exclusivo para testes, com todas as migrations aplicadas. Defina `TEST_DATABASE_URL` e execute:

```bash
npm test
```

A suíte limpa as tabelas do banco de teste antes e depois da execução. Nunca aponte `TEST_DATABASE_URL` para produção.

## DEPLOY HOSTINGER

### 1. Instalação

No painel da aplicação Node.js da Hostinger, selecione Node.js 20.19 ou superior, envie o projeto e execute na raiz:

```bash
npm install
```

O `postinstall` regenera automaticamente o Prisma Client. O arquivo inicial do backend é `server/server.js`, e o comando de inicialização é `npm start`.

### 2. Variáveis de ambiente

Cadastre as variáveis no painel da Hostinger. Não envie arquivos `.env` ao servidor público nem ao Git:

```env
NODE_ENV=production
DATABASE_URL="mysql://USUARIO:SENHA@HOST:3306/BANCO"
JWT_SECRET="UMA_CHAVE_ALEATORIA_FORTE_COM_32_OU_MAIS_CARACTERES"
CPF_HASH_SECRET="OUTRA_CHAVE_ALEATORIA_FORTE_COM_32_OU_MAIS_CARACTERES"
PORT=3000
FRONTEND_URL="https://seudominio.com"
ADMIN_NAME="Administrador"
ADMIN_EMAIL="admin@seudominio.com"
ADMIN_PASSWORD="SENHA_INICIAL_FORTE"
FISCAL_PASSWORD="SENHA_COMPARTILHADA_DOS_FISCAIS"
```

A Hostinger pode fornecer `PORT` automaticamente; o backend sempre utiliza `process.env.PORT`. `FRONTEND_URL` deve conter somente a origem pública autorizada, sem caminho adicional. `CPF_HASH_SECRET` não pode ser alterada depois da importação dos alunos, pois ela protege a consulta dos CPFs.

### 3. Banco MySQL

Crie o banco e usuário MySQL no painel da Hostinger. Monte `DATABASE_URL` com os dados fornecidos pelo painel. Nenhuma credencial deve ser inserida no código.

### 4. Migrations

Com o banco configurado, aplique migrations de produção — nunca use `prisma migrate dev` no servidor:

```bash
npm run prisma:deploy
```

### 5. Seed

Para criar o primeiro administrador, configure `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` e execute:

```bash
npm run prisma:seed
```

O seed faz upsert do administrador e redefine sua senha. Execute novamente somente quando essa alteração for intencional.

### 6. Build do frontend

Antes do build, crie `client/.env.production` ou configure `VITE_API_URL` no ambiente de build:

```env
VITE_API_URL=https://api.seudominio.com/api
```

Depois execute:

```bash
npm install --include=dev
npm run build
```

`--include=dev` é necessário somente quando o frontend for compilado no servidor. Uma alternativa é gerar `client/dist` localmente e enviar apenas os arquivos estáticos resultantes.

Publique o conteúdo gerado em `client/dist` no diretório estático do domínio, normalmente `public_html`. Como é uma SPA, configure o servidor para redirecionar rotas não encontradas para `index.html`.

Se frontend e API estiverem no mesmo domínio, `VITE_API_URL` pode ser omitida. Em produção, o Express serve automaticamente `client/dist` e o frontend utiliza `/api` como caminho relativo seguro.

### 7. Execução do backend

Depois das migrations e do seed inicial, inicie pelo painel ou terminal:

```bash
npm start
```

Configure o domínio ou subdomínio da API para encaminhar requisições ao processo Node. Verifique `GET /api/v1/health`, autenticação administrativa, CORS e download de PDF após o deploy.
