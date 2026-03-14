// API endpoint para testar conectividade com PostgreSQL
import { testConnection, initDatabase, getPoolInfo } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    console.log('🧪 Testando conexão com PostgreSQL...')
    
    // Inicializar conexão
    const pool = initDatabase()
    
    if (!pool) {
      return res.status(500).json({ 
        status: 'error',
        message: 'Falha ao inicializar pool de conexões',
        connected: false,
        timestamp: new Date().toISOString()
      })
    }

    // Testar conexão
    const testResult = await testConnection()
    
    console.log('✅ Teste de conexão bem-sucedido')
    
    res.status(200).json({
      status: 'success',
      message: 'Conexão com PostgreSQL estabelecida com sucesso',
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
    console.error('❌ Erro no teste de conexão:', error)
    
    res.status(500).json({
      status: 'error',
      message: 'Falha na conexão com PostgreSQL',
      connected: false,
      error: {
        message: error.message,
        code: error.code,
        detail: error.detail
      },
      timestamp: new Date().toISOString(),
      suggestion: 'Verifique se o PostgreSQL está rodando e as credenciais estão corretas'
    })
  }
}
