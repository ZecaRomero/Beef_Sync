const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createSemenTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Criando estrutura de tabelas para sêmen...');
    
    // 1. Criar tabela de entradas de sêmen
    await client.query(`
      CREATE TABLE IF NOT EXISTS entradas_semen (
        id SERIAL PRIMARY KEY,
        nome_touro VARCHAR(255) NOT NULL,
        rg_touro VARCHAR(100),
        raca VARCHAR(100),
        localizacao VARCHAR(255),
        rack_touro VARCHAR(50),
        botijao VARCHAR(50),
        caneca VARCHAR(50),
        fornecedor VARCHAR(255),
        numero_nf VARCHAR(100),
        valor_compra DECIMAL(10,2) DEFAULT 0,
        data_compra DATE DEFAULT CURRENT_DATE,
        quantidade_doses INTEGER NOT NULL DEFAULT 0,
        doses_disponiveis INTEGER NOT NULL DEFAULT 0,
        doses_usadas INTEGER DEFAULT 0,
        certificado VARCHAR(255),
        data_validade DATE,
        origem VARCHAR(255),
        linhagem VARCHAR(255),
        observacoes TEXT,
        status VARCHAR(20) DEFAULT 'disponivel',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2. Criar tabela de saídas de sêmen
    await client.query(`
      CREATE TABLE IF NOT EXISTS saidas_semen (
        id SERIAL PRIMARY KEY,
        entrada_id INTEGER NOT NULL REFERENCES entradas_semen(id),
        destino VARCHAR(255) NOT NULL,
        quantidade_doses INTEGER NOT NULL,
        data_saida DATE DEFAULT CURRENT_DATE,
        observacoes TEXT,
        responsavel VARCHAR(255),
        numero_nf VARCHAR(100),
        valor_unitario DECIMAL(10,2),
        valor_total DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Dados do touro (copiados da entrada para histórico)
        nome_touro VARCHAR(255),
        rg_touro VARCHAR(100),
        raca VARCHAR(100),
        certificado VARCHAR(255)
      )
    `);
    
    // 3. Criar índices para performance (um por vez para evitar erros)
    try {
      await client.query(`CREATE INDEX IF NOT EXISTS idx_entradas_semen_nome_touro ON entradas_semen(nome_touro)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_entradas_semen_status ON entradas_semen(status)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_entradas_semen_data_compra ON entradas_semen(data_compra)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_saidas_semen_entrada_id ON saidas_semen(entrada_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_saidas_semen_data_saida ON saidas_semen(data_saida)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_saidas_semen_destino ON saidas_semen(destino)`);
    } catch (indexError) {
      console.log('⚠️  Alguns índices já existem, continuando...');
    }
    
    // 4. Migrar dados existentes da tabela estoque_semen
    console.log('📦 Migrando dados existentes...');
    
    // Migrar entradas
    const existingEntradas = await client.query(`
      SELECT * FROM estoque_semen 
      WHERE tipo_operacao = 'entrada' OR tipo_operacao IS NULL
    `);
    
    for (const entrada of existingEntradas.rows) {
      await client.query(`
        INSERT INTO entradas_semen (
          nome_touro, rg_touro, raca, localizacao, rack_touro, botijao, caneca,
          fornecedor, numero_nf, valor_compra, data_compra, quantidade_doses,
          doses_disponiveis, doses_usadas, certificado, data_validade, origem,
          linhagem, observacoes, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT DO NOTHING
      `, [
        entrada.nome_touro || entrada.serie,
        entrada.rg_touro || entrada.rg,
        entrada.raca,
        entrada.localizacao,
        entrada.rack_touro,
        entrada.botijao,
        entrada.caneca,
        entrada.fornecedor,
        entrada.numero_nf,
        entrada.valor_compra || entrada.preco_por_dose,
        entrada.data_compra || entrada.data_chegada,
        entrada.quantidade_doses,
        entrada.doses_disponiveis || entrada.quantidade_doses,
        entrada.doses_usadas || 0,
        entrada.certificado,
        entrada.data_validade || entrada.validade,
        entrada.origem,
        entrada.linhagem,
        entrada.observacoes,
        entrada.status || 'disponivel',
        entrada.created_at || new Date()
      ]);
    }
    
    // Migrar saídas
    const existingSaidas = await client.query(`
      SELECT * FROM estoque_semen 
      WHERE tipo_operacao = 'saida'
    `);
    
    for (const saida of existingSaidas.rows) {
      // Encontrar a entrada correspondente
      const entradaRef = await client.query(`
        SELECT id FROM entradas_semen 
        WHERE nome_touro = $1 AND rg_touro = $2
        LIMIT 1
      `, [saida.nome_touro, saida.rg_touro]);
      
      if (entradaRef.rows.length > 0) {
        await client.query(`
          INSERT INTO saidas_semen (
            entrada_id, destino, quantidade_doses, data_saida, observacoes,
            nome_touro, rg_touro, raca, certificado, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING
        `, [
          entradaRef.rows[0].id,
          saida.destino || 'Não informado',
          saida.quantidade_doses,
          saida.data_operacao || saida.created_at,
          saida.observacoes,
          saida.nome_touro,
          saida.rg_touro,
          saida.raca,
          saida.certificado,
          saida.created_at || new Date()
        ]);
      }
    }
    
    // 5. Criar triggers para atualizar doses disponíveis automaticamente
    await client.query(`
      CREATE OR REPLACE FUNCTION atualizar_doses_disponiveis()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Atualizar doses disponíveis na entrada
        UPDATE entradas_semen 
        SET 
          doses_usadas = COALESCE(doses_usadas, 0) + NEW.quantidade_doses,
          doses_disponiveis = quantidade_doses - (COALESCE(doses_usadas, 0) + NEW.quantidade_doses),
          status = CASE 
            WHEN quantidade_doses - (COALESCE(doses_usadas, 0) + NEW.quantidade_doses) <= 0 
            THEN 'esgotado' 
            ELSE 'disponivel' 
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.entrada_id;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_atualizar_doses ON saidas_semen;
      CREATE TRIGGER trigger_atualizar_doses
        AFTER INSERT ON saidas_semen
        FOR EACH ROW
        EXECUTE FUNCTION atualizar_doses_disponiveis();
    `);
    
    // 6. Criar view para facilitar consultas
    await client.query(`
      CREATE OR REPLACE VIEW view_estoque_semen AS
      SELECT 
        e.id,
        e.nome_touro,
        e.rg_touro,
        e.raca,
        e.localizacao,
        e.rack_touro,
        e.botijao,
        e.caneca,
        e.fornecedor,
        e.numero_nf,
        e.valor_compra,
        e.data_compra,
        e.quantidade_doses,
        e.doses_disponiveis,
        e.doses_usadas,
        e.certificado,
        e.data_validade,
        e.origem,
        e.linhagem,
        e.observacoes,
        e.status,
        e.created_at,
        e.updated_at,
        COALESCE(s.total_saidas, 0) as total_saidas,
        COALESCE(s.ultima_saida, NULL) as ultima_saida
      FROM entradas_semen e
      LEFT JOIN (
        SELECT 
          entrada_id,
          COUNT(*) as total_saidas,
          MAX(data_saida) as ultima_saida
        FROM saidas_semen 
        GROUP BY entrada_id
      ) s ON e.id = s.entrada_id
      ORDER BY e.created_at DESC;
    `);
    
    console.log('✅ Tabelas de sêmen criadas com sucesso!');
    console.log('📊 Estrutura criada:');
    console.log('   - entradas_semen: Para registrar entradas de sêmen');
    console.log('   - saidas_semen: Para registrar saídas de sêmen');
    console.log('   - view_estoque_semen: View consolidada para consultas');
    console.log('   - Triggers automáticos para atualizar estoque');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createSemenTables()
    .then(() => {
      console.log('🎉 Migração concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro na migração:', error);
      process.exit(1);
    });
}

module.exports = { createSemenTables };