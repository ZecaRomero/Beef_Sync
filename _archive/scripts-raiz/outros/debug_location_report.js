const { Pool } = require('pg');

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
  const report = {}

  try {
    console.log('=== INICIANDO GERAÇÃO DO RELATÓRIO ===');
    console.log('Período:', period);
    console.log('Seções:', sections);

    // Localização atual dos animais
    if (!sections || sections.localizacao_atual !== false) {
      console.log('\n📍 Executando query de localização atual...');
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
          l.motivo_movimentacao,
          l.usuario_responsavel,
          l.observacoes
        FROM animais a
        LEFT JOIN localizacoes_animais l ON a.id = l.animal_id AND l.data_saida IS NULL
        WHERE a.situacao = 'Ativo'
        ORDER BY l.piquete NULLS LAST, a.serie, a.rg
      `)

      console.log('Resultados encontrados:', localizacaoAtualResult.rows.length);
      
      // Mostrar alguns resultados
      localizacaoAtualResult.rows.slice(0, 5).forEach((animal, index) => {
        console.log(`${index + 1}. ${animal.serie}-${animal.rg} -> ${animal.piquete || 'SEM LOCALIZAÇÃO'}`);
      });

      report.localizacao_atual = localizacaoAtualResult.rows
    }

    // Animais por piquete
    if (!sections || sections.animais_por_piquete !== false) {
      console.log('\n📊 Executando query de animais por piquete...');
      const porPiqueteResult = await query(`
        SELECT 
          l.piquete,
          COUNT(*) as total_animais,
          COUNT(CASE WHEN a.sexo = 'Macho' THEN 1 END) as machos,
          COUNT(CASE WHEN a.sexo = 'Fêmea' THEN 1 END) as femeas,
          STRING_AGG(DISTINCT a.raca, ', ') as racas
        FROM localizacoes_animais l
        JOIN animais a ON l.animal_id = a.id
        WHERE l.data_saida IS NULL AND a.situacao = 'Ativo'
        GROUP BY l.piquete
        ORDER BY total_animais DESC
      `)

      console.log('Piquetes encontrados:', porPiqueteResult.rows.length);
      porPiqueteResult.rows.forEach(piquete => {
        console.log(`${piquete.piquete}: ${piquete.total_animais} animais`);
      });

      report.animais_por_piquete = porPiqueteResult.rows
    }

    // Estatísticas gerais de localização
    console.log('\n📈 Executando query de estatísticas...');
    const estatisticasResult = await query(`
      SELECT 
        COUNT(DISTINCT a.id) as total_animais,
        COUNT(DISTINCT CASE WHEN l.id IS NOT NULL THEN a.id END) as animais_localizados,
        COUNT(DISTINCT CASE WHEN l.id IS NULL THEN a.id END) as animais_sem_localizacao,
        COUNT(DISTINCT l.piquete) as total_piquetes
      FROM animais a
      LEFT JOIN localizacoes_animais l ON a.id = l.animal_id AND l.data_saida IS NULL
      WHERE a.situacao = 'Ativo'
    `)

    console.log('Estatísticas:', estatisticasResult.rows[0]);
    report.estatisticas = estatisticasResult.rows[0]

    console.log('\n=== RELATÓRIO FINAL ===');
    console.log('Seções geradas:', Object.keys(report));
    console.log('Total de dados:', JSON.stringify(report, null, 2).length, 'caracteres');

    return report
  } catch (error) {
    console.error('Erro ao gerar relatório de localização:', error)
    return {}
  }
}

async function testLocationReport() {
  try {
    const period = {
      startDate: '2025-10-01',
      endDate: '2025-10-31'
    };

    const sections = {
      localizacao_atual: true,
      historico_movimentacoes: false, // Desabilitando para simplificar
      animais_por_piquete: true,
      movimentacoes_recentes: false, // Desabilitando para simplificar
      animais_sem_localizacao: false // Desabilitando para simplificar
    };

    const report = await generateLocationReport(period, sections);
    
    console.log('\n=== RESULTADO FINAL ===');
    if (Object.keys(report).length === 0) {
      console.log('❌ RELATÓRIO VAZIO!');
    } else {
      console.log('✅ RELATÓRIO GERADO COM SUCESSO');
      
      // Verificar especificamente o Piquete 4
      if (report.localizacao_atual) {
        const piquete4Animals = report.localizacao_atual.filter(animal => 
          animal.piquete && animal.piquete.toLowerCase().includes('piquete 4')
        );
        
        console.log('\n🔍 VERIFICAÇÃO PIQUETE 4:');
        console.log('Animais encontrados no Piquete 4:', piquete4Animals.length);
        
        if (piquete4Animals.length > 0) {
          piquete4Animals.forEach(animal => {
            console.log(`✅ ${animal.serie}-${animal.rg} está no ${animal.piquete}`);
          });
        } else {
          console.log('❌ NENHUM ANIMAL DO PIQUETE 4 ENCONTRADO NO RELATÓRIO');
        }
      }
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await pool.end();
  }
}

testLocationReport();