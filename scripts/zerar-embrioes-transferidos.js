/**
 * Script para zerar doses de embriÃµes que jÃ¡ foram transferidos
 * 
 * Baseado na imagem fornecida, os seguintes acasalamentos foram transferidos:
 * - CJ SANT ANNA 14785 (B2887 X JATOBÃ�) - 171 doses
 * - CJ SANT ANNA 15407 (HERMOSO X GENERAL) - 66 doses  
 * - CJCJ 15559 (MALÃÆ’O X REM ARMADOR) - 30 doses
 * - CJ SANT ANNA 15168 (URI X GENERAL) - 15 doses
 */

const { Pool } = require('pg')
require('dotenv').config()

async function zerarEmbrioesTransferidos() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'beef_sync',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  })

  try {
    console.log('ðÅ¸â€�Å’ Conectando ao banco de dados...')
    await pool.query('SELECT 1')
    console.log('âÅ“â€¦ Conectado ao banco de dados\n')

    // Lista de acasalamentos que foram transferidos (baseado na imagem)
    const acasalamentosTransferidos = [
      'CJ SANT ANNA 14785',
      'CJ SANT ANNA 15407',
      'CJCJ 15559',
      'CJ SANT ANNA 15168'
    ]

    console.log('ðÅ¸â€œâ€¹ Acasalamentos a serem zerados:')
    acasalamentosTransferidos.forEach(a => console.log(`  - ${a}`))
    console.log('')

    // Para cada acasalamento, zerar as doses
    let totalZerados = 0
    
    for (const acasalamento of acasalamentosTransferidos) {
      console.log(`\nðÅ¸â€�� Processando: ${acasalamento}`)
      
      // Buscar registros deste acasalamento
      const registros = await pool.query(`
        SELECT 
          id,
          nome_touro,
          quantidade_doses,
          doses_disponiveis,
          COALESCE(doses_usadas, 0) as doses_usadas
        FROM estoque_semen
        WHERE nome_touro ILIKE $1
          AND tipo_operacao = 'entrada'
          AND (tipo = 'embriao'
               OR nome_touro ILIKE '%ACASALAMENTO%'
               OR nome_touro ILIKE '% X %')
      `, [`%${acasalamento}%`])

      if (registros.rows.length === 0) {
        console.log(`  âÅ¡ ï¸�  Nenhum registro encontrado`)
        continue
      }

      console.log(`  ðÅ¸â€œ¦ Encontrados ${registros.rows.length} registro(s)`)
      
      for (const reg of registros.rows) {
        console.log(`\n  Registro ID ${reg.id}:`)
        console.log(`    Nome: ${reg.nome_touro}`)
        console.log(`    Antes: ${reg.doses_disponiveis} disponÃ­veis (total: ${reg.quantidade_doses}, usadas: ${reg.doses_usadas})`)
        
        // Zerar doses disponÃ­veis e marcar todas como usadas
        const resultado = await pool.query(`
          UPDATE estoque_semen
          SET doses_disponiveis = 0,
              doses_usadas = quantidade_doses,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING doses_disponiveis, doses_usadas
        `, [reg.id])

        const atualizado = resultado.rows[0]
        console.log(`    Depois: ${atualizado.doses_disponiveis} disponÃ­veis (usadas: ${atualizado.doses_usadas})`)
        console.log(`    âÅ“â€¦ Zerado com sucesso!`)
        totalZerados++
      }
    }

    console.log(`\n\nâÅ“â€¦ CORREÃâ€¡ÃÆ’O CONCLUÃ�DA!`)
    console.log(`ðÅ¸â€œÅ  Total de registros zerados: ${totalZerados}`)
    
    // Verificar resultado final
    const verificacao = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN doses_disponiveis > 0 THEN 1 ELSE 0 END) as com_doses,
        SUM(doses_disponiveis) as total_doses_disponiveis
      FROM estoque_semen
      WHERE tipo_operacao = 'entrada'
        AND (tipo = 'embriao'
             OR nome_touro ILIKE '%ACASALAMENTO%'
             OR nome_touro ILIKE '% X %')
    `)

    const stats = verificacao.rows[0]
    console.log(`\nðÅ¸â€œÅ  ESTOQUE ATUAL:`)
    console.log(`  Total de registros de embriÃµes: ${stats.total}`)
    console.log(`  Com doses disponÃ­veis: ${stats.com_doses}`)
    console.log(`  Total de doses disponÃ­veis: ${stats.total_doses_disponiveis}`)

    console.log('\nðÅ¸â€œ± Agora o relatÃ³rio mobile deve mostrar apenas os embriÃµes realmente disponÃ­veis!')

  } catch (error) {
    console.error('\nâ�Å’ Erro:', error.message)
    console.error('Stack:', error.stack)
    throw error
  } finally {
    await pool.end()
    console.log('\nðÅ¸â€�Å’ ConexÃ£o encerrada')
  }
}

// Executar
zerarEmbrioesTransferidos()
  .then(() => {
    console.log('\nâÅ“â€¦ Script finalizado')
    process.exit(0)
  })
  .catch(error => {
    console.error('\nâ�Å’ Erro ao executar script:', error.message)
    process.exit(1)
  })
