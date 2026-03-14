const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
});

async function testRgField() {
  const client = await pool.connect();
  
  try {
    console.log('�Ÿ�� Testando inserção de RG com 6 dígitos...');
    
    // Testar inserção direta
    try {
      const result = await client.query(`
        INSERT INTO animais (serie, rg, sexo, raca, situacao) 
        VALUES ('TEST', '123456', 'Fêmea', 'Teste', 'Ativo')
        RETURNING *
      `);
      
      console.log('�œ… Inserção direta bem-sucedida:', result.rows[0]);
      
      // Limpar o teste
      await client.query(`
        DELETE FROM animais WHERE serie = 'TEST' AND rg = '123456'
      `);
      console.log('�Ÿ�� Registro de teste removido.');
      
    } catch (insertError) {
      console.log('�Œ Erro na inserção direta:', insertError.message);
      
      // Verificar se é erro de campo específico
      if (insertError.message.includes('character(1)')) {
        console.log('�Ÿ”� Erro específico de campo character(1) detectado!');
        
        // Verificar estrutura da tabela novamente
        const structureResult = await client.query(`
          SELECT column_name, data_type, character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = 'animais' 
          ORDER BY ordinal_position
        `);
        
        console.log('�Ÿ“Š Estrutura completa da tabela animais:');
        console.table(structureResult.rows);
        
        // Verificar se há alguma constraint ou trigger
        const constraintsResult = await client.query(`
          SELECT 
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          LEFT JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.table_name = 'animais'
        `);
        
        console.log('�Ÿ”’ Constraints da tabela animais:');
        console.table(constraintsResult.rows);
      }
    }
    
    // Testar com diferentes tamanhos de RG
    const testValues = ['1', '12', '123', '1234', '12345', '123456', '1234567'];
    
    for (const rgValue of testValues) {
      try {
        await client.query(`
          INSERT INTO animais (serie, rg, sexo, raca, situacao) 
          VALUES ('TEST', $1, 'Fêmea', 'Teste', 'Ativo')
        `, [rgValue]);
        
        console.log(`�œ… RG '${rgValue}' (${rgValue.length} dígitos) - OK`);
        
        // Limpar
        await client.query(`
          DELETE FROM animais WHERE serie = 'TEST' AND rg = $1
        `, [rgValue]);
        
      } catch (error) {
        console.log(`�Œ RG '${rgValue}' (${rgValue.length} dígitos) - ERRO: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('�Œ Erro geral no teste:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testRgField()
    .then(() => {
      console.log('�ŸŽ‰ Teste do campo RG concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('�Ÿ’� Falha no teste:', error);
      process.exit(1);
    });
}

module.exports = { testRgField };
