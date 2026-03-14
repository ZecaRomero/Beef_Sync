const { query } = require('../lib/database')

async function buscarTouroRemNocaute() {
  try {
    console.log('�Ÿ”� Buscando touro REM NOCAUTE no cadastro de animais...\n')

    // Buscar por diferentes variações
    const variacoes = [
      'REM NOCAUTE',
      'REMC A5686',
      'NOCAUTE',
      'REM',
      'A5686'
    ]

    for (const variacao of variacoes) {
      const result = await query(`
        SELECT id, serie, rg, nome, sexo, raca
        FROM animais
        WHERE (
          nome ILIKE $1
          OR serie ILIKE $1
          OR rg::text ILIKE $1
          OR CONCAT(serie, ' ', rg::text) ILIKE $1
        )
        AND (sexo ILIKE '%macho%' OR sexo = 'M')
        ORDER BY id DESC
        LIMIT 10
      `, [`%${variacao}%`])

      if (result.rows.length > 0) {
        console.log(`\n�œ… Encontrado(s) com "${variacao}":`)
        result.rows.forEach(animal => {
          console.log(`   ID: ${animal.id}`)
          console.log(`   Nome: ${animal.nome || 'N/A'}`)
          console.log(`   Série: ${animal.serie || 'N/A'}`)
          console.log(`   RG: ${animal.rg || 'N/A'}`)
          console.log(`   Sexo: ${animal.sexo || 'N/A'}`)
          console.log(`   Raça: ${animal.raca || 'N/A'}`)
          console.log('')
        })
      }
    }

    // Verificar se existe no estoque de sêmen
    console.log('\n�Ÿ”� Buscando no estoque de sêmen...\n')
    const semenResult = await query(`
      SELECT DISTINCT nome_touro, rg_touro, COUNT(*) as total
      FROM estoque_semen
      WHERE (
        nome_touro ILIKE '%REM%'
        OR nome_touro ILIKE '%NOCAUTE%'
        OR rg_touro ILIKE '%A5686%'
        OR rg_touro ILIKE '%REMC%'
      )
      GROUP BY nome_touro, rg_touro
      ORDER BY total DESC
      LIMIT 10
    `)

    if (semenResult.rows.length > 0) {
      console.log('�œ… Encontrado(s) no estoque de sêmen:')
      semenResult.rows.forEach(semen => {
        console.log(`   Nome: ${semen.nome_touro || 'N/A'}`)
        console.log(`   RG: ${semen.rg_touro || 'N/A'}`)
        console.log(`   Quantidade de registros: ${semen.total}`)
        console.log('')
      })
    } else {
      console.log('�Œ Não encontrado no estoque de sêmen')
    }

    // Resumo das transferências
    console.log('\n�Ÿ“Š Resumo das transferências com REM NOCAUTE:')
    const transferencias = await query(`
      SELECT COUNT(*) as total
      FROM transferencias_embrioes
      WHERE touro ILIKE '%REM NOCAUTE%'
    `)
    console.log(`   Total: ${transferencias.rows[0].total} transferência(s)`)

    console.log('\n�Ÿ’� O touro completo é: REM NOCAUTE (RG: REMC A5686)')
    console.log('   Este touro precisa ser cadastrado no sistema se ainda não estiver.')

  } catch (error) {
    console.error('�Œ Erro:', error)
    throw error
  }
}

if (require.main === module) {
  buscarTouroRemNocaute()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('�Œ Erro:', error)
      process.exit(1)
    })
}

module.exports = { buscarTouroRemNocaute }
