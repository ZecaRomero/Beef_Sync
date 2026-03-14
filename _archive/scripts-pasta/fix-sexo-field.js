const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
});

async function fixSexoField() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Corrigindo campo sexo...');
    
    // Verificar estrutura atual
    const checkResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
      AND column_name = 'sexo'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('❌ Tabela animais não encontrada!');
      return;
    }
    
    const currentField = checkResult.rows[0];
    console.log('📊 Campo sexo atual:', currentField);
    
    // Se já está correto, não precisa alterar
    if (currentField.data_type === 'character varying' && currentField.character_maximum_length >= 10) {
      console.log('✅ Campo sexo já está correto!');
      return;
    }
    
    // Alterar o campo sexo
    console.log('🔨 Alterando campo sexo para VARCHAR(10)...');
    await client.query(`
      ALTER TABLE animais ALTER COLUMN sexo TYPE VARCHAR(10)
    `);
    
    // Remover constraint antiga se existir
    try {
      await client.query(`
        ALTER TABLE animais DROP CONSTRAINT IF EXISTS animais_sexo_check
      `);
      console.log('🗑️ Constraint antiga removida');
    } catch (error) {
      console.log('ℹ️ Nenhuma constraint antiga encontrada');
    }
    
    // Adicionar nova constraint
    await client.query(`
      ALTER TABLE animais ADD CONSTRAINT animais_sexo_check 
      CHECK (sexo IN ('Macho', 'Fêmea'))
    `);
    console.log('✅ Nova constraint adicionada');
    
    // Verificar se a alteração foi aplicada
    const verifyResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
      AND column_name = 'sexo'
    `);
    
    const updatedField = verifyResult.rows[0];
    console.log('✅ Campo sexo atualizado:', updatedField);
    
    // Testar com valores corretos
    console.log('🧪 Testando com valores corretos...');
    try {
      await client.query(`
        INSERT INTO animais (serie, rg, sexo, raca, situacao) 
        VALUES ('TEST', '123456', 'Fêmea', 'Teste', 'Ativo')
        ON CONFLICT (serie, rg) DO NOTHING
      `);
      console.log('✅ Teste bem-sucedido! Campo sexo aceita "Fêmea".');
      
      // Limpar o teste
      await client.query(`
        DELETE FROM animais WHERE serie = 'TEST' AND rg = '123456'
      `);
      console.log('🧹 Registro de teste removido.');
      
    } catch (testError) {
      console.log('❌ Erro no teste:', testError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir campo sexo:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixSexoField()
    .then(() => {
      console.log('🎉 Correção do campo sexo concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na correção:', error);
      process.exit(1);
    });
}

module.exports = { fixSexoField };
