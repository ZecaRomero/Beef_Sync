const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: '123456',
  port: 5432,
});

async function updateSemenTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Atualizando estrutura da tabela estoque_semen...');
    
    // Primeiro, vamos verificar se a tabela existe e sua estrutura atual
    const checkTable = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'estoque_semen' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colunas atuais:', checkTable.rows.map(r => r.column_name));
    
    // Se a tabela não tem as colunas novas, vamos recriar
    const hasNewColumns = checkTable.rows.some(r => r.column_name === 'nome_touro');
    
    if (!hasNewColumns) {
      console.log('🔄 Recriando tabela com nova estrutura...');
      
      // Fazer backup dos dados existentes
      const backupData = await client.query('SELECT * FROM estoque_semen');
      console.log(`💾 Backup: ${backupData.rows.length} registros encontrados`);
      
      // Dropar a tabela antiga
      await client.query('DROP TABLE IF EXISTS estoque_semen CASCADE');
      
      // Criar a nova tabela
      await client.query(`
        CREATE TABLE estoque_semen (
          id SERIAL PRIMARY KEY,
          nome_touro VARCHAR(100) NOT NULL,
          rg_touro VARCHAR(20),
          raca VARCHAR(50),
          localizacao VARCHAR(100) NOT NULL,
          rack_touro VARCHAR(50),
          botijao VARCHAR(50),
          caneca VARCHAR(50),
          tipo_operacao VARCHAR(20) DEFAULT 'entrada' CHECK (tipo_operacao IN ('entrada', 'saida')),
          fornecedor VARCHAR(100),
          destino VARCHAR(100),
          numero_nf VARCHAR(50),
          valor_compra DECIMAL(12,2),
          data_compra DATE NOT NULL,
          quantidade_doses INTEGER NOT NULL,
          doses_disponiveis INTEGER DEFAULT 0,
          doses_usadas INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'esgotado', 'vencido')),
          certificado VARCHAR(100),
          data_validade DATE,
          origem VARCHAR(50),
          linhagem VARCHAR(50),
          observacoes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Tabela recriada com sucesso!');
      
      // Restaurar dados do backup se existirem (adaptando para nova estrutura)
      if (backupData.rows.length > 0) {
        console.log('🔄 Restaurando dados do backup...');
        for (const row of backupData.rows) {
          await client.query(`
            INSERT INTO estoque_semen (
              nome_touro, localizacao, quantidade_doses, doses_disponiveis, 
              valor_compra, data_compra, fornecedor, observacoes, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            row.serie || 'Touro Migrado',
            'Migrado',
            row.quantidade_doses || 0,
            row.quantidade_doses || 0,
            row.preco_por_dose || 0,
            row.data_chegada || new Date().toISOString().split('T')[0],
            row.fornecedor || 'Migrado',
            row.observacoes || 'Migrado da estrutura antiga',
            row.created_at || new Date()
          ]);
        }
        console.log(`✅ ${backupData.rows.length} registros restaurados!`);
      }
    } else {
      console.log('✅ Tabela já possui a estrutura atualizada!');
    }
    
    // Verificar a estrutura final
    const finalCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'estoque_semen' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estrutura final:', finalCheck.rows.map(r => r.column_name));
    console.log('✅ Atualização concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar tabela:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateSemenTable();
