-- =============================================
-- HI-PILATES v2 — Schema Supabase
-- =============================================

-- Apagar tudo anterior
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TABLE IF EXISTS lista_espera CASCADE;
DROP TABLE IF EXISTS avaliacoes CASCADE;
DROP TABLE IF EXISTS comunicados CASCADE;
DROP TABLE IF EXISTS pagamentos CASCADE;
DROP TABLE IF EXISTS feriados CASCADE;
DROP TABLE IF EXISTS marcacoes CASCADE;
DROP TABLE IF EXISTS sessoes CASCADE;
DROP TABLE IF EXISTS aulas CASCADE;
DROP TABLE IF EXISTS professores CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Professores
CREATE TABLE professores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamp with time zone DEFAULT now()
);

-- Perfis de clientes
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  nome text NOT NULL DEFAULT 'Cliente',
  email text NOT NULL DEFAULT '',
  plano text NOT NULL DEFAULT 'avulso',
  creditos integer NOT NULL DEFAULT 0,
  aulas_pack_restantes integer DEFAULT null,
  ativo boolean NOT NULL DEFAULT true,
  data_inicio date DEFAULT CURRENT_DATE,
  data_nascimento date DEFAULT null,
  foto_url text DEFAULT null,
  observacoes_saude text DEFAULT null,
  objetivos text DEFAULT null,
  experiencia text DEFAULT null,
  problemas_fisicos text DEFAULT null,
  horarios_preferidos text[] DEFAULT '{}',
  criado_em timestamp with time zone DEFAULT now()
);

-- Aulas (horários recorrentes)
CREATE TABLE aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  nivel text NOT NULL DEFAULT 'todos',
  dia_semana integer NOT NULL,
  hora time NOT NULL,
  tipo text NOT NULL DEFAULT 'normal',
  max_pessoas integer NOT NULL DEFAULT 5,
  professor_id uuid REFERENCES professores ON DELETE SET NULL,
  ativa boolean NOT NULL DEFAULT true
);

-- Feriados e encerramentos
CREATE TABLE feriados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  motivo text NOT NULL,
  criado_em timestamp with time zone DEFAULT now()
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
  usou_credito boolean NOT NULL DEFAULT false,
  criado_em timestamp with time zone DEFAULT now(),
  UNIQUE(sessao_id, cliente_id)
);

-- Lista de espera
CREATE TABLE lista_espera (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id uuid REFERENCES sessoes ON DELETE CASCADE,
  aula_id uuid REFERENCES aulas ON DELETE CASCADE,
  cliente_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL DEFAULT 'sessao',
  notificada boolean NOT NULL DEFAULT false,
  criado_em timestamp with time zone DEFAULT now()
);

-- Avaliações mensais
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

-- Comunicados do admin
CREATE TABLE comunicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamp with time zone DEFAULT now()
);

-- Pagamentos
CREATE TABLE pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  valor numeric NOT NULL,
  mes integer NOT NULL,
  ano integer NOT NULL,
  estado text NOT NULL DEFAULT 'pendente',
  data_pagamento date DEFAULT null,
  notas text DEFAULT null,
  criado_em timestamp with time zone DEFAULT now(),
  UNIQUE(cliente_id, mes, ano)
);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_espera ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE feriados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_aulas" ON aulas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_sessoes" ON sessoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_marcacoes" ON marcacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_espera" ON lista_espera FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_avaliacoes" ON avaliacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_comunicados" ON comunicados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pagamentos" ON pagamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_professores" ON professores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_feriados" ON feriados FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON profiles TO anon, authenticated, service_role;
GRANT ALL ON aulas TO anon, authenticated, service_role;
GRANT ALL ON sessoes TO anon, authenticated, service_role;
GRANT ALL ON marcacoes TO anon, authenticated, service_role;
GRANT ALL ON lista_espera TO anon, authenticated, service_role;
GRANT ALL ON avaliacoes TO anon, authenticated, service_role;
GRANT ALL ON comunicados TO anon, authenticated, service_role;
GRANT ALL ON pagamentos TO anon, authenticated, service_role;
GRANT ALL ON professores TO anon, authenticated, service_role;
GRANT ALL ON feriados TO anon, authenticated, service_role;

-- =============================================
-- Trigger registo
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, nome, email, plano, creditos, data_inicio)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', 'Cliente'),
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data->>'plano', 'avulso'),
    0,
    CURRENT_DATE
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- =============================================
-- Professor padrão
-- =============================================
INSERT INTO professores (nome, email) VALUES ('Professor Principal', 'professor@hipilates.pt');

-- =============================================
-- Aulas — Seg a Sex 08h-13h e 16h-20h, Sab 08h-13h
-- =============================================
DO $$
DECLARE
  prof_id uuid;
BEGIN
  SELECT id INTO prof_id FROM professores LIMIT 1;

  -- Segunda a Sexta (1-5)
  FOR dia IN 1..5 LOOP
    -- Manhã 08h-12h
    FOR h IN 8..12 LOOP
      INSERT INTO aulas (nome, nivel, dia_semana, hora, tipo, professor_id)
      VALUES ('Pilates', 'todos', dia, (h || ':00')::time,
        CASE WHEN h <= 13 THEN 'off_peak' ELSE 'normal' END, prof_id);
    END LOOP;
    -- Tarde 16h-19h
    FOR h IN 16..19 LOOP
      INSERT INTO aulas (nome, nivel, dia_semana, hora, tipo, professor_id)
      VALUES ('Pilates', 'todos', dia, (h || ':00')::time, 'normal', prof_id);
    END LOOP;
  END LOOP;

  -- Sábado (6)
  FOR h IN 8..12 LOOP
    INSERT INTO aulas (nome, nivel, dia_semana, hora, tipo, professor_id)
    VALUES ('Pilates', 'todos', 6, (h || ':00')::time, 'off_peak', prof_id);
  END LOOP;
END $$;
