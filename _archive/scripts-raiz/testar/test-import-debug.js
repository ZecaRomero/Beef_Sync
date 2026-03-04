// Script para testar e debugar a importação de animais

console.log('🔍 Verificando dados no localStorage...')

// Verificar se há animais no localStorage
const animalsData = localStorage.getItem('animals')
console.log('📦 Dados brutos do localStorage:', animalsData)

if (animalsData) {
  try {
    const animals = JSON.parse(animalsData)
    console.log('🐄 Animais encontrados:', animals.length)
    console.log('🔍 Primeiro animal:', animals[0])
    console.log('🔍 Últimos 3 animais:', animals.slice(-3))
  } catch (error) {
    console.error('❌ Erro ao parsear dados:', error)
  }
} else {
  console.log('⚠️ Nenhum dado encontrado no localStorage')
}

// Verificar se a API está funcionando
console.log('🔍 Testando API...')
fetch('/api/animals')
  .then(response => {
    console.log('📡 Status da API:', response.status)
    return response.json()
  })
  .then(data => {
    console.log('📊 Resposta da API:', data)
    if (data.success && data.data) {
      console.log('✅ API funcionando, animais encontrados:', data.data.length)
    }
  })
  .catch(error => {
    console.error('❌ Erro na API:', error)
  })

// Função para limpar dados (se necessário)
window.clearAnimalsData = () => {
  localStorage.removeItem('animals')
  console.log('🧹 Dados do localStorage limpos')
}

// Função para adicionar animal de teste
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
  
  console.log('✅ Animal de teste adicionado:', testAnimal)
  console.log('📊 Total de animais agora:', existingAnimals.length)
}

console.log('🛠️ Funções disponíveis:')
console.log('- clearAnimalsData() - Limpar dados')
console.log('- addTestAnimal() - Adicionar animal de teste')