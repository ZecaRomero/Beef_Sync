/**
 * DiagnÃ³stico: verifica se DATABASE_URL estÃ¡ configurada (sem expor o valor)
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
          ? 'DATABASE_URL estÃ¡ configurada mas a conexÃ£o falhou. Verifique a connection string no Neon.'
          : 'DATABASE_URL nÃ£o estÃ¡ configurada. Adicione no Vercel: Settings ââ€ â€™ Environment Variables',
      hint: !hasDatabaseUrl
        ? 'Vercel ââ€ â€™ beef-sync_2 ââ€ â€™ Settings ââ€ â€™ Environment Variables ââ€ â€™ DATABASE_URL = connection string do Neon'
        : null
    })
  } catch (err) {
    const isConnectionRefused = (err?.message || '').includes('ECONNREFUSED') || (err?.code === 'ECONNREFUSED')
    return res.status(200).json({
      ok: false,
      databaseUrlConfigured: hasDatabaseUrl,
      databaseConnected: false,
      message: hasDatabaseUrl
        ? 'ConexÃ£o recusada ââ‚¬â€œ verifique se a connection string do Neon estÃ¡ correta'
        : 'DATABASE_URL nÃ£o configurada ââ‚¬â€œ a app estÃ¡ tentando conectar em localhost (127.0.0.1)',
      hint: !hasDatabaseUrl
        ? 'âÅ¡ ï¸� Adicione DATABASE_URL no Vercel. Sem ela, o app tenta conectar em 127.0.0.1:5432 (que nÃ£o existe na Vercel).'
        : isConnectionRefused
          ? 'Copie a connection string completa do Neon Console e cole em DATABASE_URL na Vercel. Depois: Redeploy.'
          : null
    })
  }
}
