const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

// Lista das 7 receptoras com data de TE errada
const receptoras = [
  { serie: 'M8535', rg: '8535' },
  { serie: 'M8251', rg: '8251' },
  { serie: 'M9775', rg: '9775' },
  { serie: 'M8326', rg: '8326' },
  { serie: 'M8962', rg: '8962' },
  { serie: 'M9305', rg: '9305' },
  { serie: 'M9487', rg: '9487' }
];

async function verificarReceptoras() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== VERIFICANDO RECEPTORAS COM DATA DE TE ERRADA ===\n');
    
    for (const receptora of receptoras) {
      // Buscar animal
      const result = await client.query(`
        SELECT id, serie, rg, data_chegada, data_te, data_dg_prevista, observacoes
        FROM animais 
        WHERE serie = $1 OR rg = $2
        LIMIT 1
      `, [receptora.serie, receptora.rg]);
      
      if (result.rows.length > 0) {
        const animal = result.rows[0];
        console.log(`\n${animal.serie} ${animal.rg} (ID: ${animal.id})`);
        console.log(`  Data de Chegada: ${animal.data_chegada ? new Date(animal.data_chegada).toLocaleDateString('pt-BR') : 'N/A'}`);
        console.log(`  Data de TE ATUAL: ${animal.data_te ? new Date(animal.data_te).toLocaleDateString('pt-BR') : 'N/A'}`);
        console.log(`  Data DG Prevista: ${animal.data_dg_prevista ? new Date(animal.data_dg_prevista).toLocaleDateString('pt-BR') : 'N/A'}`);
        
        // Verificar NF nas observações
        if (animal.observacoes) {
          const nfMatch = animal.observacoes.match(/NF:\s*(\d+)/);
          if (nfMatch) {
            console.log(`  NF: ${nfMatch[1]}`);
          }
        }
      } else {
        console.log(`\n❌ ${receptora.serie} ${receptora.rg} NÃO ENCONTRADA`);
      }
    }
    
    console.log('\n=== BUSCANDO NFs COM DATA DE TE 27/11/2025 ===\n');
    
    const nfs = await client.query(`
      SELECT id, numero_nf, fornecedor, data_te, data_chegada_animais, receptora_letra
      FROM notas_fiscais
      WHERE data_te = '2025-11-27'
      ORDER BY numero_nf
    `);
    
    console.log(`Total de NFs com TE em 27/11/2025: ${nfs.rows.length}\n`);
    
    nfs.rows.forEach(nf => {
      console.log(`NF ${nf.numero_nf} | Fornecedor: ${nf.fornecedor}`);
      console.log(`  Data TE: ${new Date(nf.data_te).toLocaleDateString('pt-BR')}`);
      console.log(`  Data Chegada: ${nf.data_chegada_animais ? new Date(nf.data_chegada_animais).toLocaleDateString('pt-BR') : 'N/A'}`);
      console.log(`  Letra: ${nf.receptora_letra || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarReceptoras();
