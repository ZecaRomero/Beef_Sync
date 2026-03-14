const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function generateLocationReport(period, sections) {
  const report = {};
  console.log('🔍 Iniciando geração do relatório de localização...');
  console.log('📅 Período:', period);
  console.log('📋 Seções:', sections);

  try {
    // Localização atual dos animais
    if (!sections || sections.localizacao_atual !== false) {
      console.log('\n📍 Consultando localização atual...');
      const localizacaoAtualResult = await query(`
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
          l.motivo_movimentacao
        FROM animais a
        LEFT JOIN localizacoes_animais l ON a.id = l.animal_id 
        WHERE l.data_saida IS NULL 
          AND a.situacao = 'Ativo'
        ORDER BY l.piquete, a.serie
      `);

      console.log(`✅ Localização atual: ${localizacaoAtualResult.rows.length} registros`);
      report.localizacao_atual = localizacaoAtualResult.rows;
    }

    // Histórico de movimentações no período
    if (!sections || sections.historico_movimentacoes !== false) {
      console.log('\n📜 Consultando histórico de movimentações...');
      const historicoResult = await query(`
        SELECT 
          a.serie,
          a.rg,
          a.raca,
          l.piquete,
          l.data_entrada,
          l.data_saida,
          l.motivo_movimentacao,
          l.usuario_responsavel,
          (COALESCE(l.data_saida, CURRENT_DATE)::date - l.data_entrada::date) as dias_permanencia
        FROM localizacoes_animais l
        JOIN animais a ON l.animal_id = a.id
        WHERE l.data_entrada BETWEEN $1 AND $2
           OR l.data_saida BETWEEN $1 AND $2
        ORDER BY l.data_entrada DESC
      `, [period.startDate, period.endDate]);

      console.log(`✅ Histórico: ${historicoResult.rows.length} registros`);
      report.historico_movimentacoes = historicoResult.rows;
    }

    // Animais por piquete
    if (!sections || sections.animais_por_piquete !== false) {
      console.log('\n🏡 Consultando animais por piquete...');
      const porPiqueteResult = await query(`
        SELECT 
          l.piquete,
          COUNT(*) as quantidade_animais,
          COUNT(CASE WHEN a.sexo = 'Macho' THEN 1 END) as machos,
          COUNT(CASE WHEN a.sexo = 'Fêmea' THEN 1 END) as femeas
        FROM localizacoes_animais l
        JOIN animais a ON l.animal_id = a.id
        WHERE l.data_saida IS NULL 
          AND a.situacao = 'Ativo'
        GROUP BY l.piquete
        ORDER BY l.piquete
      `);

      console.log(`✅ Piquetes: ${porPiqueteResult.rows.length} registros`);
      report.animais_por_piquete = porPiqueteResult.rows;
    }

    // Movimentações recentes (últimos 30 dias)
    if (!sections || sections.movimentacoes_recentes !== false) {
      console.log('\n🔄 Consultando movimentações recentes...');
      const recentesResult = await query(`
        SELECT 
          a.serie,
          a.rg,
          l.piquete,
          l.data_entrada,
          l.motivo_movimentacao,
          l.usuario_responsavel
        FROM localizacoes_animais l
        JOIN animais a ON l.animal_id = a.id
        WHERE l.data_entrada >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY l.data_entrada DESC
        LIMIT 50
      `);

      console.log(`✅ Movimentações recentes: ${recentesResult.rows.length} registros`);
      report.movimentacoes_recentes = recentesResult.rows;
    }

    // Animais sem localização
    if (!sections || sections.animais_sem_localizacao !== false) {
      console.log('\n❓ Consultando animais sem localização...');
      const semLocalizacaoResult = await query(`
        SELECT 
          a.id,
          a.serie,
          a.rg,
          a.raca,
          a.sexo,
          a.data_nascimento
        FROM animais a
        LEFT JOIN localizacoes_animais l ON a.id = l.animal_id AND l.data_saida IS NULL
        WHERE l.animal_id IS NULL 
          AND a.situacao = 'Ativo'
        ORDER BY a.serie
      `);

      console.log(`✅ Sem localização: ${semLocalizacaoResult.rows.length} registros`);
      report.animais_sem_localizacao = semLocalizacaoResult.rows;
    }

    console.log('\n📊 Relatório gerado com sucesso!');
    console.log('📈 Resumo do relatório:', {
      localizacao_atual: report.localizacao_atual?.length || 0,
      historico_movimentacoes: report.historico_movimentacoes?.length || 0,
      animais_por_piquete: report.animais_por_piquete?.length || 0,
      movimentacoes_recentes: report.movimentacoes_recentes?.length || 0,
      animais_sem_localizacao: report.animais_sem_localizacao?.length || 0
    });

    return report;
  } catch (error) {
    console.error('❌ Erro ao gerar relatório de localização:', error);
    return {};
  }
}

async function testLocationReport() {
  console.log('=== TESTE DO RELATÓRIO DE LOCALIZAÇÃO ===\n');
  
  const period = {
    startDate: '2025-10-01',
    endDate: '2025-10-31'
  };
  
  const sections = {
    localizacao_atual: true,
    historico_movimentacoes: true,
    animais_por_piquete: true,
    movimentacoes_recentes: true,
    animais_sem_localizacao: true
  };

  const report = await generateLocationReport(period, sections);
  
  console.log('\n=== RESULTADO FINAL ===');
  console.log('Relatório:', JSON.stringify(report, null, 2));
  
  // Verificar especificamente o Piquete 4
  if (report.localizacao_atual) {
    const piquete4 = report.localizacao_atual.filter(animal => animal.piquete === 'Piquete 4');
    console.log('\n🎯 Animais no Piquete 4:', piquete4);
  }
  
  if (report.animais_por_piquete) {
    const piquete4Stats = report.animais_por_piquete.find(p => p.piquete === 'Piquete 4');
    console.log('📊 Estatísticas do Piquete 4:', piquete4Stats);
  }

  await pool.end();
}

testLocationReport().catch(console.error);