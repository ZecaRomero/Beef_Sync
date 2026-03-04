const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
})

async function testSync() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Verificando dados no banco...')
    
    // Contar animais
    const animaisResult = await client.query('SELECT COUNT(*) as total FROM animais')
    const totalAnimais = parseInt(animaisResult.rows[0].total)
    console.log(`📊 Total de animais: ${totalAnimais}`)
    
    // Contar notas fiscais
    const nfsResult = await client.query('SELECT COUNT(*) as total FROM notas_fiscais')
    const totalNFs = parseInt(nfsResult.rows[0].total)
    console.log(`📄 Total de notas fiscais: ${totalNFs}`)
    
    // Contar NFs por tipo
    const nfsEntradaResult = await client.query("SELECT COUNT(*) as total FROM notas_fiscais WHERE tipo = 'entrada'")
    const nfsSaidaResult = await client.query("SELECT COUNT(*) as total FROM notas_fiscais WHERE tipo = 'saida'")
    
    const nfsEntradas = parseInt(nfsEntradaResult.rows[0].total)
    const nfsSaidas = parseInt(nfsSaidaResult.rows[0].total)
    
    console.log(`📥 NFs de entrada: ${nfsEntradas}`)
    console.log(`📤 NFs de saída: ${nfsSaidas}`)
    console.log(`📊 Total movimentações: ${nfsEntradas + nfsSaidas}`)
    
    // Mostrar alguns animais
    const animaisSample = await client.query('SELECT serie, rg, situacao FROM animais LIMIT 5')
    console.log('\n🐄 Amostra de animais:')
    animaisSample.rows.forEach(animal => {
      console.log(`  - ${animal.serie}${animal.rg} (${animal.situacao})`)
    })
    
    // Mostrar algumas NFs
    const nfsSample = await client.query('SELECT numero_nf, tipo, valor_total FROM notas_fiscais LIMIT 5')
    console.log('\n📄 Amostra de notas fiscais:')
    nfsSample.rows.forEach(nf => {
      console.log(`  - ${nf.numero_nf} (${nf.tipo}) - R$ ${nf.valor_total}`)
    })
    
    console.log('\n✅ Verificação concluída!')
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testSync()
    .then(() => {
      console.log('🎉 Teste concluído!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro no teste:', error)
      process.exit(1)
    })
}

module.exports = testSync
