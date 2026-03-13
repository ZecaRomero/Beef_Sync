/**
 * API para listar usuários do Supabase Auth (como na dashboard do Supabase).
 * Requer SUPABASE_SERVICE_ROLE_KEY no .env.
 */
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método não permitido' })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({
      success: false,
      message: 'Supabase não configurado. Defina SUPABASE_SERVICE_ROLE_KEY no .env'
    })
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      per_page: 100,
    })

    if (error) {
      console.error('Erro ao listar usuários Supabase:', error)
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar usuários'
      })
    }

    const users = (data?.users ?? []).map(u => ({
      id: u.id,
      email: u.email,
      display_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
      phone: u.phone || null,
      providers: u.app_metadata?.provider ? [u.app_metadata.provider] : (u.identities?.map(i => i.provider) ?? ['email']),
      created_at: u.created_at,
    }))

    return res.status(200).json({
      success: true,
      data: users,
    })
  } catch (err) {
    console.error('Erro supabase-users:', err)
    return res.status(500).json({
      success: false,
      message: err.message || 'Erro ao buscar usuários'
    })
  }
}
