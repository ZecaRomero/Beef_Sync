/**
 * Cliente Supabase para Beef-Sync
 * Use para acessar o banco na nuvem (acesso pelo celular com PC desligado)
 *
 * Configuração: defina no .env:
 *   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
 *
 * Para o backend (APIs), use DATABASE_URL com a connection string do Supabase.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * Verifica se o Supabase está configurado
 */
export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey)
}
