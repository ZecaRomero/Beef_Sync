#!/usr/bin/env node

/**
 * Script para corrigir o campo receptora do animal CJCC 1
 */

const { query } = require('./lib/database')

async function fixCJCC1Receptora() {
  console.log('�Ÿ”� Corrigindo campo receptora do animal CJCC 1...\n')

  try {
    // 1. Verificar estado atual
    console.log('1. Estado atual do animal CJCC 1:')
    const currentState = await query(`
      SELECT id, serie, rg, receptora, created_at, updated_at
      FROM animais 
      WHERE serie = 'CJCC' AND rg = '1'
      ORDER BY id DESC
      LIMIT 1
    `)
    
    if (currentState.rows.length === 0) {
      console.log('   �Œ Animal CJCC 1 não encontrado!')
      return
    }

    const animal = currentState.rows[0]
    console.log(`   ID: ${animal.id}`)
    console.log(`   Série: ${animal.serie}`)
    console.log(`   RG: ${animal.rg}`)
    console.log(`   Receptora atual: "${animal.receptora || 'VAZIO'}"`)
    console.log(`   Criado em: ${animal.created_at}`)
    console.log(`   Atualizado em: ${animal.updated_at}`)

    // 2. Atualizar com a receptora correta
    console.log('\n2. Atualizando campo receptora...')
    const updateResult = await query(`
      UPDATE animais 
      SET receptora = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, serie, rg, receptora, updated_at
    `, ['RZE72304', animal.id])

    if (updateResult.rows.length > 0) {
      const updatedAnimal = updateResult.rows[0]
      console.log(`   �œ… Animal atualizado com sucesso!`)
      console.log(`   ID: ${updatedAnimal.id}`)
      console.log(`   Receptora atualizada: "${updatedAnimal.receptora}"`)
      console.log(`   Atualizado em: ${updatedAnimal.updated_at}`)
    }

    // 3. Verificar se a atualização foi bem-sucedida
    console.log('\n3. Verificando atualização...')
    const verifyResult = await query(`
      SELECT id, serie, rg, receptora, updated_at
      FROM animais 
      WHERE serie = 'CJCC' AND rg = '1'
      ORDER BY id DESC
      LIMIT 1
    `)

    if (verifyResult.rows.length > 0) {
      const verifiedAnimal = verifyResult.rows[0]
      console.log(`   �œ… Verificação concluída:`)
      console.log(`   Receptora: "${verifiedAnimal.receptora}"`)
      
      if (verifiedAnimal.receptora === 'RZE72304') {
        console.log(`   �ŸŽ‰ Campo receptora corrigido com sucesso!`)
      } else {
        console.log(`   �Œ Erro: Campo não foi atualizado corretamente`)
      }
    }

    // 4. Testar como a API retornaria os dados
    console.log('\n4. Testando retorno da API...')
    const apiTest = await query(`
      SELECT 
        a.*,
        COALESCE(
          (SELECT SUM(valor) FROM custos WHERE animal_id = a.id),
          0
        ) as custo_total_calculado
      FROM animais a
      WHERE serie = 'CJCC' AND rg = '1'
      ORDER BY id DESC
      LIMIT 1
    `)

    if (apiTest.rows.length > 0) {
      const apiAnimal = apiTest.rows[0]
      console.log(`   �œ… Dados como a API retornaria:`)
      console.log(`   ID: ${apiAnimal.id}`)
      console.log(`   Receptora: "${apiAnimal.receptora || 'VAZIO'}"`)
      console.log(`   Avô Materno: "${apiAnimal.avo_materno || 'VAZIO'}"`)
    }

    console.log('\n�œ… Correção concluída!')
    console.log('\n�ŸŽ� RESULTADO:')
    console.log('�œ… O campo receptora do animal CJCC 1 foi corrigido para "RZE72304"')
    console.log('�œ… Agora deve aparecer corretamente na ficha do animal')
    console.log('\n�Ÿ“‹ PR�“XIMOS PASSOS:')
    console.log('1. Acesse a ficha do animal CJCC 1 no sistema')
    console.log('2. Verifique se o campo "Receptora" agora mostra "RZE72304"')
    console.log('3. Se ainda não aparecer, pode ser cache do navegador - tente F5 ou Ctrl+F5')

  } catch (error) {
    console.error('�Œ Erro durante correção:', error)
  }
}

// Executar
fixCJCC1Receptora()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })