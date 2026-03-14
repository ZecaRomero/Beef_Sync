import { query } from '../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' })
  }

  try {
    console.log('🔧 Iniciando correção do estoque de embriões...')

    // 1. Verificar estado atual
    const estoqueAtual = await query(`
      SELECT 
        id,
        nome_touro as acasalamento,
        quantidade_doses,
        doses_disponiveis,
        doses_usadas,
        tipo_operacao,
        tipo
      FROM estoque_semen
      WHERE tipo_operacao = 'entrada'
        AND doses_disponiveis > 0
        AND (tipo = 'embriao'
             OR nome_touro ILIKE '%ACASALAMENTO%'
             OR nome_touro ILIKE '% X %')
      ORDER BY nome_touro
    `)

    const registrosComProblema = estoqueAtual.rows || []
    console.log(`📦 Encontrados ${registrosComProblema.length} registros com doses disponíveis`)

    if (registrosComProblema.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum registro precisa de correção',
        corrigidos: 0
      })
    }

    // 2. Verificar se há transferências registradas
    let transferenciasMap = {}
    try {
      const transferencias = await query(`
        SELECT 
          acasalamento,
          COUNT(*) as total
        FROM transferencias_embriao
        GROUP BY acasalamento
      `)
      
      transferencias.rows.forEach(t => {
        transferenciasMap[t.acasalamento.toLowerCase()] = t.total
      })
      console.log(`📤 Encontradas ${transferencias.rows.length} acasalamentos com transferências`)
    } catch (e) {
      console.log('ℹ️  Tabela transferencias_embriao não existe ou está vazia')
    }

    // 3. Aplicar correção: recalcular doses_disponiveis baseado em doses_usadas
    const resultado = await query(`
      UPDATE estoque_semen 
      SET doses_disponiveis = GREATEST(0, quantidade_doses - COALESCE(doses_usadas, 0)),
          updated_at = CURRENT_TIMESTAMP
      WHERE tipo_operacao = 'entrada'
        AND (tipo = 'embriao'
             OR nome_touro ILIKE '%ACASALAMENTO%'
             OR nome_touro ILIKE '% X %')
      RETURNING id, nome_touro, quantidade_doses, doses_disponiveis, doses_usadas
    `)

    const registrosCorrigidos = resultado.rows || []
    console.log(`✅ ${registrosCorrigidos.length} registros corrigidos`)

    // 4. Verificar resultado
    const estoqueDepois = await query(`
      SELECT 
        COUNT(*) as total
      FROM estoque_semen
      WHERE tipo_operacao = 'entrada'
        AND doses_disponiveis > 0
        AND (tipo = 'embriao'
             OR nome_touro ILIKE '%ACASALAMENTO%'
             OR nome_touro ILIKE '% X %')
    `)

    const totalDepois = estoqueDepois.rows[0]?.total || 0

    return res.status(200).json({
      success: true,
      message: 'Estoque de embriões corrigido com sucesso',
      antes: registrosComProblema.length,
      depois: totalDepois,
      corrigidos: registrosCorrigidos.length,
      detalhes: registrosCorrigidos.map(r => ({
        acasalamento: r.nome_touro,
        total: r.quantidade_doses,
        disponiveis: r.doses_disponiveis,
        usadas: r.doses_usadas
      }))
    })

  } catch (error) {
    console.error('❌ Erro ao corrigir estoque:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao corrigir estoque de embriões',
      error: error.message
    })
  }
}
