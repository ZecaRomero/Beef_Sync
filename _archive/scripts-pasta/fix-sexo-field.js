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
    console.log('ðÅ¸â€§ Corrigindo campo sexo...');
    
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
      console.log('âÅ’ Tabela animais nÃ£o encontrada!');
      return;
    }
    
    const currentField = checkResult.rows[0];
    console.log('ðÅ¸â€œÅ  Campo sexo atual:', currentField);
    
    // Se jÃ¡ estÃ¡ correto, nÃ£o precisa alterar
    if (currentField.data_type === 'character varying' && currentField.character_maximum_length >= 10) {
      console.log('âÅ“â€¦ Campo sexo jÃ¡ estÃ¡ correto!');
      return;
    }
    
    // Alterar o campo sexo
    console.log('ðÅ¸â€¨ Alterando campo sexo para VARCHAR(10)...');
    await client.query(`
      ALTER TABLE animais ALTER COLUMN sexo TYPE VARCHAR(10)
    `);
    
    // Remover constraint antiga se existir
    try {
      await client.query(`
        ALTER TABLE animais DROP CONSTRAINT IF EXISTS animais_sexo_check
      `);
      console.log('ðÅ¸â€”â€˜ï¸ Constraint antiga removida');
    } catch (error) {
      console.log('ââ€ž¹ï¸ Nenhuma constraint antiga encontrada');
    }
    
    // Adicionar nova constraint
    await client.query(`
      ALTER TABLE animais ADD CONSTRAINT animais_sexo_check 
      CHECK (sexo IN ('Macho', 'FÃªmea'))
    `);
    console.log('âÅ“â€¦ Nova constraint adicionada');
    
    // Verificar se a alteraÃ§Ã£o foi aplicada
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
    console.log('âÅ“â€¦ Campo sexo atualizado:', updatedField);
    
    // Testar com valores corretos
    console.log('ðÅ¸§ª Testando com valores corretos...');
    try {
      await client.query(`
        INSERT INTO animais (serie, rg, sexo, raca, situacao) 
        VALUES ('TEST', '123456', 'FÃªmea', 'Teste', 'Ativo')
        ON CONFLICT (serie, rg) DO NOTHING
      `);
      console.log('âÅ“â€¦ Teste bem-sucedido! Campo sexo aceita "FÃªmea".');
      
      // Limpar o teste
      await client.query(`
        DELETE FROM animais WHERE serie = 'TEST' AND rg = '123456'
      `);
      console.log('ðÅ¸§¹ Registro de teste removido.');
      
    } catch (testError) {
      console.log('âÅ’ Erro no teste:', testError.message);
    }
    
  } catch (error) {
    console.error('âÅ’ Erro ao corrigir campo sexo:', error);
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
      console.log('ðÅ¸Å½â€° CorreÃ§Ã£o do campo sexo concluÃ­da!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('ðÅ¸â€™¥ Falha na correÃ§Ã£o:', error);
      process.exit(1);
    });
}

module.exports = { fixSexoField };
