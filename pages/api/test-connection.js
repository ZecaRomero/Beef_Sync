/**
 * API para testar conexão com o banco de dados
 * Acesse: /api/test-connection
 */
import { testConnection } from '../../lib/database'

export default async function handler(req, res) {
  try {
    const result = await testConnection()
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: '✅ Banco de dados conectado com sucesso!',
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
        message: '❌ Erro ao conectar com o banco de dados',
        error: result.error,
        code: result.code,
        hint: getDatabaseErrorHint(result.code)
      })
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '❌ Erro ao testar conexão',
      error: error.message,
      hint: 'Verifique se a variável DATABASE_URL está configurada no Vercel'
    })
  }
}

function getDatabaseErrorHint(code) {
  const hints = {
    'ENOTFOUND': '🔍 Verifique se o host do banco está correto na DATABASE_URL',
    'ECONNREFUSED': '🔌 O banco de dados não está aceitando conexões. Verifique se está ativo no Neon.',
    'ETIMEDOUT': '⏱️ Timeout na conexão. Verifique sua internet ou se o banco está ativo.',
    '28P01': '🔐 Senha incorreta. Verifique a DATABASE_URL.',
    '3D000': '📁 Banco de dados não existe. Verifique o nome na DATABASE_URL.',
    'ECONNRESET': '🔄 Conexão resetada. Tente novamente.'
  }
  
  return hints[code] || '❓ Erro desconhecido. Verifique a configuração da DATABASE_URL.'
}
