# Hi-Pilates — Guia de Instalação

## O que vais precisar
- Uma conta gratuita no [Supabase](https://supabase.com)
- Uma conta gratuita no [Vercel](https://vercel.com)
- [Node.js](https://nodejs.org) instalado no teu computador (para testar localmente)

---

## Passo 1 — Criar projeto no Supabase

1. Vai a https://supabase.com e cria uma conta gratuita
2. Clica em **"New project"**
3. Escolhe um nome: `hi-pilates`
4. Define uma password para a base de dados (guarda-a)
5. Escolhe a região **Europe (Frankfurt)** — mais perto de Portugal
6. Clica **"Create new project"** e espera ~2 minutos

---

## Passo 2 — Criar a base de dados

1. No teu projeto Supabase, vai ao menu **"SQL Editor"**
2. Clica em **"New query"**
3. Copia todo o conteúdo do ficheiro `supabase_schema.sql`
4. Cola na caixa de texto e clica **"Run"**
5. Deves ver "Success" — a base de dados está criada!

---

## Passo 3 — Buscar as credenciais

1. No Supabase, vai a **Settings → API**
2. Copia:
   - **Project URL** → algo como `https://abcxyz.supabase.co`
   - **anon public** key → uma chave longa que começa com `eyJ...`

---

## Passo 4 — Configurar o projeto

1. Na pasta do projeto, copia o ficheiro de exemplo:
   ```
   cp .env.example .env
   ```

2. Abre o ficheiro `.env` e preenche com os teus valores:
   ```
   REACT_APP_SUPABASE_URL=https://SEU_PROJETO.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJ...
   REACT_APP_ADMIN_EMAIL=o_teu_email@exemplo.com
   ```

   ⚠️ O `REACT_APP_ADMIN_EMAIL` deve ser o email com que vais gerir o estúdio.
      Quando entrares com esse email, vês automaticamente o painel de admin.

---

## Passo 5 — Criar a conta de admin no Supabase

1. No Supabase, vai a **Authentication → Users**
2. Clica **"Invite user"**
3. Introduz o teu email de admin (o mesmo que colocaste no `.env`)
4. Vai ao teu email e aceita o convite — define uma password
5. Pronto! Quando entrares na app com esse email, verás o painel de gestão.

---

## Passo 6 — Testar localmente

Na pasta do projeto, corre:
```bash
npm install
npm start
```

A app abre em http://localhost:3000

---

## Passo 7 — Colocar online com Vercel (grátis)

1. Vai a https://vercel.com e cria uma conta (pode ser com GitHub)
2. Instala o Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Na pasta do projeto, corre:
   ```bash
   vercel
   ```
4. Segue as instruções. Quando perguntar pelas variáveis de ambiente,
   introduz os mesmos valores do teu ficheiro `.env`

5. No final, o Vercel dá-te um URL tipo:
   `https://hi-pilates.vercel.app` ← partilha este com as tuas clientes!

---

## Resumo dos ficheiros

```
hi-pilates/
├── src/
│   ├── App.js              ← roteamento e autenticação
│   ├── App.css             ← estilos globais
│   ├── index.js            ← entrada da app
│   ├── lib/
│   │   └── supabase.js     ← configuração do Supabase
│   └── pages/
│       ├── Login.js        ← página de login
│       ├── Registo.js      ← página de registo
│       ├── ClienteApp.js   ← área das clientes
│       └── AdminApp.js     ← painel de gestão
├── public/
│   └── index.html          ← HTML base
├── supabase_schema.sql     ← base de dados (corre no Supabase)
├── .env.example            ← template de configuração
└── package.json            ← dependências
```

---

## Dúvidas frequentes

**Posso usar o meu domínio próprio?**
Sim! No Vercel, vai a Settings → Domains e adiciona o teu domínio.

**Como adiciono/mudo horários?**
Por agora, edita diretamente na tabela `aulas` no Supabase (SQL Editor ou Table Editor).
Em breve posso adicionar um gestor de horários visual no painel de admin.

**Como marco uma cliente como "presente"?**
No painel admin → Hoje, podes atualizar o estado das marcações.
Posso adicionar um botão de presença se quiseres.

**Como funciona o logotipo?**
Quando tiveres o logotipo, substitui o texto no `header` do `ClienteApp.js` e `AdminApp.js`:
```jsx
// Antes:
<div className="logo"><span className="logo-hi">Hi</span>-Pilates</div>

// Depois:
<img src="/logo.png" alt="Hi-Pilates" style={{height:'32px'}} />
```
E coloca o ficheiro `logo.png` na pasta `public/`.
