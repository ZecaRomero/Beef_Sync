const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkSaidasSemen() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando saídas de sêmen no PostgreSQL...');
    
    // 1. Verificar todos os registros na tabela estoque_semen
    const allRecords = await client.query(`
      SELECT id, nome_touro, tipo_operacao, quantidade_doses, doses_disponiveis, 
             destino, created_at, entrada_referencia
      FROM estoque_semen 
      ORDER BY created_at DESC
    `);
    
    console.log('\n📊 Todos os registros na tabela estoque_semen:');
    allRecords.rows.forEach(record => {
      console.log(`   ID: ${record.id} | Touro: ${record.nome_touro} | Tipo: ${record.tipo_operacao} | Doses: ${record.quantidade_doses} | Destino: ${record.destino || 'N/A'} | Data: ${record.created_at}`);
    });
    
    // 2. Verificar especificamente as saídas
    const saidas = await client.query(`
      SELECT * FROM estoque_semen 
      WHERE tipo_operacao = 'saida'
      ORDER BY created_at DESC
    `);
    
    console.log(`\n📤 Saídas encontradas: ${saidas.rows.length}`);
    if (saidas.rows.length > 0) {
      saidas.rows.forEach(saida => {
        console.log(`   🔸 ID: ${saida.id}`);
        console.log(`     Touro: ${saida.nome_touro}`);
        console.log(`     Destino: ${saida.destino}`);
        console.log(`     Quantidade: ${saida.quantidade_doses} doses`);
        console.log(`     Entrada Ref: ${saida.entrada_referencia}`);
        console.log(`     Data: ${saida.created_at}`);
        console.log('     ---');
      });
    } else {
      console.log('   ❌ Nenhuma saída encontrada!');
    }
    
    // 3. Verificar se existe a tabela saidas_semen
    const saidasTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'saidas_semen'
      );
    `);
    
    console.log(`\n🗂️  Tabela 'saidas_semen' existe: ${saidasTable.rows[0].exists}`);
    
    if (saidasTable.rows[0].exists) {
      const saidasSeparadas = await client.query('SELECT * FROM saidas_semen ORDER BY created_at DESC');
      console.log(`📋 Registros na tabela saidas_semen: ${saidasSeparadas.rows.length}`);
      
      if (saidasSeparadas.rows.length > 0) {
        saidasSeparadas.rows.forEach(saida => {
          console.log(`   🔸 ID: ${saida.id} | Entrada ID: ${saida.entrada_id} | Destino: ${saida.destino} | Doses: ${saida.quantidade_doses}`);
        });
      }
    }
    
    // 4. Verificar entradas disponíveis
    const entradas = await client.query(`
      SELECT id, nome_touro, quantidade_doses, doses_disponiveis, doses_usadas, status
      FROM estoque_semen 
      WHERE tipo_operacao = 'entrada'
      ORDER BY created_at DESC
    `);
    
    console.log(`\n📥 Entradas encontradas: ${entradas.rows.length}`);
    entradas.rows.forEach(entrada => {
      console.log(`   🔸 ID: ${entrada.id} | Touro: ${entrada.nome_touro} | Total: ${entrada.quantidade_doses} | Disponível: ${entrada.doses_disponiveis} | Usadas: ${entrada.doses_usadas} | Status: ${entrada.status}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSaidasSemen();