-- Atualização v4: novas colunas para morada e acompanhante

-- Adicionar campos de morada ao profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS morada TEXT,
ADD COLUMN IF NOT EXISTS codigo_postal TEXT,
ADD COLUMN IF NOT EXISTS localidade TEXT,
ADD COLUMN IF NOT EXISTS acompanhante_nome TEXT,
ADD COLUMN IF NOT EXISTS acompanhante_contacto TEXT;

