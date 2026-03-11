/**
 * Estilos centralizados para badges de ranking (iABCZ, DECA, IQG, Pt IQG, MGTe)
 */

/**
 * Retorna classes CSS para badge de ranking por posição
 * @param {string} tipo - 'iabcz' | 'deca' | 'iqg' | 'ptiqg' | 'mgte'
 * @param {number} posicao - posição no ranking (1, 2, 3, 4-10)
 * @param {boolean} filhoTop - se é mãe do 1º
 */
export function getRankingBadgeClass(tipo, posicao, filhoTop = false) {
  if (filhoTop) {
    return 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-white text-sm font-bold shadow-lg'
  }
  if (posicao === 1) {
    return 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-white text-sm font-bold shadow-lg'
  }
  if (posicao === 2) {
    return 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-500 text-white text-sm font-bold shadow-lg'
  }
  if (posicao === 3) {
    return 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-700 text-white text-sm font-bold'
  }
  if (posicao >= 4 && posicao <= 10) {
    return 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-bold'
  }
  // Sem posição definida - cores por tipo
  const defaults = {
    iabcz: 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/20 border border-amber-400 text-amber-700 dark:text-amber-200',
    deca: 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 border border-teal-400 text-teal-700 dark:text-teal-300',
    iqg: 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-400 text-purple-700 dark:text-purple-300',
    ptiqg: 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-400 text-cyan-700 dark:text-cyan-300',
    mgte: 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-400 text-indigo-700 dark:text-indigo-300'
  }
  return defaults[tipo] || defaults.iabcz
}

/**
 * Retorna classes para chip compacto (header)
 */
export function getRankingChipClass(posicao, filhoTop = false) {
  if (filhoTop) return 'bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-400 text-indigo-700 dark:from-indigo-900/30 dark:to-purple-900/30 dark:border-indigo-600 dark:text-indigo-300'
  if (posicao === 1) return 'bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-200'
  if (posicao === 2) return 'bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-800/40 dark:border-slate-500 dark:text-slate-200'
  if (posicao === 3) return 'bg-amber-50 border-amber-500 text-amber-800 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300'
  if (posicao && posicao <= 10) return 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200'
  return 'bg-white border-gray-300 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'
}
