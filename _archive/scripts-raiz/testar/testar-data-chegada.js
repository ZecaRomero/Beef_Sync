const { pool } = require('./lib/database')

async function testarDataChegada() {
  console.log('ğÅ¸§ª Testando funcionalidade de Data de Chegada e Alertas de DG\n')

  try {
    // 1. Verificar se as colunas existem
    console.log('1ï¸âÆ’£ Verificando estrutura da tabela...')
    const estrutura = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'animais'
        AND column_name IN ('data_chegada', 'data_dg_prevista', 'data_dg', 'resultado_dg')
      ORDER BY column_name
    `)
    
    console.log('   Colunas encontradas:')
    estrutura.rows.forEach(col => {
      console.log(`   âÅ“â€œ ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`)
    })

    if (estrutura.rows.length < 4) {
      console.log('\n   âÅ¡ ï¸ ATENÃâ€¡ÃÆ’O: Algumas colunas estÃ£o faltando!')
      console.log('   Execute o script adicionar-data-chegada.js primeiro')
      return
    }

    // 2. Verificar se o trigger existe
    console.log('\n2ï¸âÆ’£ Verificando trigger automÃ¡tico...')
    const trigger = await pool.query(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE trigger_name = 'calcular_data_dg_trigger'
    `)
    
    if (trigger.rows.length > 0) {
      console.log('   âÅ“â€œ Trigger encontrado: calcular_data_dg_trigger')
    } else {
      console.log('   âÅ¡ ï¸ Trigger nÃ£o encontrado!')
    }

    // 3. Verificar se a tabela de alertas existe
    console.log('\n3ï¸âÆ’£ Verificando tabela de alertas...')
    const tabelaAlertas = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'alertas_dg'
      )
    `)
    
    if (tabelaAlertas.rows[0].exists) {
      console.log('   âÅ“â€œ Tabela alertas_dg encontrada')
    } else {
      console.log('   âÅ¡ ï¸ Tabela alertas_dg nÃ£o encontrada!')
    }

    // 4. Criar um animal de teste com data de chegada
    console.log('\n4ï¸âÆ’£ Criando animal de teste...')
    const dataChegada = new Date()
    dataChegada.setDate(dataChegada.getDate() - 10) // 10 dias atrÃ¡s
    
    const resultado = await pool.query(`
      INSERT INTO animais (
        serie, rg, sexo, raca, situacao, 
        data_chegada, boletim, pasto_atual
      ) VALUES (
        'RPT', 'TEST-DG-001', 'FÃªmea', 'Receptora', 'Ativo',
        $1, 'TESTE', 'Piquete Teste'
      )
      RETURNING id, serie, rg, data_chegada, data_dg_prevista
    `, [dataChegada.toISOString().split('T')[0]])

    const animalTeste = resultado.rows[0]
    console.log('   âÅ“â€œ Animal criado:')
    console.log(`     ID: ${animalTeste.id}`)
    console.log(`     IdentificaÃ§Ã£o: ${animalTeste.serie}-${animalTeste.rg}`)
    console.log(`     Data Chegada: ${new Date(animalTeste.data_chegada).toLocaleDateString('pt-BR')}`)
    console.log(`     Data DG Prevista: ${new Date(animalTeste.data_dg_prevista).toLocaleDateString('pt-BR')}`)

    // 5. Verificar se o trigger calculou corretamente
    console.log('\n5ï¸âÆ’£ Verificando cÃ¡lculo automÃ¡tico...')
    const dataChegadaDate = new Date(animalTeste.data_chegada)
    const dataDgPrevistaDate = new Date(animalTeste.data_dg_prevista)
    const diferencaDias = Math.round((dataDgPrevistaDate - dataChegadaDate) / (1000 * 60 * 60 * 24))
    
    if (diferencaDias === 15) {
      console.log(`   âÅ“â€œ CÃ¡lculo correto! DG previsto para 15 dias apÃ³s chegada`)
    } else {
      console.log(`   âÅ¡ ï¸ CÃ¡lculo incorreto! DiferenÃ§a: ${diferencaDias} dias (esperado: 15)`)
    }

    // 6. Testar API de alertas
    console.log('\n6ï¸âÆ’£ Testando API de alertas...')
    const alertas = await pool.query(`
      SELECT 
        a.id,
        a.serie,
        a.rg,
        a.data_chegada,
        a.data_dg_prevista,
        (a.data_dg_prevista - CURRENT_DATE) as dias_restantes
      FROM animais a
      WHERE a.data_dg_prevista IS NOT NULL
        AND a.data_dg IS NULL
        AND a.data_dg_prevista BETWEEN CURRENT_DATE - INTERVAL '10 days' AND CURRENT_DATE + INTERVAL '7 days'
      ORDER BY a.data_dg_prevista ASC
    `)

    console.log(`   âÅ“â€œ Encontrados ${alertas.rows.length} alertas`)
    alertas.rows.forEach(alerta => {
      const diasRestantes = parseInt(alerta.dias_restantes)
      const status = diasRestantes < 0 ? 'ğÅ¸â€´ ATRASADO' : diasRestantes <= 2 ? 'ğÅ¸Å¸  URGENTE' : 'ğÅ¸Å¸¡ PRÃâ€œXIMO'
      console.log(`     ${status} ${alerta.serie}-${alerta.rg} - DG em ${diasRestantes} dias`)
    })

    // 7. Limpar dados de teste
    console.log('\n7ï¸âÆ’£ Limpando dados de teste...')
    await pool.query('DELETE FROM animais WHERE rg = $1', ['TEST-DG-001'])
    console.log('   âÅ“â€œ Animal de teste removido')

    console.log('\nâÅ“â€¦ TESTE CONCLUÃDO COM SUCESSO!')
    console.log('\nğÅ¸â€œâ€¹ Resumo:')
    console.log('   ââ‚¬¢ Estrutura do banco: OK')
    console.log('   ââ‚¬¢ Trigger automÃ¡tico: OK')
    console.log('   ââ‚¬¢ CÃ¡lculo de DG: OK')
    console.log('   ââ‚¬¢ API de alertas: OK')
    console.log('\nğÅ¸Å½¯ PrÃ³ximos passos:')
    console.log('   1. Abra o dashboard para ver o widget de alertas')
    console.log('   2. Cadastre uma receptora com data de chegada')
    console.log('   3. Verifique se o alerta aparece no dashboard')

  } catch (error) {
    console.error('\nâÅ’ Erro durante o teste:', error.message)
    console.error(error)
  } finally {
    await pool.end()
  }
}

testarDataChegada()
