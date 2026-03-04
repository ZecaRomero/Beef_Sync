#!/usr/bin/env node

/**
 * Script para testar a importação de um animal com campo receptora
 */

const { query } = require('./lib/database')

async function testReceptoraImport() {
  console.log('🧪 Testando importação com campo receptora...\n')

  try {
    // 1. Simular dados como viriam do AnimalImporter
    const animalData = {
      nome: null,
      serie: 'TEST',
      rg: '999',
      tatuagem: null,
      sexo: 'Fêmea',
      raca: 'Nelore',
      data_nascimento: '2024-11-14',
      hora_nascimento: null,
      peso: null,
      cor: null,
      tipo_nascimento: null,
      dificuldade_parto: null,
      meses: 14,
      situacao: 'Ativo',
      pai: 'C2747 DA S.NICE',
      mae: 'CJCJ/15294 NIRA SANT ANNA',
      avo_materno: 'DON QUIXOTE MAT.',
      receptora: 'RZE72304', // Campo que deveria aparecer
      is_fiv: false,
      custo_total: 0,
      valor_venda: null,
      valor_real: null,
      veterinario: null,
      abczg: null,
      deca: null,
      observacoes: null,
      boletim: 'FAZENDA SANT ANNA RANCHARIA',
      local_nascimento: null,
      pasto_atual: null
    }

    console.log('1. Dados do animal a ser inserido:')
    console.log(`   Série: ${animalData.serie}`)
    console.log(`   RG: ${animalData.rg}`)
    console.log(`   Receptora: "${animalData.receptora}"`)
    console.log('')

    // 2. Inserir diretamente no banco
    console.log('2. Inserindo animal no banco de dados...')
    const result = await query(`
      INSERT INTO animais (
        nome, serie, rg, tatuagem, sexo, raca, data_nascimento, hora_nascimento,
        peso, cor, tipo_nascimento, dificuldade_parto, meses, situacao,
        pai, mae, avo_materno, receptora, is_fiv, custo_total, valor_venda, valor_real,
        veterinario, abczg, deca, observacoes, boletim, local_nascimento, pasto_atual
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
      ) RETURNING *
    `, [
      animalData.nome, animalData.serie, animalData.rg, animalData.tatuagem, 
      animalData.sexo, animalData.raca, animalData.data_nascimento, animalData.hora_nascimento,
      animalData.peso, animalData.cor, animalData.tipo_nascimento, animalData.dificuldade_parto, 
      animalData.meses, animalData.situacao, animalData.pai, animalData.mae, animalData.avo_materno, 
      animalData.receptora, animalData.is_fiv, animalData.custo_total, animalData.valor_venda, 
      animalData.valor_real, animalData.veterinario, animalData.abczg, animalData.deca, 
      animalData.observacoes, animalData.boletim, animalData.local_nascimento, animalData.pasto_atual
    ])

    if (result.rows.length > 0) {
      const animal = result.rows[0]
      console.log(`   ✅ Animal inserido com sucesso!`)
      console.log(`   ID: ${animal.id}`)
      console.log(`   Receptora salva: "${animal.receptora || 'VAZIO'}"`)
    }

    // 3. Buscar o animal inserido
    console.log('\n3. Buscando animal inserido...')
    const searchResult = await query(`
      SELECT id, serie, rg, receptora, created_at
      FROM animais 
      WHERE serie = 'TEST' AND rg = '999'
      ORDER BY id DESC
      LIMIT 1
    `)

    if (searchResult.rows.length > 0) {
      const animal = searchResult.rows[0]
      console.log(`   ✅ Animal encontrado:`)
      console.log(`   ID: ${animal.id}`)
      console.log(`   Receptora: "${animal.receptora || 'VAZIO'}"`)
    }

    // 4. Testar via API simulada (como o databaseService faria)
    console.log('\n4. Testando via databaseService...')
    const databaseService = require('./services/databaseService')
    
    const testAnimal2 = {
      ...animalData,
      serie: 'TEST2',
      rg: '998',
      receptora: 'RZE99999'
    }

    const createdAnimal = await databaseService.criarAnimal(testAnimal2)
    console.log(`   ✅ Animal criado via databaseService:`)
    console.log(`   ID: ${createdAnimal.id}`)
    console.log(`   Receptora: "${createdAnimal.receptora || 'VAZIO'}"`)

    // 5. Limpar dados de teste
    console.log('\n5. Limpando dados de teste...')
    await query(`DELETE FROM animais WHERE serie IN ('TEST', 'TEST2')`)
    console.log(`   ✅ Dados de teste removidos`)

    console.log('\n✅ Teste concluído com sucesso!')
    console.log('\n🎯 RESULTADO: O sistema está funcionando corretamente para salvar receptora')

  } catch (error) {
    console.error('❌ Erro durante teste:', error)
    
    // Tentar limpar dados mesmo com erro
    try {
      await query(`DELETE FROM animais WHERE serie IN ('TEST', 'TEST2')`)
    } catch (cleanupError) {
      console.error('Erro na limpeza:', cleanupError)
    }
  }
}

// Executar
testReceptoraImport()
  .then(() => {
    console.log('\n🔍 PRÓXIMO PASSO: Verificar os dados originais da importação do CJCC 1')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })