// API endpoint para testar conectividade com PostgreSQL
import { testConnection, initDatabase, getPoolInfo } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'MÃ©todo nÃ£o permitido' })
  }

  try {
    console.log('ðÅ¸§ª Testando conexÃ£o com PostgreSQL...')
    
    // Inicializar conexÃ£o
    const pool = initDatabase()
    
    if (!pool) {
      return res.status(500).json({ 
        status: 'error',
        message: 'Falha ao inicializar pool de conexÃµes',
        connected: false,
        timestamp: new Date().toISOString()
      })
    }

    // Testar conexÃ£o
    const testResult = await testConnection()
    
    console.log('âÅ“â€¦ Teste de conexÃ£o bem-sucedido')
    
    res.status(200).json({
      status: 'success',
      message: 'ConexÃ£o com PostgreSQL estabelecida com sucesso',
      connected: true,
      timestamp: testResult.timestamp,
      version: testResult.version,
      poolInfo: testResult.poolInfo,
      config: {
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'estoque_semen',
        user: process.env.DB_USER || 'postgres',
        port: parseInt(process.env.DB_PORT) || 5432,
        ssl: process.env.DB_SSL === 'true'
      }
    })
    
  } catch (error) {
    console.error('â�Å’ Erro no teste de conexÃ£o:', error)
    
    res.status(500).json({
      status: 'error',
      message: 'Falha na conexÃ£o com PostgreSQL',
      connected: false,
      error: {
        message: error.message,
        code: error.code,
        detail: error.detail
      },
      timestamp: new Date().toISOString(),
      suggestion: 'Verifique se o PostgreSQL estÃ¡ rodando e as credenciais estÃ£o corretas'
    })
  }
}
