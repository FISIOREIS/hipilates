import { createClient } from '@supabase/supabase-js'

// Substitui com os teus valores do Supabase
// Vai a: https://supabase.com → o teu projeto → Settings → API
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Email do admin — só este email acede ao painel de gestão
export const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'admin@hipilates.pt'
