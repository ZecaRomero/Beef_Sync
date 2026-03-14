const { query } = require('./lib/database')

async function testarMultiplosEnvios() {
  try {
    console.log('≈∏ß™ Testando sistema de m√∫ltiplos envios de DNA...\n')

    // Buscar um animal de teste
    const animalResult = await query(`
      SELECT id, serie, rg, nome 
      FROM animais 
      WHERE id IN (1611, 1612)
      LIMIT 1
    `)

    if (animalResult.rows.length === 0) {
      console.log('‚ù≈í Nenhum animal encontrado para teste')
      process.exit(1)
    }

    const animal = animalResult.rows[0]
    console.log(`‚≈ì‚Ä¶ Animal selecionado: ${animal.serie}-${animal.rg} (${animal.nome})`)
    console.log(`   ID: ${animal.id}\n`)

    // Simular envio para VRGEN
    console.log('≈∏‚Äú§ Simulando envio para VRGEN (R$ 50,00)...')
    const envio1 = await query(`
      INSERT INTO dna_envios 
      (laboratorio, data_envio, custo_por_animal, custo_total, quantidade_animais, observacoes)
      VALUES ('VRGEN', CURRENT_DATE, 50.00, 50.00, 1, 'Teste de m√∫ltiplos envios - VRGEN')
      RETURNING id
    `)
    
    await query(`
      INSERT INTO dna_animais (envio_id, animal_id)
      VALUES ($1, $2)
    `, [envio1.rows[0].id, animal.id])

    await query(`
      UPDATE animais
      SET laboratorio_dna = 'VRGEN',
          data_envio_dna = CURRENT_DATE,
          custo_dna = 50.00
      WHERE id = $1
    `, [animal.id])

    await query(`
      INSERT INTO custos (animal_id, tipo, subtipo, valor, data, observacoes)
      VALUES ($1, 'DNA', 'An√°lise Gen√©tica', 50.00, CURRENT_DATE, 'An√°lise de DNA - VRGEN')
    `, [animal.id])

    console.log('‚≈ì‚Ä¶ Envio VRGEN registrado\n')

    // Simular envio para NEOGEN
    console.log('≈∏‚Äú§ Simulando envio para NEOGEN (R$ 80,00)...')
    const envio2 = await query(`
      INSERT INTO dna_envios 
      (laboratorio, data_envio, custo_por_animal, custo_total, quantidade_animais, observacoes)
      VALUES ('NEOGEN', CURRENT_DATE, 80.00, 80.00, 1, 'Teste de m√∫ltiplos envios - NEOGEN')
      RETURNING id
    `)
    
    await query(`
      INSERT INTO dna_animais (envio_id, animal_id)
      VALUES ($1, $2)
    `, [envio2.rows[0].id, animal.id])

    await query(`
      UPDATE animais
      SET laboratorio_dna = 'VRGEN, NEOGEN',
          custo_dna = 130.00
      WHERE id = $1
    `, [animal.id])

    await query(`
      INSERT INTO custos (animal_id, tipo, subtipo, valor, data, observacoes)
      VALUES ($1, 'DNA', 'An√°lise Gen√©tica', 80.00, CURRENT_DATE, 'An√°lise de DNA - NEOGEN')
    `, [animal.id])

    console.log('‚≈ì‚Ä¶ Envio NEOGEN registrado\n')

    // Verificar resultado
    const animalAtualizado = await query(`
      SELECT 
        id,
        serie,
        rg,
        nome,
        laboratorio_dna,
        custo_dna
      FROM animais
      WHERE id = $1
    `, [animal.id])

    const enviosAnimal = await query(`
      SELECT 
        de.id,
        de.laboratorio,
        de.custo_por_animal,
        de.observacoes
      FROM dna_envios de
      INNER JOIN dna_animais da ON da.envio_id = de.id
      WHERE da.animal_id = $1
      ORDER BY de.created_at
    `, [animal.id])

    const custosAnimal = await query(`
      SELECT 
        id,
        tipo,
        subtipo,
        valor,
        observacoes
      FROM custos
      WHERE animal_id = $1 AND tipo = 'DNA'
      ORDER BY created_at
    `, [animal.id])

    console.log('≈∏‚Äú≈† RESULTADO FINAL:\n')
    console.log('≈∏ê‚Äû Animal:')
    console.log(`   ${animalAtualizado.rows[0].serie}-${animalAtualizado.rows[0].rg}`)
    console.log(`   Laborat√≥rios: ${animalAtualizado.rows[0].laboratorio_dna}`)
    console.log(`   Custo Total: R$ ${parseFloat(animalAtualizado.rows[0].custo_dna).toFixed(2)}\n`)

    console.log(`≈∏‚Äú¶ Envios (${enviosAnimal.rows.length}):`)
    enviosAnimal.rows.forEach((envio, idx) => {
      console.log(`   ${idx + 1}. ${envio.laboratorio} - R$ ${parseFloat(envio.custo_por_animal).toFixed(2)}`)
      console.log(`      ${envio.observacoes}`)
    })

    console.log(`\n≈∏‚Äô∞ Custos (${custosAnimal.rows.length}):`)
    const custoTotal = custosAnimal.rows.reduce((sum, c) => sum + parseFloat(c.valor), 0)
    custosAnimal.rows.forEach((custo, idx) => {
      console.log(`   ${idx + 1}. ${custo.subtipo} - R$ ${parseFloat(custo.valor).toFixed(2)}`)
      console.log(`      ${custo.observacoes}`)
    })
    console.log(`   TOTAL: R$ ${custoTotal.toFixed(2)}`)

    console.log('\n‚≈ì‚Ä¶ Teste conclu√≠do com sucesso!')
    console.log('\n≈∏‚Äô° Acesse a ficha do animal para ver o hist√≥rico completo de envios.')

  } catch (error) {
    console.error('‚ù≈í Erro:', error)
  } finally {
    process.exit(0)
  }
}

testarMultiplosEnvios()
