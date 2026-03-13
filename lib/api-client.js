import { supabase } from './supabase'

/**
 * Faz fetch autenticado, adicionando o token do Supabase ao header Authorization.
 */
export async function authFetch(url, options = {}) {
  const headers = { ...options.headers }

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
  }

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  return fetch(url, { ...options, headers })
}
