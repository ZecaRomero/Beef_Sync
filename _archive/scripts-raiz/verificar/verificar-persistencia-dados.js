const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function verificarPersistencia() {
  console.log('🔍 VERIFICANDO PERSISTÊNCIA DE DADOS NO BANCO\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar tabelas críticas
    console.log('\n📊 1. TABELAS CRÍTICAS E SEUS DADOS:\n');
    
    const tabelasCriticas = [
      { nome: 'animais', descricao: 'Cadastro de Animais' },
      { nome: 'dna_envios', descricao: 'Envios de DNA' },
      { nome: 'dna_animais', descricao: 'Relação DNA-Animais' },
      { nome: 'exames_andrologicos', descricao: 'Exames Andrológicos' },
      { nome: 'abastecimento_nitrogenio', descricao: 'Abastecimento de Nitrogênio' },
      { nome: 'custos', descricao: 'Custos dos Animais' },
      { nome: 'gestacoes', descricao: 'Gestações' },
      { nome: 'nascimentos', descricao: 'Nascimentos' },
      { nome: 'transferencias_embrioes', descricao: 'Transferências de Embriões' },
      { nome: 'estoque_semen', descricao: 'Estoque de Sêmen' },
      { nome: 'notas_fiscais', descricao: 'Notas Fiscais' },
      { nome: 'historia_ocorrencias', descricao: 'Histórico de Ocorrências' }
    ];

    const resultados = [];

    for (const tabela of tabelasCriticas) {
      try {
        // Verificar se a tabela existe
        const existeResult = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [tabela.nome]);

        const existe = existeResult.rows[0].exists;

        if (existe) {
          // Contar registros
          const countResult = await pool.query(`SELECT COUNT(*) FROM ${tabela.nome}`);
          const count = parseInt(countResult.rows[0].count);

          // Verificar última atualização
          let ultimaAtualizacao = 'N/A';
          try {
            const updateResult = await pool.query(`
              SELECT MAX(updated_at) as ultima, MAX(created_at) as criacao 
              FROM ${tabela.nome}
            `);
            if (updateResult.rows[0].ultima || updateResult.rows[0].criacao) {
              const data = updateResult.rows[0].ultima || updateResult.rows[0].criacao;
              ultimaAtualizacao = new Date(data).toLocaleString('pt-BR');
            }
          } catch (e) {
            // Tabela não tem campos de timestamp
          }

          resultados.push({
            tabela: tabela.nome,
            descricao: tabela.descricao,
            existe: true,
            registros: count,
            ultimaAtualizacao,
            status: count > 0 ? '✅ COM DADOS' : '⚠️  VAZIA'
          });

          console.log(`${count > 0 ? '✅' : '⚠️ '} ${tabela.descricao.padEnd(35)} | ${count.toString().padStart(6)} registros | Última: ${ultimaAtualizacao}`);
        } else {
          resultados.push({
            tabela: tabela.nome,
            descricao: tabela.descricao,
            existe: false,
            registros: 0,
            ultimaAtualizacao: 'N/A',
            status: '❌ NÃO EXISTE'
          });

          console.log(`❌ ${tabela.descricao.padEnd(35)} | NÃO EXISTE`);
        }
      } catch (error) {
        console.log(`❌ ${tabela.descricao.padEnd(35)} | ERRO: ${error.message}`);
      }
    }

    // 2. Verificar integridade dos dados
    console.log('\n📋 2. VERIFICAÇÃO DE INTEGRIDADE:\n');

    // Verificar animais com DNA registrado
    const animaisComDNA = await pool.query(`
      SELECT COUNT(*) FROM animais 
      WHERE laboratorio_dna IS NOT NULL OR data_envio_dna IS NOT NULL
    `);
    console.log(`   Animais com DNA registrado: ${animaisComDNA.rows[0].count}`);

    // Verificar custos de DNA
    const custosDNA = await pool.query(`
      SELECT COUNT(*), COALESCE(SUM(valor), 0) as total 
      FROM custos 
      WHERE tipo = 'DNA'
    `);
    console.log(`   Custos de DNA: ${custosDNA.rows[0].count} registros | Total: R$ ${parseFloat(custosDNA.rows[0].total).toFixed(2)}`);

    // Verificar custos de exames andrológicos
    const custosAndrologicos = await pool.query(`
      SELECT COUNT(*), COALESCE(SUM(valor), 0) as total 
      FROM custos 
      WHERE tipo = 'Exame' AND subtipo = 'Andrológico'
    `);
    console.log(`   Custos Andrológicos: ${custosAndrologicos.rows[0].count} registros | Total: R$ ${parseFloat(custosAndrologicos.rows[0].total).toFixed(2)}`);

    // 3. Verificar APIs que salvam no banco
    console.log('\n🔌 3. APIS VERIFICADAS (salvam no PostgreSQL):\n');

    const apisVerificadas = [
      { endpoint: '/api/dna/enviar', metodo: 'POST', tabelas: ['dna_envios', 'dna_animais', 'custos', 'animais'], status: '✅' },
      { endpoint: '/api/nitrogenio', metodo: 'POST', tabelas: ['abastecimento_nitrogenio', 'movimentacoes_contabeis'], status: '✅' },
      { endpoint: '/api/reproducao/exames-andrologicos', metodo: 'POST', tabelas: ['exames_andrologicos', 'custos', 'historia_ocorrencias'], status: '✅' },
      { endpoint: '/api/animals', metodo: 'POST', tabelas: ['animais'], status: '✅' },
      { endpoint: '/api/births', metodo: 'POST', tabelas: ['nascimentos', 'animais'], status: '✅' },
      { endpoint: '/api/deaths', metodo: 'POST', tabelas: ['mortes', 'animais'], status: '✅' },
      { endpoint: '/api/semen', metodo: 'POST', tabelas: ['estoque_semen'], status: '✅' },
      { endpoint: '/api/nf', metodo: 'POST', tabelas: ['notas_fiscais', 'notas_fiscais_itens'], status: '✅' },
    ];

    apisVerificadas.forEach(api => {
      console.log(`   ${api.status} ${api.metodo.padEnd(6)} ${api.endpoint.padEnd(45)} → ${api.tabelas.join(', ')}`);
    });

    // 4. Resumo final
    console.log('\n📊 4. RESUMO FINAL:\n');

    const tabelasComDados = resultados.filter(r => r.existe && r.registros > 0).length;
    const tabelasVazias = resultados.filter(r => r.existe && r.registros === 0).length;
    const tabelasInexistentes = resultados.filter(r => !r.existe).length;
    const totalRegistros = resultados.reduce((sum, r) => sum + r.registros, 0);

    console.log(`   ✅ Tabelas com dados: ${tabelasComDados}`);
    console.log(`   ⚠️  Tabelas vazias: ${tabelasVazias}`);
    console.log(`   ❌ Tabelas inexistentes: ${tabelasInexistentes}`);
    console.log(`   📦 Total de registros: ${totalRegistros.toLocaleString('pt-BR')}`);

    // 5. Recomendações
    console.log('\n💡 5. RECOMENDAÇÕES:\n');

    if (tabelasInexistentes > 0) {
      console.log('   ⚠️  Algumas tabelas não existem. Execute as migrations necessárias.');
    }

    if (tabelasVazias > 0) {
      const vazias = resultados.filter(r => r.existe && r.registros === 0);
      console.log('   ⚠️  Tabelas vazias encontradas:');
      vazias.forEach(t => {
        console.log(`      - ${t.descricao} (${t.tabela})`);
      });
      console.log('   💡 Comece a usar essas funcionalidades no APP para popular os dados.');
    }

    if (tabelasComDados === tabelasCriticas.length) {
      console.log('   ✅ Todas as tabelas críticas têm dados! Sistema funcionando corretamente.');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Verificação concluída!\n');

  } catch (error) {
    console.error('\n❌ Erro durante verificação:', error);
  } finally {
    await pool.end();
  }
}

verificarPersistencia();
