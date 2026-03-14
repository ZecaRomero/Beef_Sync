const { query } = require('./lib/database')

async function verificarDNA() {
  try {
    console.log('�Ÿ”� Verificando tabelas de DNA...\n')

    // Verificar se as tabelas existem
    const tabelasResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('dna_envios', 'dna_animais')
      ORDER BY table_name
    `)

    console.log('�Ÿ“‹ Tabelas encontradas:')
    tabelasResult.rows.forEach(row => {
      console.log(`  �œ“ ${row.table_name}`)
    })

    if (tabelasResult.rows.length === 0) {
      console.log('\n�Œ Nenhuma tabela de DNA encontrada!')
      console.log('Execute: node scripts/create-dna-tables.js')
      return
    }

    console.log('\n')

    // Verificar envios
    const enviosResult = await query(`
      SELECT 
        id,
        laboratorio,
        data_envio,
        quantidade_animais,
        custo_total,
        observacoes,
        created_at
      FROM dna_envios
      ORDER BY created_at DESC
      LIMIT 10
    `)

    console.log(`�Ÿ“� Envios de DNA: ${enviosResult.rows.length} registro(s)`)
    if (enviosResult.rows.length > 0) {
      enviosResult.rows.forEach(envio => {
        console.log(`\n  ID: ${envio.id}`)
        console.log(`  Laboratório: ${envio.laboratorio}`)
        console.log(`  Data: ${envio.data_envio}`)
        console.log(`  Quantidade: ${envio.quantidade_animais} animais`)
        console.log(`  Custo Total: R$ ${parseFloat(envio.custo_total).toFixed(2)}`)
        console.log(`  Observações: ${envio.observacoes || '-'}`)
        console.log(`  Criado em: ${envio.created_at}`)
      })
    } else {
      console.log('  (Nenhum envio registrado)')
    }

    console.log('\n')

    // Verificar animais vinculados
    const animaisResult = await query(`
      SELECT 
        da.id,
        da.envio_id,
        da.animal_id,
        a.serie,
        a.rg,
        a.nome
      FROM dna_animais da
      LEFT JOIN animais a ON a.id = da.animal_id
      ORDER BY da.created_at DESC
      LIMIT 10
    `)

    console.log(`�Ÿ�„ Animais vinculados: ${animaisResult.rows.length} registro(s)`)
    if (animaisResult.rows.length > 0) {
      animaisResult.rows.forEach(animal => {
        console.log(`\n  ID Vínculo: ${animal.id}`)
        console.log(`  Envio ID: ${animal.envio_id}`)
        console.log(`  Animal ID: ${animal.animal_id}`)
        console.log(`  Série: ${animal.serie || '-'}`)
        console.log(`  RG: ${animal.rg || '-'}`)
        console.log(`  Nome: ${animal.nome || '-'}`)
      })
    } else {
      console.log('  (Nenhum animal vinculado)')
    }

    console.log('\n')

    // Verificar custos de DNA
    const custosResult = await query(`
      SELECT 
        id,
        animal_id,
        tipo,
        subtipo,
        valor,
        data,
        observacoes
      FROM custos
      WHERE tipo = 'DNA'
      ORDER BY data DESC, created_at DESC
      LIMIT 10
    `)

    console.log(`�Ÿ’� Custos de DNA: ${custosResult.rows.length} registro(s)`)
    if (custosResult.rows.length > 0) {
      custosResult.rows.forEach(custo => {
        console.log(`\n  ID: ${custo.id}`)
        console.log(`  Animal ID: ${custo.animal_id}`)
        console.log(`  Tipo: ${custo.tipo}`)
        console.log(`  Subtipo: ${custo.subtipo}`)
        console.log(`  Valor: R$ ${parseFloat(custo.valor).toFixed(2)}`)
        console.log(`  Data: ${custo.data}`)
        console.log(`  Observações: ${custo.observacoes || '-'}`)
      })
    } else {
      console.log('  (Nenhum custo de DNA registrado)')
    }

    console.log('\n�œ… Verificação concluída!')

  } catch (error) {
    console.error('�Œ Erro ao verificar DNA:', error)
  } finally {
    process.exit(0)
  }
}

verificarDNA()
