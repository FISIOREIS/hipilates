-- =============================================
-- HI-PILATES — Schema Supabase
-- Corre isto no SQL Editor do teu projeto Supabase
-- =============================================

-- Perfis de clientes (ligado ao auth.users do Supabase)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  email text not null,
  plano text not null default 'avulso',
  -- plano: '1x_semana' | '2x_semana' | 'pack10' | 'avulso'
  creditos integer not null default 0,
  aulas_pack_restantes integer default null,
  ativo boolean not null default true,
  criado_em timestamp with time zone default now()
);

-- Aulas (horários recorrentes)
create table aulas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,          -- ex: 'Pilates Intermédio'
  nivel text not null,         -- 'iniciante' | 'intermedio' | 'avancado'
  dia_semana integer not null, -- 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex
  hora time not null,          -- ex: '10:00'
  tipo text not null default 'normal', -- 'normal' | 'off_peak'
  max_pessoas integer not null default 5,
  ativa boolean not null default true
);

-- Sessões concretas de aulas (cada ocorrência semanal)
create table sessoes (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid references aulas on delete cascade not null,
  data date not null,
  cancelada boolean not null default false,
  criado_em timestamp with time zone default now(),
  unique(aula_id, data)
);

-- Marcações de clientes em sessões
create table marcacoes (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid references sessoes on delete cascade not null,
  cliente_id uuid references profiles on delete cascade not null,
  estado text not null default 'confirmada',
  -- estado: 'confirmada' | 'presente' | 'cancelada' | 'credito'
  usou_credito boolean not null default false,
  criado_em timestamp with time zone default now(),
  unique(sessao_id, cliente_id)
);

-- =============================================
-- Segurança: Row Level Security (RLS)
-- =============================================

alter table profiles enable row level security;
alter table aulas enable row level security;
alter table sessoes enable row level security;
alter table marcacoes enable row level security;

-- Profiles: cada cliente vê apenas o seu perfil
create policy "cliente vê o seu perfil"
  on profiles for select using (auth.uid() = id);

create policy "cliente atualiza o seu perfil"
  on profiles for update using (auth.uid() = id);

-- Aulas: toda a gente pode ver as aulas ativas
create policy "aulas visíveis a todos"
  on aulas for select using (ativa = true);

-- Sessões: toda a gente autenticada pode ver
create policy "sessoes visíveis a autenticados"
  on sessoes for select using (auth.role() = 'authenticated');

-- Marcações: cliente vê só as suas
create policy "cliente vê as suas marcações"
  on marcacoes for select using (auth.uid() = cliente_id);

create policy "cliente insere marcações"
  on marcacoes for insert with check (auth.uid() = cliente_id);

create policy "cliente atualiza as suas marcações"
  on marcacoes for update using (auth.uid() = cliente_id);

-- =============================================
-- Função: criar perfil automaticamente no registo
-- =============================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, nome, email, plano, creditos)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Cliente'),
    new.email,
    coalesce(new.raw_user_meta_data->>'plano', 'avulso'),
    0
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =============================================
-- Dados de exemplo (aulas base)
-- =============================================
insert into aulas (nome, nivel, dia_semana, hora, tipo) values
  ('Pilates Iniciante',  'iniciante',  1, '09:00', 'off_peak'),
  ('Pilates Intermédio', 'intermedio', 1, '11:00', 'off_peak'),
  ('Pilates Avançado',   'avancado',   1, '18:00', 'normal'),
  ('Pilates Iniciante',  'iniciante',  2, '09:00', 'off_peak'),
  ('Pilates Intermédio', 'intermedio', 2, '10:00', 'off_peak'),
  ('Pilates Avançado',   'avancado',   2, '11:00', 'off_peak'),
  ('Pilates Intermédio', 'intermedio', 2, '18:00', 'normal'),
  ('Pilates Iniciante',  'iniciante',  2, '19:00', 'normal'),
  ('Pilates Iniciante',  'iniciante',  3, '09:00', 'off_peak'),
  ('Pilates Intermédio', 'intermedio', 3, '10:00', 'off_peak'),
  ('Pilates Avançado',   'avancado',   3, '19:00', 'normal'),
  ('Pilates Intermédio', 'intermedio', 4, '09:00', 'off_peak'),
  ('Pilates Iniciante',  'iniciante',  4, '18:00', 'normal'),
  ('Pilates Intermédio', 'intermedio', 4, '19:00', 'normal'),
  ('Pilates Iniciante',  'iniciante',  5, '09:00', 'off_peak'),
  ('Pilates Intermédio', 'intermedio', 5, '10:00', 'off_peak'),
  ('Pilates Avançado',   'avancado',   5, '11:00', 'off_peak');
