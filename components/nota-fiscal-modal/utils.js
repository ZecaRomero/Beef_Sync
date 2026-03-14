
// FunÃ§Ã£o auxiliar para normalizar data para formato YYYY-MM-DD (formato do input date)
export const normalizarDataParaInput = (data) => {
  if (!data) return ''
  
  // Se jÃ¡ estÃ¡ no formato YYYY-MM-DD, retornar como estÃ¡
  if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return data
  }
  
  // Se estÃ¡ no formato DD/MM/YYYY, converter para YYYY-MM-DD
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

// FunÃ§Ã£o para formatar valor no input
export const formatCurrencyInput = (value) => {
  if (!value) return ''
  const cleaned = value.toString().replace(/[^\d,]/g, '')
  const parts = cleaned.split(',')
  if (parts.length > 2) {
    return parts[0] + ',' + parts.slice(1).join('')
  }
  return cleaned
}

// FunÃ§Ã£o para converter valor formatado para nÃºmero (formato brasileiro)
export const parseCurrencyValue = (value) => {
  if (!value) return 0
  if (typeof value === 'number') return value
  
  const str = value.toString().trim()
  
  // Se jÃ¡ for nÃºmero puro, retornar
  if (!isNaN(str) && !str.includes(',') && !str.includes('.')) {
    return parseFloat(str) || 0
  }
  
  // Formato brasileiro: ponto Ã© milhar, vÃ­rgula Ã© decimal
  // Exemplo: "10.808,00" = 10808.00 ou "10,81" = 10.81
  let cleaned = str.replace(/[^\d,.-]/g, '')
  
  // Se tem vÃ­rgula, ela SEMPRE Ã© o separador decimal no formato brasileiro
  if (cleaned.includes(',')) {
    // Remover TODOS os pontos (separadores de milhar) e substituir vÃ­rgula por ponto
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (cleaned.includes('.')) {
    // Se sÃ³ tem ponto, verificar se Ã© separador de milhar ou decimal
    const parts = cleaned.split('.')
    if (parts.length > 1) {
      // Se a Ãºltima parte tem 2 ou menos dÃ­gitos, Ã© decimal
      if (parts[parts.length - 1].length <= 2) {
        // ÃÅ¡ltimo ponto Ã© decimal, remover os outros pontos (milhares)
        cleaned = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1]
      } else {
        // Todos os pontos sÃ£o separadores de milhar
        cleaned = cleaned.replace(/\./g, '')
      }
    }
  }
  
  const resultado = parseFloat(cleaned) || 0
  // Garantir que nÃ£o hÃ¡ problemas de precisÃ£o
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
