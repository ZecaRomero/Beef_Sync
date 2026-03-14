const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'beef_sync',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function initLotesDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando criação da tabela de lotes...');

    // Criar tabela de lotes
    await client.query(`
      CREATE TABLE IF NOT EXISTS lotes_operacoes (
        id SERIAL PRIMARY KEY,
        numero_lote VARCHAR(20) UNIQUE NOT NULL,
        tipo_operacao VARCHAR(100) NOT NULL,
        descricao TEXT NOT NULL,
        detalhes JSONB,
        usuario VARCHAR(100),
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        quantidade_registros INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'concluido',
        modulo VARCHAR(50) NOT NULL,
        ip_origem VARCHAR(45),
        user_agent TEXT
      )
    `);

    // Criar índices para melhor performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lotes_numero ON lotes_operacoes(numero_lote);
      CREATE INDEX IF NOT EXISTS idx_lotes_data ON lotes_operacoes(data_criacao);
      CREATE INDEX IF NOT EXISTS idx_lotes_modulo ON lotes_operacoes(modulo);
      CREATE INDEX IF NOT EXISTS idx_lotes_tipo ON lotes_operacoes(tipo_operacao);
    `);

    // Criar sequência para numeração automática dos lotes
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS seq_lote_numero START 1;
    `);

    // Função para gerar próximo número de lote
    await client.query(`
      CREATE OR REPLACE FUNCTION gerar_proximo_lote()
      RETURNS VARCHAR(20) AS $$
      DECLARE
        proximo_numero INTEGER;
        numero_formatado VARCHAR(20);
      BEGIN
        SELECT nextval('seq_lote_numero') INTO proximo_numero;
        numero_formatado := 'LOTE' || LPAD(proximo_numero::TEXT, 6, '0');
        RETURN numero_formatado;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Tabela de lotes criada com sucesso!');
    console.log('✅ Índices criados com sucesso!');
    console.log('✅ Função de geração de lotes criada!');

    // Inserir alguns exemplos para teste
    const exemploLotes = [
      {
        tipo: 'CADASTRO_ANIMAIS',
        descricao: 'Cadastro inicial de animais do sistema',
        detalhes: { quantidade: 50, origem: 'importacao_inicial' },
        modulo: 'ANIMAIS'
      },
      {
        tipo: 'ENTRADA_NF',
        descricao: 'Entrada de Nota Fiscal NF-001234',
        detalhes: { numero_nf: 'NF-001234', valor: 15000.00 },
        modulo: 'CONTABILIDADE'
      }
    ];

    for (const exemplo of exemploLotes) {
      await client.query(`
        INSERT INTO lotes_operacoes 
        (numero_lote, tipo_operacao, descricao, detalhes, modulo, usuario)
        VALUES (gerar_proximo_lote(), $1, $2, $3, $4, 'sistema')
      `, [exemplo.tipo, exemplo.descricao, JSON.stringify(exemplo.detalhes), exemplo.modulo]);
    }

    console.log('✅ Exemplos de lotes inseridos!');

  } catch (error) {
    console.error('❌ Erro ao criar tabela de lotes:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  initLotesDatabase()
    .then(() => {
      console.log('🎉 Inicialização da base de lotes concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro na inicialização:', error);
      process.exit(1);
    });
}

module.exports = { initLotesDatabase };