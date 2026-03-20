/**
 * Utility functions
 */
import { toLocalCalendarDate } from '../utils/dateCalendar'

export function cn(...inputs) {
  // Simplified version of cn
  return inputs
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatDate(date) {
  if (!date) return 'Não informado'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Data inválida'
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}

export function formatDateTime(date) {
  if (!date) return 'Não informado'
  try {
    const d = toLocalCalendarDate(date)
    if (!d || isNaN(d.getTime())) return 'Data inválida'
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Erro ao formatar data/hora:', error)
    return 'Data inválida'
  }
}

export function formatCurrency(value) {
  const numValue = parseFloat(value) || 0
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue)
}

export function formatNumber(value, decimals = 0) {
  const numValue = parseFloat(value) || 0
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numValue)
}

// Funções seguras para formatação
export function safeToLocaleString(value, options = { minimumFractionDigits: 2, maximumFractionDigits: 2 }) {
  if (value === null || value === undefined || value === '') return '0,00'
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return '0,00'
  return numValue.toLocaleString('pt-BR', options)
}

export function safeToLocaleDateString(value) {
  if (!value) return 'Não informado'
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return 'Data inválida'
    return date.toLocaleDateString('pt-BR')
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}

export function debounce(func, wait) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncate(str, length) {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '')
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false
  }

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf.charAt(10))) return false

  return true
}

export function formatCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '')
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatPhone(phone) {
  phone = phone.replace(/[^\d]/g, '')
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

