const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
});

async function fixRgField() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Iniciando correção do campo RG...');
    
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
      console.log('❌ Tabela animais não encontrada!');
      return;
    }
    
    const currentField = checkResult.rows[0];
    console.log('📊 Campo RG atual:', currentField);
    
    // Se já está correto, não precisa alterar
    if (currentField.data_type === 'character varying' && currentField.character_maximum_length >= 20) {
      console.log('✅ Campo RG já está correto!');
      return;
    }
    
    // Alterar o campo RG
    console.log('🔨 Alterando campo RG para VARCHAR(20)...');
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
    console.log('✅ Campo RG atualizado:', updatedField);
    
    // Testar com um valor de 6 dígitos
    console.log('🧪 Testando com valor de 6 dígitos...');
    try {
      await client.query(`
        INSERT INTO animais (serie, rg, sexo, raca, situacao) 
        VALUES ('TEST', '123456', 'Fêmea', 'Teste', 'Ativo')
        ON CONFLICT (serie, rg) DO NOTHING
      `);
      console.log('✅ Teste bem-sucedido! Campo RG aceita 6 dígitos.');
      
      // Limpar o teste
      await client.query(`
        DELETE FROM animais WHERE serie = 'TEST' AND rg = '123456'
      `);
      console.log('🧹 Registro de teste removido.');
      
    } catch (testError) {
      console.log('❌ Erro no teste:', testError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir campo RG:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixRgField()
    .then(() => {
      console.log('🎉 Correção do campo RG concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na correção:', error);
      process.exit(1);
    });
}

module.exports = { fixRgField };
