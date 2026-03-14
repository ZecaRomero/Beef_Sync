import { query } from '../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'MÃ©todo nÃ£o permitido' })
  }

  try {
    console.log('ðÅ¸â€�§ Iniciando correÃ§Ã£o do estoque de embriÃµes...')

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
    console.log(`ðÅ¸â€œ¦ Encontrados ${registrosComProblema.length} registros com doses disponÃ­veis`)

    if (registrosComProblema.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum registro precisa de correÃ§Ã£o',
        corrigidos: 0
      })
    }

    // 2. Verificar se hÃ¡ transferÃªncias registradas
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
      console.log(`ðÅ¸â€œ¤ Encontradas ${transferencias.rows.length} acasalamentos com transferÃªncias`)
    } catch (e) {
      console.log('ââ€ž¹ï¸�  Tabela transferencias_embriao nÃ£o existe ou estÃ¡ vazia')
    }

    // 3. Aplicar correÃ§Ã£o: recalcular doses_disponiveis baseado em doses_usadas
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
    console.log(`âÅ“â€¦ ${registrosCorrigidos.length} registros corrigidos`)

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
      message: 'Estoque de embriÃµes corrigido com sucesso',
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
    console.error('â�Å’ Erro ao corrigir estoque:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao corrigir estoque de embriÃµes',
      error: error.message
    })
  }
}
