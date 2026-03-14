const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function corrigirRacasDuplicadas() {
  console.log('🔧 CORRIGINDO RAÇAS DUPLICADAS\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar raças atuais
    console.log('\n📊 1. Verificando raças cadastradas...');
    const racasResult = await pool.query(`
      SELECT raca, COUNT(*) as total
      FROM animais
      WHERE raca IS NOT NULL
      GROUP BY raca
      ORDER BY raca
    `);

    console.log('✅ Raças encontradas:');
    racasResult.rows.forEach(r => {
      console.log(`   - ${r.raca}: ${r.total} animais`);
    });

    // 2. Identificar raças duplicadas (case-insensitive e sem acentos)
    console.log('\n📊 2. Identificando duplicatas...');
    const racasMap = new Map();
    
    // Função para normalizar raça (remover acentos e converter para minúscula)
    const normalizar = (str) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
    };
    
    racasResult.rows.forEach(r => {
      const racaNormalizada = normalizar(r.raca);
      if (!racasMap.has(racaNormalizada)) {
        racasMap.set(racaNormalizada, []);
      }
      racasMap.get(racaNormalizada).push({ original: r.raca, total: r.total });
    });

    const duplicatas = [];
    racasMap.forEach((variantes, racaNormalizada) => {
      if (variantes.length > 1) {
        duplicatas.push({ racaNormalizada, variantes });
      }
    });

    if (duplicatas.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada!');
      return;
    }

    console.log(`⚠️ Encontradas ${duplicatas.length} raças com duplicatas:`);
    duplicatas.forEach(d => {
      console.log(`\n   ${d.racaNormalizada.toUpperCase()}:`);
      d.variantes.forEach(v => {
        console.log(`      - "${v.original}": ${v.total} animais`);
      });
    });

    // 3. Definir padrão correto para cada raça
    const padroes = {
      'nelore': 'Nelore',
      'angus': 'Angus',
      'brahman': 'Brahman',
      'mestiça': 'Mestiça',
      'mestica': 'Mestiça',
      'gir': 'Gir',
      'guzerá': 'Guzerá',
      'guzera': 'Guzerá',
      'tabapuã': 'Tabapuã',
      'tabapua': 'Tabapuã',
      'senepol': 'Senepol',
      'brangus': 'Brangus',
      'braford': 'Braford'
    };

    // 4. Corrigir cada duplicata
    console.log('\n📊 3. Corrigindo duplicatas...');
    let totalCorrigidos = 0;

    for (const dup of duplicatas) {
      const racaPadrao = padroes[dup.racaNormalizada] || dup.variantes[0].original;
      
      console.log(`\n🔧 Padronizando "${dup.racaNormalizada}" para "${racaPadrao}"...`);
      
      for (const variante of dup.variantes) {
        if (variante.original !== racaPadrao) {
          const result = await pool.query(`
            UPDATE animais 
            SET raca = $1, updated_at = CURRENT_TIMESTAMP
            WHERE raca = $2
          `, [racaPadrao, variante.original]);
          
          console.log(`   ✅ Corrigidos ${result.rowCount} animais de "${variante.original}" para "${racaPadrao}"`);
          totalCorrigidos += result.rowCount;
        }
      }
    }

    // 5. Verificar resultado
    console.log('\n📊 4. Verificando resultado...');
    const racasAposCorrecao = await pool.query(`
      SELECT raca, COUNT(*) as total
      FROM animais
      WHERE raca IS NOT NULL
      GROUP BY raca
      ORDER BY raca
    `);

    console.log('✅ Raças após correção:');
    racasAposCorrecao.rows.forEach(r => {
      console.log(`   - ${r.raca}: ${r.total} animais`);
    });

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Correção concluída! ${totalCorrigidos} animais atualizados.`);

  } catch (error) {
    console.error('\n❌ Erro durante correção:', error);
    console.error('Detalhes:', error.message);
  } finally {
    await pool.end();
  }
}

corrigirRacasDuplicadas();
