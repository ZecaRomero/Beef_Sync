const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
});

async function checkPiquete4() {
  try {
    // Verificar animais no piquete 4
    const result = await pool.query(`
      SELECT 
        a.id,
        a.serie,
        a.rg,
        a.raca,
        a.sexo,
        a.situacao,
        l.piquete,
        l.data_entrada,
        l.data_saida,
        l.motivo_movimentacao,
        l.usuario_responsavel
      FROM animais a
      LEFT JOIN localizacoes_animais l ON a.id = l.animal_id 
      WHERE l.piquete ILIKE '%4%' OR l.piquete ILIKE '%piquete 4%'
      ORDER BY l.data_entrada DESC
    `);
    
    console.log('=== ANIMAIS NO PIQUETE 4 ===');
    console.log('Total encontrados:', result.rows.length);
    
    if (result.rows.length > 0) {
      result.rows.forEach((animal, index) => {
        console.log(`\n${index + 1}. Animal: ${animal.serie}-${animal.rg}`);
        console.log(`   Raça: ${animal.raca}`);
        console.log(`   Sexo: ${animal.sexo}`);
        console.log(`   Situação: ${animal.situacao}`);
        console.log(`   Piquete: ${animal.piquete}`);
        console.log(`   Data Entrada: ${animal.data_entrada}`);
        console.log(`   Data Saída: ${animal.data_saida || 'Ainda no piquete'}`);
        console.log(`   Motivo: ${animal.motivo_movimentacao || 'N/A'}`);
        console.log(`   Responsável: ${animal.usuario_responsavel || 'N/A'}`);
      });
    } else {
      console.log('Nenhum animal encontrado no piquete 4');
    }
    
    // Verificar todos os piquetes disponíveis
    const piquetesResult = await pool.query(`
      SELECT DISTINCT piquete, COUNT(*) as total_animais
      FROM localizacoes_animais 
      WHERE data_saida IS NULL
      GROUP BY piquete
      ORDER BY piquete
    `);
    
    console.log('\n=== TODOS OS PIQUETES ATIVOS ===');
    piquetesResult.rows.forEach(p => {
      console.log(`${p.piquete}: ${p.total_animais} animais`);
    });
    
    // Verificar animais ativos sem localização
    const semLocalizacaoResult = await pool.query(`
      SELECT 
        a.id,
        a.serie,
        a.rg,
        a.raca,
        a.sexo,
        a.situacao
      FROM animais a
      LEFT JOIN localizacoes_animais l ON a.id = l.animal_id AND l.data_saida IS NULL
      WHERE a.situacao = 'Ativo' AND l.id IS NULL
      ORDER BY a.serie, a.rg
    `);
    
    console.log('\n=== ANIMAIS ATIVOS SEM LOCALIZAÇÃO ===');
    console.log('Total:', semLocalizacaoResult.rows.length);
    if (semLocalizacaoResult.rows.length > 0) {
      semLocalizacaoResult.rows.slice(0, 10).forEach((animal, index) => {
        console.log(`${index + 1}. ${animal.serie}-${animal.rg} (${animal.raca}, ${animal.sexo})`);
      });
      if (semLocalizacaoResult.rows.length > 10) {
        console.log(`... e mais ${semLocalizacaoResult.rows.length - 10} animais`);
      }
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkPiquete4();