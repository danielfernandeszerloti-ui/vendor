# VendorManager TI 🖥️

Sistema completo de gerenciamento de fornecedores de TI.

## Stack
- **Frontend:** Next.js 14 + React + TypeScript
- **Backend/DB:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (JWT)
- **Deploy:** Vercel
- **UI:** Tailwind CSS

---

## ✅ PASSO A PASSO COMPLETO

### PASSO 1 — Criar projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e clique em **Start your project**
2. Faça login com GitHub ou email
3. Clique em **New project**
4. Preencha:
   - **Organization:** sua organização
   - **Project name:** `vendor-manager`
   - **Database password:** crie uma senha forte (guarde ela!)
   - **Region:** South America (São Paulo)
5. Clique em **Create new project** e aguarde ~2 minutos

---

### PASSO 2 — Executar o SQL no Supabase

1. No painel do Supabase, clique em **SQL Editor** (ícone de banco no menu lateral)
2. Clique em **New query**
3. Abra o arquivo `supabase.sql` deste projeto
4. Copie **todo o conteúdo** e cole no editor
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Você verá mensagem "Success" — o banco está criado!

---

### PASSO 3 — Criar o primeiro usuário (admin)

1. No Supabase, vá em **Authentication → Users**
2. Clique em **Add user → Create new user**
3. Preencha email e senha
4. Clique em **Create User**
5. Agora vá em **SQL Editor** e execute:

```sql
UPDATE public.usuarios 
SET role = 'administrador', nome = 'Seu Nome Aqui'
WHERE email = 'SEU_EMAIL@empresa.com';
```

---

### PASSO 4 — Copiar as chaves do Supabase

1. No Supabase, vá em **Settings → API**
2. Copie:
   - **Project URL** (algo como `https://abcdef.supabase.co`)
   - **anon public** key (chave longa que começa com `eyJ...`)

---

### PASSO 5 — Configurar variáveis de ambiente localmente

1. Na pasta do projeto, copie o arquivo de exemplo:
```bash
cp .env.local.example .env.local
```

2. Abra `.env.local` e preencha com suas chaves:
```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

---

### PASSO 6 — Instalar dependências e rodar localmente

Você precisa ter **Node.js 18+** instalado. Se não tiver: [https://nodejs.org](https://nodejs.org)

```bash
# Entrar na pasta do projeto
cd vendor-manager

# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

4. Acesse [http://localhost:3000](http://localhost:3000)
5. Faça login com o email/senha criados no Passo 3

---

### PASSO 7 — Deploy na Vercel

1. Crie conta em [https://vercel.com](https://vercel.com) (pode usar GitHub)

2. Instale a Vercel CLI:
```bash
npm install -g vercel
```

3. Faça login:
```bash
vercel login
```

4. Na pasta do projeto, execute:
```bash
vercel
```

5. Responda as perguntas:
   - **Set up and deploy?** → Y
   - **Which scope?** → sua conta
   - **Link to existing project?** → N
   - **Project name?** → vendor-manager
   - **In which directory?** → ./  (apenas Enter)
   - **Override settings?** → N

6. Acesse o dashboard da Vercel e vá em:
   **Project → Settings → Environment Variables**

7. Adicione as variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua anon key

8. Vá em **Deployments** e clique em **Redeploy**

9. Seu sistema estará online em uma URL do tipo `https://vendor-manager-xxx.vercel.app`

---

### PASSO 8 — Configurar URL de callback no Supabase

Para o login funcionar no domínio da Vercel:

1. No Supabase, vá em **Authentication → URL Configuration**
2. Em **Site URL**, coloque sua URL da Vercel: `https://vendor-manager-xxx.vercel.app`
3. Em **Redirect URLs**, adicione: `https://vendor-manager-xxx.vercel.app/auth/callback`
4. Clique em **Save**

---

## 🔐 Perfis de Acesso

| Perfil | Visualizar | Criar/Editar | Excluir |
|--------|-----------|--------------|---------|
| **Administrador** | ✅ | ✅ | ✅ |
| **TI** | ✅ | ✅ | ❌ |
| **Visualização** | ✅ | ❌ | ❌ |

Para alterar o perfil de um usuário:
```sql
UPDATE public.usuarios SET role = 'ti' WHERE email = 'usuario@empresa.com';
```

---

## 📋 Módulos disponíveis

- **Dashboard** — Visão geral com stats, gráficos e alertas
- **Fornecedores** — CRUD completo com filtros e busca
- **Contratos** — Controle com alertas de vencimento
- **Serviços** — Status e criticidade dos serviços
- **Incidentes** — Registro com histórico de atualizações
- **Usuários** — Gestão de perfis (admin only)

---

## ❓ Problemas comuns

**Erro "relation does not exist"**
→ O SQL do Passo 2 não foi executado. Execute novamente.

**Login não funciona**
→ Verifique se as variáveis de ambiente estão corretas.

**Tela em branco após login**
→ O usuário não foi inserido na tabela `usuarios`. Execute:
```sql
INSERT INTO public.usuarios (id, email, nome, role)
SELECT id, email, split_part(email,'@',1), 'administrador'
FROM auth.users WHERE email = 'SEU_EMAIL@empresa.com'
ON CONFLICT (id) DO UPDATE SET role = 'administrador';
```

**"Not authorized" ao salvar**
→ Seu usuário tem perfil `visualizacao`. Altere para `ti` ou `administrador`.
