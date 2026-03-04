const { query } = require('./lib/database')

async function limparCustosDNAOrfaos() {
  try {
    console.log('🔍 Procurando custos de DNA órfãos...\n')

    // Buscar todos os custos de DNA
    const custosResult = await query(`
      SELECT 
        c.id,
        c.animal_id,
        c.valor,
        c.data,
        c.observacoes,
        a.serie,
        a.rg,
        a.nome
      FROM custos c
      LEFT JOIN animais a ON a.id = c.animal_id
      WHERE c.tipo = 'DNA'
      ORDER BY c.data DESC, c.created_at DESC
    `)

    console.log(`💰 Total de custos de DNA: ${custosResult.rows.length}`)

    if (custosResult.rows.length === 0) {
      console.log('✅ Nenhum custo de DNA encontrado.')
      return
    }

    // Buscar todos os envios
    const enviosResult = await query(`
      SELECT COUNT(*) as total FROM dna_envios
    `)

    const totalEnvios = parseInt(enviosResult.rows[0].total)
    console.log(`📦 Total de envios registrados: ${totalEnvios}\n`)

    if (totalEnvios === 0) {
      console.log('⚠️ Não há envios registrados, mas há custos de DNA.')
      console.log('Isso indica que os custos foram criados mas o envio falhou.\n')
      
      console.log('📋 Custos órfãos encontrados:')
      custosResult.rows.forEach(custo => {
        console.log(`\n  ID: ${custo.id}`)
        console.log(`  Animal: ${custo.serie}-${custo.rg} (${custo.nome || 'sem nome'})`)
        console.log(`  Valor: R$ ${parseFloat(custo.valor).toFixed(2)}`)
        console.log(`  Data: ${custo.data}`)
        console.log(`  Observações: ${custo.observacoes}`)
      })

      console.log('\n❓ Deseja excluir esses custos órfãos? (y/n)')
      
      // Aguardar confirmação do usuário
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      })

      readline.question('', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
          console.log('\n🗑️ Excluindo custos órfãos...')
          
          const deleteResult = await query(`
            DELETE FROM custos 
            WHERE tipo = 'DNA'
            AND id IN (${custosResult.rows.map(c => c.id).join(',')})
          `)

          console.log(`✅ ${deleteResult.rowCount} custo(s) excluído(s) com sucesso!`)
        } else {
          console.log('\n❌ Operação cancelada.')
        }
        
        readline.close()
        process.exit(0)
      })
    } else {
      console.log('✅ Há envios registrados. Verificando consistência...')
      
      // Verificar se todos os custos têm envios correspondentes
      const custosOrfaos = []
      
      for (const custo of custosResult.rows) {
        const envioResult = await query(`
          SELECT e.id 
          FROM dna_envios e
          INNER JOIN dna_animais da ON da.envio_id = e.id
          WHERE da.animal_id = $1
          AND e.data_envio = $2
        `, [custo.animal_id, custo.data])
        
        if (envioResult.rows.length === 0) {
          custosOrfaos.push(custo)
        }
      }
      
      if (custosOrfaos.length > 0) {
        console.log(`\n⚠️ ${custosOrfaos.length} custo(s) órfão(s) encontrado(s):`)
        custosOrfaos.forEach(custo => {
          console.log(`\n  ID: ${custo.id}`)
          console.log(`  Animal: ${custo.serie}-${custo.rg}`)
          console.log(`  Valor: R$ ${parseFloat(custo.valor).toFixed(2)}`)
        })
      } else {
        console.log('✅ Todos os custos têm envios correspondentes.')
      }
      
      process.exit(0)
    }

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

limparCustosDNAOrfaos()
