const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

// Lista das 19 receptoras da NF #2141
const receptoras = [
  { numero: '1815' },
  { numero: '3233' },
  { numero: '3238' },
  { numero: '3239' },
  { numero: '3240' },
  { numero: '3241' },
  { numero: '3242' },
  { numero: '3243' },
  { numero: '3244' },
  { numero: '3245' },
  { numero: '3246' },
  { numero: '3247' },
  { numero: '3248' },
  { numero: '3249' },
  { numero: '3250' },
  { numero: '8251' },
  { numero: '3251' },
  { numero: '3252' },
  { numero: '3253' },
  { numero: '3254' }
];

async function criarReceptoras() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== CRIANDO RECEPTORAS DA NF #2141 ===\n');
    
    // Corrigir sequência do ID
    await client.query(`
      SELECT setval('animais_id_seq', COALESCE((SELECT MAX(id) FROM animais), 1))
    `);
    console.log('✅ Sequência de IDs corrigida\n');
    
    // Buscar dados da NF
    const nfResult = await client.query(`
      SELECT * FROM notas_fiscais WHERE numero_nf = '2141'
    `);
    
    if (nfResult.rows.length === 0) {
      console.log('❌ NF #2141 não encontrada!');
      return;
    }
    
    const nf = nfResult.rows[0];
    console.log(`✅ NF encontrada: ${nf.numero_nf}`);
    console.log(`Fornecedor: ${nf.fornecedor}`);
    console.log(`Data de chegada: ${nf.data_chegada_animais}`);
    console.log(`Data de TE: ${nf.data_te}`);
    console.log(`Letra: ${nf.receptora_letra}\n`);
    
    // Calcular data do DG (15 dias após chegada)
    const dataChegada = new Date(nf.data_chegada_animais || nf.data);
    const dataDG = new Date(dataChegada);
    dataDG.setDate(dataDG.getDate() + 15);
    const dataDGFormatada = dataDG.toISOString().split('T')[0];
    
    console.log(`Data prevista para DG: ${dataDGFormatada}\n`);
    
    let criadas = 0;
    let jaExistiam = 0;
    
    for (const receptora of receptoras) {
      const serie = `${nf.receptora_letra}${receptora.numero}`;
      const rg = receptora.numero;
      
      // Verificar se já existe
      const existente = await client.query(`
        SELECT id FROM animais WHERE serie = $1 AND rg = $2
      `, [serie, rg]);
      
      if (existente.rows.length > 0) {
        console.log(`⚠️  ${serie} já existe (ID: ${existente.rows[0].id})`);
        jaExistiam++;
        
        // Atualizar data_chegada e data_dg_prevista
        await client.query(`
          UPDATE animais 
          SET data_chegada = $1, 
              data_dg_prevista = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [nf.data_chegada_animais || nf.data, dataDGFormatada, existente.rows[0].id]);
        
        continue;
      }
      
      // Criar animal
      const observacoes = [
        `NF: ${nf.numero_nf}`,
        `Fornecedor: ${nf.fornecedor}`,
        `Valor total NF: R$ ${parseFloat(nf.valor_total || 0).toFixed(2)}`,
        `Data de TE: ${new Date(nf.data_te).toLocaleDateString('pt-BR')}`
      ].join(' | ');
      
      const result = await client.query(`
        INSERT INTO animais (
          serie,
          rg,
          nome,
          sexo,
          raca,
          situacao,
          data_nascimento,
          observacoes,
          data_chegada,
          data_dg_prevista,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        serie,
        rg,
        serie, // nome = série
        'Fêmea',
        'Mestiça', // Raça para receptoras
        'Ativo',
        null, // data_nascimento não informada
        observacoes,
        nf.data_chegada_animais || nf.data,
        dataDGFormatada
      ]);
      
      const animalId = result.rows[0].id;
      console.log(`✅ ${serie} criada (ID: ${animalId})`);
      criadas++;
      
      // Criar registro de TE
      try {
        await client.query(`
          INSERT INTO transferencias_embrioes (
            receptora_id,
            receptora_nome,
            data_te,
            central,
            status,
            observacoes,
            numero_nf
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          animalId,
          serie,
          nf.data_te,
          nf.fornecedor || 'MINEREMBRYO',
          'realizada',
          `NF: ${nf.numero_nf} - DG agendado para ${dataDGFormatada}`,
          nf.numero_nf
        ]);
        console.log(`   📅 TE registrada para ${serie}`);
      } catch (error) {
        console.log(`   ⚠️  Erro ao criar TE: ${error.message}`);
      }
    }
    
    console.log(`\n=== RESUMO ===`);
    console.log(`✅ Receptoras criadas: ${criadas}`);
    console.log(`⚠️  Já existiam: ${jaExistiam}`);
    console.log(`📊 Total: ${receptoras.length}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

criarReceptoras();
