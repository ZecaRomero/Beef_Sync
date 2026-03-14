/**
 * Script para adicionar ultrassom realizado em 22/10/2025
 * Custo total: R$ 4.875,10 dividido entre todos os animais
 */

require('dotenv').config();
const { Pool } = require('pg');

// Configurar pool de conexão
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
});

// Lista de IDs dos animais que fizeram ultrassom (obtidos pelos RGs)
const animaisIds = [
  1138, 1141, 1144, 1147, 1148, 1150, 1151, 1160, 1162, 1167,
  1174, 1175, 1177, 1178, 1179, 1180, 1182, 1183, 1189, 1191,
  1192, 1193, 1194, 1204, 1205, 1224, 1229, 1238, 1254, 1256,
  1286, 1363, 1140, 1143, 1146, 1154, 1163, 1165, 1166, 1181,
  1184, 1187, 1195, 1196, 1197, 1200, 1201, 1211, 1213, 1216,
  1218, 1220, 1221, 1223, 1226, 1230, 1231, 1232, 1234, 1237,
  1239, 1243, 1249, 1252, 1257, 1260, 1261, 1262, 1263, 1264,
  1265, 1266, 1267, 1268, 1269, 1273, 1275, 1279, 1280, 1284,
  1287, 1288, 1290, 1247, 1285, 1291, 1295, 1296, 1297, 1298,
  1299, 1300, 1301, 1302, 1303, 1304, 1305, 1307, 1309, 1312,
  1313, 1314, 1316, 1317, 1318, 1321, 1322, 1327
];

// Dados do ultrassom
const dataUltraSom = '2025-10-22';
const custoTotal = 4875.10;
const custoIndividual = custoTotal / animaisIds.length;

async function adicionarUltraSom() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log(`\n🚀 Iniciando processamento...`);
    console.log(`📊 Total de animais: ${animaisIds.length}`);
    console.log(`💰 Custo total: R$ ${custoTotal.toFixed(2)}`);
    console.log(`💵 Custo individual: R$ ${custoIndividual.toFixed(2)}`);
    console.log(`📅 Data do ultrassom: ${dataUltraSom}\n`);

    let sucessos = 0;
    let erros = 0;
    const animaisComErro = [];

    for (const animalId of animaisIds) {
      try {
        // Verificar se o animal existe
        const animalCheck = await client.query(
          'SELECT id, serie, rg FROM animais WHERE id = $1',
          [animalId]
        );

        if (animalCheck.rows.length === 0) {
          console.log(`⚠️  Animal ID ${animalId} não encontrado`);
          animaisComErro.push({ id: animalId, motivo: 'Animal não encontrado' });
          erros++;
          continue;
        }

        const animal = animalCheck.rows[0];
        console.log(`✅ Processando animal ${animal.serie || ''}/${animal.rg || ''} (ID: ${animalId})`);

        // 1. Adicionar custo
        const custoResult = await client.query(`
          INSERT INTO custos (
            animal_id, tipo, subtipo, valor, data, observacoes, detalhes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          animalId,
          'Exame',
          'Ultrassom',
          custoIndividual,
          dataUltraSom,
          'Ultrassom realizado em 22/10/2025',
          JSON.stringify({ 
            tipo: 'Ultrassom',
            data: dataUltraSom,
            custo_total_grupo: custoTotal,
            quantidade_animais: animaisIds.length
          })
        ]);

        // 2. Atualizar custo total do animal
        await client.query(`
          UPDATE animais 
          SET custo_total = (
            SELECT COALESCE(SUM(valor), 0) 
            FROM custos 
            WHERE animal_id = $1
          ),
          updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [animalId]);

        // 3. Adicionar registro no histórico sanitário
        await client.query(`
          INSERT INTO historia_ocorrencias (
            animal_id, tipo, data, descricao, observacoes, valor, veterinario
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          animalId,
          'Exame',
          dataUltraSom,
          'Ultrassom',
          `Ultrassom realizado em 22/10/2025. Custo: R$ ${custoIndividual.toFixed(2)}`,
          custoIndividual,
          null
        ]);

        sucessos++;
        
      } catch (error) {
        console.error(`❌ Erro ao processar animal ID ${animalId}:`, error.message);
        animaisComErro.push({ id: animalId, motivo: error.message });
        erros++;
      }
    }

    await client.query('COMMIT');

    console.log(`\n✨ Processamento concluído!`);
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    
    if (animaisComErro.length > 0) {
      console.log(`\n⚠️  Animais com erro:`);
      animaisComErro.forEach(item => {
        console.log(`   - ID ${item.id}: ${item.motivo}`);
      });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Erro crítico:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

// Executar o script
adicionarUltraSom().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});

