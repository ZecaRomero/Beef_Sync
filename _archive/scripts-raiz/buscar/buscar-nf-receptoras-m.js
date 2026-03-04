const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function buscarNF() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== BUSCANDO NFs DE RECEPTORAS M ===\n');
    
    // Buscar NFs com receptora_letra = M
    const nfs = await client.query(`
      SELECT id, numero_nf, fornecedor, data_te, data_chegada_animais, data, receptora_letra, receptora_numero
      FROM notas_fiscais
      WHERE receptora_letra = 'M' AND eh_receptoras = true
      ORDER BY data DESC
      LIMIT 10
    `);
    
    console.log(`Total de NFs encontradas: ${nfs.rows.length}\n`);
    
    nfs.rows.forEach(nf => {
      console.log(`\n📋 NF ${nf.numero_nf} (ID: ${nf.id})`);
      console.log(`   Fornecedor: ${nf.fornecedor}`);
      console.log(`   Data NF: ${nf.data ? new Date(nf.data).toLocaleDateString('pt-BR') : 'N/A'}`);
      console.log(`   Data TE: ${nf.data_te ? new Date(nf.data_te).toLocaleDateString('pt-BR') : 'N/A'}`);
      console.log(`   Data Chegada: ${nf.data_chegada_animais ? new Date(nf.data_chegada_animais).toLocaleDateString('pt-BR') : 'N/A'}`);
      console.log(`   Letra: ${nf.receptora_letra} | Número: ${nf.receptora_numero || 'N/A'}`);
    });
    
    // Buscar as 7 receptoras específicas
    console.log('\n\n=== VERIFICANDO AS 7 RECEPTORAS ===\n');
    
    const receptoras = ['8535', '8251', '9775', '8326', '8962', '9305', '9487'];
    
    for (const rg of receptoras) {
      const result = await client.query(`
        SELECT id, serie, rg, observacoes, data_chegada
        FROM animais 
        WHERE rg = $1
        LIMIT 1
      `, [rg]);
      
      if (result.rows.length > 0) {
        const animal = result.rows[0];
        console.log(`\n${animal.serie} ${animal.rg} (ID: ${animal.id})`);
        console.log(`  Data Chegada: ${animal.data_chegada ? new Date(animal.data_chegada).toLocaleDateString('pt-BR') : 'N/A'}`);
        
        // Extrair NF das observações
        if (animal.observacoes) {
          const nfMatch = animal.observacoes.match(/NF:\s*(\d+)/);
          const dataTeMatch = animal.observacoes.match(/Data de TE:\s*(\d{2}\/\d{2}\/\d{4})/);
          
          if (nfMatch) {
            console.log(`  NF: ${nfMatch[1]}`);
          }
          if (dataTeMatch) {
            console.log(`  Data TE (observações): ${dataTeMatch[1]}`);
          }
        }
      } else {
        console.log(`\n❌ M ${rg} NÃO ENCONTRADA`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

buscarNF();
