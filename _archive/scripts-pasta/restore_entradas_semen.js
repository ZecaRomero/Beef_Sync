const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: parseInt(process.env.DB_PORT) || 5432,
});

async function restoreEntradasSemen() {
  console.log('Starting restore of entradas_semen from entradas_semen_backup...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check backup data
    const backupRes = await client.query('SELECT * FROM entradas_semen_backup');
    const backupRows = backupRes.rows;
    console.log(`Found ${backupRows.length} records in backup.`);

    if (backupRows.length === 0) {
      console.log('No data to restore.');
      await client.query('ROLLBACK');
      return;
    }

    // Insert into entradas_semen
    for (const row of backupRows) {
      // Check if already exists to avoid duplicates
      const exists = await client.query('SELECT id FROM entradas_semen WHERE id = $1', [row.id]);
      if (exists.rows.length > 0) {
        console.log(`Skipping existing record ID ${row.id}`);
        continue;
      }

      await client.query(`
        INSERT INTO entradas_semen (
          id,
          touro_nome,
          raca,
          cod_rack,
          rg_touro,
          doses,
          valor,
          data_entrada,
          fornecedor,
          botijao,
          caneca,
          observacoes,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        row.id,
        row.touro_nome,
        row.raca,
        row.cod_rack,
        row.rg_touro,
        row.doses,
        row.valor,
        row.data_entrada,
        row.fornecedor,
        row.botijao,
        row.caneca,
        row.observacoes,
        row.created_at || new Date(),
        row.updated_at || new Date()
      ]);
    }

    await client.query('COMMIT');
    console.log(`Successfully restored records to entradas_semen.`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error restoring data:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

restoreEntradasSemen();