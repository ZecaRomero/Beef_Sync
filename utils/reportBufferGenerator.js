// Utilitário para gerar relatórios em buffer para envio
// Usa fetch interno para chamar as APIs de geração de relatórios

// Importar node-fetch se necessário (para Node.js < 18)
let fetchFunction = null
try {
  if (typeof fetch !== 'undefined') {
    fetchFunction = fetch
  } else {
    fetchFunction = require('node-fetch')
  }
} catch (e) {
  console.warn('⚠️ node-fetch não disponível, usando fetch global')
  fetchFunction = typeof fetch !== 'undefined' ? fetch : null
}

if (!fetchFunction) {
  throw new Error('Nenhuma função fetch disponível. Instale node-fetch ou use Node.js 18+')
}

/**
 * Obter URL base do servidor
 */
const getBaseUrl = (baseUrl = null) => {
  if (baseUrl) return baseUrl
  
  // Em produção, usar NEXTAUTH_URL ou construir a partir da requisição
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  
  // Em desenvolvimento, usar localhost
  const port = process.env.PORT || 3020
  return `http://localhost:${port}`
}

/**
 * Gerar o boletim de gado em buffer
 */
export const generateBoletimBuffer = async (period, baseUrl = null) => {
  try {
    const url = getBaseUrl(baseUrl)
    const fullUrl = `${url}/api/contabilidade/boletim-gado`
    
    console.log(`📊 Gerando boletim via ${fullUrl}`)
    
    const response = await fetchFunction(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro na resposta do boletim: ${response.status}`, errorText.substring(0, 200))
      throw new Error(`Erro ao gerar boletim: ${response.status} - ${errorText.substring(0, 100)}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('❌ Erro ao gerar boletim:', error.message)
    console.error('Stack:', error.stack)
    throw error
  }
}

/**
 * Gerar relatório de notas fiscais em buffer
 */
export const generateNotasFiscaisBuffer = async (period, baseUrl = null) => {
  try {
    const url = getBaseUrl(baseUrl)
    const fullUrl = `${url}/api/contabilidade/notas-fiscais`
    
    console.log(`📋 Gerando notas fiscais via ${fullUrl}`)
    
    const response = await fetchFunction(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro na resposta de notas fiscais: ${response.status}`, errorText.substring(0, 200))
      throw new Error(`Erro ao gerar notas fiscais: ${response.status} - ${errorText.substring(0, 100)}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('❌ Erro ao gerar notas fiscais:', error.message)
    console.error('Stack:', error.stack)
    throw error
  }
}

/**
 * Gerar relatório de movimentações em buffer
 */
export const generateMovimentacoesBuffer = async (period, baseUrl = null) => {
  try {
    const url = getBaseUrl(baseUrl)
    const fullUrl = `${url}/api/contabilidade/movimentacoes`
    
    console.log(`📈 Gerando movimentações via ${fullUrl}`)
    
    const response = await fetchFunction(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro na resposta de movimentações: ${response.status}`, errorText.substring(0, 200))
      throw new Error(`Erro ao gerar movimentações: ${response.status} - ${errorText.substring(0, 100)}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('❌ Erro ao gerar movimentações:', error.message)
    console.error('Stack:', error.stack)
    throw error
  }
}

/**
 * Gerar relatório de nascimentos em buffer
 */
export const generateNascimentosBuffer = async (period, baseUrl = null) => {
  try {
    const url = getBaseUrl(baseUrl)
    const fullUrl = `${url}/api/contabilidade/nascimentos`
    
    console.log(`👶 Gerando nascimentos via ${fullUrl}`)
    
    const response = await fetchFunction(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro na resposta de nascimentos: ${response.status}`, errorText.substring(0, 200))
      throw new Error(`Erro ao gerar nascimentos: ${response.status} - ${errorText.substring(0, 100)}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('❌ Erro ao gerar nascimentos:', error.message)
    console.error('Stack:', error.stack)
    throw error
  }
}

/**
 * Gerar relatório de mortes em buffer
 */
export const generateMortesBuffer = async (period, baseUrl = null) => {
  try {
    const url = getBaseUrl(baseUrl)
    const fullUrl = `${url}/api/contabilidade/mortes`
    
    console.log(`💀 Gerando mortes via ${fullUrl}`)
    
    const response = await fetchFunction(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro na resposta de mortes: ${response.status}`, errorText.substring(0, 200))
      throw new Error(`Erro ao gerar mortes: ${response.status} - ${errorText.substring(0, 100)}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('❌ Erro ao gerar mortes:', error.message)
    console.error('Stack:', error.stack)
    throw error
  }
}

/**
 * Gerar todos os relatórios em buffer
 * Retorna um objeto com os buffers dos relatórios
 */
export const generateAllReportsBuffer = async (period, baseUrl = null) => {
  try {
    console.log('📊 Gerando relatórios em buffer...')
    console.log('📅 Período:', period)
    console.log('🌐 Base URL:', baseUrl || getBaseUrl())
    
    // Gerar um por vez para melhor debug
    console.log('1/3 Gerando boletim...')
    const boletim = await generateBoletimBuffer(period, baseUrl)
    console.log('✅ Boletim gerado:', boletim.length, 'bytes')
    
    console.log('2/3 Gerando notas fiscais...')
    const notasFiscais = await generateNotasFiscaisBuffer(period, baseUrl)
    console.log('✅ Notas fiscais geradas:', notasFiscais.length, 'bytes')
    
    console.log('3/3 Gerando movimentações...')
    const movimentacoes = await generateMovimentacoesBuffer(period, baseUrl)
    console.log('✅ Movimentações geradas:', movimentacoes.length, 'bytes')

    return {
      boletim: {
        buffer: boletim,
        filename: `boletim-gado-${period.startDate}-${period.endDate}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      notasFiscais: {
        buffer: notasFiscais,
        filename: `notas-fiscais-${period.startDate}-${period.endDate}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      movimentacoes: {
        buffer: movimentacoes,
        filename: `movimentacoes-${period.startDate}-${period.endDate}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }
  } catch (error) {
    console.error('Erro ao gerar relatórios:', error)
    throw error
  }
}

