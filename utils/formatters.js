/**
 * Funções de formatação centralizadas
 */
import { toLocalCalendarDate } from './dateCalendar'

export { toLocalCalendarDate }

/**
 * Formata valor monetário em BRL
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata número com separadores
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formata data em pt-BR
 */
export function formatDate(date, format = 'short') {
  if (!date) return '';
  
  const d = toLocalCalendarDate(date);
  if (!d || isNaN(d.getTime())) return '';
  
  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: '2-digit', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
  };
  
  return new Intl.DateTimeFormat('pt-BR', options[format] || options.short).format(d);
}

/**
 * Formata data e hora
 */
export function formatDateTime(date) {
  if (!date) return '';
  
  const d = toLocalCalendarDate(date);
  if (!d || isNaN(d.getTime())) return '';
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Normaliza identificação de doadora (ex: "CJCJ-13604 13604" -> "CJCJ 13604")
 */
export function formatDoadoraIdentificacao(str) {
  if (!str || typeof str !== 'string') return str
  const t = str.trim()
  const m = t.match(/^([A-Za-z]+)-?(\d+)\s+\2$/) // "CJCJ-13604 13604" ou "CJCJ13604 13604"
  if (m) return `${m[1]} ${m[2]}`
  const m2 = t.match(/^([A-Za-z]+)-(\d+)$/) // "CJCJ-13604"
  if (m2) return `${m2[1]} ${m2[2]}`
  return t
}

/**
 * Formata CPF
 */
export function formatCPF(cpf) {
  if (!cpf) return '';
  const digits = cpf.replace(/[^\d]/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ
 */
export function formatCNPJ(cnpj) {
  if (!cnpj) return '';
  const digits = cnpj.replace(/[^\d]/g, '');
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata telefone
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/[^\d]/g, '');
  
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

/**
 * Calcula idade em meses
 */
export function calcularMesesIdade(dataNascimento, mesesCampo) {
  if (mesesCampo != null && !isNaN(parseInt(mesesCampo))) return parseInt(mesesCampo)
  if (!dataNascimento) return null
  const dt = toLocalCalendarDate(dataNascimento)
  if (!dt || isNaN(dt.getTime())) return null
  return Math.floor((new Date() - dt) / (1000 * 60 * 60 * 24 * 30.44))
}

/**
 * Calcula idade em meses em uma data de referência (ex: data da venda)
 */
export function calcularMesesIdadeNaData(dataNascimento, dataRef, mesesCampo) {
  if (mesesCampo != null && !isNaN(parseInt(mesesCampo)) && !dataRef) return parseInt(mesesCampo)
  if (!dataNascimento || !dataRef) return null
  const dtNasc = toLocalCalendarDate(dataNascimento)
  const dtRef = toLocalCalendarDate(dataRef)
  if (!dtNasc || !dtRef || isNaN(dtNasc.getTime()) || isNaN(dtRef.getTime())) return null
  return Math.floor((dtRef - dtNasc) / (1000 * 60 * 60 * 24 * 30.44))
}

/**
 * Calcula era (faixa etária) baseada em meses e sexo
 */
export function calcularEra(meses, sexo) {
  if (!meses || meses <= 0) return null
  const m = parseInt(meses)
  const isFemea = sexo && (String(sexo).toLowerCase().includes('fêmea') || String(sexo).toLowerCase().includes('femea') || sexo === 'F')
  const isMacho = sexo && (String(sexo).toLowerCase().includes('macho') || sexo === 'M')
  if (isFemea) {
    if (m <= 7) return '0/7'
    if (m <= 12) return '7/12'
    if (m <= 18) return '12/18'
    if (m <= 24) return '18/24'
    return '24+'
  }
  if (isMacho) {
    if (m <= 7) return '0/7'
    if (m <= 15) return '7/15'
    if (m <= 18) return '15/18'
    if (m <= 22) return '18/22'
    return '22+'
  }
  if (m <= 7) return '0/7'
  if (m <= 12) return '7/12'
  if (m <= 18) return '12/18'
  if (m <= 24) return '18/24'
  return '24+'
}

/**
 * Filtra nomes de touros que aparecem como localização
 */
export function localizacaoValidaParaExibir(loc) {
  if (!loc || typeof loc !== 'string') return null
  const n = loc.trim()
  if (!n || /^(VAZIO|NÃO INFORMADO|NAO INFORMADO|-)$/i.test(n)) return null
  if (/^PIQUETE\s+(\d+|CABANHA|CONF|GUARITA|PISTA)$/i.test(n)) return loc
  if (/^PROJETO\s+[\dA-Za-z\-/]+$/i.test(n)) return loc
  if (/^CONFINA$/i.test(n)) return loc
  if (/^PIQ\s+\d+$/i.test(n)) return loc.replace(/^PIQ\s+/i, 'PIQUETE ')
  // Abreviações comuns de importação: CABANHA, GUARITA, PISTA, CONF
  if (/^(CABANHA|GUARITA|PISTA|CONF)$/i.test(n)) return loc
  return null // Nome de touro ou inválido
}

/**
 * Formata porcentagem
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Formata bytes em formato legível
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Trunca texto com reticências
 */
export function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitaliza primeira letra
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Formata nome próprio (primeira letra de cada palavra maiúscula)
 */
export function formatProperName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
