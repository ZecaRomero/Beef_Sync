const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function runMigration() {
  try {
    console.log('Adding iqg and pt_iqg columns to animais table...');
    
    // Adicionar as colunas iqg e pt_iqg
    await pool.query(`
      ALTER TABLE animais 
      ADD COLUMN IF NOT EXISTS iqg NUMERIC,
      ADD COLUMN IF NOT EXISTS pt_iqg NUMERIC;
    `);
    
    console.log('Columns added successfully.');
    
    // Copiar dados de genetica_2 para iqg e decile_2 para pt_iqg (se existirem)
    await pool.query(`
      UPDATE animais 
      SET iqg = genetica_2 
      WHERE genetica_2 IS NOT NULL AND iqg IS NULL;
    `);
    
    await pool.query(`
      UPDATE animais 
      SET pt_iqg = CAST(decile_2 AS NUMERIC) 
      WHERE decile_2 IS NOT NULL AND decile_2 ~ '^[0-9.]+$' AND pt_iqg IS NULL;
    `);
    
    console.log('Data migrated successfully.');
    
    // Verificar
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais' AND column_name IN ('iqg', 'pt_iqg', 'genetica_2', 'decile_2');
    `);
    console.log('Verification:', res.rows);
    
    // Mostrar alguns exemplos de dados
    const data = await pool.query(`
      SELECT serie, rg, abczg, deca, iqg, pt_iqg, genetica_2, decile_2
      FROM animais 
      WHERE (iqg IS NOT NULL OR genetica_2 IS NOT NULL)
      LIMIT 5;
    `);
    console.log('\nSample data:', data.rows);
    
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
