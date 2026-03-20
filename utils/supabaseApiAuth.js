/**
 * Valida JWT do cliente (Authorization: Bearer) com a anon key do Supabase.
 */
import { createClient } from '@supabase/supabase-js'

function getBearerToken(req) {
  const h = req.headers.authorization || req.headers.Authorization
  if (!h || typeof h !== 'string') return null
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m ? m[1].trim() : null
}

export async function getSupabaseUserFromRequest(req) {
  const token = getBearerToken(req)
  if (!token) {
    return { user: null, error: 'Envie Authorization: Bearer <access_token>' }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    return { user: null, error: 'Supabase não configurado' }
  }
  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) {
    return { user: null, error: error?.message || 'Token inválido ou expirado' }
  }
  return { user: data.user, error: null }
}

export function userIsDeveloper(user) {
  const role = user?.user_metadata?.role
  return role === 'desenvolvedor'
}
