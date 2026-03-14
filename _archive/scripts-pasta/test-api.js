#!/usr/bin/env node

/**
 * Script para testar API de conectividade do banco
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
  console.log('🧪 Testando API de conectividade...');
  
  try {
    const response = await fetch('http://localhost:3020/api/database/test');
    const data = await response.json();
    
    if (data.connected) {
      console.log('✅ API conectada com sucesso!');
      console.log('📊 Status:', data.status);
      console.log('🔗 Configuração:');
      console.log(`   Host: ${data.config.host}`);
      console.log(`   Database: ${data.config.database}`);
      console.log(`   User: ${data.config.user}`);
      console.log(`   Port: ${data.config.port}`);
      
      if (data.poolInfo) {
        console.log('🏊 Pool de Conexões:');
        console.log(`   Total: ${data.poolInfo.totalCount}`);
        console.log(`   Idle: ${data.poolInfo.idleCount}`);
        console.log(`   Waiting: ${data.poolInfo.waitingCount}`);
      }
    } else {
      console.log('❌ Falha na conectividade da API');
      console.log('Error:', data.message);
      if (data.error) {
        console.log('Details:', data.error);
      }
    }
  } catch (error) {
    console.log('❌ Erro ao testar API:', error.message);
    console.log('💡 Certifique-se de que o servidor Next.js está rodando (npm run dev)');
  }
}

testAPI();
