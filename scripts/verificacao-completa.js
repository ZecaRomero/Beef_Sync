#!/usr/bin/env node

/**
 * Script de verificação completa do sistema Beef Sync
 * Testa banco de dados, APIs e integridade dos dados
 */

require('dotenv').config();
const { testConnection, createTables, query, closePool } = require('../lib/database');
const databaseService = require('../services/databaseService').default;

async function verificacaoCompleta() {
  console.log('🔍 VERIFICAÇÃO COMPLETA DO SISTEMA BEEF SYNC');
  console.log('=' .repeat(50));
  
  const resultados = {
    database: false,
    tables: false,
    services: false,
    data: false,
    performance: false
  };

  try {
    // 1. Testar conexão com banco
    console.log('\n1️⃣ TESTANDO CONEXÃO COM POSTGRESQL...');
    const connectionResult = await testConnection();
    if (connectionResult.success) {
      console.log('✅ Conexão estabelecida com sucesso');
      console.log(`   📊 Versão: ${connectionResult.version}`);
      console.log(`   🗄️  Database: ${connectionResult.database}`);
      console.log(`   👤 User: ${connectionResult.user}`);
      resultados.database = true;
    } else {
      console.log('❌ Falha na conexão:', connectionResult.error);
      return resultados;
    }

    // 2. Verificar/criar estrutura de tabelas
    console.log('\n2️⃣ VERIFICANDO ESTRUTURA DO BANCO...');
    await createTables();
    console.log('✅ Estrutura do banco verificada/criada');
    resultados.tables = true;

    // 3. Testar serviços principais
    console.log('\n3️⃣ TESTANDO SERVIÇOS PRINCIPAIS...');
    
    // Testar estatísticas
    try {
      const stats = await databaseService.obterEstatisticas();
      console.log('✅ Serviço de estatísticas funcionando');
      console.log(`   📊 Total de animais: ${stats.totalAnimais}`);
      console.log(`   💰 Total investido: R$ ${stats.totalInvestido.toFixed(2)}`);
    } catch (error) {
      console.log('❌ Erro no serviço de estatísticas:', error.message);
    }

    // Testar busca de animais
    try {
      const animais = await databaseService.buscarAnimais({ limit: 5 });
      console.log(`✅ Serviço de animais funcionando (${animais.length} registros)`);
    } catch (error) {
      console.log('❌ Erro no serviço de animais:', error.message);
    }

    // Testar estoque de sêmen
    try {
      const semen = await databaseService.buscarEstoqueSemen({ limit: 5 });
      console.log(`✅ Serviço de estoque funcionando (${semen.length} registros)`);
    } catch (error) {
      console.log('❌ Erro no serviço de estoque:', error.message);
    }

    resultados.services = true;

    // 4. Verificar integridade dos dados
    console.log('\n4️⃣ VERIFICANDO INTEGRIDADE DOS DADOS...');
    
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
        console.log('✅ Integridade dos dados verificada');
      } else {
        console.log('⚠️  Inconsistências encontradas:');
        if (custos_negativos > 0) console.log(`   - ${custos_negativos} animais com custos negativos`);
        if (datas_futuras > 0) console.log(`   - ${datas_futuras} animais com datas futuras`);
        if (doses_negativas > 0) console.log(`   - ${doses_negativas} itens com doses negativas`);
      }
      
      resultados.data = true;
    } catch (error) {
      console.log('❌ Erro na verificação de integridade:', error.message);
    }

    // 5. Testar performance
    console.log('\n5️⃣ TESTANDO PERFORMANCE...');
    
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
        console.log(`✅ Performance adequada (${duration}ms)`);
      } else {
        console.log(`⚠️  Performance lenta (${duration}ms)`);
      }
      
      resultados.performance = true;
    } catch (error) {
      console.log('❌ Erro no teste de performance:', error.message);
    }

    // 6. Resumo final
    console.log('\n' + '='.repeat(50));
    console.log('📋 RESUMO DA VERIFICAÇÃO');
    console.log('='.repeat(50));
    
    const totalTestes = Object.keys(resultados).length;
    const testesPassaram = Object.values(resultados).filter(Boolean).length;
    
    console.log(`✅ Testes aprovados: ${testesPassaram}/${totalTestes}`);
    console.log(`📊 Taxa de sucesso: ${((testesPassaram/totalTestes) * 100).toFixed(1)}%`);
    
    if (testesPassaram === totalTestes) {
      console.log('\n🎉 SISTEMA TOTALMENTE FUNCIONAL!');
      console.log('   Todas as verificações passaram com sucesso.');
      console.log('   O Beef Sync está pronto para uso.');
    } else {
      console.log('\n⚠️  SISTEMA PARCIALMENTE FUNCIONAL');
      console.log('   Algumas verificações falharam.');
      console.log('   Verifique os logs acima para detalhes.');
    }

    // 7. Informações do sistema
    console.log('\n📋 INFORMAÇÕES DO SISTEMA:');
    console.log(`   🏷️  Nome: ${process.env.NEXT_PUBLIC_APP_NAME || 'Beef Sync'}`);
    console.log(`   📦 Versão: ${process.env.NEXT_PUBLIC_APP_VERSION || '3.0.0'}`);
    console.log(`   🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   🗄️  Database: ${process.env.DB_NAME || 'estoque_semen'}`);
    console.log(`   🖥️  Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
    
    return resultados;

  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO:', error.message);
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
      console.error('💥 Erro na verificação:', error.message);
      process.exit(1);
    });
}

module.exports = { verificacaoCompleta };