const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
})

async function checkJoaozinhoAnimals() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Verificando animais do fornecedor Joaozinho...')
    
    // Buscar NFs do Joaozinho
    const nfsResult = await client.query(`
      SELECT numero_nf, fornecedor, itens, observacoes, valor_total
      FROM notas_fiscais 
      WHERE fornecedor ILIKE '%joaozinho%' OR numero_nf = '1020'
      ORDER BY created_at DESC
    `)
    
    console.log(`📄 Encontradas ${nfsResult.rows.length} notas fiscais`)
    
    nfsResult.rows.forEach((nf, index) => {
      console.log(`\n${index + 1}. NF: ${nf.numero_nf}`)
      console.log(`   Fornecedor: ${nf.fornecedor}`)
      console.log(`   Valor Total: R$ ${nf.valor_total || 0}`)
      console.log(`   Observações: ${nf.observacoes || 'Nenhuma'}`)
      
      try {
        let itens
        if (typeof nf.itens === 'string') {
          itens = JSON.parse(nf.itens)
        } else {
          itens = nf.itens || []
        }
        
        console.log(`   Itens (${itens.length}):`)
        itens.forEach((item, itemIndex) => {
          console.log(`     ${itemIndex + 1}. ${item.tatuagem || 'Sem tatuagem'}`)
          console.log(`        Raça: ${item.raca || 'Não informada'}`)
          console.log(`        Sexo: ${item.sexo || 'Não informado'}`)
          console.log(`        Peso: ${item.peso || 0} kg`)
          console.log(`        Valor Unitário: R$ ${item.valorUnitario || 0}`)
        })
      } catch (error) {
        console.log(`   Erro ao processar itens: ${error.message}`)
      }
    })
    
    // Verificar se esses animais estão na tabela de animais
    console.log('\n🔍 Verificando se os animais estão cadastrados na tabela de animais...')
    
    const animaisResult = await client.query('SELECT serie, rg, raca, situacao FROM animais ORDER BY created_at DESC')
    console.log(`🐄 Total de animais cadastrados: ${animaisResult.rows.length}`)
    
    console.log('\n📋 Lista de todos os animais:')
    animaisResult.rows.forEach((animal, index) => {
      console.log(`   ${index + 1}. ${animal.serie}${animal.rg} (${animal.raca}) - ${animal.situacao}`)
    })
    
    // Buscar especificamente animais que podem ser do Joaozinho
    console.log('\n🔍 Procurando animais que podem ser do Joaozinho...')
    
    const animaisJoaozinho = await client.query(`
      SELECT serie, rg, raca, situacao, observacoes, created_at
      FROM animais 
      WHERE observacoes ILIKE '%joaozinho%' 
         OR observacoes ILIKE '%1020%'
         OR serie ILIKE '%TOURO%'
         OR serie ILIKE '%BOI%'
      ORDER BY created_at DESC
    `)
    
    if (animaisJoaozinho.rows.length > 0) {
      console.log(`\n🎯 ${animaisJoaozinho.rows.length} animais encontrados que podem ser do Joaozinho:`)
      animaisJoaozinho.rows.forEach((animal, index) => {
        console.log(`   ${index + 1}. ${animal.serie}${animal.rg} (${animal.raca}) - ${animal.situacao}`)
        console.log(`      Observações: ${animal.observacoes || 'Nenhuma'}`)
        console.log(`      Criado em: ${animal.created_at}`)
      })
    } else {
      console.log('\n⚠️ Nenhum animal encontrado com referências ao Joaozinho')
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkJoaozinhoAnimals()
    .then(() => {
      console.log('🎉 Verificação concluída!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro na verificação:', error)
      process.exit(1)
    })
}

module.exports = checkJoaozinhoAnimals
