const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
});

async function createNitrogenioTable() {
  const client = await pool.connect();
  
  try {
    console.log('�Ÿš€ Criando tabela de abastecimento de nitrogênio...');
    
    // Criar tabela de abastecimento de nitrogênio
    await client.query(`
      CREATE TABLE IF NOT EXISTS abastecimento_nitrogenio (
        id SERIAL PRIMARY KEY,
        data_abastecimento DATE NOT NULL,
        quantidade_litros DECIMAL(8,2) NOT NULL,
        motorista VARCHAR(100) NOT NULL,
        observacoes TEXT,
        proximo_abastecimento DATE GENERATED ALWAYS AS (data_abastecimento + INTERVAL '1 month') STORED,
        notificacao_enviada BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Criar índices para otimização
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_nitrogenio_data_abastecimento 
      ON abastecimento_nitrogenio(data_abastecimento)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_nitrogenio_proximo_abastecimento 
      ON abastecimento_nitrogenio(proximo_abastecimento)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_nitrogenio_notificacao 
      ON abastecimento_nitrogenio(notificacao_enviada, proximo_abastecimento)
    `);
    
    // Criar trigger para atualizar updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_nitrogenio_updated_at ON abastecimento_nitrogenio;
      CREATE TRIGGER update_nitrogenio_updated_at
        BEFORE UPDATE ON abastecimento_nitrogenio
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('�œ… Tabela de abastecimento de nitrogênio criada com sucesso!');
    console.log('�Ÿ“Š Estrutura criada:');
    console.log('   - Tabela: abastecimento_nitrogenio');
    console.log('   - Campos: id, data_abastecimento, quantidade_litros, motorista, observacoes');
    console.log('   - Campo calculado: proximo_abastecimento (data + 1 mês)');
    console.log('   - Controle de notificação: notificacao_enviada');
    console.log('   - 3 índices para otimização');
    console.log('   - Trigger para updated_at');
    
  } catch (error) {
    console.error('�Œ Erro ao criar tabela de nitrogênio:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function testTable() {
  const client = await pool.connect();
  
  try {
    console.log('\n�Ÿ”� Testando tabela criada...');
    
    // Verificar se a tabela existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'abastecimento_nitrogenio'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('�œ… Tabela abastecimento_nitrogenio existe');
      
      // Verificar estrutura da tabela
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'abastecimento_nitrogenio'
        ORDER BY ordinal_position;
      `);
      
      console.log('�Ÿ“‹ Colunas da tabela:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
      
      // Verificar índices
      const indexes = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'abastecimento_nitrogenio';
      `);
      
      console.log('�Ÿ”� Índices criados:');
      indexes.rows.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
      
    } else {
      console.log('�Œ Tabela não foi criada');
    }
    
  } catch (error) {
    console.error('�Œ Erro ao testar tabela:', error.message);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await createNitrogenioTable();
    await testTable();
    console.log('\n�ŸŽ‰ Script executado com sucesso!');
  } catch (error) {
    console.error('�Œ Erro geral:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { createNitrogenioTable, testTable };