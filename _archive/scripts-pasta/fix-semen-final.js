const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixSemenFinal() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Corrigindo estrutura final das tabelas de sêmen...');
    
    // 1. Remover restrição NOT NULL da coluna touro_nome
    await client.query('ALTER TABLE entradas_semen ALTER COLUMN touro_nome DROP NOT NULL');
    
    // 2. Atualizar coluna touro_nome com dados de nome_touro
    await client.query(`
      UPDATE entradas_semen 
      SET touro_nome = nome_touro 
      WHERE nome_touro IS NOT NULL AND touro_nome IS NULL
    `);
    
    // 3. Migrar dados novamente
    console.log('📦 Migrando dados...');
    
    // Limpar e migrar entradas
    await client.query('DELETE FROM entradas_semen');
    
    const entradas = await client.query(`
      SELECT * FROM estoque_semen 
      WHERE tipo_operacao = 'entrada' OR tipo_operacao IS NULL
    `);
    
    console.log(`📥 Migrando ${entradas.rows.length} entradas...`);
    
    for (const entrada of entradas.rows) {
      await client.query(`
        INSERT INTO entradas_semen (
          touro_nome, nome_touro, rg_touro, raca, localizacao, rack_touro, 
          botijao, caneca, numero_nf, valor_compra, data_compra, quantidade_doses, 
          doses_disponiveis, doses_usadas, certificado, data_validade, origem, 
          linhagem, observacoes, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      `, [
        entrada.nome_touro || 'Sem nome',  // touro_nome
        entrada.nome_touro,               // nome_touro
        entrada.rg_touro,
        entrada.raca,
        entrada.localizacao,
        entrada.rack_touro,
        entrada.botijao,
        entrada.caneca,
        entrada.numero_nf,
        entrada.valor_compra,
        entrada.data_compra,
        entrada.quantidade_doses,
        entrada.doses_disponiveis,
        entrada.doses_usadas || 0,
        entrada.certificado,
        entrada.data_validade,
        entrada.origem,
        entrada.linhagem,
        entrada.observacoes,
        entrada.status || 'disponivel',
        entrada.created_at || new Date()
      ]);
    }
    
    // 4. Migrar saídas
    const saidas = await client.query(`
      SELECT * FROM estoque_semen 
      WHERE tipo_operacao = 'saida'
    `);
    
    console.log(`📤 Migrando ${saidas.rows.length} saídas...`);
    
    for (const saida of saidas.rows) {
      // Encontrar entrada correspondente
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
    
    console.log('✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixSemenFinal();