export default async function handler(req, res) {
  try {
    // Teste simples para verificar se a API está funcionando
    res.status(200).json({
      success: true,
      message: 'API está funcionando',
      timestamp: new Date().toISOString(),
      method: req.method,
      query: req.query
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
