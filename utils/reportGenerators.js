// Funções auxiliares para gerar relatórios diretamente (sem HTTP)
// Estas funções podem ser chamadas diretamente de outras APIs

import ExcelJS from 'exceljs'
import databaseService from '../services/databaseService'
import { query } from '../lib/database'
import { RACAS_POR_SERIE as racasPorSerie } from './constants'

// Função para corrigir raça baseada na série
function corrigirRacaPorSerie(animal) {
  if (animal.serie && racasPorSerie[animal.serie]) {
    const racaCorreta = racasPorSerie[animal.serie]
    if (animal.raca !== racaCorreta) {
      return { ...animal, raca: racaCorreta }
    }
  }
  return animal
}

// Normalizar datas para PostgreSQL
function toPgDate(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString().split('T')[0]
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [d, m, y] = value.split('/')
      return `${y}-${m}-${d}`
    }
    const d = new Date(value)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    return null
  }
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
}

// Importar a lógica de geração de boletim
export async function generateBoletimBufferDirect(period) {
  // Esta função replica a lógica de pages/api/contabilidade/boletim-gado.js
  // Mas retorna apenas o buffer, sem enviar resposta HTTP
  
  // Por enquanto, vamos fazer uma chamada interna simples
  // Em produção, você pode extrair a lógica completa aqui
  const { default: boletimHandler } = await import('../pages/api/contabilidade/boletim-gado')
  
  // Criar um objeto res mock para capturar o buffer
  let capturedBuffer = null
  let capturedHeaders = {}
  
  const mockRes = {
    status: (code) => mockRes,
    json: (data) => { throw new Error(JSON.stringify(data)) },
    setHeader: (name, value) => { capturedHeaders[name] = value },
    send: (buffer) => { capturedBuffer = buffer },
    headers: {}
  }
  
  const mockReq = {
    method: 'POST',
    body: { period }
  }
  
  try {
    await boletimHandler(mockReq, mockRes)
    return Buffer.from(capturedBuffer)
  } catch (error) {
    // Se deu erro, tentar método alternativo: fazer requisição HTTP interna
    const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3020}`
    const fetchFunction = typeof fetch !== 'undefined' ? fetch : require('node-fetch')
    
    const response = await fetchFunction(`${baseUrl}/api/contabilidade/boletim-gado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro ao gerar boletim: ${response.status} - ${errorText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
}

// Gerar notas fiscais diretamente
export async function generateNotasFiscaisBufferDirect(period) {
  const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3020}`
  const fetchFunction = typeof fetch !== 'undefined' ? fetch : require('node-fetch')
  
  const response = await fetchFunction(`${baseUrl}/api/contabilidade/notas-fiscais`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Erro ao gerar notas fiscais: ${response.status} - ${errorText}`)
  }
  
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// Gerar movimentações diretamente
export async function generateMovimentacoesBufferDirect(period) {
  const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3020}`
  const fetchFunction = typeof fetch !== 'undefined' ? fetch : require('node-fetch')
  
  const response = await fetchFunction(`${baseUrl}/api/contabilidade/movimentacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Erro ao gerar movimentações: ${response.status} - ${errorText}`)
  }
  
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

