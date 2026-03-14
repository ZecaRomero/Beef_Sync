// Script para testar e debugar a importa√ß√£o de animais

console.log('≈∏‚Äùç Verificando dados no localStorage...')

// Verificar se h√° animais no localStorage
const animalsData = localStorage.getItem('animals')
console.log('≈∏‚Äú¶ Dados brutos do localStorage:', animalsData)

if (animalsData) {
  try {
    const animals = JSON.parse(animalsData)
    console.log('≈∏ê‚Äû Animais encontrados:', animals.length)
    console.log('≈∏‚Äùç Primeiro animal:', animals[0])
    console.log('≈∏‚Äùç √≈°ltimos 3 animais:', animals.slice(-3))
  } catch (error) {
    console.error('‚ù≈í Erro ao parsear dados:', error)
  }
} else {
  console.log('‚≈°†Ô∏è Nenhum dado encontrado no localStorage')
}

// Verificar se a API est√° funcionando
console.log('≈∏‚Äùç Testando API...')
fetch('/api/animals')
  .then(response => {
    console.log('≈∏‚Äú° Status da API:', response.status)
    return response.json()
  })
  .then(data => {
    console.log('≈∏‚Äú≈† Resposta da API:', data)
    if (data.success && data.data) {
      console.log('‚≈ì‚Ä¶ API funcionando, animais encontrados:', data.data.length)
    }
  })
  .catch(error => {
    console.error('‚ù≈í Erro na API:', error)
  })

// Fun√ß√£o para limpar dados (se necess√°rio)
window.clearAnimalsData = () => {
  localStorage.removeItem('animals')
  console.log('≈∏ßπ Dados do localStorage limpos')
}

// Fun√ß√£o para adicionar animal de teste
window.addTestAnimal = () => {
  const testAnimal = {
    id: Date.now(),
    serie: 'TEST',
    rg: '001',
    sexo: 'Macho',
    raca: 'Nelore',
    dataNascimento: '2023-01-01',
    situacao: 'Ativo',
    meses: 12,
    custoTotal: 120
  }
  
  const existingAnimals = JSON.parse(localStorage.getItem('animals') || '[]')
  existingAnimals.push(testAnimal)
  localStorage.setItem('animals', JSON.stringify(existingAnimals))
  
  console.log('‚≈ì‚Ä¶ Animal de teste adicionado:', testAnimal)
  console.log('≈∏‚Äú≈† Total de animais agora:', existingAnimals.length)
}

console.log('≈∏‚Ä∫†Ô∏è Fun√ß√µes dispon√≠veis:')
console.log('- clearAnimalsData() - Limpar dados')
console.log('- addTestAnimal() - Adicionar animal de teste')