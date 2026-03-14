#!/usr/bin/env node

/**
 * Script de otimizaÃ§Ã£o para produÃ§Ã£o
 * Remove console.logs desnecessÃ¡rios e otimiza o cÃ³digo
 */

const fs = require('fs');
const path = require('path');

// DiretÃ³rios para otimizar
const DIRECTORIES = [
  'components',
  'pages',
  'hooks',
  'utils',
  'services'
];

// PadrÃµes de console.log para manter (importantes para debug)
const KEEP_PATTERNS = [
  /console\.error/,
  /console\.warn/,
  /console\.info.*crÃ­tico/i,
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
      // Remover console.log desnecessÃ¡rios
      if (line.includes('console.log') && !shouldKeepConsoleLog(line)) {
        modified = true;
        // Comentar ao invÃ©s de remover completamente
        return line.replace(/(\s*)console\.log/, '$1// console.log');
      }
      
      return line;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, optimizedLines.join('\n'));
      console.log(`âÅ“â€¦ Otimizado: ${filePath}`);
      return 1;
    }
    
    return 0;
  } catch (error) {
    console.error(`â�Å’ Erro ao otimizar ${filePath}:`, error.message);
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
    console.error(`â�Å’ Erro ao processar diretÃ³rio ${dirPath}:`, error.message);
  }
  
  return optimizedCount;
}

function main() {
  console.log('ðÅ¸Å¡â‚¬ Iniciando otimizaÃ§Ã£o para produÃ§Ã£o...\n');
  
  let totalOptimized = 0;
  
  for (const dir of DIRECTORIES) {
    if (fs.existsSync(dir)) {
      console.log(`ðÅ¸â€œ� Otimizando diretÃ³rio: ${dir}`);
      totalOptimized += optimizeDirectory(dir);
    } else {
      console.log(`âÅ¡ ï¸�  DiretÃ³rio nÃ£o encontrado: ${dir}`);
    }
  }
  
  console.log(`\nðÅ¸Å½â€° OtimizaÃ§Ã£o concluÃ­da!`);
  console.log(`ðÅ¸â€œÅ  Total de arquivos otimizados: ${totalOptimized}`);
  
  if (totalOptimized > 0) {
    console.log('\nðÅ¸â€™¡ Dicas:');
    console.log('ââ‚¬¢ Console.logs foram comentados, nÃ£o removidos');
    console.log('ââ‚¬¢ Console.error e console.warn foram mantidos');
    console.log('ââ‚¬¢ Execute npm run build para gerar versÃ£o otimizada');
  }
}

if (require.main === module) {
  main();
}

module.exports = { optimizeFile, optimizeDirectory };