/**
 * Script para adicionar colunas na tabela inseminacoes (serie_touro, semen_id)
 * Execute: node scripts/add-serie-touro-column.js
 */

const { query } = require('../lib/database')

async function addColumns() {
  try {
    for (const col of [{ name: 'serie_touro', type: 'VARCHAR(20)' }, { name: 'semen_id', type: 'INTEGER' }]) {
      const exists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'inseminacoes' AND column_name = $1
        )
      `, [col.name])
      if (exists.rows[0].exists) {
        console.log(`�œ… Coluna ${col.name} já existe`)
      } else {
        await query(`ALTER TABLE inseminacoes ADD COLUMN ${col.name} ${col.type}`)
        console.log(`�œ… Coluna ${col.name} adicionada com sucesso`)
      }
    }
    process.exit(0)
  } catch (err) {
    console.error('�Œ Erro:', err.message)
    process.exit(1)
  }
}

addColumns()
