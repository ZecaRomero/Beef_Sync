const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function corrigirDataTE() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== CORRIGINDO DATA DE TE DAS 7 RECEPTORAS ===\n');
    console.log('Data ERRADA: 30/10/2025');
    console.log('Data CORRETA: 27/11/2025\n');
    
    const receptoras = [
      { rg: '8535', id: 1660, te_id: 29 },
      { rg: '8251', id: 1658, te_id: 27 },
      { rg: '9775', id: 1665, te_id: 34 },
      { rg: '8326', id: 1659, te_id: 28 },
      { rg: '8962', id: 1661, te_id: 30 },
      { rg: '9305', id: 1662, te_id: 31 },
      { rg: '9487', id: 1664, te_id: 33 }
    ];
    
    const dataCorreta = '2025-11-27';
    let corrigidas = 0;
    
    for (const receptora of receptoras) {
      // Atualizar data_te na tabela transferencias_embrioes
      const result = await client.query(`
        UPDATE transferencias_embrioes 
        SET data_te = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, data_te
      `, [dataCorreta, receptora.te_id]);
      
      if (result.rows.length > 0) {
        console.log(`✅ M ${receptora.rg} (TE ID: ${receptora.te_id})`);
        console.log(`   Nova data TE: ${new Date(result.rows[0].data_te).toLocaleDateString('pt-BR')}`);
        corrigidas++;
      } else {
        console.log(`❌ M ${receptora.rg}: Erro ao atualizar`);
      }
    }
    
    console.log(`\n📊 RESUMO:`);
    console.log(`✅ ${corrigidas} de ${receptoras.length} receptoras corrigidas`);
    
    // Verificar se as datas foram atualizadas
    console.log('\n=== VERIFICANDO ATUALIZAÇÕES ===\n');
    
    for (const receptora of receptoras) {
      const result = await client.query(`
        SELECT data_te FROM transferencias_embrioes WHERE id = $1
      `, [receptora.te_id]);
      
      if (result.rows.length > 0) {
        const dataAtual = new Date(result.rows[0].data_te).toLocaleDateString('pt-BR');
        const status = dataAtual === '27/11/2025' ? '✅' : '❌';
        console.log(`${status} M ${receptora.rg}: ${dataAtual}`);
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

corrigirDataTE();
