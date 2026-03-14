/**
 * Utilitário para padronizar importações React em todo o projeto
 * Padrão: import React, { hooks } from 'react'
 */

const fs = require('fs')
const path = require('path')

// Padrão de importação React recomendado
const STANDARD_REACT_IMPORT = "import React, { "

// Função para padronizar importação React em um arquivo
function standardizeReactImport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Regex para encontrar diferentes padrões de importação React
    const reactImportRegex = /^import\s+(?:React\s*,\s*)?(?:\{\s*([^}]+)\s*\}\s+from\s+['"]react['"]|React\s+from\s+['"]react['"])/gm
    
    let updatedContent = content
    let hasReactImport = false
    let hooks = new Set()
    
    // Extrair todos os hooks importados
    const matches = [...content.matchAll(reactImportRegex)]
    
    matches.forEach(match => {
      hasReactImport = true
      if (match[1]) {
        // Extrair hooks da importação
        const importedHooks = match[1].split(',').map(h => h.trim()).filter(h => h)
        importedHooks.forEach(hook => hooks.add(hook))
      }
    })
    
    if (hasReactImport) {
      // Remover todas as importações React existentes
      updatedContent = updatedContent.replace(reactImportRegex, '')
      
      // Adicionar importação padronizada no início
      const hooksArray = Array.from(hooks).sort()
      const standardImport = hooksArray.length > 0 
        ? `import React, { ${hooksArray.join(', ')} } from 'react'\n`
        : `import React from 'react'\n`
      
      // Inserir no início do arquivo, após comentários iniciais
      const lines = updatedContent.split('\n')
      let insertIndex = 0
      
      // Pular comentários iniciais e imports de outros módulos
      while (insertIndex < lines.length && 
             (lines[insertIndex].trim().startsWith('//') || 
              lines[insertIndex].trim().startsWith('/*') ||
              lines[insertIndex].trim().startsWith('*') ||
              lines[insertIndex].trim() === '')) {
        insertIndex++
      }
      
      lines.splice(insertIndex, 0, standardImport)
      updatedContent = lines.join('\n')
      
      // Remover linhas vazias extras
      updatedContent = updatedContent.replace(/\n\n\n+/g, '\n\n')
      
      fs.writeFileSync(filePath, updatedContent)
      console.log(`✓ Padronizado: ${filePath}`)
      return true
    }
    
    return false
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error.message)
    return false
  }
}

// Função para processar todos os arquivos JS/JSX/TS/TSX
function standardizeAllReactImports(directory) {
  const extensions = ['.js', '.jsx', '.ts', '.tsx']
  let processedCount = 0
  
  function processDirectory(dir) {
    const items = fs.readdirSync(dir)
    
    items.forEach(item => {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        processDirectory(fullPath)
      } else if (stat.isFile() && extensions.includes(path.extname(item))) {
        if (standardizeReactImport(fullPath)) {
          processedCount++
        }
      }
    })
  }
  
  processDirectory(directory)
  console.log(`\n✅ Processados ${processedCount} arquivos com importações React padronizadas`)
}

module.exports = {
  standardizeReactImport,
  standardizeAllReactImports
}

// Se executado diretamente
if (require.main === module) {
  const projectRoot = process.argv[2] || process.cwd()
  console.log(`Padronizando importações React em: ${projectRoot}`)
  standardizeAllReactImports(projectRoot)
}