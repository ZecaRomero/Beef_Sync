/**
 * Tema de cores por sexo do animal
 * Machos: azul | Fêmeas: rosa
 */

export function isMacho(animal) {
  if (!animal?.sexo) return null
  const s = String(animal.sexo).toLowerCase()
  return s.includes('macho') || s === 'm'
}

export function getSexTheme(animal) {
  const macho = isMacho(animal)
  if (macho === null) return 'neutral' // sem sexo definido
  return macho ? 'macho' : 'femea'
}

/** Classes para fundo da página */
export function getPageBgClasses(sexTheme) {
  if (sexTheme === 'macho') {
    return 'bg-gradient-to-b from-blue-50/60 via-slate-50/80 to-sky-50/40 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/40'
  }
  if (sexTheme === 'femea') {
    return 'bg-gradient-to-b from-pink-50/60 via-slate-50/80 to-rose-50/40 dark:from-gray-900 dark:via-gray-900 dark:to-pink-950/40'
  }
  return 'bg-gradient-to-b from-amber-50/50 via-slate-50/80 to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/30'
}

/** Classes para card principal (header identificação) */
export function getCardHeaderClasses(sexTheme) {
  if (sexTheme === 'macho') {
    return 'bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/10 border-b border-blue-100 dark:border-gray-600'
  }
  if (sexTheme === 'femea') {
    return 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/10 border-b border-pink-100 dark:border-gray-600'
  }
  return 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border-b border-amber-100 dark:border-gray-600'
}

/** Classes para ícone do animal */
export function getIconClasses(sexTheme) {
  if (sexTheme === 'macho') {
    return 'bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/40 dark:to-sky-900/20'
  }
  if (sexTheme === 'femea') {
    return 'bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/20'
  }
  return 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/20'
}

/** Cor do ícone */
export function getIconColorClasses(sexTheme) {
  if (sexTheme === 'macho') return 'text-blue-600 dark:text-blue-400'
  if (sexTheme === 'femea') return 'text-pink-600 dark:text-pink-400'
  return 'text-amber-600 dark:text-amber-400'
}

/** Cor do texto identificação */
export function getIdentColorClasses(sexTheme) {
  if (sexTheme === 'macho') return 'text-blue-700 dark:text-blue-400'
  if (sexTheme === 'femea') return 'text-pink-700 dark:text-pink-400'
  return 'text-amber-700 dark:text-amber-400'
}

/** Cor do link Voltar e chips */
export function getAccentClasses(sexTheme) {
  if (sexTheme === 'macho') return 'text-blue-600 dark:text-blue-500'
  if (sexTheme === 'femea') return 'text-pink-600 dark:text-pink-500'
  return 'text-amber-600 dark:text-amber-500'
}

/** Classes para chips do header */
export function getChipClasses(sexTheme) {
  if (sexTheme === 'macho') {
    return 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200/50 dark:border-blue-700/50'
  }
  if (sexTheme === 'femea') {
    return 'bg-pink-50 dark:bg-pink-900/20 text-pink-800 dark:text-pink-200 border border-pink-200/50 dark:border-pink-700/50'
  }
  return 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200/50 dark:border-amber-700/50'
}

/** Cor do botão Nova Consulta (barra inferior) */
export function getPrimaryButtonClasses(sexTheme) {
  if (sexTheme === 'macho') {
    return 'bg-blue-500 dark:bg-blue-500 text-white hover:bg-blue-600 dark:hover:bg-blue-600'
  }
  if (sexTheme === 'femea') {
    return 'bg-pink-500 dark:bg-pink-500 text-white hover:bg-pink-600 dark:hover:bg-pink-600'
  }
  return 'bg-amber-500 dark:bg-amber-500 text-white hover:bg-amber-600 dark:hover:bg-amber-600'
}

/** Borda do card principal */
export function getCardBorderClasses(sexTheme) {
  if (sexTheme === 'macho') return 'border-blue-200/50 dark:border-gray-600'
  if (sexTheme === 'femea') return 'border-pink-200/50 dark:border-gray-600'
  return 'border-amber-200/50 dark:border-gray-600'
}

/** Classes para botão de localização (clique para ir) */
export function getLocationButtonClasses(sexTheme) {
  if (sexTheme === 'macho') {
    return 'bg-blue-50/50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/30'
  }
  if (sexTheme === 'femea') {
    return 'bg-pink-50/50 dark:bg-pink-900/20 border-t border-pink-100 dark:border-pink-800/30 hover:bg-pink-100/60 dark:hover:bg-pink-900/30'
  }
  return 'bg-amber-50/50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800/30 hover:bg-amber-100/60 dark:hover:bg-amber-900/30'
}

/** Texto do botão localização */
export function getLocationTextClasses(sexTheme) {
  if (sexTheme === 'macho') return 'text-blue-800 dark:text-blue-200'
  if (sexTheme === 'femea') return 'text-pink-800 dark:text-pink-200'
  return 'text-amber-800 dark:text-amber-200'
}

/** Sombra sutil para cards de métricas (dias fazenda, crias, etc) - accent por sexo */
export function getMetricsCardShadowClasses(sexTheme) {
  if (sexTheme === 'macho') return 'shadow-sm shadow-blue-200/40 dark:shadow-blue-900/20'
  if (sexTheme === 'femea') return 'shadow-sm shadow-pink-200/40 dark:shadow-pink-900/20'
  return 'shadow-sm shadow-amber-200/40 dark:shadow-amber-900/20'
}

