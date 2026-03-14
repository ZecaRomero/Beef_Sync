import { Pool } from 'pg';
import logger from '../../utils/logger';

// Carregar variáveis de ambiente
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Método não permitido'
    });
  }

  const client = await pool.connect();
  
  try {
    logger.info('🔧 Iniciando correção do campo RG via API...');
    
    // Verificar estrutura atual
    const checkResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
      AND column_name = 'rg'
    `);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Tabela animais não encontrada'
      });
    }
    
    const currentField = checkResult.rows[0];
    logger.info('📊 Campo RG atual:', currentField);
    
    // Se já está correto, não precisa alterar
    if (currentField.data_type === 'character varying' && currentField.character_maximum_length >= 20) {
      return res.status(200).json({
        status: 'success',
        message: 'Campo RG já está correto',
        currentField: currentField
      });
    }
    
    // Alterar o campo RG
    logger.info('🔨 Alterando campo RG para VARCHAR(20)...');
    await client.query(`
      ALTER TABLE animais ALTER COLUMN rg TYPE VARCHAR(20)
    `);
    
    // Verificar se a alteração foi aplicada
    const verifyResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
      AND column_name = 'rg'
    `);
    
    const updatedField = verifyResult.rows[0];
    logger.info('✅ Campo RG atualizado:', updatedField);
    
    // Testar com um valor de 6 dígitos
    logger.info('🧪 Testando com valor de 6 dígitos...');
    try {
      await client.query(`
        INSERT INTO animais (serie, rg, sexo, raca, situacao) 
        VALUES ('TEST', '123456', 'Fêmea', 'Teste', 'Ativo')
        ON CONFLICT (serie, rg) DO NOTHING
      `);
      logger.info('✅ Teste bem-sucedido! Campo RG aceita 6 dígitos.');
      
      // Limpar o teste
      await client.query(`
        DELETE FROM animais WHERE serie = 'TEST' AND rg = '123456'
      `);
      logger.info('🧹 Registro de teste removido.');
      
    } catch (testError) {
      logger.error('❌ Erro no teste:', testError.message);
      return res.status(500).json({
        status: 'error',
        message: 'Erro no teste do campo RG',
        error: testError.message
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Campo RG corrigido com sucesso!',
      before: currentField,
      after: updatedField,
      testResult: 'Campo aceita valores de até 6 dígitos'
    });
    
  } catch (error) {
    logger.error('❌ Erro ao corrigir campo RG:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao corrigir campo RG',
      error: error.message
    });
  } finally {
    client.release();
  }
}
