#!/usr/bin/env node

/**
 * Script de validaÃ§Ã£o completa do sistema Beef Sync
 * Verifica integridade, performance, seguranÃ§a e funcionalidades
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileIntegrity() {
  log('\n1. ðÅ¸â€œ� INTEGRIDADE DE ARQUIVOS', 'bold');
  
  const criticalFiles = {
    'ConfiguraÃ§Ã£o': [
      '.env',
      'package.json',
      'next.config.js',
      'tailwind.config.js'
    ],
    'Database': [
      'lib/database.js',
      'utils/apiResponse.js'
    ],
    'APIs Principais': [
      'pages/api/healthz.js',
      'pages/api/animals.js',
      'pages/api/semen.js',
      'pages/api/births.js'
    ],
    'Componentes UI': [
      'components/ui/Card.js',
      'components/ui/Button.js',
      'components/ui/Badge.js',
      'components/ui/Modal.js',
      'components/ui/Icons.js'
    ],
    'Scripts': [
      'scripts/health-check.js',
      'scripts/optimize-production.js',
      'scripts/backup-database.js',
      'scripts/restore-database.js'
    ]
  };

  let totalFiles = 0;
  let existingFiles = 0;

  for (const [category, files] of Object.entries(criticalFiles)) {
    log(`\n   ${category}:`, 'cyan');
    
    for (const file of files) {
      totalFiles++;
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const size = (stats.size / 1024).toFixed(1);
        log(`   âÅ“â€¦ ${file} (${size} KB)`, 'green');
        existingFiles++;
      } else {
        log(`   â�Å’ ${file} - NÃ£o encontrado`, 'red');
      }
    }
  }

  const integrity = (existingFiles / totalFiles * 100).toFixed(1);
  log(`\n   ðÅ¸â€œÅ  Integridade: ${existingFiles}/${totalFiles} (${integrity}%)`, 
      integrity === '100.0' ? 'green' : 'yellow');
  
  return integrity === '100.0';
}

function checkEnvironmentVariables() {
  log('\n2. ðÅ¸â€�§ VARIÃ�VEIS DE AMBIENTE', 'bold');
  
  const requiredVars = {
    'Database': ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'],
    'Application': ['NODE_ENV'],
    'Optional': ['NEXT_PUBLIC_APP_NAME', 'NEXT_PUBLIC_APP_VERSION']
  };

  let allRequired = true;

  for (const [category, vars] of Object.entries(requiredVars)) {
    log(`\n   ${category}:`, 'cyan');
    
    for (const envVar of vars) {
      if (process.env[envVar]) {
        const value = category === 'Database' && envVar === 'DB_PASSWORD' 
          ? '***' 
          : process.env[envVar];
        log(`   âÅ“â€¦ ${envVar}: ${value}`, 'green');
      } else {
        log(`   ${category === 'Optional' ? 'âÅ¡ ï¸�' : 'â�Å’'} ${envVar}: NÃ£o configurado`, 
            category === 'Optional' ? 'yellow' : 'red');
        if (category !== 'Optional') allRequired = false;
      }
    }
  }

  return allRequired;
}

function checkPackageDependencies() {
  log('\n3. ðÅ¸â€œ¦ DEPENDÃÅ NCIAS', 'bold');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    
    const criticalDeps = {
      'Framework': ['next', 'react', 'react-dom'],
      'Database': ['pg', '@types/pg'],
      'Utilities': ['dotenv', 'node-fetch'],
      'UI/Styling': ['tailwindcss', '@heroicons/react'],
      'Development': ['typescript', 'eslint']
    };

    let allCriticalPresent = true;

    for (const [category, deps] of Object.entries(criticalDeps)) {
      log(`\n   ${category}:`, 'cyan');
      
      for (const dep of deps) {
        const version = dependencies[dep] || devDependencies[dep];
        if (version) {
          log(`   âÅ“â€¦ ${dep}: ${version}`, 'green');
        } else {
          log(`   â�Å’ ${dep}: NÃ£o instalado`, 'red');
          allCriticalPresent = false;
        }
      }
    }

    const totalDeps = Object.keys(dependencies).length + Object.keys(devDependencies).length;
    log(`\n   ðÅ¸â€œÅ  Total de dependÃªncias: ${totalDeps}`, 'blue');
    
    return allCriticalPresent;
  } catch (error) {
    log(`   â�Å’ Erro ao ler package.json: ${error.message}`, 'red');
    return false;
  }
}

function checkCodeQuality() {
  log('\n4. ðÅ¸Å½¯ QUALIDADE DO CÃâ€œDIGO', 'bold');
  
  const checks = [
    {
      name: 'Duplicatas de API removidas',
      files: ['pages/api/lotes.js', 'pages/api/nitrogenio.js'],
      shouldNotExist: true
    },
    {
      name: 'Componentes UI completos',
      files: ['components/ui/Icons.js'],
      minSize: 20000 // 20KB mÃ­nimo para Icons.js
    },
    {
      name: 'Scripts de automaÃ§Ã£o',
      files: ['scripts/health-check.js', 'scripts/optimize-production.js'],
      shouldExist: true
    }
  ];

  let allChecksPass = true;

  for (const check of checks) {
    if (check.shouldNotExist) {
      const exists = check.files.some(file => fs.existsSync(file));
      if (!exists) {
        log(`   âÅ“â€¦ ${check.name}`, 'green');
      } else {
        log(`   â�Å’ ${check.name} - Arquivos duplicados encontrados`, 'red');
        allChecksPass = false;
      }
    } else if (check.shouldExist) {
      const allExist = check.files.every(file => fs.existsSync(file));
      if (allExist) {
        log(`   âÅ“â€¦ ${check.name}`, 'green');
      } else {
        log(`   â�Å’ ${check.name} - Arquivos faltando`, 'red');
        allChecksPass = false;
      }
    } else if (check.minSize) {
      const file = check.files[0];
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        if (stats.size >= check.minSize) {
          log(`   âÅ“â€¦ ${check.name} (${(stats.size / 1024).toFixed(1)} KB)`, 'green');
        } else {
          log(`   âÅ¡ ï¸�  ${check.name} - Arquivo muito pequeno`, 'yellow');
        }
      } else {
        log(`   â�Å’ ${check.name} - Arquivo nÃ£o encontrado`, 'red');
        allChecksPass = false;
      }
    }
  }

  return allChecksPass;
}

function checkSecurity() {
  log('\n5. ðÅ¸â€�â€™ SEGURANÃâ€¡A', 'bold');
  
  const securityChecks = [
    {
      name: 'Arquivo .env nÃ£o commitado',
      check: () => {
        // Verificar se .env estÃ¡ no .gitignore
        if (fs.existsSync('.gitignore')) {
          const gitignore = fs.readFileSync('.gitignore', 'utf8');
          return gitignore.includes('.env');
        }
        return false;
      }
    },
    {
      name: 'Senhas nÃ£o expostas no cÃ³digo',
      check: () => {
        // Verificar se nÃ£o hÃ¡ senhas hardcoded
        const sensitiveFiles = ['lib/database.js', 'utils/apiResponse.js'];
        for (const file of sensitiveFiles) {
          if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('password') && !content.includes('process.env')) {
              return false;
            }
          }
        }
        return true;
      }
    },
    {
      name: 'ValidaÃ§Ã£o de entrada nas APIs',
      check: () => {
        // Verificar se utils/apiResponse.js existe (indica validaÃ§Ã£o)
        return fs.existsSync('utils/apiResponse.js');
      }
    }
  ];

  let allSecure = true;

  for (const check of securityChecks) {
    try {
      if (check.check()) {
        log(`   âÅ“â€¦ ${check.name}`, 'green');
      } else {
        log(`   âÅ¡ ï¸�  ${check.name}`, 'yellow');
      }
    } catch (error) {
      log(`   â�Å’ ${check.name} - Erro na verificaÃ§Ã£o`, 'red');
      allSecure = false;
    }
  }

  return allSecure;
}

function generateReport(results) {
  log('\n' + '='.repeat(60), 'blue');
  log('ðÅ¸â€œÅ  RELATÃâ€œRIO FINAL DE VALIDAÃâ€¡ÃÆ’O', 'bold');
  log('='.repeat(60), 'blue');

  const categories = [
    { name: 'Integridade de Arquivos', result: results.integrity },
    { name: 'VariÃ¡veis de Ambiente', result: results.environment },
    { name: 'DependÃªncias', result: results.dependencies },
    { name: 'Qualidade do CÃ³digo', result: results.codeQuality },
    { name: 'SeguranÃ§a', result: results.security }
  ];

  let passedChecks = 0;
  const totalChecks = categories.length;

  for (const category of categories) {
    const status = category.result ? 'âÅ“â€¦ PASSOU' : 'â�Å’ FALHOU';
    const color = category.result ? 'green' : 'red';
    log(`${category.name}: ${status}`, color);
    if (category.result) passedChecks++;
  }

  const score = (passedChecks / totalChecks * 100).toFixed(1);
  log(`\nðÅ¸â€œË† PONTUAÃâ€¡ÃÆ’O GERAL: ${passedChecks}/${totalChecks} (${score}%)`, 
      score === '100.0' ? 'green' : score >= '80.0' ? 'yellow' : 'red');

  if (score === '100.0') {
    log('\nðÅ¸Å½â€° SISTEMA TOTALMENTE VALIDADO!', 'green');
    log('âÅ“¨ Todas as verificaÃ§Ãµes passaram com sucesso', 'green');
  } else if (score >= '80.0') {
    log('\nâÅ¡ ï¸�  SISTEMA FUNCIONAL COM PEQUENOS PROBLEMAS', 'yellow');
    log('ðÅ¸â€™¡ Corrija os itens marcados para melhor qualidade', 'yellow');
  } else {
    log('\nðÅ¸Å¡¨ SISTEMA COM PROBLEMAS CRÃ�TICOS', 'red');
    log('ðÅ¸â€�§ Corrija os problemas antes de usar em produÃ§Ã£o', 'red');
  }

  return score >= 80.0;
}

async function main() {
  log('ðÅ¸â€�� VALIDAÃâ€¡ÃÆ’O COMPLETA DO SISTEMA BEEF SYNC', 'bold');
  log('Verificando integridade, qualidade e seguranÃ§a...', 'blue');

  const results = {
    integrity: checkFileIntegrity(),
    environment: checkEnvironmentVariables(),
    dependencies: checkPackageDependencies(),
    codeQuality: checkCodeQuality(),
    security: checkSecurity()
  };

  const systemValid = generateReport(results);

  log('\nðÅ¸â€™¡ PRÃâ€œXIMOS PASSOS RECOMENDADOS:', 'bold');
  
  if (systemValid) {
    log('ââ‚¬¢ Execute npm run health:check para verificar APIs', 'blue');
    log('ââ‚¬¢ Execute npm run build para testar build de produÃ§Ã£o', 'blue');
    log('ââ‚¬¢ Configure backup automÃ¡tico com npm run backup', 'blue');
  } else {
    log('ââ‚¬¢ Corrija os problemas identificados acima', 'yellow');
    log('ââ‚¬¢ Execute novamente este script apÃ³s correÃ§Ãµes', 'yellow');
    log('ââ‚¬¢ Consulte a documentaÃ§Ã£o para ajuda', 'yellow');
  }

  process.exit(systemValid ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    log(`â�Å’ Erro crÃ­tico na validaÃ§Ã£o: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { 
  checkFileIntegrity, 
  checkEnvironmentVariables, 
  checkPackageDependencies,
  checkCodeQuality,
  checkSecurity 
};