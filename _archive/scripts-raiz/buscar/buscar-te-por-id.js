const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function buscarTE() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== BUSCANDO TEs DAS 7 RECEPTORAS ===\n');
    
    const receptoras = [
      { rg: '8535', id: 1660 },
      { rg: '8251', id: 1658 },
      { rg: '9775', id: 1665 },
      { rg: '8326', id: 1659 },
      { rg: '8962', id: 1661 },
      { rg: '9305', id: 1662 },
      { rg: '9487', id: 1664 }
    ];
    
    for (const receptora of receptoras) {
      const result = await client.query(`
        SELECT te.*, a.serie, a.rg
        FROM transferencias_embrioes te
        LEFT JOIN animais a ON a.id = te.receptora_id
        WHERE te.receptora_id = $1
        ORDER BY te.data_te DESC
        LIMIT 1
      `, [receptora.id]);
      
      if (result.rows.length > 0) {
        const te = result.rows[0];
        console.log(`\nM ${receptora.rg} (ID: ${receptora.id}):`);
        console.log(`  TE ID: ${te.id}`);
        console.log(`  Data TE: ${te.data_te ? new Date(te.data_te).toLocaleDateString('pt-BR') : 'N/A'}`);
        console.log(`  Status: ${te.status || 'N/A'}`);
        console.log(`  Resultado: ${te.resultado || 'N/A'}`);
      } else {
        console.log(`\n❌ M ${receptora.rg} (ID: ${receptora.id}): Nenhuma TE encontrada`);
      }
    }
    
    // Buscar todas as TEs com data 27/11/2025
    console.log('\n\n=== TODAS AS TEs COM DATA 27/11/2025 ===\n');
    
    const tes2711 = await client.query(`
      SELECT te.*, a.serie, a.rg
      FROM transferencias_embrioes te
      LEFT JOIN animais a ON a.id = te.receptora_id
      WHERE te.data_te = '2025-11-27'
      ORDER BY a.serie, a.rg
    `);
    
    console.log(`Total: ${tes2711.rows.length} TEs\n`);
    
    if (tes2711.rows.length > 0) {
      tes2711.rows.forEach(te => {
        console.log(`${te.serie || '?'} ${te.rg || '?'} | TE: ${new Date(te.data_te).toLocaleDateString('pt-BR')} | Status: ${te.status || 'N/A'}`);
      });
    } else {
      console.log('❌ Nenhuma TE encontrada com data 27/11/2025');
    }
    
    // Verificar se existe alguma TE para essas receptoras
    console.log('\n\n=== VERIFICANDO TODAS AS TEs DESSAS RECEPTORAS ===\n');
    
    const ids = receptoras.map(r => r.id);
    const todasTEs = await client.query(`
      SELECT te.*, a.serie, a.rg
      FROM transferencias_embrioes te
      LEFT JOIN animais a ON a.id = te.receptora_id
      WHERE te.receptora_id = ANY($1)
      ORDER BY te.data_te DESC
    `, [ids]);
    
    console.log(`Total de TEs encontradas: ${todasTEs.rows.length}\n`);
    
    if (todasTEs.rows.length > 0) {
      todasTEs.rows.forEach(te => {
        console.log(`${te.serie || '?'} ${te.rg || '?'} | TE: ${te.data_te ? new Date(te.data_te).toLocaleDateString('pt-BR') : 'N/A'} | Status: ${te.status || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

buscarTE();
