
// Função auxiliar para normalizar data para formato YYYY-MM-DD (formato do input date)
export const normalizarDataParaInput = (data) => {
  if (!data) return ''
  
  // Se já está no formato YYYY-MM-DD, retornar como está
  if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return data
  }
  
  // Se está no formato DD/MM/YYYY, converter para YYYY-MM-DD
  if (typeof data === 'string' && data.includes('/')) {
    const [dia, mes, ano] = data.split('/')
    if (dia && mes && ano) {
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    }
  }
  
  // Tentar parsear como Date
  try {
    const dateObj = new Date(data)
    if (!isNaN(dateObj.getTime())) {
      const ano = dateObj.getFullYear()
      const mes = String(dateObj.getMonth() + 1).padStart(2, '0')
      const dia = String(dateObj.getDate()).padStart(2, '0')
      return `${ano}-${mes}-${dia}`
    }
  } catch (e) {
    console.error('Erro ao normalizar data:', e)
  }
  return ''
}

// Função para formatar valor no input
export const formatCurrencyInput = (value) => {
  if (!value) return ''
  const cleaned = value.toString().replace(/[^\d,]/g, '')
  const parts = cleaned.split(',')
  if (parts.length > 2) {
    return parts[0] + ',' + parts.slice(1).join('')
  }
  return cleaned
}

// Função para converter valor formatado para número (formato brasileiro)
export const parseCurrencyValue = (value) => {
  if (!value) return 0
  if (typeof value === 'number') return value
  
  const str = value.toString().trim()
  
  // Se já for número puro, retornar
  if (!isNaN(str) && !str.includes(',') && !str.includes('.')) {
    return parseFloat(str) || 0
  }
  
  // Formato brasileiro: ponto é milhar, vírgula é decimal
  // Exemplo: "10.808,00" = 10808.00 ou "10,81" = 10.81
  let cleaned = str.replace(/[^\d,.-]/g, '')
  
  // Se tem vírgula, ela SEMPRE é o separador decimal no formato brasileiro
  if (cleaned.includes(',')) {
    // Remover TODOS os pontos (separadores de milhar) e substituir vírgula por ponto
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (cleaned.includes('.')) {
    // Se só tem ponto, verificar se é separador de milhar ou decimal
    const parts = cleaned.split('.')
    if (parts.length > 1) {
      // Se a última parte tem 2 ou menos dígitos, é decimal
      if (parts[parts.length - 1].length <= 2) {
        // Último ponto é decimal, remover os outros pontos (milhares)
        cleaned = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1]
      } else {
        // Todos os pontos são separadores de milhar
        cleaned = cleaned.replace(/\./g, '')
      }
    }
  }
  
  const resultado = parseFloat(cleaned) || 0
  // Garantir que não há problemas de precisão
  return Math.round(resultado * 100) / 100
}

export const formatCurrency = (value) => {
  const numValue = typeof value === 'string' 
    ? parseCurrencyValue(value)
    : (value || 0)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue)
}
