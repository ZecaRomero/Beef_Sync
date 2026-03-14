const { query } = require('./lib/database')

async function limparInfoDNA() {
  try {
    console.log('�Ÿ”� Procurando animais com informações de DNA...\n')

    // Buscar animais com DNA
    const animaisResult = await query(`
      SELECT 
        id,
        serie,
        rg,
        nome,
        laboratorio_dna,
        data_envio_dna,
        custo_dna
      FROM animais
      WHERE laboratorio_dna IS NOT NULL
      OR data_envio_dna IS NOT NULL
      OR custo_dna IS NOT NULL
      ORDER BY id
    `)

    if (animaisResult.rows.length === 0) {
      console.log('�œ… Nenhum animal com informações de DNA encontrado.')
      process.exit(0)
      return
    }

    console.log(`�Ÿ�„ ${animaisResult.rows.length} animal(is) com informações de DNA:\n`)
    
    animaisResult.rows.forEach(animal => {
      console.log(`  ID: ${animal.id}`)
      console.log(`  Animal: ${animal.serie}-${animal.rg} (${animal.nome || 'sem nome'})`)
      console.log(`  Laboratório: ${animal.laboratorio_dna || '-'}`)
      console.log(`  Data Envio: ${animal.data_envio_dna || '-'}`)
      console.log(`  Custo: R$ ${animal.custo_dna ? parseFloat(animal.custo_dna).toFixed(2) : '0.00'}`)
      console.log('')
    })

    // Limpar as informações de DNA dos animais
    console.log('�Ÿ—‘️ Limpando informações de DNA dos animais...')
    
    const updateResult = await query(`
      UPDATE animais
      SET 
        laboratorio_dna = NULL,
        data_envio_dna = NULL,
        custo_dna = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE laboratorio_dna IS NOT NULL
      OR data_envio_dna IS NOT NULL
      OR custo_dna IS NOT NULL
    `)

    console.log(`�œ… ${updateResult.rowCount} animal(is) atualizado(s) com sucesso!`)
    console.log('\n�œ… Informações de DNA removidas dos animais.')

  } catch (error) {
    console.error('�Œ Erro:', error)
  } finally {
    process.exit(0)
  }
}

limparInfoDNA()
