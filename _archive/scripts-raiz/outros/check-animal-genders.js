// Script para verificar e corrigir sexos dos animais
const { query } = require('./lib/database')

async function checkAnimalGenders() {
  console.log('�Ÿ”� Verificando sexos dos animais mencionados no erro...\n')

  try {
    // Animais mencionados no erro
    const animalsToCheck = [
      { serie: 'CJCJ', rg: '16235' },
      { serie: 'CJCJ', rg: '16511' },
      { serie: 'CJCJ', rg: '16635' }
    ]

    console.log('1. Verificando animais específicos do erro:')
    
    for (const animal of animalsToCheck) {
      try {
        const result = await query(`
          SELECT id, serie, rg, nome, sexo, raca, data_nascimento
          FROM animais 
          WHERE serie = $1 AND rg = $2
        `, [animal.serie, animal.rg])

        if (result.rows.length > 0) {
          const animalData = result.rows[0]
          console.log(`   ${animal.serie} ${animal.rg}:`)
          console.log(`     - ID: ${animalData.id}`)
          console.log(`     - Nome: ${animalData.nome || 'N/A'}`)
          console.log(`     - Sexo: ${animalData.sexo}`)
          console.log(`     - Raça: ${animalData.raca || 'N/A'}`)
          console.log(`     - Data Nascimento: ${animalData.data_nascimento || 'N/A'}`)
          
          if (animalData.sexo === 'Macho' || animalData.sexo === 'M') {
            console.log(`     �Œ PROBLEMA: Animal é macho, não pode ser inseminado`)
          } else if (animalData.sexo === 'Fêmea' || animalData.sexo === 'F') {
            console.log(`     �œ… OK: Animal é fêmea, pode ser inseminado`)
          } else {
            console.log(`     �š�️ ATEN�‡�ƒO: Sexo não reconhecido: "${animalData.sexo}"`)
          }
        } else {
          console.log(`   ${animal.serie} ${animal.rg}: �Œ Animal não encontrado`)
        }
        console.log('')
      } catch (error) {
        console.error(`   Erro ao verificar ${animal.serie} ${animal.rg}:`, error.message)
      }
    }

    // 2. Verificar estatísticas gerais de sexo
    console.log('2. Estatísticas gerais de sexo dos animais:')
    
    const sexStats = await query(`
      SELECT 
        sexo,
        COUNT(*) as quantidade,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentual
      FROM animais 
      GROUP BY sexo 
      ORDER BY quantidade DESC
    `)

    sexStats.rows.forEach(stat => {
      console.log(`   ${stat.sexo || 'NULL'}: ${stat.quantidade} animais (${stat.percentual}%)`)
    })

    // 3. Verificar animais com sexo problemático
    console.log('\n3. Verificando animais com sexo não padronizado:')
    
    const problematicGenders = await query(`
      SELECT serie, rg, sexo, COUNT(*) as quantidade
      FROM animais 
      WHERE sexo NOT IN ('Macho', 'Fêmea', 'M', 'F')
      GROUP BY serie, rg, sexo
      ORDER BY quantidade DESC
      LIMIT 10
    `)

    if (problematicGenders.rows.length > 0) {
      console.log('   Animais com sexo não padronizado:')
      problematicGenders.rows.forEach(animal => {
        console.log(`   - ${animal.serie} ${animal.rg}: "${animal.sexo}" (${animal.quantidade} registros)`)
      })
    } else {
      console.log('   �œ… Todos os animais têm sexo padronizado')
    }

    // 4. Sugestões de correção
    console.log('\n4. Sugestões para resolver o problema:')
    console.log('   a) Verificar se os animais CJCJ 16235 e CJCJ 16511 realmente são machos')
    console.log('   b) Se forem machos, não devem ser incluídos na planilha de inseminação')
    console.log('   c) Se forem fêmeas, corrigir o sexo no banco de dados')
    console.log('   d) Verificar a planilha Excel para garantir que apenas fêmeas sejam importadas')

    // 5. Verificar se existem inseminações desses animais
    console.log('\n5. Verificando inseminações existentes desses animais:')
    
    for (const animal of animalsToCheck) {
      try {
        const animalResult = await query(`
          SELECT id FROM animais WHERE serie = $1 AND rg = $2
        `, [animal.serie, animal.rg])

        if (animalResult.rows.length > 0) {
          const animalId = animalResult.rows[0].id
          
          const inseminacoes = await query(`
            SELECT COUNT(*) as total, MAX(data_inseminacao) as ultima_ia
            FROM inseminacoes 
            WHERE animal_id = $1
          `, [animalId])

          const total = inseminacoes.rows[0].total
          const ultimaIA = inseminacoes.rows[0].ultima_ia

          if (total > 0) {
            console.log(`   ${animal.serie} ${animal.rg}: ${total} inseminação(ões), última em ${ultimaIA}`)
          } else {
            console.log(`   ${animal.serie} ${animal.rg}: Nenhuma inseminação registrada`)
          }
        }
      } catch (error) {
        console.error(`   Erro ao verificar inseminações de ${animal.serie} ${animal.rg}:`, error.message)
      }
    }

    console.log('\n�œ… Verificação concluída!')

  } catch (error) {
    console.error('�Œ Erro:', error)
  }
}

// Executar
checkAnimalGenders()
  .then(() => {
    console.log('\n�ŸŽ� PR�“XIMOS PASSOS:')
    console.log('1. Verificar a planilha Excel e remover machos da lista de inseminação')
    console.log('2. Ou corrigir o sexo dos animais no banco se estiver incorreto')
    console.log('3. Tentar importar novamente após as correções')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })