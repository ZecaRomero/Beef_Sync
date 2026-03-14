/**
 * API de debug para verificar variáveis de ambiente
 * ATENÇÃO: Remover após debug!
 */
export default function handler(req, res) {
  const hasDbUrl = !!process.env.DATABASE_URL
  const dbUrlStart = process.env.DATABASE_URL?.substring(0, 30) || 'NOT_DEFINED'
  
  // Verificar todas as variáveis DB_*
  const dbVars = {}
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('DB_') || key === 'DATABASE_URL') {
      dbVars[key] = key === 'DATABASE_URL' 
        ? (process.env[key]?.substring(0, 30) + '...')
        : process.env[key]
    }
  })
  
  res.status(200).json({
    hasDbUrl,
    dbUrlStart,
    dbVars,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV
  })
}
