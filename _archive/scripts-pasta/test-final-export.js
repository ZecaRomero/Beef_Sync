const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
})

async function testFinalExport() {
  const client = await pool.connect()
  
  try {
    console.log('�Ÿ”� Testando exportação final...')
    
    // Período do mês atual (igual ao frontend)
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const period = {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    }
    
    console.log(`�Ÿ“… Período: ${period.startDate} até ${period.endDate}`)
    
    // Executar a mesma consulta da API
    const nfsEntradas = await client.query(`
      SELECT numero_nf, data_compra, fornecedor, natureza_operacao, valor_total, itens, observacoes
      FROM notas_fiscais 
      WHERE tipo = 'entrada' 
      AND (data_compra BETWEEN $1 AND $2 OR data BETWEEN $1 AND $2)
      ORDER BY data_compra DESC
    `, [period.startDate, period.endDate])
    
    console.log(`\n�Ÿ“„ NFs de entrada encontradas: ${nfsEntradas.rows.length}`)
    
    nfsEntradas.rows.forEach((nf, index) => {
      console.log(`\n${index + 1}. NF: ${nf.numero_nf}`)
      console.log(`   Fornecedor: ${nf.fornecedor}`)
      console.log(`   Data: ${nf.data_compra}`)
      console.log(`   Valor: R$ ${nf.valor_total}`)
      console.log(`   Observações: ${nf.observacoes}`)
      
      try {
        let itens
        if (typeof nf.itens === 'string') {
          itens = JSON.parse(nf.itens)
        } else {
          itens = nf.itens || []
        }
        
        console.log(`   Itens (${itens.length}):`)
        itens.forEach((item, itemIndex) => {
          console.log(`     ${itemIndex + 1}. ${item.tatuagem} (${item.raca})`)
        })
      } catch (error) {
        console.log(`   Erro ao processar itens: ${error.message}`)
      }
    })
    
    // Verificar especificamente a NF do Joaozinho
    const nfJoaozinho = nfsEntradas.rows.find(nf => nf.numero_nf === '1020')
    if (nfJoaozinho) {
      console.log('\n�œ… NF do Joaozinho encontrada!')
      console.log(`   Fornecedor: ${nfJoaozinho.fornecedor}`)
      console.log(`   Observações: ${nfJoaozinho.observacoes}`)
      
      let itens
      try {
        itens = typeof nfJoaozinho.itens === 'string' ? JSON.parse(nfJoaozinho.itens) : nfJoaozinho.itens || []
      } catch {
        itens = []
      }
      
      console.log(`   Animais (${itens.length}):`)
      itens.forEach((item, itemIndex) => {
        console.log(`     ${itemIndex + 1}. ${item.tatuagem} (${item.raca})`)
      })
    } else {
      console.log('\n�Œ NF do Joaozinho N�ƒO encontrada!')
    }
    
    // Verificar se os animais estão cadastrados
    console.log('\n�Ÿ”� Verificando animais na tabela...')
    const animaisResult = await client.query(`
      SELECT serie, rg, raca, situacao, observacoes
      FROM animais 
      WHERE serie IN ('TOURO', 'BOI') AND rg IN ('001', '002')
      ORDER BY created_at DESC
    `)
    
    console.log(`�Ÿ�„ Animais encontrados: ${animaisResult.rows.length}`)
    animaisResult.rows.forEach((animal, index) => {
      console.log(`   ${index + 1}. ${animal.serie}${animal.rg} (${animal.raca}) - ${animal.situacao}`)
      console.log(`      Observações: ${animal.observacoes || 'Nenhuma'}`)
    })
    
  } catch (error) {
    console.error('�Œ Erro no teste:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testFinalExport()
    .then(() => {
      console.log('�ŸŽ‰ Teste concluído!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('�Ÿ’� Erro no teste:', error)
      process.exit(1)
    })
}

module.exports = testFinalExport
