const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
})

async function salvarDG() {
  try {
    console.log('🔍 Buscando animal 8251...\n')

    // Buscar animal
    const animal = await pool.query(`
      SELECT id, rg, serie FROM animais 
      WHERE rg = '8251'
      LIMIT 1
    `)

    if (animal.rows.length === 0) {
      console.log('❌ Animal 8251 não encontrado!')
      return
    }

    const a = animal.rows[0]
    console.log(`✅ Animal encontrado: ID ${a.id}, RG ${a.rg}, Série ${a.serie}\n`)

    // Salvar DG
    console.log('💾 Salvando DG...')
    const resultado = await pool.query(`
      UPDATE animais 
      SET 
        data_dg = $1,
        veterinario_dg = $2,
        resultado_dg = $3,
        observacoes_dg = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, rg, data_dg, veterinario_dg, resultado_dg
    `, ['2026-02-15', 'MARINA', 'Vazia', '', a.id])

    if (resultado.rows.length > 0) {
      const r = resultado.rows[0]
      console.log('\n✅ DG salvo com sucesso!')
      console.log('─────────────────────────────────────')
      console.log(`ID: ${r.id}`)
      console.log(`RG: ${r.rg}`)
      console.log(`Data DG: ${new Date(r.data_dg).toLocaleDateString('pt-BR')}`)
      console.log(`Veterinário: ${r.veterinario_dg}`)
      console.log(`Resultado: ${r.resultado_dg}`)
      console.log('─────────────────────────────────────\n')
    }

    // Verificar se salvou
    const verificacao = await pool.query(`
      SELECT data_dg, veterinario_dg, resultado_dg 
      FROM animais 
      WHERE id = $1
    `, [a.id])

    if (verificacao.rows.length > 0) {
      const v = verificacao.rows[0]
      console.log('✅ Verificação: DG está salvo no banco!')
      console.log(`   Data: ${new Date(v.data_dg).toLocaleDateString('pt-BR')}`)
      console.log(`   Veterinário: ${v.veterinario_dg}`)
      console.log(`   Resultado: ${v.resultado_dg}`)
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error(error.stack)
  } finally {
    await pool.end()
  }
}

salvarDG()
