import databaseService from '../../../services/databaseService'

function isLocalRequest(req) {
  const host = String(req.headers?.host || '').toLowerCase()
  const origin = String(req.headers?.origin || '').toLowerCase()
  const referer = String(req.headers?.referer || '').toLowerCase()
  return (
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    referer.includes('localhost') ||
    referer.includes('127.0.0.1')
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' })
  }

  if (!isLocalRequest(req)) {
    return res.status(403).json({ success: false, message: 'Acesso negado' })
  }

  try {
    const result = await databaseService.corrigirSexoMaesParaFemea()
    return res.status(200).json({
      success: true,
      corrigidos: result.total,
      corrigidosMaes: result.corrigidosMaes ?? null,
      corrigidosMachosPorNome: result.corrigidosMachosPorNome ?? null,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao corrigir sexo das mães',
      error: error.message,
    })
  }
}
