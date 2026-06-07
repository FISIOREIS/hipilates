-- =============================================
-- HI-PILATES v3 — Schema Supabase COMPLETO
-- Corre isto no SQL Editor do Supabase
-- =============================================

-- Limpar tudo anterior
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TABLE IF EXISTS notificacoes CASCADE;
DROP TABLE IF EXISTS mensagens CASCADE;
DROP TABLE IF EXISTS lista_espera_geral CASCADE;
DROP TABLE IF EXISTS lista_espera CASCADE;
DROP TABLE IF EXISTS avaliacoes CASCADE;
DROP TABLE IF EXISTS comunicados CASCADE;
DROP TABLE IF EXISTS pagamentos CASCADE;
DROP TABLE IF EXISTS feriados CASCADE;
DROP TABLE IF EXISTS periodos_fecho CASCADE;
DROP TABLE IF EXISTS baixas CASCADE;
DROP TABLE IF EXISTS marcacoes CASCADE;
DROP TABLE IF EXISTS sessoes CASCADE;
DROP TABLE IF EXISTS aulas CASCADE;
DROP TABLE IF EXISTS professores CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Professores
CREATE TABLE professores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamp with time zone DEFAULT now()
);

-- Perfis
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  nome text NOT NULL DEFAULT 'Cliente',
  email text NOT NULL DEFAULT '',
  telemovel text DEFAULT null,
  nif text DEFAULT null,
  subsistema_saude text DEFAULT null,
  subsistema_numero text DEFAULT null,
  plano text NOT NULL DEFAULT 'avulso',
  estado text NOT NULL DEFAULT 'pendente',
  creditos integer NOT NULL DEFAULT 0,
  aulas_pack_restantes integer DEFAULT null,
  ativo boolean NOT NULL DEFAULT true,
  data_inicio date DEFAULT null,
  data_nascimento date DEFAULT null,
  foto_url text DEFAULT null,
  objetivos text DEFAULT null,
  experiencia text DEFAULT null,
  problemas_fisicos text DEFAULT null,
  problemas_descricao text DEFAULT null,
  cirurgias boolean DEFAULT false,
  cirurgias_descricao text DEFAULT null,
  medicacao boolean DEFAULT false,
  medicacao_descricao text DEFAULT null,
  gravidez boolean DEFAULT false,
  horarios_preferidos text[] DEFAULT '{}',
  turma_id uuid DEFAULT null,
  professor_id uuid DEFAULT null,
  seguro_data date DEFAULT null,
  taxa_inscricao_paga boolean NOT NULL DEFAULT false,
  criado_em timestamp with time zone DEFAULT now()
);

-- Aulas (horários recorrentes)
CREATE TABLE aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT 'Pilates Clínico',
  dia_semana integer NOT NULL,
  hora time NOT NULL,
  tipo text NOT NULL DEFAULT 'normal',
  max_pessoas integer NOT NULL DEFAULT 5,
  professor_id uuid REFERENCES professores ON DELETE SET NULL,
  ativa boolean NOT NULL DEFAULT true
);

-- Sessões concretas
CREATE TABLE sessoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id uuid REFERENCES aulas ON DELETE CASCADE NOT NULL,
  data date NOT NULL,
  cancelada boolean NOT NULL DEFAULT false,
  motivo_cancelamento text DEFAULT null,
  professor_id uuid REFERENCES professores ON DELETE SET NULL,
  criado_em timestamp with time zone DEFAULT now(),
  UNIQUE(aula_id, data)
);

-- Marcações
CREATE TABLE marcacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id uuid REFERENCES sessoes ON DELETE CASCADE NOT NULL,
  cliente_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  estado text NOT NULL DEFAULT 'confirmada',
  tipo text NOT NULL DEFAULT 'regular',
  usou_credito boolean NOT NULL DEFAULT false,
  criado_em timestamp with time zone DEFAULT now(),
  UNIQUE(sessao_id, cliente_id)
);

-- Lista de espera (aulas cheias)
CREATE TABLE lista_espera (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id uuid REFERENCES sessoes ON DELETE CASCADE,
  aula_id uuid REFERENCES aulas ON DELETE CASCADE,
  cliente_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  notificada boolean NOT NULL DEFAULT false,
  criado_em timestamp with time zone DEFAULT now()
);

-- Lista de espera geral (sem conta)
CREATE TABLE lista_espera_geral (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  telemovel text NOT NULL,
  horarios_preferidos text[] DEFAULT '{}',
  estado text NOT NULL DEFAULT 'pendente',
  notas text DEFAULT null,
  criado_em timestamp with time zone DEFAULT now()
);

-- Feriados pontuais
CREATE TABLE feriados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  motivo text NOT NULL,
  criado_em timestamp with time zone DEFAULT now()
);

-- Períodos de fecho (férias, obras, etc)
CREATE TABLE periodos_fecho (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  motivo text NOT NULL,
  criado_em timestamp with time zone DEFAULT now()
);

-- Baixas médicas de clientes
CREATE TABLE baixas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  data_inicio date NOT NULL,
  data_fim date,
  motivo text DEFAULT null,
  justificacao_url text DEFAULT null,
  estado text NOT NULL DEFAULT 'pendente',
  criado_em timestamp with time zone DEFAULT now()
);

-- Pagamentos
CREATE TABLE pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL DEFAULT 'mensalidade',
  valor numeric NOT NULL,
  mes integer DEFAULT null,
  ano integer DEFAULT null,
  estado text NOT NULL DEFAULT 'pendente',
  data_pagamento date DEFAULT null,
  notas text DEFAULT null,
  criado_em timestamp with time zone DEFAULT now()
);

-- Comunicados
CREATE TABLE comunicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamp with time zone DEFAULT now()
);

-- Avaliações
CREATE TABLE avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  mes integer NOT NULL,
  ano integer NOT NULL,
  nota integer NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario text DEFAULT null,
  criado_em timestamp with time zone DEFAULT now(),
  UNIQUE(cliente_id, mes, ano)
);

-- Notificações
CREATE TABLE notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES profiles ON DELETE CASCADE,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  tipo text NOT NULL DEFAULT 'info',
  criado_em timestamp with time zone DEFAULT now()
);

-- Mensagens chat
CREATE TABLE mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  de_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  para_id uuid REFERENCES profiles ON DELETE CASCADE,
  para_professor_id uuid REFERENCES professores ON DELETE CASCADE,
  mensagem text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  criado_em timestamp with time zone DEFAULT now()
);

-- =============================================
-- RLS — permissões abertas (simplificado)
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_espera ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_espera_geral ENABLE ROW LEVEL SECURITY;
ALTER TABLE feriados ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodos_fecho ENABLE ROW LEVEL SECURITY;
ALTER TABLE baixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE professores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_aulas" ON aulas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_sessoes" ON sessoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_marcacoes" ON marcacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_espera" ON lista_espera FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_espera_geral" ON lista_espera_geral FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_feriados" ON feriados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_periodos" ON periodos_fecho FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_baixas" ON baixas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_pagamentos" ON pagamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_comunicados" ON comunicados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_avaliacoes" ON avaliacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_notificacoes" ON notificacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_mensagens" ON mensagens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_professores" ON professores FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- =============================================
-- Trigger registo
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, nome, email, plano, creditos, estado)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', 'Cliente'),
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data->>'plano', '1x_semana'),
    0,
    'pendente'
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Professor padrão
INSERT INTO professores (nome, email) VALUES ('Professor Principal', 'professor@hipilates.pt');

-- Aulas Seg-Sex 08h-12h e 16h-19h, Sab 08h-12h
DO $$
DECLARE prof_id uuid;
BEGIN
  SELECT id INTO prof_id FROM professores LIMIT 1;
  FOR dia IN 1..5 LOOP
    FOR h IN 8..12 LOOP
      INSERT INTO aulas (dia_semana, hora, tipo, professor_id)
      VALUES (dia, (h || ':00')::time, 'off_peak', prof_id);
    END LOOP;
    FOR h IN 16..19 LOOP
      INSERT INTO aulas (dia_semana, hora, tipo, professor_id)
      VALUES (dia, (h || ':00')::time, 'normal', prof_id);
    END LOOP;
  END LOOP;
  FOR h IN 8..12 LOOP
    INSERT INTO aulas (dia_semana, hora, tipo, professor_id)
    VALUES (6, (h || ':00')::time, 'off_peak', prof_id);
  END LOOP;
END $$;
