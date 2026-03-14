// Script para limpar localStorage e for√ßar uso da API
console.log('≈∏ßπ Limpando localStorage...')

// Limpar dados de animais
localStorage.removeItem('animals')
localStorage.removeItem('animalData')
localStorage.removeItem('boletimContabilData')

console.log('‚≈ì‚Ä¶ localStorage limpo!')
console.log('≈∏‚Äô° Agora a p√°gina de contabilidade deve usar a API do PostgreSQL')

// Verificar se foi limpo
const animals = localStorage.getItem('animals')
const animalData = localStorage.getItem('animalData')
const boletimData = localStorage.getItem('boletimContabilData')

console.log('≈∏‚Äùç Verifica√ß√£o:')
console.log('  animals:', animals ? 'AINDA EXISTE' : 'REMOVIDO')
console.log('  animalData:', animalData ? 'AINDA EXISTE' : 'REMOVIDO')
console.log('  boletimContabilData:', boletimData ? 'AINDA EXISTE' : 'REMOVIDO')

if (!animals && !animalData && !boletimData) {
  console.log('≈∏≈Ω‚Ä∞ localStorage completamente limpo!')
} else {
  console.log('‚≈°†Ô∏è Alguns dados ainda existem no localStorage')
}
