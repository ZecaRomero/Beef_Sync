const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
});

async function checkAllRgFields() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando todos os campos RG no banco de dados...');
    
    // Buscar todos os campos que contenham 'rg' no nome
    const result = await client.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM information_schema.columns 
      WHERE column_name ILIKE '%rg%' 
      ORDER BY table_name, column_name
    `);
    
    console.log('📊 Campos encontrados:');
    console.table(result.rows);
    
    // Verificar especificamente campos que podem estar causando o problema
    const problematicFields = result.rows.filter(field => 
      field.character_maximum_length === 1 || 
      field.data_type === 'character' ||
      field.data_type === 'char'
    );
    
    if (problematicFields.length > 0) {
      console.log('⚠️ Campos problemáticos encontrados:');
      console.table(problematicFields);
      
      // Corrigir campos problemáticos
      for (const field of problematicFields) {
        console.log(`🔧 Corrigindo campo ${field.table_name}.${field.column_name}...`);
        
        try {
          await client.query(`
            ALTER TABLE ${field.table_name} 
            ALTER COLUMN ${field.column_name} TYPE VARCHAR(20)
          `);
          
          console.log(`✅ Campo ${field.table_name}.${field.column_name} corrigido!`);
        } catch (error) {
          console.log(`❌ Erro ao corrigir ${field.table_name}.${field.column_name}:`, error.message);
        }
      }
    } else {
      console.log('✅ Nenhum campo problemático encontrado!');
    }
    
    // Verificar novamente após correções
    const finalCheck = await client.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM information_schema.columns 
      WHERE column_name ILIKE '%rg%' 
      ORDER BY table_name, column_name
    `);
    
    console.log('📊 Campos após correções:');
    console.table(finalCheck.rows);
    
  } catch (error) {
    console.error('❌ Erro ao verificar campos RG:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkAllRgFields()
    .then(() => {
      console.log('🎉 Verificação dos campos RG concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na verificação:', error);
      process.exit(1);
    });
}

module.exports = { checkAllRgFields };
