#!/usr/bin/env node

/**
 * Script de verificação de saúde do sistema Beef Sync
 * Verifica APIs, banco de dados, dependências e configurações
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020';

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkAPI(endpoint, name) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { timeout: 10000 });
    
    if (response.ok) {
      const data = await response.json();
      const count = Array.isArray(data) ? data.length : (data.data ? data.data.length : 'N/A');
      log(`✅ ${name}: OK (${count} registros)`, 'green');
      return true;
    } else {
      log(`❌ ${name}: Status ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${name}: ${error.message}`, 'red');
    return false;
  }
}

async function checkHealthEndpoint() {
  try {
    const response = await fetch(`${BASE_URL}/api/healthz`);
    const data = await response.json();
    
    if (data.data) {
      log(`✅ Sistema: ${data.data.status}`, 'green');
      log(`✅ Banco: ${data.data.database.connected ? 'Conectado' : 'Desconectado'}`, 
          data.data.database.connected ? 'green' : 'red');
      log(`✅ Versão: ${data.data.version}`, 'blue');
      log(`✅ Uptime: ${Math.round(data.data.uptime)}s`, 'blue');
      log(`✅ Tempo Resposta: ${data.data.responseTime}ms`, 'blue');
      return data.data.database.connected;
    }
    return false;
  } catch (error) {
    log(`❌ Health Check: ${error.message}`, 'red');
    return false;
  }
}

function checkFiles() {
  const criticalFiles = [
    '.env',
    'package.json',
    'next.config.js',
    'lib/database.js',
    'pages/api/healthz.js'
  ];
  
  let allFilesExist = true;
  
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      log(`✅ ${file}: Existe`, 'green');
    } else {
      log(`❌ ${file}: Não encontrado`, 'red');
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

function checkEnvironment() {
  const requiredEnvVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];
  
  let allVarsSet = true;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log(`✅ ${envVar}: Configurado`, 'green');
    } else {
      log(`❌ ${envVar}: Não configurado`, 'red');
      allVarsSet = false;
    }
  }
  
  return allVarsSet;
}

function checkDuplicateAPIs() {
  const duplicates = [
    { file1: 'pages/api/lotes.js', file2: 'pages/api/lotes/index.js' },
    { file1: 'pages/api/nitrogenio.js', file2: 'pages/api/nitrogenio/index.js' }
  ];
  
  let hasDuplicates = false;
  
  for (const dup of duplicates) {
    if (fs.existsSync(dup.file1) && fs.existsSync(dup.file2)) {
      log(`⚠️  Duplicata encontrada: ${dup.file1} e ${dup.file2}`, 'yellow');
      hasDuplicates = true;
    }
  }
  
  if (!hasDuplicates) {
    log('✅ Nenhuma duplicata de API encontrada', 'green');
  }
  
  return !hasDuplicates;
}

async function main() {
  log('🔍 VERIFICAÇÃO DE SAÚDE DO SISTEMA BEEF SYNC', 'bold');
  log('=' .repeat(50), 'blue');
  
  let overallHealth = true;
  
  // 1. Verificar arquivos críticos
  log('\n1. 📁 ARQUIVOS CRÍTICOS', 'bold');
  const filesOK = checkFiles();
  overallHealth = overallHealth && filesOK;
  
  // 2. Verificar variáveis de ambiente
  log('\n2. 🔧 VARIÁVEIS DE AMBIENTE', 'bold');
  const envOK = checkEnvironment();
  overallHealth = overallHealth && envOK;
  
  // 3. Verificar duplicatas
  log('\n3. 🔍 VERIFICAR DUPLICATAS', 'bold');
  const noDuplicates = checkDuplicateAPIs();
  overallHealth = overallHealth && noDuplicates;
  
  // 4. Verificar health endpoint
  log('\n4. 🏥 HEALTH CHECK', 'bold');
  const healthOK = await checkHealthEndpoint();
  overallHealth = overallHealth && healthOK;
  
  // 5. Verificar APIs principais
  log('\n5. 🔌 APIS PRINCIPAIS', 'bold');
  const apis = [
    { endpoint: '/api/animals', name: 'Animais' },
    { endpoint: '/api/semen', name: 'Sêmen' },
    { endpoint: '/api/births', name: 'Nascimentos' },
    { endpoint: '/api/deaths', name: 'Mortes' },
    { endpoint: '/api/localizacoes', name: 'Localizações' },
    { endpoint: '/api/custos', name: 'Custos' },
    { endpoint: '/api/gestacoes', name: 'Gestações' },
    { endpoint: '/api/notifications', name: 'Notificações' }
  ];
  
  let apisOK = 0;
  for (const api of apis) {
    const result = await checkAPI(api.endpoint, api.name);
    if (result) apisOK++;
  }
  
  const allAPIsOK = apisOK === apis.length;
  overallHealth = overallHealth && allAPIsOK;
  
  // 6. Teste de relatórios
  log('\n6. 📊 SISTEMA DE RELATÓRIOS', 'bold');
  try {
    const reportResponse = await fetch(`${BASE_URL}/api/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reports: ['monthly_summary'],
        period: { startDate: '2025-01-01', endDate: '2025-12-31' }
      })
    });
    
    if (reportResponse.ok) {
      log('✅ Geração de Relatórios: Funcionando', 'green');
    } else {
      log(`❌ Geração de Relatórios: Status ${reportResponse.status}`, 'red');
      overallHealth = false;
    }
  } catch (error) {
    log(`❌ Geração de Relatórios: ${error.message}`, 'red');
    overallHealth = false;
  }
  
  // Resumo final
  log('\n' + '=' .repeat(50), 'blue');
  log('📊 RESUMO FINAL', 'bold');
  log(`APIs funcionando: ${apisOK}/${apis.length}`, apisOK === apis.length ? 'green' : 'yellow');
  log(`Status geral: ${overallHealth ? 'SAUDÁVEL' : 'PROBLEMAS DETECTADOS'}`, 
      overallHealth ? 'green' : 'red');
  
  if (overallHealth) {
    log('\n🎉 Sistema funcionando perfeitamente!', 'green');
  } else {
    log('\n⚠️  Alguns problemas foram detectados. Verifique os itens marcados com ❌', 'yellow');
  }
  
  process.exit(overallHealth ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro crítico: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { checkAPI, checkHealthEndpoint, checkFiles, checkEnvironment };