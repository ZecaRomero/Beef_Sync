#!/usr/bin/env node

/**
 * Script de otimização para produção
 * Remove console.logs desnecessários e otimiza o código
 */

const fs = require('fs');
const path = require('path');

// Diretórios para otimizar
const DIRECTORIES = [
  'components',
  'pages',
  'hooks',
  'utils',
  'services'
];

// Padrões de console.log para manter (importantes para debug)
const KEEP_PATTERNS = [
  /console\.error/,
  /console\.warn/,
  /console\.info.*crítico/i,
  /console\.log.*erro/i,
  /console\.log.*falha/i
];

function shouldKeepConsoleLog(line) {
  return KEEP_PATTERNS.some(pattern => pattern.test(line));
}

function optimizeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let modified = false;
    const optimizedLines = lines.map(line => {
      // Remover console.log desnecessários
      if (line.includes('console.log') && !shouldKeepConsoleLog(line)) {
        modified = true;
        // Comentar ao invés de remover completamente
        return line.replace(/(\s*)console\.log/, '$1// console.log');
      }
      
      return line;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, optimizedLines.join('\n'));
      console.log(`✅ Otimizado: ${filePath}`);
      return 1;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Erro ao otimizar ${filePath}:`, error.message);
    return 0;
  }
}

function optimizeDirectory(dirPath) {
  let optimizedCount = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        optimizedCount += optimizeDirectory(itemPath);
      } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
        optimizedCount += optimizeFile(itemPath);
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao processar diretório ${dirPath}:`, error.message);
  }
  
  return optimizedCount;
}

function main() {
  console.log('🚀 Iniciando otimização para produção...\n');
  
  let totalOptimized = 0;
  
  for (const dir of DIRECTORIES) {
    if (fs.existsSync(dir)) {
      console.log(`📁 Otimizando diretório: ${dir}`);
      totalOptimized += optimizeDirectory(dir);
    } else {
      console.log(`⚠️  Diretório não encontrado: ${dir}`);
    }
  }
  
  console.log(`\n🎉 Otimização concluída!`);
  console.log(`📊 Total de arquivos otimizados: ${totalOptimized}`);
  
  if (totalOptimized > 0) {
    console.log('\n💡 Dicas:');
    console.log('• Console.logs foram comentados, não removidos');
    console.log('• Console.error e console.warn foram mantidos');
    console.log('• Execute npm run build para gerar versão otimizada');
  }
}

if (require.main === module) {
  main();
}

module.exports = { optimizeFile, optimizeDirectory };