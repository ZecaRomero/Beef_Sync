const { query } = require('../lib/database')

async function verificarAnimal() {
  try {
    console.log('�Ÿ”� Verificando animal CJCJ 16174 no banco de dados...\n')

    // Buscar por diferentes variações
    const variacoes = [
      { serie: 'CJCJ', rg: '16174' },
      { serie: 'CJCJ', rg: '16174' },
    ]

    // Busca 1: Por série e RG exatos
    console.log('1. Buscando por série e RG exatos:')
    const busca1 = await query(`
      SELECT id, serie, rg, nome, sexo, raca, situacao, created_at
      FROM animais
      WHERE serie = $1 AND rg::text = $2
      ORDER BY id DESC
    `, ['CJCJ', '16174'])

    if (busca1.rows.length > 0) {
      console.log(`   �œ… Encontrado: ${busca1.rows.length} registro(s)`)
      busca1.rows.forEach(animal => {
        console.log(`      ID: ${animal.id}`)
        console.log(`      Série: ${animal.serie}`)
        console.log(`      RG: ${animal.rg}`)
        console.log(`      Nome: ${animal.nome || 'N/A'}`)
        console.log(`      Sexo: ${animal.sexo || 'N/A'}`)
        console.log(`      Raça: ${animal.raca || 'N/A'}`)
        console.log(`      Situação: ${animal.situacao || 'N/A'}`)
        console.log(`      Criado em: ${animal.created_at || 'N/A'}`)
        console.log('')
      })
    } else {
      console.log('   �Œ Não encontrado por série e RG exatos')
    }

    // Busca 2: Por RG apenas (caso a série esteja diferente)
    console.log('2. Buscando apenas por RG:')
    const busca2 = await query(`
      SELECT id, serie, rg, nome, sexo, raca, situacao
      FROM animais
      WHERE rg::text = $1
      ORDER BY id DESC
      LIMIT 10
    `, ['16174'])

    if (busca2.rows.length > 0) {
      console.log(`   �œ… Encontrado: ${busca2.rows.length} registro(s)`)
      busca2.rows.forEach(animal => {
        console.log(`      ID: ${animal.id}, Série: ${animal.serie}, RG: ${animal.rg}, Nome: ${animal.nome || 'N/A'}`)
      })
    } else {
      console.log('   �Œ Não encontrado por RG')
    }

    // Busca 3: Busca parcial (caso tenha espaços ou formatação diferente)
    console.log('\n3. Buscando por variações (parcial):')
    const busca3 = await query(`
      SELECT id, serie, rg, nome, sexo, raca, situacao
      FROM animais
      WHERE (serie ILIKE '%CJCJ%' AND rg::text ILIKE '%16174%')
         OR CONCAT(serie, ' ', rg::text) ILIKE '%CJCJ%16174%'
         OR CONCAT(serie, rg::text) ILIKE '%CJCJ16174%'
      ORDER BY id DESC
      LIMIT 10
    `)

    if (busca3.rows.length > 0) {
      console.log(`   �œ… Encontrado: ${busca3.rows.length} registro(s)`)
      busca3.rows.forEach(animal => {
        console.log(`      ID: ${animal.id}, Série: ${animal.serie}, RG: ${animal.rg}, Nome: ${animal.nome || 'N/A'}`)
      })
    } else {
      console.log('   �Œ Não encontrado por busca parcial')
    }

    // Busca 4: Verificar se está inativo ou com situação diferente
    console.log('\n4. Verificando situação do animal:')
    if (busca1.rows.length > 0) {
      const animal = busca1.rows[0]
      console.log(`   Situação: ${animal.situacao || 'N/A'}`)
      console.log(`   Está ativo: ${animal.situacao === 'Ativo' || animal.situacao === 'Ativa' ? '�œ… SIM' : '�Œ N�ƒO'}`)
    }

    // Busca 5: Verificar em outras tabelas relacionadas
    console.log('\n5. Verificando em outras tabelas:')
    
    if (busca1.rows.length > 0) {
      const animalId = busca1.rows[0].id
      
      // Verificar em movimentações
      const movimentacoes = await query(`
        SELECT COUNT(*) as total
        FROM movimentacoes
        WHERE animal_id = $1
      `, [animalId])
      console.log(`   Movimentações: ${movimentacoes.rows[0].total}`)
      
      // Verificar em custos
      const custos = await query(`
        SELECT COUNT(*) as total
        FROM custos
        WHERE animal_id = $1
      `, [animalId])
      console.log(`   Custos: ${custos.rows[0].total}`)
      
      // Verificar em transferências de embriões
      const transferencias = await query(`
        SELECT COUNT(*) as total
        FROM transferencias_embrioes
        WHERE doadora_id = $1 OR receptora_id = $1 OR touro_id = $1
      `, [animalId])
      console.log(`   Transferências de embriões: ${transferencias.rows[0].total}`)
    }

  } catch (error) {
    console.error('�Œ Erro:', error)
    throw error
  }
}

if (require.main === module) {
  verificarAnimal()
    .then(() => {
      console.log('\n�œ… Verificação concluída!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('�Œ Erro:', error)
      process.exit(1)
    })
}

module.exports = { verificarAnimal }
