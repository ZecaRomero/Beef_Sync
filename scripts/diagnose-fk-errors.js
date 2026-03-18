require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: false,
})

async function diagnoseOrphans() {
  console.log('🔍 Iniciando diagnóstico de registros órfãos no banco de dados local...')
  let totalOrphans = 0

  try {
    const tablesToCheck = [
      'historia_ocorrencias',
      'movimentacoes_contabeis',
      'custos',
      'pesagens',
      'inseminacoes',
      'localizacoes_animais',
      'protocolos_aplicados',
      'situacoes_abcz',
      'ciclos_reprodutivos'
    ]

    for (const table of tablesToCheck) {
      console.log(`\n--- Verificando tabela: ${table} ---`)
      const queryText = `
        SELECT t.animal_id, t.id 
        FROM ${table} t
        LEFT JOIN animais a ON t.animal_id = a.id
        WHERE t.animal_id IS NOT NULL AND a.id IS NULL
        LIMIT 100;
      `
      try {
        const { rows } = await pool.query(queryText)
        if (rows.length > 0) {
          console.log(`❌ Encontrados ${rows.length} registros órfãos em \"${table}\":`)
          rows.forEach(row => {
            console.log(`  - ID do registro: ${row.id}, aponta para animal_id inexistente: ${row.animal_id}`)
          })
          totalOrphans += rows.length
        } else {
          console.log(`✅ Nenhum registro órfão encontrado em \"${table}\".`)
        }
      } catch (err) {
        if (err.message.includes('does not exist')) {
            console.log(`ℹ️ Tabela \"${table}\" não existe. Pulando.`)
        } else {
            console.error(`  - Erro ao verificar a tabela ${table}: ${err.message}`)
        }
      }
    }

    if (totalOrphans > 0) {
      console.log(`\n\n🚨 Diagnóstico concluído. Total de ${totalOrphans} registros órfãos encontrados.`)
      console.log('Esses registros precisam ser removidos antes de sincronizar com o Supabase.')
    } else {
      console.log('\n\n✅ Diagnóstico concluído. Nenhuma inconsistência de chave estrangeira encontrada.')
    }

  } catch (err) {
    console.error('❌ Erro fatal durante o diagnóstico:', err.message)
  } finally {
    await pool.end()
  }
}

diagnoseOrphans()
