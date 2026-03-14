/**
 * API para testar conexÃ£o com o banco de dados
 * Acesse: /api/test-connection
 */
import { testConnection } from '../../lib/database'

export default async function handler(req, res) {
  try {
    const result = await testConnection()
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'âÅ“â€¦ Banco de dados conectado com sucesso!',
        details: {
          database: result.database,
          user: result.user,
          version: result.version,
          timestamp: result.timestamp,
          pool: result.poolInfo
        }
      })
    } else {
      return res.status(500).json({
        success: false,
        message: 'â�Å’ Erro ao conectar com o banco de dados',
        error: result.error,
        code: result.code,
        hint: getDatabaseErrorHint(result.code)
      })
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'â�Å’ Erro ao testar conexÃ£o',
      error: error.message,
      hint: 'Verifique se a variÃ¡vel DATABASE_URL estÃ¡ configurada no Vercel'
    })
  }
}

function getDatabaseErrorHint(code) {
  const hints = {
    'ENOTFOUND': 'ðÅ¸â€�� Verifique se o host do banco estÃ¡ correto na DATABASE_URL',
    'ECONNREFUSED': 'ðÅ¸â€�Å’ O banco de dados nÃ£o estÃ¡ aceitando conexÃµes. Verifique se estÃ¡ ativo no Neon.',
    'ETIMEDOUT': 'â�±ï¸� Timeout na conexÃ£o. Verifique sua internet ou se o banco estÃ¡ ativo.',
    '28P01': 'ðÅ¸â€�� Senha incorreta. Verifique a DATABASE_URL.',
    '3D000': 'ðÅ¸â€œ� Banco de dados nÃ£o existe. Verifique o nome na DATABASE_URL.',
    'ECONNRESET': 'ðÅ¸â€�â€ž ConexÃ£o resetada. Tente novamente.'
  }
  
  return hints[code] || 'â�â€œ Erro desconhecido. Verifique a configuraÃ§Ã£o da DATABASE_URL.'
}
