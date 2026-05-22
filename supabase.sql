-- ============================================================
-- VENDOR MANAGER TI - Script SQL Completo para Supabase
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 1. TABELA: usuarios (espelho do auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  nome        TEXT NOT NULL,
  cargo       TEXT,
  role        TEXT NOT NULL DEFAULT 'visualizacao' CHECK (role IN ('administrador','ti','visualizacao')),
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. TABELA: fornecedores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome              TEXT NOT NULL,
  categoria         TEXT NOT NULL CHECK (categoria IN ('infraestrutura','software','cloud','telecomunicacoes','seguranca','consultoria','hardware','outros')),
  cnpj              TEXT,
  contato_comercial TEXT,
  contato_tecnico   TEXT,
  telefone          TEXT,
  email             TEXT,
  site              TEXT,
  sla               TEXT,
  observacoes       TEXT,
  status            TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  created_by        UUID NOT NULL REFERENCES public.usuarios(id),
  updated_by        UUID REFERENCES public.usuarios(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. TABELA: contratos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contratos (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id        UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE RESTRICT,
  numero_contrato      TEXT,
  data_inicio          DATE NOT NULL,
  data_vencimento      DATE NOT NULL,
  renovacao_automatica BOOLEAN NOT NULL DEFAULT false,
  valor_mensal         NUMERIC(12,2),
  criticidade          TEXT NOT NULL DEFAULT 'media' CHECK (criticidade IN ('baixa','media','alta','critica')),
  responsavel_interno  TEXT,
  observacoes          TEXT,
  status               TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','vencido','cancelado','em_renovacao')),
  arquivo_url          TEXT,
  arquivo_nome         TEXT,
  created_by           UUID NOT NULL REFERENCES public.usuarios(id),
  updated_by           UUID REFERENCES public.usuarios(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. TABELA: servicos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.servicos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT NOT NULL,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE RESTRICT,
  tipo          TEXT,
  status        TEXT NOT NULL DEFAULT 'operacional' CHECK (status IN ('operacional','degradado','fora_do_ar','manutencao')),
  ambiente      TEXT NOT NULL DEFAULT 'producao' CHECK (ambiente IN ('producao','homologacao','desenvolvimento')),
  criticidade   TEXT NOT NULL DEFAULT 'media' CHECK (criticidade IN ('baixa','media','alta','critica')),
  url           TEXT,
  observacoes   TEXT,
  created_by    UUID NOT NULL REFERENCES public.usuarios(id),
  updated_by    UUID REFERENCES public.usuarios(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. TABELA: incidentes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.incidentes (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo                 TEXT NOT NULL,
  descricao              TEXT NOT NULL,
  fornecedor_id          UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE RESTRICT,
  data_abertura          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_resolucao         TIMESTAMPTZ,
  status                 TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_andamento','resolvido','fechado')),
  sla_horas              INTEGER,
  tempo_resolucao_horas  NUMERIC(10,2),
  protocolo              TEXT,
  impacto                TEXT NOT NULL DEFAULT 'medio' CHECK (impacto IN ('baixo','medio','alto','critico')),
  responsavel_interno    TEXT,
  created_by             UUID NOT NULL REFERENCES public.usuarios(id),
  updated_by             UUID REFERENCES public.usuarios(id),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. TABELA: incidentes_historico
-- ============================================================
CREATE TABLE IF NOT EXISTS public.incidentes_historico (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incidente_id    UUID NOT NULL REFERENCES public.incidentes(id) ON DELETE CASCADE,
  descricao       TEXT NOT NULL,
  status_anterior TEXT,
  status_novo     TEXT,
  created_by      UUID NOT NULL REFERENCES public.usuarios(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. TABELA: logs_auditoria
-- ============================================================
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID REFERENCES public.usuarios(id),
  acao            TEXT NOT NULL,
  entidade_tipo   TEXT NOT NULL,
  entidade_id     UUID,
  dados_anteriores JSONB,
  dados_novos     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_fornecedores_status ON public.fornecedores(status);
CREATE INDEX IF NOT EXISTS idx_fornecedores_categoria ON public.fornecedores(categoria);
CREATE INDEX IF NOT EXISTS idx_contratos_fornecedor ON public.contratos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON public.contratos(status);
CREATE INDEX IF NOT EXISTS idx_contratos_vencimento ON public.contratos(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_servicos_fornecedor ON public.servicos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_servicos_status ON public.servicos(status);
CREATE INDEX IF NOT EXISTS idx_incidentes_fornecedor ON public.incidentes(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_incidentes_status ON public.incidentes(status);
CREATE INDEX IF NOT EXISTS idx_incidentes_historico_incidente ON public.incidentes_historico(incidente_id);
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON public.logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON public.logs_auditoria(created_at DESC);

-- ============================================================
-- 9. FUNÇÃO: auto-criar usuario ao registrar no auth
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'visualizacao'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 10. FUNÇÃO: atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_contratos_updated_at    BEFORE UPDATE ON public.contratos    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_servicos_updated_at     BEFORE UPDATE ON public.servicos     FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_incidentes_updated_at   BEFORE UPDATE ON public.incidentes   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_usuarios_updated_at     BEFORE UPDATE ON public.usuarios     FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidentes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidentes_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria     ENABLE ROW LEVEL SECURITY;

-- ---- POLÍTICAS: usuarios ----
CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "usuarios_update_self" ON public.usuarios FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "usuarios_update_admin" ON public.usuarios FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'administrador'));

-- ---- POLÍTICAS: fornecedores ----
CREATE POLICY "fornecedores_select" ON public.fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "fornecedores_insert" ON public.fornecedores FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role IN ('administrador','ti') AND u.ativo = true));
CREATE POLICY "fornecedores_update" ON public.fornecedores FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role IN ('administrador','ti') AND u.ativo = true));
CREATE POLICY "fornecedores_delete" ON public.fornecedores FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'administrador' AND u.ativo = true));

-- ---- POLÍTICAS: contratos ----
CREATE POLICY "contratos_select" ON public.contratos FOR SELECT TO authenticated USING (true);
CREATE POLICY "contratos_insert" ON public.contratos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role IN ('administrador','ti') AND u.ativo = true));
CREATE POLICY "contratos_update" ON public.contratos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role IN ('administrador','ti') AND u.ativo = true));
CREATE POLICY "contratos_delete" ON public.contratos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'administrador' AND u.ativo = true));

-- ---- POLÍTICAS: servicos ----
CREATE POLICY "servicos_select" ON public.servicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "servicos_insert" ON public.servicos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role IN ('administrador','ti') AND u.ativo = true));
CREATE POLICY "servicos_update" ON public.servicos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role IN ('administrador','ti') AND u.ativo = true));
CREATE POLICY "servicos_delete" ON public.servicos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'administrador' AND u.ativo = true));

-- ---- POLÍTICAS: incidentes ----
CREATE POLICY "incidentes_select" ON public.incidentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "incidentes_insert" ON public.incidentes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role IN ('administrador','ti') AND u.ativo = true));
CREATE POLICY "incidentes_update" ON public.incidentes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role IN ('administrador','ti') AND u.ativo = true));
CREATE POLICY "incidentes_delete" ON public.incidentes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'administrador' AND u.ativo = true));

-- ---- POLÍTICAS: incidentes_historico ----
CREATE POLICY "historico_select" ON public.incidentes_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "historico_insert" ON public.incidentes_historico FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role IN ('administrador','ti') AND u.ativo = true));

-- ---- POLÍTICAS: logs_auditoria ----
CREATE POLICY "logs_select_admin" ON public.logs_auditoria FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'administrador'));
CREATE POLICY "logs_insert" ON public.logs_auditoria FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- 12. SEEDS DE EXEMPLO (dados iniciais)
-- ============================================================
-- ATENÇÃO: Só execute após criar o primeiro usuário no Supabase Auth.
-- Substitua 'SEU_USER_ID' pelo UUID do usuário admin criado.

-- Para tornar o primeiro usuário admin, execute:
-- UPDATE public.usuarios SET role = 'administrador' WHERE email = 'SEU_EMAIL@empresa.com';

-- Exemplo de fornecedores seed (substitua o created_by):
/*
INSERT INTO public.fornecedores (nome, categoria, email, telefone, status, sla, created_by) VALUES
  ('Microsoft Brasil', 'software', 'suporte@microsoft.com', '0800-888-2029', 'ativo', '99.9% SLA', 'SEU_USER_ID'),
  ('Amazon AWS', 'cloud', 'support@aws.amazon.com', NULL, 'ativo', '99.99% SLA', 'SEU_USER_ID'),
  ('Claro Empresas', 'telecomunicacoes', 'corporativo@claro.com.br', '4004-7777', 'ativo', '4h para atendimento', 'SEU_USER_ID'),
  ('Vercel Inc', 'cloud', 'support@vercel.com', NULL, 'ativo', '99.99% uptime', 'SEU_USER_ID');
*/
