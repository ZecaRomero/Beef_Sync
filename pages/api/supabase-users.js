/**
 * GET: lista usuários (Supabase Admin).
 * PATCH: altera user_metadata.role (apenas usuário logado com role desenvolvedor + Bearer token).
 */
import { createClient } from '@supabase/supabase-js'
import { getSupabaseUserFromRequest, userIsDeveloper } from '../../utils/supabaseApiAuth'

function createAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function serializeAuthUser(u) {
  if (!u) return null
  const meta = u.user_metadata || {}
  return {
    id: u.id,
    email: u.email,
    display_name: meta.nome || meta.full_name || meta.name || null,
    role: meta.role != null && meta.role !== '' ? String(meta.role) : 'externo',
    phone: u.phone || null,
    providers: u.app_metadata?.provider
      ? [u.app_metadata.provider]
      : u.identities?.map((i) => i.provider) ?? ['email'],
    created_at: u.created_at,
  }
}

const ALLOWED_ROLES = new Set(['desenvolvedor', 'externo'])

export default async function handler(req, res) {
  const admin = createAdmin()
  if (!admin) {
    return res.status(500).json({
      success: false,
      message: 'Supabase não configurado. Defina SUPABASE_SERVICE_ROLE_KEY no .env',
    })
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await admin.auth.admin.listUsers({ per_page: 100 })
      if (error) {
        console.error('Erro ao listar usuários Supabase:', error)
        return res.status(500).json({
          success: false,
          message: error.message || 'Erro ao listar usuários',
        })
      }
      const users = (data?.users ?? []).map((u) => serializeAuthUser(u))
      return res.status(200).json({ success: true, data: users })
    } catch (err) {
      console.error('Erro supabase-users GET:', err)
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro ao buscar usuários',
      })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { user: caller, error: authErr } = await getSupabaseUserFromRequest(req)
      if (authErr || !caller) {
        return res.status(401).json({
          success: false,
          message: authErr || 'Não autenticado',
        })
      }
      if (!userIsDeveloper(caller)) {
        return res.status(403).json({
          success: false,
          message: 'Somente desenvolvedores podem alterar perfis.',
        })
      }

      let body = req.body
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body || '{}')
        } catch {
          return res.status(400).json({ success: false, message: 'JSON inválido' })
        }
      }

      const userId = body?.userId || body?.id
      const roleRaw = body?.role
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ success: false, message: 'userId é obrigatório' })
      }
      const role = String(roleRaw || '').trim().toLowerCase()
      if (!ALLOWED_ROLES.has(role)) {
        return res.status(400).json({
          success: false,
          message: 'role deve ser "desenvolvedor" ou "externo"',
        })
      }

      const { data: existingWrapper, error: getErr } = await admin.auth.admin.getUserById(userId)
      if (getErr || !existingWrapper?.user) {
        return res.status(404).json({
          success: false,
          message: getErr?.message || 'Usuário não encontrado',
        })
      }

      const existing = existingWrapper.user
      const merged = {
        ...(existing.user_metadata || {}),
        role,
      }

      const { data: updated, error: upErr } = await admin.auth.admin.updateUserById(userId, {
        user_metadata: merged,
      })
      if (upErr || !updated?.user) {
        return res.status(500).json({
          success: false,
          message: upErr?.message || 'Falha ao atualizar usuário',
        })
      }

      return res.status(200).json({
        success: true,
        data: serializeAuthUser(updated.user),
      })
    } catch (err) {
      console.error('Erro supabase-users PATCH:', err)
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro ao atualizar',
      })
    }
  }

  return res.status(405).json({ success: false, message: 'Método não permitido' })
}
