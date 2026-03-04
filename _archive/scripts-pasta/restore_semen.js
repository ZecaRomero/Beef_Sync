const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: parseInt(process.env.DB_PORT) || 5432,
});

async function restoreSemen() {
  console.log('Starting restore of estoque_semen from entradas_semen_backup...');
  
  const client = await pool.connect();
  
  try {
    // Check backup table
    const backupRes = await client.query('SELECT * FROM entradas_semen_backup');
    console.log(`Found ${backupRes.rows.length} records in backup.`);
    
    if (backupRes.rows.length === 0) {
      console.log('No data in backup to restore.');
      return;
    }

    let restoredCount = 0;
    
    for (const row of backupRes.rows) {
      // Check if already exists in estoque_semen (to avoid duplicates if run multiple times)
      // Assuming 'nome_touro' and 'raca' and 'data_compra' might be unique enough?
      // Or just check if count is 0 as we saw earlier.
      
      // Map columns from backup to main table
      // Backup has: touro_nome, raca, cod_rack, rg_touro, doses, valor, data_entrada, fornecedor, botijao, caneca, observacoes
      // Main table has: nome_touro, rg_touro, raca, localizacao, rack_touro, botijao, caneca, tipo_operacao, fornecedor, numero_nf, valor_compra, data_compra, quantidade_doses, doses_disponiveis, doses_usadas, status, created_at
      
      const insertQuery = `
        INSERT INTO estoque_semen (
          nome_touro, 
          rg_touro, 
          raca, 
          rack_touro, 
          botijao, 
          caneca, 
          fornecedor, 
          valor_compra, 
          data_compra, 
          quantidade_doses, 
          doses_disponiveis, 
          doses_usadas,
          status, 
          observacoes,
          tipo_operacao,
          created_at,
          localizacao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id
      `;
      
      const values = [
        row.touro_nome, // nome_touro
        row.rg_touro, // rg_touro
        row.raca, // raca
        row.cod_rack, // rack_touro
        row.botijao, // botijao
        row.caneca, // caneca
        row.fornecedor, // fornecedor
        row.valor, // valor_compra
        row.data_entrada, // data_compra
        row.doses, // quantidade_doses
        row.doses, // doses_disponiveis (assuming all available)
        0, // doses_usadas
        'disponivel', // status
        row.observacoes, // observacoes
        'entrada', // tipo_operacao
        row.created_at || new Date(), // created_at
        `Botijão ${row.botijao || '?'} / Caneca ${row.caneca || '?'}` // localizacao
      ];
      
      await client.query(insertQuery, values);
      restoredCount++;
    }
    
    console.log(`Successfully restored ${restoredCount} records to estoque_semen.`);
    
  } catch (err) {
    console.error('Error restoring data:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

restoreSemen();
