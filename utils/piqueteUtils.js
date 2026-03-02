/**
 * Filtra valores que parecem nomes de touros (cadastrados por engano como piquete).
 * Usado nos dropdowns de Localização/Piquete para evitar exibir nomes como
 * "6966 FIV KATISPERA (PODEROSO)", "B7556 FIV DA EAO (ELITE)", etc.
 */
export function ehPiqueteValido(nome) {
  if (!nome || typeof nome !== 'string') return false
  const n = nome.trim()
  if (!n) return false
  // Excluir padrões típicos de nomes de touros
  if (/\bFIV\b/i.test(n)) return false
  if (/\([^)]+\)/.test(n)) return false // genealogia: (PODEROSO), (AZULEJO), (MAGNATA)
  if (/\bDA\s+[A-Za-z.]/i.test(n) && !/^PIQUETE|^PROJETO|^CURRAL|^PASTO/i.test(n)) return false // DA XARAES, DA S.NICE
  if (/^\d{4,}[A-Z]|\d+[A-Z]\s+-/i.test(n)) return false // 11627J, 1486L, etc
  if (/^[A-Z]\d{4}/i.test(n)) return false // A7389, B7556, C2506 (com ou sem espaço)
  if (/^\d{3,}\s+[A-Z]/i.test(n)) return false // 2774 FIV, 3272 FC, etc
  if (/^\([A-Z]+\)/.test(n)) return false // (MAGNATA) no início
  return true
}

/**
 * Busca lista de piquetes/locais disponíveis para dropdowns.
 * Prioriza piquetes cadastrados e locais, filtra nomes de touros das localizações.
 */
export async function fetchAvailableLocations() {
  const piquetesUsados = new Set()
  const piquetesList = []

  // 1. Piquetes cadastrados (aplicar filtro - pode ter nomes de touros por engano)
  try {
    const piquetesResponse = await fetch('/api/piquetes')
    if (piquetesResponse.ok) {
      const piquetesData = await piquetesResponse.json()
      const piquetesArray = piquetesData.piquetes || piquetesData.data?.piquetes || piquetesData.data || []
      if (Array.isArray(piquetesArray) && piquetesArray.length > 0) {
        piquetesArray.forEach((piquete) => {
          const nome = typeof piquete === 'object' ? piquete.nome : piquete
          if (nome && ehPiqueteValido(nome) && !piquetesUsados.has(nome)) {
            piquetesUsados.add(nome)
            piquetesList.push(nome)
          }
        })
      }
    }
  } catch (error) {
    console.warn('Erro ao buscar piquetes cadastrados:', error)
  }

  // 2. API de locais (aplicar filtro - pode ter nomes de touros por engano)
  try {
    const response = await fetch('/api/locais')
    if (response.ok) {
      const data = await response.json()
      if (data.data && data.data.length > 0) {
        data.data.forEach((local) => {
          const nome = local.nome || local
          if (nome && ehPiqueteValido(nome) && !piquetesUsados.has(nome)) {
            piquetesUsados.add(nome)
            piquetesList.push(nome)
          }
        })
      }
    }
  } catch (error) {
    console.warn('Erro ao carregar locais da API:', error)
  }

  // 3. Localizações (filtrar - pode conter nomes de touros por engano)
  try {
    const localizacoesResponse = await fetch('/api/localizacoes')
    if (localizacoesResponse.ok) {
      const localizacoesData = await localizacoesResponse.json()
      const localizacoesApi = localizacoesData.data || []
      localizacoesApi.forEach((loc) => {
        if (loc.piquete && ehPiqueteValido(loc.piquete) && !piquetesUsados.has(loc.piquete)) {
          piquetesUsados.add(loc.piquete)
          piquetesList.push(loc.piquete)
        }
      })
    }
  } catch (error) {
    console.warn('Erro ao buscar localizações da API:', error)
  }

  piquetesList.sort((a, b) => a.localeCompare(b))
  return piquetesList
}
