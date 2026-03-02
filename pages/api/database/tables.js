import { query } from '../../../lib/database';
import logger from '../../../utils/logger';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Listar todas as tabelas
      const tablesResult = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      // Para cada tabela, obter informações das colunas
      const tablesInfo = {};
      
      for (const table of tablesResult.rows) {
        const tableName = table.table_name;
        
        const columnsResult = await query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        tablesInfo[tableName] = {
          columns: columnsResult.rows,
          rowCount: 0
        };
        
        // Contar registros na tabela (validar nome para evitar SQL injection)
        try {
          if (/^[a-zA-Z0-9_]+$/.test(tableName)) {
            const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
            tablesInfo[tableName].rowCount = parseInt(countResult.rows[0].count, 10);
          }
        } catch (error) {
          // Ignorar erros de contagem, manter rowCount 0
        }
      }

      res.status(200).json({
        tables: tablesResult.rows.map(t => t.table_name),
        tablesInfo
      });
    } catch (error) {
      logger.error('Erro ao listar tabelas', { error: error?.message });
      res.status(500).json({ 
        message: 'Erro ao listar tabelas do banco de dados', 
        error: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}