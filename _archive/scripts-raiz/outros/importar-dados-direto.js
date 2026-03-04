const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

// Seus dados
const dados = [
  {
    serie: 'CJCJ',
    rg: '15639',
    local: 'PIQUETE 1',
    touro: 'JAMBU FIV DA GAROUPA',
    seriePai: 'AGJZ',
    rgPai: '878',
    dataIA: '05/12/25',
    dataDG: '05/01/26',
    resultado: 'P'
  }
  // Adicione mais linhas aqui se quiser
];

function converterData(data) {
  const [dia, mes, ano] = data.split('/');
  const anoCompleto = ano.length === 2 ? `20${ano}` : ano;
  return `${anoCompleto}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

async function importar() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 IMPORTANDO DADOS\n');
    console.log('='.repeat(80));
    
    for (const dado of dados) {
      console.log(`\n📝 Processando: ${dado.serie} ${dado.rg}`);
      
      // 1. Criar piquete
      const piqueteExiste = await client.query(
        'SELECT id FROM piquetes WHERE codigo = $1',
        [dado.local]
      );
      
      if (piqueteExiste.rows.length === 0) {
        await client.query(
          'INSERT INTO piquetes (codigo, nome, ativo) VALUES ($1, $2, true)',
          [dado.local, dado.local]
        );
        console.log(`  ✅ Piquete criado: ${dado.local}`);
      } else {
        console.log(`  ℹ️ Piquete já existe: ${dado.local}`);
      }
      
      // 2. Criar/atualizar animal - SEMPRE FÊMEA
      const animalExiste = await client.query(
        'SELECT id FROM animais WHERE serie = $1 AND rg = $2',
        [dado.serie, dado.rg]
      );
      
      const tatuagem = `${dado.serie} ${dado.rg}`;
      const dataEntrada = new Date().toISOString().split('T')[0];
      
      let animalId;
      if (animalExiste.rows.length === 0) {
        const result = await client.query(
          `INSERT INTO animais (
            serie, rg, tatuagem, nome, sexo, situacao, 
            piquete_atual, data_entrada_piquete, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id`,
          [dado.serie, dado.rg, tatuagem, tatuagem, 'Fêmea', 'Ativo', dado.local, dataEntrada]
        );
        animalId = result.rows[0].id;
        console.log(`  ✅ Animal criado: ${tatuagem} (ID: ${animalId})`);
      } else {
        animalId = animalExiste.rows[0].id;
        await client.query(
          `UPDATE animais 
           SET piquete_atual = $1, data_entrada_piquete = $2, sexo = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [dado.local, dataEntrada, 'Fêmea', animalId]
        );
        console.log(`  ✅ Animal atualizado: ${tatuagem} (ID: ${animalId})`);
      }
      
      // 3. Registrar IA
      const dataIAFormatada = converterData(dado.dataIA);
      const dataDGFormatada = converterData(dado.dataDG);
      
      console.log(`  📅 Data IA: ${dado.dataIA} → ${dataIAFormatada}`);
      console.log(`  📅 Data DG: ${dado.dataDG} → ${dataDGFormatada}`);
      
      const iaExiste = await client.query(
        'SELECT id FROM inseminacoes WHERE animal_id = $1 AND data_ia = $2',
        [animalId, dataIAFormatada]
      );
      
      if (iaExiste.rows.length === 0) {
        await client.query(
          `INSERT INTO inseminacoes (
            animal_id, numero_ia, data_ia, data_dg, 
            touro_nome, status_gestacao, observacoes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            animalId, 1, dataIAFormatada, dataDGFormatada,
            dado.touro, dado.resultado === 'P' ? 'Prenha' : 'Pendente',
            `Importado - Piquete: ${dado.local}`
          ]
        );
        console.log(`  ✅ IA registrada`);
      } else {
        console.log(`  ℹ️ IA já existe`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Importação concluída com sucesso!');
    console.log(`   ${dados.length} registro(s) processado(s)`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

importar();
