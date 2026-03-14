const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function criarTabelaNitrogenio() {
  console.log('🔧 Criando tabela de Abastecimento de Nitrogênio...\n');

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS abastecimento_nitrogenio (
        id SERIAL PRIMARY KEY,
        data_abastecimento DATE NOT NULL,
        quantidade_litros DECIMAL(10,2) NOT NULL,
        valor_unitario DECIMAL(10,2),
        valor_total DECIMAL(10,2),
        motorista VARCHAR(100) NOT NULL,
        observacoes TEXT,
        proximo_abastecimento DATE,
        notificacao_enviada BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tabela abastecimento_nitrogenio criada com sucesso!');

    // Criar índices
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_abastecimento_nitrogenio_data 
      ON abastecimento_nitrogenio(data_abastecimento);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_abastecimento_nitrogenio_motorista 
      ON abastecimento_nitrogenio(motorista);
    `);

    console.log('✅ Índices criados com sucesso!');

    // Verificar se foi criada
    const result = await pool.query(`
      SELECT COUNT(*) FROM abastecimento_nitrogenio
    `);

    console.log(`\n📊 Tabela verificada: ${result.rows[0].count} registros`);
    console.log('\n✅ Processo concluído!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

criarTabelaNitrogenio();
