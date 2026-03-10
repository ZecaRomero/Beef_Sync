/**
 * Script para RESTAURAR as doses de embriões que foram zeradas por engano
 * 
 * O usuário transferiu de "Embriões" para "Estoque de Sêmen" (mudança de tipo)
 * não para animais. Precisamos restaurar as doses.
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
    console.log('🔌 Conectando ao banco de dados...')
    await pool.query('SELECT 1')
    console.log('✅ Conectado ao banco de dados\n')

    // Registros que foram zerados (baseado no output anterior)
    const registrosZerados = [
      { id: 105, nome: 'CJ SANT ANNA 14785(B2887 X JATOBÁ)', doses: 8 },
      { id: 21, nome: 'CJ SANT ANNA 14785(B2887 X JATOBÁ)', doses: 163 },
      { id: 48, nome: 'CJ SANT ANNA 15407(HERMOSO X GENERAL)', doses: 39 },
      { id: 23, nome: 'CJ SANT ANNA 15407(HERMOSO X GENERAL)', doses: 17 },
      { id: 122, nome: 'CJCJ 15559 ( MALAIO X REM ARMADOR)', doses: 14 },
      { id: 71, nome: 'CJCJ 15559 ( MALAIO X REM ARMADOR)', doses: 16 },
      { id: 47, nome: 'CJ SANT ANNA 15168 ( URI X GENERAL)', doses: 15 }
    ]

    console.log('🔄 RESTAURANDO DOSES...\n')

    let totalRestaurados = 0

    for (const reg of registrosZerados) {
      console.log(`📦 Restaurando ID ${reg.id}: ${reg.nome}`)
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
        console.log(`   ✅ Restaurado: ${atualizado.doses_disponiveis} disponíveis\n`)
        totalRestaurados++
      } else {
        console.log(`   ⚠️  Registro não encontrado\n`)
      }
    }

    console.log(`\n✅ RESTAURAÇÃO CONCLUÍDA!`)
    console.log(`📊 Total de registros restaurados: ${totalRestaurados}`)

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
    console.log(`\n📊 ESTOQUE ATUAL:`)
    console.log(`  Total de registros de embriões: ${stats.total}`)
    console.log(`  Com doses disponíveis: ${stats.com_doses}`)
    console.log(`  Total de doses disponíveis: ${stats.total_doses_disponiveis}`)

    // Agora vamos verificar se esses registros foram transferidos para sêmen
    console.log(`\n\n🔍 VERIFICANDO TRANSFERÊNCIAS PARA SÊMEN...`)
    
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
        console.log(`\n📋 ${acasalamento}:`)
        semen.rows.forEach(s => {
          console.log(`   ID ${s.id}: tipo="${s.tipo || 'NULL'}", ${s.doses_disponiveis} doses disponíveis`)
        })
      }
    }

    console.log('\n\n💡 PRÓXIMOS PASSOS:')
    console.log('Se você transferiu de "Embriões" para "Sêmen", os registros devem ter:')
    console.log('  - tipo = "semen" (ao invés de "embriao")')
    console.log('  - Isso faz com que não apareçam no relatório de embriões')
    console.log('\nVerifique o relatório de "Estoque de Sêmen" para encontrar esses registros.')

  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    console.error('Stack:', error.stack)
    throw error
  } finally {
    await pool.end()
    console.log('\n🔌 Conexão encerrada')
  }
}

// Executar
restaurarEmbrioes()
  .then(() => {
    console.log('\n✅ Script finalizado')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Erro ao executar script:', error.message)
    process.exit(1)
  })
