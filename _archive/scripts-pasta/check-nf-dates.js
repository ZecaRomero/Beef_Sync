const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
})

async function checkNFDates() {
  const client = await pool.connect()
  
  try {
    console.log('�Ÿ”� Verificando datas das notas fiscais...')
    
    // Buscar todas as NFs com suas datas
    const nfsResult = await client.query(`
      SELECT numero_nf, data_compra, data, created_at, fornecedor
      FROM notas_fiscais 
      ORDER BY created_at DESC
    `)
    
    console.log(`�Ÿ“„ Total de NFs: ${nfsResult.rows.length}`)
    console.log('\n�Ÿ“… Datas das NFs:')
    
    nfsResult.rows.forEach((nf, index) => {
      console.log(`${index + 1}. NF: ${nf.numero_nf}`)
      console.log(`   Fornecedor: ${nf.fornecedor || 'N/A'}`)
      console.log(`   data_compra: ${nf.data_compra}`)
      console.log(`   data: ${nf.data}`)
      console.log(`   created_at: ${nf.created_at}`)
      console.log('')
    })
    
    // Verificar período padrão (mês atual)
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    console.log(`\n�Ÿ“… Período padrão (mês atual):`)
    console.log(`   Início: ${firstDay.toISOString().split('T')[0]}`)
    console.log(`   Fim: ${lastDay.toISOString().split('T')[0]}`)
    
    // Verificar quais NFs estão dentro do período
    const nfsNoPeriodo = nfsResult.rows.filter(nf => {
      const dataNF = nf.data_compra || nf.data
      if (!dataNF) return false
      
      const dataNFDate = new Date(dataNF)
      return dataNFDate >= firstDay && dataNFDate <= lastDay
    })
    
    console.log(`\n�œ… NFs dentro do período atual: ${nfsNoPeriodo.length}`)
    nfsNoPeriodo.forEach(nf => {
      console.log(`   - ${nf.numero_nf} (${nf.fornecedor})`)
    })
    
    // Verificar quais NFs estão fora do período
    const nfsForaPeriodo = nfsResult.rows.filter(nf => {
      const dataNF = nf.data_compra || nf.data
      if (!dataNF) return true
      
      const dataNFDate = new Date(dataNF)
      return dataNFDate < firstDay || dataNFDate > lastDay
    })
    
    console.log(`\n�š�️ NFs fora do período atual: ${nfsForaPeriodo.length}`)
    nfsForaPeriodo.forEach(nf => {
      console.log(`   - ${nf.numero_nf} (${nf.fornecedor}) - Data: ${nf.data_compra || nf.data}`)
    })
    
  } catch (error) {
    console.error('�Œ Erro na verificação:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkNFDates()
    .then(() => {
      console.log('�ŸŽ‰ Verificação concluída!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('�Ÿ’� Erro na verificação:', error)
      process.exit(1)
    })
}

module.exports = checkNFDates
