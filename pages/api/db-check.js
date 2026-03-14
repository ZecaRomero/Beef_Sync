/**
 * Diagnóstico: verifica se DATABASE_URL está configurada (sem expor o valor)
 * Acesse: https://seu-app.vercel.app/api/db-check
 */
import { testConnection } from '../../lib/database'

export default async function handler(req, res) {
  const hasDatabaseUrl = !!(
    process.env.DATABASE_URL &&
    typeof process.env.DATABASE_URL === 'string' &&
    process.env.DATABASE_URL.length > 20 &&
    process.env.DATABASE_URL.includes('postgresql') &&
    !process.env.DATABASE_URL.includes('user:pass')
  )

  try {
    const dbResult = await testConnection()
    return res.status(200).json({
      ok: dbResult.success,
      databaseUrlConfigured: hasDatabaseUrl,
      databaseConnected: dbResult.success,
      message: dbResult.success
        ? 'Banco conectado com sucesso'
        : hasDatabaseUrl
          ? 'DATABASE_URL está configurada mas a conexão falhou. Verifique a connection string no Neon.'
          : 'DATABASE_URL não está configurada. Adicione no Vercel: Settings → Environment Variables',
      hint: !hasDatabaseUrl
        ? 'Vercel → beef-sync_2 → Settings → Environment Variables → DATABASE_URL = connection string do Neon'
        : null
    })
  } catch (err) {
    const isConnectionRefused = (err?.message || '').includes('ECONNREFUSED') || (err?.code === 'ECONNREFUSED')
    return res.status(200).json({
      ok: false,
      databaseUrlConfigured: hasDatabaseUrl,
      databaseConnected: false,
      message: hasDatabaseUrl
        ? 'Conexão recusada – verifique se a connection string do Neon está correta'
        : 'DATABASE_URL não configurada – a app está tentando conectar em localhost (127.0.0.1)',
      hint: !hasDatabaseUrl
        ? '⚠️ Adicione DATABASE_URL no Vercel. Sem ela, o app tenta conectar em 127.0.0.1:5432 (que não existe na Vercel).'
        : isConnectionRefused
          ? 'Copie a connection string completa do Neon Console e cole em DATABASE_URL na Vercel. Depois: Redeploy.'
          : null
    })
  }
}
