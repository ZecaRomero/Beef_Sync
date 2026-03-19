export function normalizeRg(value) {
  return String(value || '').trim().replace(/^0+/, '') || '0'
}

export function normalizeSerie(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z]/g, '')
}

export function extractRgDigits(value) {
  const txt = String(value || '').trim()
  if (!txt) return ''
  const onlyDigits = txt.match(/^\d+$/)?.[0]
  if (onlyDigits) return normalizeRg(onlyDigits)
  const trailingDigits = txt.match(/(\d+)(?!.*\d)/)?.[1]
  return trailingDigits ? normalizeRg(trailingDigits) : ''
}

/**
 * Match sêmen com animal de forma precisa.
 * Exige match de série + RG quando possível, para evitar falsos positivos.
 */
export function matchesSemenWithAnimal({
  rgTouro,
  nomeTouro,
  animalSerie,
  animalRg,
}) {
  const alvoRg = normalizeRg(animalRg)
  const alvoSerie = normalizeSerie(animalSerie)
  if (!alvoRg || alvoRg === '0') return false

  const rg = String(rgTouro || '').trim()
  const nome = String(nomeTouro || '').trim()

  // 1. Se rg_touro está preenchido, usar ele como fonte primária
  if (rg) {
    // rg_touro pode ser só número ("15559") ou série+número ("CJCJ 15559", "CJCJ15559")
    const rgOnlyDigits = rg.replace(/[^0-9]/g, '')
    const rgLetters = rg.replace(/[^A-Za-z]/g, '').toUpperCase()

    if (rgLetters) {
      // rg_touro contém letras (ex: "CJCJ 15559") — exigir match de série E RG
      return rgLetters === alvoSerie && normalizeRg(rgOnlyDigits) === alvoRg
    } else {
      // rg_touro é só número (ex: "15559") — match por RG, mas verificar série no nome se possível
      if (normalizeRg(rg) !== alvoRg) return false
      // Se temos série do animal e nome do touro, verificar se a série bate
      if (alvoSerie && nome) {
        const nomeSerie = nome.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, alvoSerie.length)
        // Se o nome começa com letras que NÃO batem com a série, rejeitar
        const nomeLetters = nome.match(/^([A-Za-z]+)/)?.[1]?.toUpperCase() || ''
        if (nomeLetters && nomeLetters !== alvoSerie) return false
      }
      return true
    }
  }

  // 2. rg_touro vazio — tentar extrair do nome_touro
  if (!nome) return false

  // Extrair série e RG do nome (ex: "CJCJ 15559 ( MALAIO X REM ARMADOR)")
  // Padrão: letras no início + número logo depois
  const nomeMatch = nome.match(/^([A-Za-z]+)\s*(\d+)/)
  if (nomeMatch) {
    const nomeSerie = nomeMatch[1].toUpperCase()
    const nomeRg = normalizeRg(nomeMatch[2])
    if (alvoSerie) {
      // Exigir match de série E RG
      return nomeSerie === alvoSerie && nomeRg === alvoRg
    } else {
      // Sem série do animal, match só por RG
      return nomeRg === alvoRg
    }
  }

  return false
}
