#!/usr/bin/env node

/**
 * Script para limpar dados de notas fiscais do localStorage
 * Este script força o frontend a usar apenas dados do banco PostgreSQL
 */

console.log('�Ÿ�� Limpando dados de notas fiscais do localStorage...')

// Simular execução no navegador para limpar localStorage
const localStorageData = {
  'notasFiscais': '[]',
  'nfParaEdicao': null
}

console.log('�Ÿ“‹ Dados que serão limpos:')
Object.keys(localStorageData).forEach(key => {
  console.log(`  - ${key}: ${localStorageData[key]}`)
})

console.log('\n�œ… Script de limpeza do localStorage criado!')
console.log('�Ÿ“� Para aplicar a limpeza no navegador:')
console.log('   1. Abra o DevTools (F12)')
console.log('   2. Vá para a aba Console')
console.log('   3. Execute os comandos abaixo:')
console.log('')
console.log('   localStorage.removeItem("notasFiscais")')
console.log('   localStorage.removeItem("nfParaEdicao")')
console.log('   location.reload()')
console.log('')
console.log('�Ÿ”„ Ou simplesmente recarregue a página após executar os comandos acima.')

module.exports = { localStorageData }
