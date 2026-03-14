// Script para limpar localStorage e forçar uso da API
console.log('🧹 Limpando localStorage...')

// Limpar dados de animais
localStorage.removeItem('animals')
localStorage.removeItem('animalData')
localStorage.removeItem('boletimContabilData')

console.log('✅ localStorage limpo!')
console.log('💡 Agora a página de contabilidade deve usar a API do PostgreSQL')

// Verificar se foi limpo
const animals = localStorage.getItem('animals')
const animalData = localStorage.getItem('animalData')
const boletimData = localStorage.getItem('boletimContabilData')

console.log('🔍 Verificação:')
console.log('  animals:', animals ? 'AINDA EXISTE' : 'REMOVIDO')
console.log('  animalData:', animalData ? 'AINDA EXISTE' : 'REMOVIDO')
console.log('  boletimContabilData:', boletimData ? 'AINDA EXISTE' : 'REMOVIDO')

if (!animals && !animalData && !boletimData) {
  console.log('🎉 localStorage completamente limpo!')
} else {
  console.log('⚠️ Alguns dados ainda existem no localStorage')
}
