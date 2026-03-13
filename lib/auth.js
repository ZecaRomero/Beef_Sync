import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Verifica o token de autenticação do Supabase em uma API route.
 * Retorna o usuário se válido, ou null.
 */
export async function getAuthUser(req) {
  if (!supabaseUrl || !supabaseAnonKey) return null

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) return null
  return user
}

/**
 * Middleware wrapper que exige autenticação.
 * Uso: export default withAuth(async (req, res, user) => { ... })
 */
export function withAuth(handler) {
  return async (req, res) => {
    const user = await getAuthUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado' })
    }
    return handler(req, res, user)
  }
}
