#!/usr/bin/env node

/**
 * Script de verificaÃ§Ã£o de saÃºde do sistema Beef Sync
 * Verifica APIs, banco de dados, dependÃªncias e configuraÃ§Ãµes
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Carregar variÃ¡veis de ambiente
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
      log(`âÅ“â€¦ ${name}: OK (${count} registros)`, 'green');
      return true;
    } else {
      log(`â�Å’ ${name}: Status ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`â�Å’ ${name}: ${error.message}`, 'red');
    return false;
  }
}

async function checkHealthEndpoint() {
  try {
    const response = await fetch(`${BASE_URL}/api/healthz`);
    const data = await response.json();
    
    if (data.data) {
      log(`âÅ“â€¦ Sistema: ${data.data.status}`, 'green');
      log(`âÅ“â€¦ Banco: ${data.data.database.connected ? 'Conectado' : 'Desconectado'}`, 
          data.data.database.connected ? 'green' : 'red');
      log(`âÅ“â€¦ VersÃ£o: ${data.data.version}`, 'blue');
      log(`âÅ“â€¦ Uptime: ${Math.round(data.data.uptime)}s`, 'blue');
      log(`âÅ“â€¦ Tempo Resposta: ${data.data.responseTime}ms`, 'blue');
      return data.data.database.connected;
    }
    return false;
  } catch (error) {
    log(`â�Å’ Health Check: ${error.message}`, 'red');
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
      log(`âÅ“â€¦ ${file}: Existe`, 'green');
    } else {
      log(`â�Å’ ${file}: NÃ£o encontrado`, 'red');
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
      log(`âÅ“â€¦ ${envVar}: Configurado`, 'green');
    } else {
      log(`â�Å’ ${envVar}: NÃ£o configurado`, 'red');
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
      log(`âÅ¡ ï¸�  Duplicata encontrada: ${dup.file1} e ${dup.file2}`, 'yellow');
      hasDuplicates = true;
    }
  }
  
  if (!hasDuplicates) {
    log('âÅ“â€¦ Nenhuma duplicata de API encontrada', 'green');
  }
  
  return !hasDuplicates;
}

async function main() {
  log('ðÅ¸â€�� VERIFICAÃâ€¡ÃÆ’O DE SAÃÅ¡DE DO SISTEMA BEEF SYNC', 'bold');
  log('=' .repeat(50), 'blue');
  
  let overallHealth = true;
  
  // 1. Verificar arquivos crÃ­ticos
  log('\n1. ðÅ¸â€œ� ARQUIVOS CRÃ�TICOS', 'bold');
  const filesOK = checkFiles();
  overallHealth = overallHealth && filesOK;
  
  // 2. Verificar variÃ¡veis de ambiente
  log('\n2. ðÅ¸â€�§ VARIÃ�VEIS DE AMBIENTE', 'bold');
  const envOK = checkEnvironment();
  overallHealth = overallHealth && envOK;
  
  // 3. Verificar duplicatas
  log('\n3. ðÅ¸â€�� VERIFICAR DUPLICATAS', 'bold');
  const noDuplicates = checkDuplicateAPIs();
  overallHealth = overallHealth && noDuplicates;
  
  // 4. Verificar health endpoint
  log('\n4. ðÅ¸�¥ HEALTH CHECK', 'bold');
  const healthOK = await checkHealthEndpoint();
  overallHealth = overallHealth && healthOK;
  
  // 5. Verificar APIs principais
  log('\n5. ðÅ¸â€�Å’ APIS PRINCIPAIS', 'bold');
  const apis = [
    { endpoint: '/api/animals', name: 'Animais' },
    { endpoint: '/api/semen', name: 'SÃªmen' },
    { endpoint: '/api/births', name: 'Nascimentos' },
    { endpoint: '/api/deaths', name: 'Mortes' },
    { endpoint: '/api/localizacoes', name: 'LocalizaÃ§Ãµes' },
    { endpoint: '/api/custos', name: 'Custos' },
    { endpoint: '/api/gestacoes', name: 'GestaÃ§Ãµes' },
    { endpoint: '/api/notifications', name: 'NotificaÃ§Ãµes' }
  ];
  
  let apisOK = 0;
  for (const api of apis) {
    const result = await checkAPI(api.endpoint, api.name);
    if (result) apisOK++;
  }
  
  const allAPIsOK = apisOK === apis.length;
  overallHealth = overallHealth && allAPIsOK;
  
  // 6. Teste de relatÃ³rios
  log('\n6. ðÅ¸â€œÅ  SISTEMA DE RELATÃâ€œRIOS', 'bold');
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
      log('âÅ“â€¦ GeraÃ§Ã£o de RelatÃ³rios: Funcionando', 'green');
    } else {
      log(`â�Å’ GeraÃ§Ã£o de RelatÃ³rios: Status ${reportResponse.status}`, 'red');
      overallHealth = false;
    }
  } catch (error) {
    log(`â�Å’ GeraÃ§Ã£o de RelatÃ³rios: ${error.message}`, 'red');
    overallHealth = false;
  }
  
  // Resumo final
  log('\n' + '=' .repeat(50), 'blue');
  log('ðÅ¸â€œÅ  RESUMO FINAL', 'bold');
  log(`APIs funcionando: ${apisOK}/${apis.length}`, apisOK === apis.length ? 'green' : 'yellow');
  log(`Status geral: ${overallHealth ? 'SAUDÃ�VEL' : 'PROBLEMAS DETECTADOS'}`, 
      overallHealth ? 'green' : 'red');
  
  if (overallHealth) {
    log('\nðÅ¸Å½â€° Sistema funcionando perfeitamente!', 'green');
  } else {
    log('\nâÅ¡ ï¸�  Alguns problemas foram detectados. Verifique os itens marcados com â�Å’', 'yellow');
  }
  
  process.exit(overallHealth ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    log(`â�Å’ Erro crÃ­tico: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { checkAPI, checkHealthEndpoint, checkFiles, checkEnvironment };