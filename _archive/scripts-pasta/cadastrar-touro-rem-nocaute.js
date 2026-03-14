const { query } = require('../lib/database')

async function cadastrarTouroRemNocaute() {
  try {
    console.log('�Ÿ”� Verificando se o touro REM NOCAUTE já existe...\n')

    // Verificar se já existe
    const existe = await query(`
      SELECT id, serie, rg, nome, sexo
      FROM animais
      WHERE (
        (serie ILIKE 'REM%' OR serie ILIKE 'REMC%')
        AND rg::text = 'A5686'
      )
      OR (
        nome ILIKE '%REM NOCAUTE%'
        AND (sexo ILIKE '%macho%' OR sexo = 'M')
      )
      LIMIT 1
    `)

    let touroId

    if (existe.rows.length > 0) {
      console.log('�œ… Touro já existe no cadastro:')
      console.log(`   ID: ${existe.rows[0].id}`)
      console.log(`   Nome: ${existe.rows[0].nome || 'N/A'}`)
      console.log(`   Série: ${existe.rows[0].serie || 'N/A'}`)
      console.log(`   RG: ${existe.rows[0].rg || 'N/A'}`)
      touroId = existe.rows[0].id
    } else {
      console.log('�Ÿ“� Cadastrando touro REM NOCAUTE...\n')

      // Buscar informações do estoque de sêmen
      const semenInfo = await query(`
        SELECT nome_touro, rg_touro, raca
        FROM estoque_semen
        WHERE nome_touro ILIKE '%REM NOCAUTE%'
        LIMIT 1
      `)

      const nomeTouro = semenInfo.rows[0]?.nome_touro || 'REM NOCAUTE'
      const rgTouro = semenInfo.rows[0]?.rg_touro || 'REMC A5686'
      const racaTouro = semenInfo.rows[0]?.raca || 'Nelore'

      // Extrair série e RG
      let serie = 'REMC'
      let rg = 'A5686'

      if (rgTouro.includes(' ')) {
        const partes = rgTouro.split(' ')
        if (partes.length >= 2) {
          serie = partes[0]
          rg = partes.slice(1).join(' ')
        }
      } else if (rgTouro.includes('-')) {
        const partes = rgTouro.split('-')
        if (partes.length >= 2) {
          serie = partes[0]
          rg = partes.slice(1).join('-')
        }
      }

      // Cadastrar o touro
      const result = await query(`
        INSERT INTO animais (
          serie, 
          rg, 
          nome, 
          sexo, 
          raca,
          situacao,
          boletim,
          pasto_atual,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, serie, rg, nome, sexo
      `, [
        serie,
        rg,
        nomeTouro,
        'Macho',
        racaTouro,
        'Ativo',
        'Cadastrado via script - REM NOCAUTE',
        'Indefinido'
      ])

      touroId = result.rows[0].id
      console.log('�œ… Touro cadastrado com sucesso!')
      console.log(`   ID: ${result.rows[0].id}`)
      console.log(`   Nome: ${result.rows[0].nome}`)
      console.log(`   Série: ${result.rows[0].serie}`)
      console.log(`   RG: ${result.rows[0].rg}`)
      console.log(`   Sexo: ${result.rows[0].sexo}`)
    }

    // Vincular transferências
    console.log('\n�Ÿ”— Vinculando transferências ao touro...\n')

    const updateResult = await query(`
      UPDATE transferencias_embrioes
      SET touro_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE touro ILIKE '%REM NOCAUTE%'
        AND (touro_id IS NULL OR touro_id != $1)
      RETURNING id, numero_te, receptora_nome
    `, [touroId])

    console.log(`�œ… ${updateResult.rows.length} transferência(s) vinculada(s) ao touro:`)
    updateResult.rows.forEach((te, idx) => {
      console.log(`   ${idx + 1}. TE ${te.numero_te || te.id} - Receptora: ${te.receptora_nome || 'N/A'}`)
    })

    console.log('\n�œ… Processo concluído com sucesso!')
    console.log(`\n�Ÿ’� O touro REM NOCAUTE agora está cadastrado e todas as transferências foram vinculadas.`)

  } catch (error) {
    console.error('�Œ Erro:', error)
    throw error
  }
}

if (require.main === module) {
  cadastrarTouroRemNocaute()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('�Œ Erro:', error)
      process.exit(1)
    })
}

module.exports = { cadastrarTouroRemNocaute }
