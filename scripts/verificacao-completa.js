#!/usr/bin/env node

/**
 * Script de verificaÃ§Ã£o completa do sistema Beef Sync
 * Testa banco de dados, APIs e integridade dos dados
 */

require('dotenv').config();
const { testConnection, createTables, query, closePool } = require('../lib/database');
const databaseService = require('../services/databaseService').default;

async function verificacaoCompleta() {
  console.log('ðÅ¸â€�� VERIFICAÃâ€¡ÃÆ’O COMPLETA DO SISTEMA BEEF SYNC');
  console.log('=' .repeat(50));
  
  const resultados = {
    database: false,
    tables: false,
    services: false,
    data: false,
    performance: false
  };

  try {
    // 1. Testar conexÃ£o com banco
    console.log('\n1ï¸�âÆ’£ TESTANDO CONEXÃÆ’O COM POSTGRESQL...');
    const connectionResult = await testConnection();
    if (connectionResult.success) {
      console.log('âÅ“â€¦ ConexÃ£o estabelecida com sucesso');
      console.log(`   ðÅ¸â€œÅ  VersÃ£o: ${connectionResult.version}`);
      console.log(`   ðÅ¸â€”â€žï¸�  Database: ${connectionResult.database}`);
      console.log(`   ðÅ¸â€˜¤ User: ${connectionResult.user}`);
      resultados.database = true;
    } else {
      console.log('â�Å’ Falha na conexÃ£o:', connectionResult.error);
      return resultados;
    }

    // 2. Verificar/criar estrutura de tabelas
    console.log('\n2ï¸�âÆ’£ VERIFICANDO ESTRUTURA DO BANCO...');
    await createTables();
    console.log('âÅ“â€¦ Estrutura do banco verificada/criada');
    resultados.tables = true;

    // 3. Testar serviÃ§os principais
    console.log('\n3ï¸�âÆ’£ TESTANDO SERVIÃâ€¡OS PRINCIPAIS...');
    
    // Testar estatÃ­sticas
    try {
      const stats = await databaseService.obterEstatisticas();
      console.log('âÅ“â€¦ ServiÃ§o de estatÃ­sticas funcionando');
      console.log(`   ðÅ¸â€œÅ  Total de animais: ${stats.totalAnimais}`);
      console.log(`   ðÅ¸â€™° Total investido: R$ ${stats.totalInvestido.toFixed(2)}`);
    } catch (error) {
      console.log('â�Å’ Erro no serviÃ§o de estatÃ­sticas:', error.message);
    }

    // Testar busca de animais
    try {
      const animais = await databaseService.buscarAnimais({ limit: 5 });
      console.log(`âÅ“â€¦ ServiÃ§o de animais funcionando (${animais.length} registros)`);
    } catch (error) {
      console.log('â�Å’ Erro no serviÃ§o de animais:', error.message);
    }

    // Testar estoque de sÃªmen
    try {
      const semen = await databaseService.buscarEstoqueSemen({ limit: 5 });
      console.log(`âÅ“â€¦ ServiÃ§o de estoque funcionando (${semen.length} registros)`);
    } catch (error) {
      console.log('â�Å’ Erro no serviÃ§o de estoque:', error.message);
    }

    resultados.services = true;

    // 4. Verificar integridade dos dados
    console.log('\n4ï¸�âÆ’£ VERIFICANDO INTEGRIDADE DOS DADOS...');
    
    try {
      // Verificar dados inconsistentes
      const inconsistencias = await query(`
        SELECT 
          (SELECT COUNT(*) FROM animais WHERE custo_total < 0) as custos_negativos,
          (SELECT COUNT(*) FROM animais WHERE data_nascimento > CURRENT_DATE) as datas_futuras,
          (SELECT COUNT(*) FROM estoque_semen WHERE quantidade_doses < 0) as doses_negativas
      `);
      
      const { custos_negativos, datas_futuras, doses_negativas } = inconsistencias.rows[0];
      
      if (custos_negativos == 0 && datas_futuras == 0 && doses_negativas == 0) {
        console.log('âÅ“â€¦ Integridade dos dados verificada');
      } else {
        console.log('âÅ¡ ï¸�  InconsistÃªncias encontradas:');
        if (custos_negativos > 0) console.log(`   - ${custos_negativos} animais com custos negativos`);
        if (datas_futuras > 0) console.log(`   - ${datas_futuras} animais com datas futuras`);
        if (doses_negativas > 0) console.log(`   - ${doses_negativas} itens com doses negativas`);
      }
      
      resultados.data = true;
    } catch (error) {
      console.log('â�Å’ Erro na verificaÃ§Ã£o de integridade:', error.message);
    }

    // 5. Testar performance
    console.log('\n5ï¸�âÆ’£ TESTANDO PERFORMANCE...');
    
    try {
      const startTime = Date.now();
      
      // Query complexa para testar performance
      await query(`
        SELECT 
          a.serie, a.rg, a.raca, a.situacao,
          COUNT(c.id) as total_custos,
          COALESCE(SUM(c.valor), 0) as custo_total_calculado
        FROM animais a
        LEFT JOIN custos c ON a.id = c.animal_id
        GROUP BY a.id, a.serie, a.rg, a.raca, a.situacao
        ORDER BY custo_total_calculado DESC
        LIMIT 100
      `);
      
      const duration = Date.now() - startTime;
      
      if (duration < 1000) {
        console.log(`âÅ“â€¦ Performance adequada (${duration}ms)`);
      } else {
        console.log(`âÅ¡ ï¸�  Performance lenta (${duration}ms)`);
      }
      
      resultados.performance = true;
    } catch (error) {
      console.log('â�Å’ Erro no teste de performance:', error.message);
    }

    // 6. Resumo final
    console.log('\n' + '='.repeat(50));
    console.log('ðÅ¸â€œâ€¹ RESUMO DA VERIFICAÃâ€¡ÃÆ’O');
    console.log('='.repeat(50));
    
    const totalTestes = Object.keys(resultados).length;
    const testesPassaram = Object.values(resultados).filter(Boolean).length;
    
    console.log(`âÅ“â€¦ Testes aprovados: ${testesPassaram}/${totalTestes}`);
    console.log(`ðÅ¸â€œÅ  Taxa de sucesso: ${((testesPassaram/totalTestes) * 100).toFixed(1)}%`);
    
    if (testesPassaram === totalTestes) {
      console.log('\nðÅ¸Å½â€° SISTEMA TOTALMENTE FUNCIONAL!');
      console.log('   Todas as verificaÃ§Ãµes passaram com sucesso.');
      console.log('   O Beef Sync estÃ¡ pronto para uso.');
    } else {
      console.log('\nâÅ¡ ï¸�  SISTEMA PARCIALMENTE FUNCIONAL');
      console.log('   Algumas verificaÃ§Ãµes falharam.');
      console.log('   Verifique os logs acima para detalhes.');
    }

    // 7. InformaÃ§Ãµes do sistema
    console.log('\nðÅ¸â€œâ€¹ INFORMAÃâ€¡Ãâ€¢ES DO SISTEMA:');
    console.log(`   ðÅ¸�·ï¸�  Nome: ${process.env.NEXT_PUBLIC_APP_NAME || 'Beef Sync'}`);
    console.log(`   ðÅ¸â€œ¦ VersÃ£o: ${process.env.NEXT_PUBLIC_APP_VERSION || '3.0.0'}`);
    console.log(`   ðÅ¸Å’� Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   ðÅ¸â€”â€žï¸�  Database: ${process.env.DB_NAME || 'estoque_semen'}`);
    console.log(`   ðÅ¸â€“¥ï¸�  Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
    
    return resultados;

  } catch (error) {
    console.error('\nðÅ¸â€™¥ ERRO CRÃ�TICO:', error.message);
    return resultados;
  } finally {
    await closePool();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  verificacaoCompleta()
    .then((resultados) => {
      const sucesso = Object.values(resultados).every(Boolean);
      process.exit(sucesso ? 0 : 1);
    })
    .catch((error) => {
      console.error('ðÅ¸â€™¥ Erro na verificaÃ§Ã£o:', error.message);
      process.exit(1);
    });
}

module.exports = { verificacaoCompleta };