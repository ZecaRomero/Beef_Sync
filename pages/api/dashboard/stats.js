const { query } = require('../../../lib/database')

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({
      error: `Método ${req.method} não permitido`,
      allowed: ['GET']
    })
  }

  try {
    console.log('Buscando estatísticas do dashboard...')

    // Buscar estatísticas gerais usando queries diretas
    const [animalsResult, birthsResult, semenResult, costsResult] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE situacao = $1) as ativos FROM animais', ['Ativo']),
      query('SELECT COUNT(*) as total FROM nascimentos'),
      query('SELECT COUNT(*) as total, SUM(doses_disponiveis) as doses_disponiveis FROM estoque_semen'),
      query("SELECT COUNT(*) as total, SUM(valor) as total_valor FROM custos WHERE tipo NOT IN ('Alimentação', 'Nutrição', 'Ração', 'Suplementação')")
    ])

    // Extrair dados dos resultados
    const totalAnimals = parseInt(animalsResult.rows[0]?.total || 0)
    const activeAnimals = parseInt(animalsResult.rows[0]?.ativos || 0)
    const totalBirths = parseInt(birthsResult.rows[0]?.total || 0)
    const totalSemen = parseInt(semenResult.rows[0]?.total || 0)
    const availableDoses = parseInt(semenResult.rows[0]?.doses_disponiveis || 0)
    const totalCosts = parseFloat(costsResult.rows[0]?.total_valor || 0)

    // Buscar nascimentos do mês atual (verificar se a coluna existe)
    let birthsThisMonth = 0
    try {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      // Tentar primeiro com data_nascimento, depois com created_at
      let birthsThisMonthResult
      try {
        birthsThisMonthResult = await query(
          'SELECT COUNT(*) as count FROM nascimentos WHERE data_nascimento >= $1',
          [firstDayOfMonth.toISOString().split('T')[0]]
        )
      } catch (e) {
        // Se data_nascimento não existir, usar created_at
        birthsThisMonthResult = await query(
          'SELECT COUNT(*) as count FROM nascimentos WHERE created_at >= $1',
          [firstDayOfMonth.toISOString()]
        )
      }
      
      birthsThisMonth = parseInt(birthsThisMonthResult.rows[0]?.count || 0)
    } catch (error) {
      console.warn('Erro ao buscar nascimentos do mês:', error.message)
      birthsThisMonth = 0
    }

    // Buscar alertas de estoque
    const lowStockResult = await query(
      'SELECT COUNT(*) as count FROM estoque_semen WHERE doses_disponiveis > 0 AND doses_disponiveis < 5'
    )
    const outOfStockResult = await query(
      'SELECT COUNT(*) as count FROM estoque_semen WHERE doses_disponiveis = 0'
    )

    const alerts = []
    const lowStockCount = parseInt(lowStockResult.rows[0]?.count || 0)
    const outOfStockCount = parseInt(outOfStockResult.rows[0]?.count || 0)

    if (lowStockCount > 0) {
      alerts.push({
        type: 'warning',
        title: 'Estoque Baixo de Sêmen',
        message: `${lowStockCount} touro(s) com menos de 5 doses disponíveis`
      })
    }

    if (outOfStockCount > 0) {
      alerts.push({
        type: 'error',
        title: 'Sêmen Esgotado',
        message: `${outOfStockCount} touro(s) sem doses disponíveis`
      })
    }

    const dashboardStats = {
      totalAnimals,
      activeAnimals,
      totalBirths,
      birthsThisMonth,
      totalSemen,
      availableDoses,
      totalCosts,
      alerts,
      lastUpdated: new Date().toISOString()
    }

    console.log('Estatísticas do dashboard obtidas com sucesso')
    res.status(200).json(dashboardStats)
  } catch (error) {
    console.error('Erro ao obter estatísticas do dashboard:', error)
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

