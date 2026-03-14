/**
 * API para garantir que o usuÃ¡rio Adelso existe no Supabase Auth.
 * Cria o usuÃ¡rio se nÃ£o existir (email: adelso@beefsync.local, senha: adfaz2630).
 * Requer SUPABASE_SERVICE_ROLE_KEY no .env (Settings ââ€ â€™ API ââ€ â€™ service_role).
 */
import { createClient } from '@supabase/supabase-js'

const ADELSO_EMAIL = 'adelso@beefsync.local'
const ADELSO_PASSWORD = 'adfaz2630'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'MÃ©todo nÃ£o permitido' })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({
      success: false,
      message: 'Supabase nÃ£o configurado. Defina SUPABASE_SERVICE_ROLE_KEY no .env (Settings ââ€ â€™ API ââ€ â€™ service_role)'
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

    // Criar usuÃ¡rio Adelso se nÃ£o existir (ignorar erro "jÃ¡ existe")
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: ADELSO_EMAIL,
      password: ADELSO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        nome: 'Adelso',
        role: 'externo',
      },
    })

    if (error) {
      // Se usuÃ¡rio jÃ¡ existe, considerar sucesso (pode fazer login)
      const msg = (error.message || '').toLowerCase()
      if (msg.includes('already') || msg.includes('exist') || msg.includes('duplicate')) {
        // OK - usuÃ¡rio jÃ¡ cadastrado
      } else {
        console.error('Erro ao criar usuÃ¡rio Adelso:', error)
        return res.status(500).json({
          success: false,
          message: error.message || 'Erro ao cadastrar Adelso no Supabase'
        })
      }
    }

    return res.status(200).json({
      success: true,
      message: 'UsuÃ¡rio Adelso pronto para login',
      email: ADELSO_EMAIL,
    })
  } catch (err) {
    console.error('Erro adelso-supabase-auth:', err)
    return res.status(500).json({
      success: false,
      message: err.message || 'Erro ao configurar autenticaÃ§Ã£o'
    })
  }
}
