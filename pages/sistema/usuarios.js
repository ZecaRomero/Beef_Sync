/**
 * Lista usuários do Supabase Auth (via /api/supabase-users).
 */
import Head from 'next/head'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { supabase } from '../../lib/supabase'
import { ExclamationTriangleIcon, UserGroupIcon } from '../../components/ui/Icons'
import {
  PERMISSION_ROWS,
  isDeveloperRole,
  permissionFlagsForRole,
  roleLabel,
} from '../../utils/permissionMatrix'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR')
  } catch {
    return String(iso)
  }
}

export default function SistemaUsuarios() {
  const { session } = useAuth()
  const [mounted, setMounted] = useState(false)
  const permissions = usePermissions()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingUserId, setUpdatingUserId] = useState(null)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/supabase-users')
      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(json?.message || `HTTP ${response.status}`)
        setUsers([])
        return
      }
      if (!json.success) {
        setError(json?.message || 'Resposta inválida da API')
        setUsers([])
        return
      }
      setUsers(Array.isArray(json.data) ? json.data : [])
    } catch (e) {
      console.error(e)
      setError(e?.message || 'Falha ao buscar usuários')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  const patchUserRole = useCallback(
    async (userRow, newRole) => {
      const norm = newRole === 'desenvolvedor' ? 'desenvolvedor' : 'externo'
      const prev = String(userRow.role || 'externo').toLowerCase()
      if (norm === prev) return
      if (isDeveloperRole(userRow.role) && norm === 'externo') {
        const ok = window.confirm(
          `Remover o perfil Desenvolvedor de ${userRow.email || userRow.id}? Essa conta deixa de gerenciar usuários, backups, importação etc.`
        )
        if (!ok) return
      }
      const token = session?.access_token
      if (!token) {
        window.alert('Sessão não disponível. Faça login novamente.')
        return
      }
      setUpdatingUserId(userRow.id)
      try {
        const res = await fetch('/api/supabase-users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: userRow.id, role: norm }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          window.alert(json.message || `Erro HTTP ${res.status}`)
          return
        }
        const updated = json.data
        if (updated?.id) {
          setUsers((list) => list.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)))
        }
        if (session?.user?.id === userRow.id && supabase) {
          try {
            await supabase.auth.refreshSession()
          } catch {
            /* optional */
          }
        }
      } catch (e) {
        console.error(e)
        window.alert(e?.message || 'Falha ao atualizar perfil')
      } finally {
        setUpdatingUserId(null)
      }
    },
    [session?.access_token, session?.user?.id]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || permissions.userType === 'loading') return
    if (!permissions.canManageUsers) {
      setLoading(false)
      return
    }
    loadUsers()
  }, [mounted, permissions.userType, permissions.canManageUsers, loadUsers])

  if (!mounted || permissions.userType === 'loading') {
    return (
      <>
        <Head>
          <title>Usuários | Beef-Sync</title>
        </Head>
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando…</p>
          </div>
        </div>
      </>
    )
  }

  const restricted = !permissions.canManageUsers

  return (
    <>
      <Head>
        <title>Usuários | Beef-Sync</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">👤</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários (Supabase Auth)</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mesma base de logins do painel Supabase — leitura via service role no servidor
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/sistema/permissoes"
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Permissões
                </Link>
                {!restricted && (
                  <button
                    type="button"
                    onClick={loadUsers}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Atualizando…' : 'Atualizar lista'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!restricted && (
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🔑</span> Permissões no Beef-Sync (por perfil)
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  O campo <code className="text-xs bg-gray-200 dark:bg-gray-900 px-1 rounded">user_metadata.role</code> no
                  Supabase deve ser <strong>desenvolvedor</strong> para o perfil completo; caso contrário vale como{' '}
                  <strong>externo</strong>. Na tabela abaixo você pode <strong>alterar o perfil</strong> (requer sessão ativa
                  como desenvolvedor).
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Permissão</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-700 dark:text-gray-300 w-36">Externo</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-700 dark:text-gray-300 w-36">
                        Desenvolvedor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {PERMISSION_ROWS.map((row) => {
                      const ext = permissionFlagsForRole('externo')
                      const dev = permissionFlagsForRole('desenvolvedor')
                      const okExt = ext[row.key]
                      const okDev = dev[row.key]
                      return (
                        <tr key={row.key} className="bg-white dark:bg-gray-800/50">
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                            {row.label}
                            {row.adminOnly && (
                              <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(admin)</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span
                              className={
                                okExt
                                  ? 'text-green-600 dark:text-green-400 font-medium'
                                  : 'text-gray-400 dark:text-gray-500'
                              }
                            >
                              {okExt ? 'Sim' : 'Não'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span
                              className={
                                okDev
                                  ? 'text-green-600 dark:text-green-400 font-medium'
                                  : 'text-gray-400 dark:text-gray-500'
                              }
                            >
                              {okDev ? 'Sim' : 'Não'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {restricted && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 flex gap-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-amber-600 shrink-0" />
              <div>
                <h2 className="font-semibold text-amber-900 dark:text-amber-100">Acesso restrito</h2>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Só o perfil <strong>Desenvolvedor</strong> consulta a lista de usuários aqui. Seu acesso atual:{' '}
                  <strong>{permissions.isNetworkUser ? 'Rede' : 'Padrão'}</strong>.
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                  O cadastro de novos usuários continua sendo feito no Supabase Dashboard → Authentication, ou pelo fluxo
                  de convite do projeto.
                </p>
              </div>
            </div>
          )}

          {!restricted && error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200 text-sm">
              <strong>Erro:</strong> {error}
              <p className="mt-2 text-xs opacity-90">
                Confira <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
                <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> no{' '}
                <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">.env</code> e reinicie o Next.js.
              </p>
            </div>
          )}

          {!restricted && !error && !loading && users.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-600 dark:text-gray-400">
              Nenhum usuário retornado (ou projeto sem cadastros).
            </div>
          )}

          {!restricted && users.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {users.length} usuário(s)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        E-mail
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Perfil
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        Alterar perfil
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[280px]">
                        Permissões efetivas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Provedor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Criado em
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {users.map((u) => {
                      const flags = permissionFlagsForRole(u.role)
                      const dev = isDeveloperRole(u.role)
                      return (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/80 align-top">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{u.email || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {u.display_name || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-medium ${
                                  dev
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                }`}
                              >
                                {roleLabel(u.role)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate max-w-[140px]" title={u.role || ''}>
                                role: {u.role || '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <select
                              aria-label={`Perfil de ${u.email || u.id}`}
                              disabled={updatingUserId === u.id || !session?.access_token}
                              value={isDeveloperRole(u.role) ? 'desenvolvedor' : 'externo'}
                              onChange={(e) => {
                                const v = e.target.value
                                patchUserRole(u, v)
                              }}
                              className="block w-full max-w-[200px] text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-2 py-1.5 disabled:opacity-50"
                            >
                              <option value="externo">Externo (padrão)</option>
                              <option value="desenvolvedor">Desenvolvedor</option>
                            </select>
                            {!session?.access_token && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Faça login para editar</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-wrap gap-1">
                              {PERMISSION_ROWS.map((row) => (
                                <span
                                  key={row.key}
                                  className={`text-[11px] px-1.5 py-0.5 rounded ${
                                    flags[row.key]
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/35 dark:text-green-300'
                                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500 line-through opacity-80'
                                  }`}
                                >
                                  {row.label}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {(u.providers || []).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {formatDate(u.created_at)}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-500">{u.id}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                Até 100 usuários por requisição (API Supabase). Para convites e senhas, use o painel Supabase.
              </p>
            </div>
          )}

          {!restricted && loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
