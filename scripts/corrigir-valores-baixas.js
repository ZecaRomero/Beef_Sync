/**
 * Script para corrigir valores de vendas na tabela baixas
 * Valores como 3.64 devem ser 3640.00
 * Multiplica por 1000 valores suspeitos (< 100 e tipo VENDA)
 */

const { query } = require('../lib/database')

async function corrigirValoresBaixas() {
  console.log('🔧 Iniciando correção de valores de baixas...\n')

  try {
    // 1. Buscar todas as vendas com valores suspeitos (< 100)
    const result = await query(`
      SELECT id, serie, rg, valor, comprador, numero_nf, data_baixa
      FROM baixas
      WHERE tipo = 'VENDA' 
        AND valor IS NOT NULL 
        AND valor > 0 
        AND valor < 100
      ORDER BY valor DESC
    `)

    const registros = result.rows || []
    console.log(`📊 Encontrados ${registros.length} registros com valores suspeitos\n`)

    if (registros.length === 0) {
      console.log('✅ Nenhum registro precisa de correção!')
      return
    }

    // Mostrar registros que serão corrigidos
    console.log('Registros que serão corrigidos:')
    console.log('─'.repeat(80))
    registros.forEach(r => {
      const valorAtual = parseFloat(r.valor)
      const valorCorrigido = valorAtual * 1000
      console.log(`${r.serie} ${r.rg}`)
      console.log(`  Valor atual: R$ ${valorAtual.toFixed(2)}`)
      console.log(`  Valor corrigido: R$ ${valorCorrigido.toFixed(2)}`)
      console.log(`  Comprador: ${r.comprador || 'N/A'}`)
      console.log(`  NF: ${r.numero_nf || 'N/A'}`)
      console.log(`  Data: ${r.data_baixa || 'N/A'}`)
      console.log('─'.repeat(80))
    })

    // Confirmar antes de executar
    console.log(`\n⚠️  Serão corrigidos ${registros.length} registros`)
    console.log('Os valores serão multiplicados por 1000\n')

    // Executar correção
    let corrigidos = 0
    let erros = 0

    for (const registro of registros) {
      try {
        const valorAtual = parseFloat(registro.valor)
        const valorCorrigido = valorAtual * 1000

        await query(`
          UPDATE baixas
          SET valor = $1
          WHERE id = $2
        `, [valorCorrigido, registro.id])

        // Também atualizar o valor_venda na tabela animais se existir
        await query(`
          UPDATE animais
          SET valor_venda = $1
          WHERE serie = $2 AND rg = $3
        `, [valorCorrigido, registro.serie, registro.rg])

        corrigidos++
        console.log(`✅ ${registro.serie} ${registro.rg}: R$ ${valorAtual.toFixed(2)} → R$ ${valorCorrigido.toFixed(2)}`)
      } catch (err) {
        erros++
        console.error(`❌ Erro ao corrigir ${registro.serie} ${registro.rg}:`, err.message)
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log(`✅ Correção concluída!`)
    console.log(`   Corrigidos: ${corrigidos}`)
    console.log(`   Erros: ${erros}`)
    console.log('='.repeat(80))

  } catch (error) {
    console.error('❌ Erro ao executar correção:', error)
    throw error
  }
}

// Executar
corrigirValoresBaixas()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Erro fatal:', err)
    process.exit(1)
  })
