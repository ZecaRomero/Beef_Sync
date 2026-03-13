import { getPoolInfo, testConnection } from '../../lib/database'
import { sendHealthCheck, sendError, asyncHandler } from '../../utils/apiResponse'

const handler = async (req, res) => {
  try {
    const startTime = Date.now()
    const timeoutMs = 5000

    // Testar conexão com banco (timeout curto para não travar requisições)
    const dbStatus = await Promise.race([
      testConnection(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
    ]).catch(err => ({ success: false, error: err?.message || 'Conexão lenta' }))
    const poolInfo = getPoolInfo()
    const responseTime = Date.now() - startTime
    
    const healthData = {
      status: dbStatus.success ? 'healthy' : 'unhealthy',
      app: 'Beef Sync',
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      responseTime,
      uptime: process.uptime(),
      memory: process.memoryUsage().heapUsed,
      database: {
        connected: dbStatus.success,
        poolInfo: poolInfo,
        version: dbStatus.version,
        error: dbStatus.error
      },
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform
    }

    if (dbStatus.success) {
      return sendHealthCheck(res, healthData)
    } else {
      return res.status(503).json(healthData)
    }
  } catch (err) {
    return sendError(res, 'Erro no health check', 500, err?.message || 'Erro desconhecido')
  }
}

export const config = { api: { externalResolver: true } }
export default asyncHandler(handler)