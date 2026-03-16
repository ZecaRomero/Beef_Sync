/**
 * Utilitários centralizados para animais
 */

/**
 * Extrai série e RG de texto (ex: "CJCJ 13604", "CJCJ-13604", "CJ SANT ANNA 13604")
 * @param {string} texto - texto com identificação
 * @param {string} serieFilho - série do filho (para inferir série da mãe quando só tem RG no final)
 * @returns {{ serie: string, rg: string }}
 */
export function extrairSerieRG(texto, serieFilho = '') {
  if (!texto) return { serie: '', rg: '' }
  const t = String(texto).trim()
  if (!t) return { serie: '', rg: '' }
  const m1 = t.match(/^([A-Za-z]+)-(\d+)$/)
  if (m1) return { serie: m1[1], rg: m1[2] }
  const m2 = t.match(/^([A-Za-z]+)\s*(\d+)$/)
  if (m2) return { serie: m2[1], rg: m2[2] }
  // Formato "CJ SANT ANNA 13604" - extrair RG do final
  const m3 = t.match(/\s+(\d+)$/)
  if (m3) {
    const rg = m3[1]
    const serie = serieFilho || (t.match(/^CJ/i) ? 'CJCJ' : '')
    return { serie, rg }
  }
  const m4 = t.match(/^(\d+)$/)
  if (m4 && serieFilho) return { serie: serieFilho, rg: m4[1] }
  return { serie: '', rg: '' }
}

/**
 * Formata o nome do animal no padrão: NOME SANT ANNA RG
 * Ex: "JALOUSIER SANT ANNA 16974"
 * Se não tiver nome próprio, usa só "SANT ANNA RG"
 * @param {object} animal - objeto com campos nome, serie, rg
 * @returns {string}
 */
export function formatNomeAnimal(animal) {
  if (!animal) return '-'
  const rg = animal.rg ? String(animal.rg).trim() : ''
  const nomeBase = animal.nome ? String(animal.nome).trim() : ''

  // Se o nome já contém SANT ANNA, só garante que o RG está no final
  if (nomeBase.toUpperCase().includes('SANT ANNA')) {
    // Remove RG duplicado no final se já existir
    const semRg = nomeBase.replace(/\s+\d+$/, '').trim()
    return rg ? `${semRg} ${rg}` : semRg
  }

  // Nome próprio sem SANT ANNA
  if (nomeBase) {
    return rg ? `${nomeBase} SANT ANNA ${rg}` : `${nomeBase} SANT ANNA`
  }

  // Sem nome: só SANT ANNA + RG
  return rg ? `SANT ANNA ${rg}` : (animal.serie ? `${animal.serie} ${rg}`.trim() : '-')
}
