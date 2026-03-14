/**
 * Script para RESTAURAR as doses de embriÃµes que foram zeradas por engano
 * 
 * O usuÃ¡rio transferiu de "EmbriÃµes" para "Estoque de SÃªmen" (mudanÃ§a de tipo)
 * nÃ£o para animais. Precisamos restaurar as doses.
 */

const { Pool } = require('pg')
require('dotenv').config()

async function restaurarEmbrioes() {
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

    // Registros que foram zerados (baseado no output anterior)
    const registrosZerados = [
      { id: 105, nome: 'CJ SANT ANNA 14785(B2887 X JATOBÃ�)', doses: 8 },
      { id: 21, nome: 'CJ SANT ANNA 14785(B2887 X JATOBÃ�)', doses: 163 },
      { id: 48, nome: 'CJ SANT ANNA 15407(HERMOSO X GENERAL)', doses: 39 },
      { id: 23, nome: 'CJ SANT ANNA 15407(HERMOSO X GENERAL)', doses: 17 },
      { id: 122, nome: 'CJCJ 15559 ( MALAIO X REM ARMADOR)', doses: 14 },
      { id: 71, nome: 'CJCJ 15559 ( MALAIO X REM ARMADOR)', doses: 16 },
      { id: 47, nome: 'CJ SANT ANNA 15168 ( URI X GENERAL)', doses: 15 }
    ]

    console.log('ðÅ¸â€�â€ž RESTAURANDO DOSES...\n')

    let totalRestaurados = 0

    for (const reg of registrosZerados) {
      console.log(`ðÅ¸â€œ¦ Restaurando ID ${reg.id}: ${reg.nome}`)
      console.log(`   Restaurando ${reg.doses} doses...`)

      // Restaurar doses_disponiveis e zerar doses_usadas
      const resultado = await pool.query(`
        UPDATE estoque_semen
        SET doses_disponiveis = $1,
            doses_usadas = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, nome_touro, doses_disponiveis, doses_usadas
      `, [reg.doses, reg.id])

      if (resultado.rows.length > 0) {
        const atualizado = resultado.rows[0]
        console.log(`   âÅ“â€¦ Restaurado: ${atualizado.doses_disponiveis} disponÃ­veis\n`)
        totalRestaurados++
      } else {
        console.log(`   âÅ¡ ï¸�  Registro nÃ£o encontrado\n`)
      }
    }

    console.log(`\nâÅ“â€¦ RESTAURAÃâ€¡ÃÆ’O CONCLUÃ�DA!`)
    console.log(`ðÅ¸â€œÅ  Total de registros restaurados: ${totalRestaurados}`)

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

    // Agora vamos verificar se esses registros foram transferidos para sÃªmen
    console.log(`\n\nðÅ¸â€�� VERIFICANDO TRANSFERÃÅ NCIAS PARA SÃÅ MEN...`)
    
    const acasalamentos = [
      'CJ SANT ANNA 14785',
      'CJ SANT ANNA 15407',
      'CJCJ 15559',
      'CJ SANT ANNA 15168'
    ]

    for (const acasalamento of acasalamentos) {
      const semen = await pool.query(`
        SELECT 
          id,
          nome_touro,
          tipo,
          quantidade_doses,
          doses_disponiveis
        FROM estoque_semen
        WHERE nome_touro ILIKE $1
          AND tipo_operacao = 'entrada'
        ORDER BY tipo, id
      `, [`%${acasalamento}%`])

      if (semen.rows.length > 0) {
        console.log(`\nðÅ¸â€œâ€¹ ${acasalamento}:`)
        semen.rows.forEach(s => {
          console.log(`   ID ${s.id}: tipo="${s.tipo || 'NULL'}", ${s.doses_disponiveis} doses disponÃ­veis`)
        })
      }
    }

    console.log('\n\nðÅ¸â€™¡ PRÃâ€œXIMOS PASSOS:')
    console.log('Se vocÃª transferiu de "EmbriÃµes" para "SÃªmen", os registros devem ter:')
    console.log('  - tipo = "semen" (ao invÃ©s de "embriao")')
    console.log('  - Isso faz com que nÃ£o apareÃ§am no relatÃ³rio de embriÃµes')
    console.log('\nVerifique o relatÃ³rio de "Estoque de SÃªmen" para encontrar esses registros.')

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
restaurarEmbrioes()
  .then(() => {
    console.log('\nâÅ“â€¦ Script finalizado')
    process.exit(0)
  })
  .catch(error => {
    console.error('\nâ�Å’ Erro ao executar script:', error.message)
    process.exit(1)
  })
