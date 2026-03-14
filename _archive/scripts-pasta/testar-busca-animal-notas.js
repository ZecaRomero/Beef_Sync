const { query } = require('../lib/database')

async function testarBusca() {
  try {
    console.log('�Ÿ”� Testando busca do animal CJCJ 16174...\n')

    // Teste 1: Busca direta no banco
    console.log('1. Busca direta no banco:')
    const busca1 = await query(`
      SELECT id, serie, rg, nome, sexo, raca, situacao
      FROM animais
      WHERE serie = 'CJCJ' AND rg::text = '16174'
    `)
    console.log(`   Resultado: ${busca1.rows.length} animal(s) encontrado(s)`)
    if (busca1.rows.length > 0) {
      console.log(`   �œ… Animal encontrado:`, busca1.rows[0])
    }

    // Teste 2: Busca como a API faz (sem filtros)
    console.log('\n2. Busca como a API (todos os animais):')
    const busca2 = await query(`
      SELECT a.*
      FROM animais a
      WHERE a.serie = 'CJCJ' AND a.rg::text = '16174'
      GROUP BY a.id
      ORDER BY a.data_nascimento DESC, a.created_at DESC
    `)
    console.log(`   Resultado: ${busca2.rows.length} animal(s) encontrado(s)`)
    if (busca2.rows.length > 0) {
      console.log(`   �œ… Animal encontrado na query da API`)
    }

    // Teste 3: Verificar se está na lista completa
    console.log('\n3. Verificando se está na lista completa:')
    const todos = await query(`
      SELECT COUNT(*) as total
      FROM animais
      WHERE situacao = 'Ativo'
    `)
    console.log(`   Total de animais ativos: ${todos.rows[0].total}`)

    const cjcjAtivos = await query(`
      SELECT COUNT(*) as total
      FROM animais
      WHERE serie = 'CJCJ' AND situacao = 'Ativo'
    `)
    console.log(`   Total de animais CJCJ ativos: ${cjcjAtivos.rows[0].total}`)

    // Teste 4: Verificar formato do RG
    console.log('\n4. Verificando formato do RG:')
    const rgTest = await query(`
      SELECT id, serie, rg, rg::text as rg_text, LENGTH(rg::text) as rg_length
      FROM animais
      WHERE serie = 'CJCJ' AND rg::text = '16174'
    `)
    if (rgTest.rows.length > 0) {
      const animal = rgTest.rows[0]
      console.log(`   RG como número: ${animal.rg}`)
      console.log(`   RG como texto: ${animal.rg_text}`)
      console.log(`   Tamanho do RG: ${animal.rg_length}`)
    }

    // Teste 5: Busca com variações
    console.log('\n5. Testando variações de busca:')
    const variacoes = [
      { serie: 'CJCJ', rg: '16174' },
      { serie: 'CJCJ', rg: 16174 },
      { serie: 'cjcj', rg: '16174' },
      { serie: 'CJCJ', rg: ' 16174' },
    ]

    for (const variacao of variacoes) {
      const result = await query(`
        SELECT id, serie, rg
        FROM animais
        WHERE UPPER(TRIM(serie)) = UPPER(TRIM($1))
          AND (TRIM(rg::text) = $2 OR rg = $3)
      `, [variacao.serie, String(variacao.rg).trim(), parseInt(variacao.rg)])
      
      console.log(`   Busca "${variacao.serie}" + "${variacao.rg}": ${result.rows.length > 0 ? '�œ… Encontrado' : '�Œ Não encontrado'}`)
    }

    console.log('\n�œ… Testes concluídos!')

  } catch (error) {
    console.error('�Œ Erro:', error)
    throw error
  }
}

if (require.main === module) {
  testarBusca()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('�Œ Erro:', error)
      process.exit(1)
    })
}

module.exports = { testarBusca }
