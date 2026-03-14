/**
 * Remove a tabela legada transferencias_embriao (singular) que causa confusão.
 * 
 * O sistema usa APENAS transferencias_embrioes (plural).
 * A tabela transferencias_embriao foi criada por engano/legado e não é utilizada.
 * 
 * Uso: node scripts/remover-tabela-te-duplicada.js [--execute]
 * --dry-run (padrão): apenas verifica e mostra o que seria feito
 * --execute: remove a tabela legada
 */

require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
})

async function main() {
  const execute = process.argv.includes('--execute')
  console.log('🔍 Beef-Sync - Remoção da tabela duplicada transferencias_embriao')
  console.log(execute ? '   Modo: EXECUÇÃO\n' : '   Modo: DRY-RUN (use --execute para aplicar)\n')

  const client = await pool.connect()
  try {
    // Verificar se a tabela legada existe
    const existe = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transferencias_embriao'
      )
    `)

    if (!existe.rows[0].exists) {
      console.log('✅ A tabela transferencias_embriao não existe. Nada a fazer.')
      await pool.end()
      return
    }

    // Verificar quantos registros tem na tabela legada
    const countLegada = await client.query('SELECT COUNT(*) as total FROM transferencias_embriao')
    const totalLegada = parseInt(countLegada.rows[0].total)

    // Verificar a tabela correta
    const countCorreta = await client.query('SELECT COUNT(*) as total FROM transferencias_embrioes')
    const totalCorreta = parseInt(countCorreta.rows[0].total)

    console.log('📊 Situação atual:')
    console.log(`   - transferencias_embrioes (correta): ${totalCorreta} registros`)
    console.log(`   - transferencias_embriao (legada):   ${totalLegada} registros`)

    if (totalLegada > 0) {
      console.log('\n⚠️  A tabela legada tem dados. Verificando se precisam ser migrados...')
      const dados = await client.query(`
        SELECT te.id, te.animal_id, te.data_te, te.data_dg, te.resultado_dg, te.veterinario, te.observacoes,
               a.nome, a.serie, a.rg
        FROM transferencias_embriao te
        LEFT JOIN animais a ON a.id = te.animal_id
        ORDER BY te.id
        LIMIT 10
      `)
      console.log('   Amostra dos primeiros registros:')
      dados.rows.forEach(r => {
        console.log(`   - ID ${r.id}: animal_id=${r.animal_id} (${r.nome || 'N/A'}) data_te=${r.data_te}`)
      })
      if (totalLegada > 10) console.log(`   ... e mais ${totalLegada - 10} registros`)

      // Migrar para transferencias_embrioes se não existir
      const jaMigrados = await client.query(`
        SELECT te.animal_id, te.data_te FROM transferencias_embriao te
        WHERE EXISTS (
          SELECT 1 FROM transferencias_embrioes te2 
          WHERE te2.receptora_id = te.animal_id AND te2.data_te = te.data_te
        )
      `)
      const pendentes = totalLegada - jaMigrados.rows.length
      if (pendentes > 0) {
        console.log(`\n   ${pendentes} registros NÃO estão na tabela correta. Migrando...`)
        if (execute) {
          const legados = await client.query('SELECT * FROM transferencias_embriao')
          let migrados = 0
          const baseNum = Date.now()
          for (let i = 0; i < legados.rows.length; i++) {
            const row = legados.rows[i]
            const numeroTE = `TE-MIGRADO-${row.id}-${baseNum}-${i}`
            await client.query(`
              INSERT INTO transferencias_embrioes (numero_te, data_te, receptora_id, data_diagnostico, resultado, observacoes, status)
              VALUES ($1, $2, $3, $4, $5, $6, 'realizada')
            `, [
              numeroTE,
              row.data_te,
              row.animal_id,
              row.data_dg,
              row.resultado_dg || 'pendente',
              [row.veterinario, row.observacoes].filter(Boolean).join(' | ') || 'Migrado de transferencias_embriao'
            ])
            migrados++
          }
          console.log(`   ✅ ${migrados} registros migrados para transferencias_embrioes`)
        }
      } else {
        console.log('\n   Todos os registros já existem na tabela correta.')
      }
    }

    if (execute) {
      await client.query('DROP TABLE IF EXISTS transferencias_embriao CASCADE')
      console.log('\n✅ Tabela transferencias_embriao removida com sucesso!')
    } else {
      console.log('\n📌 Para remover a tabela legada, execute: node scripts/remover-tabela-te-duplicada.js --execute')
    }
  } catch (err) {
    console.error('❌ Erro:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
