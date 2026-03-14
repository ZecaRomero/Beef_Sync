/**
 * Script para corrigir venda registrada no animal errado
 * A venda (NF 4145, CLEBER, R$ 28.800) pertence Ã  CJCJ 16013 (MANERA SANT ANNA),
 * mas foi importada incorretamente na CJCJ 17037 (JATAUBA SANT ANNA - filha).
 */
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
})

async function corrigirVenda() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    console.log('ðÅ¸â€�� Buscando a baixa incorreta na CJCJ 17037...')
    
    // 1. Buscar a baixa com serie=CJCJ, rg=17037 que tem os dados da venda da 16013
    const baixaResult = await client.query(`
      SELECT id, animal_id, serie, rg, valor, comprador, numero_nf, data_baixa
      FROM baixas
      WHERE UPPER(TRIM(serie)) = 'CJCJ' 
        AND TRIM(rg::text) = '17037'
        AND tipo = 'VENDA'
        AND (comprador ILIKE '%CLEBER%' OR numero_nf = '4145')
      ORDER BY data_baixa DESC
      LIMIT 1
    `)

    const baixa = baixaResult.rows[0]
    if (!baixa) {
      console.log('âÅ“â€¦ Nenhuma baixa encontrada para corrigir (jÃ¡ foi corrigida ou nÃ£o existe)')
      await client.query('ROLLBACK')
      return
    }

    console.log('ðÅ¸â€œâ€¹ Baixa encontrada:', {
      id: baixa.id,
      serie_rg: `${baixa.serie} ${baixa.rg}`,
      valor: baixa.valor,
      comprador: baixa.comprador,
      nf: baixa.numero_nf
    })

    // 2. Buscar ou criar o animal CJCJ 16013 (MANERA SANT ANNA)
    let animal16013 = await client.query(`
      SELECT id, nome FROM animais 
      WHERE UPPER(TRIM(serie)) = 'CJCJ' AND TRIM(rg::text) = '16013' 
      LIMIT 1
    `)
    
    let animalId16013 = animal16013.rows[0]?.id
    
    if (!animalId16013) {
      console.log('âÅ¡ ï¸�  Animal CJCJ 16013 nÃ£o encontrado. Criando cadastro...')
      
      // Criar o animal CJCJ 16013 (mÃ£e da 17037)
      const insertResult = await client.query(`
        INSERT INTO animais (
          serie, rg, nome, sexo, raca, situacao, 
          created_at, updated_at
        ) VALUES (
          'CJCJ', '16013', 'MANERA SANT ANNA', 'FÃªmea', 'Nelore', 'Vendido',
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING id, nome
      `)
      
      animalId16013 = insertResult.rows[0].id
      console.log('âÅ“â€¦ Animal CJCJ 16013 criado com ID:', animalId16013)
    }

    console.log('ðÅ¸�â€ž Animal correto:', {
      id: animalId16013,
      nome: animal16013.rows[0]?.nome || 'MANERA SANT ANNA'
    })

    // 3. Corrigir valor se estiver errado (28.80 -> 28800)
    let valorCorrigido = parseFloat(baixa.valor)
    if (valorCorrigido > 0 && valorCorrigido < 100) {
      valorCorrigido = valorCorrigido * 1000
      console.log(`ðÅ¸â€™° Valor corrigido: R$ ${baixa.valor} ââ€ â€™ R$ ${valorCorrigido.toLocaleString('pt-BR')}`)
    }

    // 4. Atualizar a baixa: mover para 16013
    console.log('ðÅ¸â€œ� Movendo baixa para CJCJ 16013...')
    await client.query(`
      UPDATE baixas
      SET serie = 'CJCJ', rg = '16013', animal_id = $1, valor = $2
      WHERE id = $3
    `, [animalId16013, valorCorrigido, baixa.id])

    // 5. Remover Vendido da CJCJ 17037 (a venda nÃ£o era dela)
    console.log('ðÅ¸â€�â€ž Removendo status "Vendido" da CJCJ 17037...')
    await client.query(`
      UPDATE animais
      SET situacao = CASE WHEN situacao = 'Vendido' THEN 'Ativo' ELSE situacao END,
          valor_venda = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE UPPER(TRIM(serie)) = 'CJCJ' AND TRIM(rg::text) = '17037'
    `)

    // 6. Marcar CJCJ 16013 como Vendido
    console.log('âÅ“â€¦ Marcando CJCJ 16013 como Vendido...')
    await client.query(`
      UPDATE animais
      SET situacao = 'Vendido', valor_venda = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [valorCorrigido, animalId16013])

    await client.query('COMMIT')
    
    console.log('\nâÅ“â€¦ CORREÃâ€¡ÃÆ’O CONCLUÃ�DA COM SUCESSO!')
    console.log('ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��')
    console.log(`ðÅ¸â€œÅ’ Venda movida: CJCJ 17037 ââ€ â€™ CJCJ 16013`)
    console.log(`ðÅ¸â€™µ Valor: R$ ${valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    console.log(`ðÅ¸â€œâ€ž NF: ${baixa.numero_nf}`)
    console.log(`ðÅ¸â€˜¤ Comprador: ${baixa.comprador}`)
    console.log('ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��ââ€��')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('â�Å’ Erro ao corrigir venda:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

corrigirVenda()
  .then(() => {
    console.log('\nâÅ“¨ Script finalizado')
    process.exit(0)
  })
  .catch(error => {
    console.error('\nðÅ¸â€™¥ Erro fatal:', error)
    process.exit(1)
  })
