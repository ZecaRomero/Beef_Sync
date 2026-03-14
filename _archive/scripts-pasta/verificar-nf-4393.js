const { query } = require('../lib/database')

async function verificarNF() {
  try {
    console.log('�Ÿ”� Verificando Nota Fiscal 4393...\n')

    // Buscar a NF
    const nfResult = await query(`
      SELECT 
        id,
        numero_nf,
        data,
        data_compra,
        tipo,
        tipo_produto,
        fornecedor,
        destino,
        valor_total,
        natureza_operacao,
        created_at
      FROM notas_fiscais
      WHERE numero_nf = $1 OR numero_nf::text = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, ['4393'])

    if (nfResult.rows.length > 0) {
      console.log(`�œ… Nota Fiscal encontrada: ${nfResult.rows.length} registro(s)\n`)
      
      for (const nf of nfResult.rows) {
        console.log('�Ÿ“„ Dados da Nota Fiscal:')
        console.log(`   ID: ${nf.id}`)
        console.log(`   Número: ${nf.numero_nf}`)
        console.log(`   Tipo: ${nf.tipo}`)
        console.log(`   Tipo Produto: ${nf.tipo_produto}`)
        console.log(`   Data: ${nf.data || nf.data_compra}`)
        console.log(`   Valor Total: R$ ${parseFloat(nf.valor_total || 0).toFixed(2)}`)
        console.log(`   Destino: ${nf.destino || 'N/A'}`)
        console.log(`   Fornecedor: ${nf.fornecedor || 'N/A'}`)
        console.log(`   Criada em: ${nf.created_at}`)
        console.log('')

        // Buscar itens da NF
        const itensResult = await query(`
          SELECT 
            id,
            tipo_produto,
            dados_item
          FROM notas_fiscais_itens
          WHERE nota_fiscal_id = $1
        `, [nf.id])

        console.log(`   Itens: ${itensResult.rows.length}`)
        itensResult.rows.forEach((item, index) => {
          try {
            const dadosItem = typeof item.dados_item === 'string' 
              ? JSON.parse(item.dados_item) 
              : item.dados_item || {}
            
            console.log(`   Item ${index + 1}:`)
            console.log(`      Tipo: ${item.tipo_produto}`)
            console.log(`      Tatuagem: ${dadosItem.tatuagem || 'N/A'}`)
            console.log(`      Sexo: ${dadosItem.sexo || 'N/A'}`)
            console.log(`      Raça: ${dadosItem.raca || 'N/A'}`)
            console.log(`      Valor Unitário: R$ ${parseFloat(dadosItem.valorUnitario || 0).toFixed(2)}`)
            console.log(`      Quantidade: ${dadosItem.quantidade || 1}`)
            console.log(`      Peso: ${dadosItem.peso || 'N/A'}`)
          } catch (err) {
            console.log(`      Erro ao parsear dados: ${err.message}`)
          }
        })
        console.log('')
      }
    } else {
      console.log('�Œ Nota Fiscal 4393 não encontrada')
      
      // Verificar se existe com variações
      console.log('\n�Ÿ”� Buscando variações...')
      const variacoes = await query(`
        SELECT 
          id,
          numero_nf,
          tipo,
          valor_total,
          created_at
        FROM notas_fiscais
        WHERE numero_nf::text LIKE '%4393%'
           OR numero_nf::text = '4393'
        ORDER BY created_at DESC
        LIMIT 10
      `)
      
      if (variacoes.rows.length > 0) {
        console.log(`   Encontradas ${variacoes.rows.length} notas com variações:`)
        variacoes.rows.forEach(nf => {
          console.log(`      NF ${nf.numero_nf} - Tipo: ${nf.tipo} - Valor: R$ ${parseFloat(nf.valor_total || 0).toFixed(2)}`)
        })
      } else {
        console.log('   Nenhuma variação encontrada')
      }

      // Verificar últimas NFs de saída
      console.log('\n�Ÿ“‹ �šltimas 5 Notas Fiscais de Saída:')
      const ultimas = await query(`
        SELECT 
          id,
          numero_nf,
          tipo,
          valor_total,
          data,
          created_at
        FROM notas_fiscais
        WHERE tipo = 'saida'
        ORDER BY created_at DESC
        LIMIT 5
      `)
      
      if (ultimas.rows.length > 0) {
        ultimas.rows.forEach(nf => {
          console.log(`   NF ${nf.numero_nf} - Valor: R$ ${parseFloat(nf.valor_total || 0).toFixed(2)} - Data: ${nf.data || nf.created_at}`)
        })
      } else {
        console.log('   Nenhuma NF de saída encontrada')
      }
    }

    // Verificar filtro de data
    console.log('\n�Ÿ“… Verificando filtro de data (01/01/2026 a 30/01/2026):')
    const hoje = new Date()
    const inicioMes = new Date(2026, 0, 1) // Janeiro 2026
    const fimMes = new Date(2026, 0, 31) // Janeiro 2026
    
    const nfsPeriodo = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(valor_total) as valor_total
      FROM notas_fiscais
      WHERE tipo = 'saida'
        AND (
          (data >= $1 AND data <= $2)
          OR (data_compra >= $1 AND data_compra <= $2)
          OR (created_at::date >= $1 AND created_at::date <= $2)
        )
    `, [inicioMes.toISOString().split('T')[0], fimMes.toISOString().split('T')[0]])
    
    console.log(`   Total de NFs de saída no período: ${nfsPeriodo.rows[0].total}`)
    console.log(`   Valor total: R$ ${parseFloat(nfsPeriodo.rows[0].valor_total || 0).toFixed(2)}`)

  } catch (error) {
    console.error('�Œ Erro:', error)
    throw error
  }
}

if (require.main === module) {
  verificarNF()
    .then(() => {
      console.log('\n�œ… Verificação concluída!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('�Œ Erro:', error)
      process.exit(1)
    })
}

module.exports = { verificarNF }
