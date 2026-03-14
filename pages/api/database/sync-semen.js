import { query } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      console.log('🔄 Iniciando sincronização das tabelas de sêmen...');
      
      // Buscar todos os dados da tabela entradas_semen
      const entradasResult = await query('SELECT * FROM entradas_semen ORDER BY id');
      
      let migrated = 0;
      let skipped = 0;
      let deleted = 0;
      
      // Primeiro, vamos marcar registros que foram excluídos pelo usuário
      // Criar uma tabela temporária para rastrear exclusões se não existir
      await query(`
        CREATE TABLE IF NOT EXISTS semen_exclusoes (
          id SERIAL PRIMARY KEY,
          nome_touro VARCHAR(100),
          raca VARCHAR(50),
          fornecedor VARCHAR(100),
          data_exclusao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(nome_touro, raca, fornecedor)
        )
      `);
      
      // Verificar quais registros da entradas_semen não existem mais no estoque_semen
      // mas não estão marcados como excluídos
      for (const entrada of entradasResult.rows) {
        const existsResult = await query(`
          SELECT id FROM estoque_semen 
          WHERE nome_touro = $1 AND raca = $2 AND fornecedor = $3
        `, [entrada.touro_nome, entrada.raca, entrada.fornecedor]);
        
        if (existsResult.rows.length > 0) {
          skipped++;
          continue;
        }
        
        // Verificar se foi excluído pelo usuário
        const deletedResult = await query(`
          SELECT id FROM semen_exclusoes 
          WHERE nome_touro = $1 AND raca = $2 AND fornecedor = $3
        `, [entrada.touro_nome, entrada.raca, entrada.fornecedor]);
        
        if (deletedResult.rows.length > 0) {
          skipped++;
          continue;
        }
        
        // Inserir na tabela estoque_semen
        await query(`
          INSERT INTO estoque_semen (
            nome_touro, rg_touro, raca, localizacao, rack_touro, botijao, caneca,
            tipo_operacao, fornecedor, valor_compra, data_compra,
            quantidade_doses, doses_disponiveis, doses_usadas, status, observacoes
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, 'disponivel', $14
          )
        `, [
          entrada.touro_nome,
          entrada.rg_touro,
          entrada.raca,
          `Rack: ${entrada.cod_rack}`,
          entrada.cod_rack,
          entrada.botijao,
          entrada.caneca,
          'entrada',
          entrada.fornecedor,
          entrada.valor,
          entrada.data_entrada,
          entrada.doses,
          entrada.doses,
          entrada.observacoes
        ]);
        
        migrated++;
      }
      
      // Contar total de registros
      const totalResult = await query('SELECT COUNT(*) as count FROM estoque_semen');
      
      res.status(200).json({
        success: true,
        message: 'Sincronização concluída com sucesso',
        migrated,
        skipped,
        deleted,
        totalRecords: parseInt(totalResult.rows[0].count)
      });
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao sincronizar tabelas de sêmen', 
        error: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}