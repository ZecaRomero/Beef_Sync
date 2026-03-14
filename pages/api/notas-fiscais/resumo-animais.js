import { query } from '../../../lib/database'

// Função para calcular era baseada em meses e sexo
function calcularEra(meses, sexo) {
  if (!meses || meses === 0) return 'Não informado'
  
  const isFemea = sexo && (sexo.toLowerCase().includes('fêmea') || sexo.toLowerCase().includes('femea') || sexo === 'F')
  const isMacho = sexo && (sexo.toLowerCase().includes('macho') || sexo === 'M')
  
  if (isFemea) {
    // FÊMEA: 0-3 / 3-8 / 8-12 / 12-24 / 25-36 / ACIMA 36
    if (meses <= 3) return '0 A 3'
    if (meses <= 8) return '3 A 8'
    if (meses <= 12) return '8 A 12'
    if (meses <= 24) return '12 A 24'
    if (meses <= 36) return '25 A 36'
    return 'ACIMA 36'
  } else if (isMacho) {
    // MACHO: 0-3 / 3-8 / 8-12 / 12-24 / 25-36 / ACIMA 36
    if (meses <= 3) return '0 A 3'
    if (meses <= 8) return '3 A 8'
    if (meses <= 12) return '8 A 12'
    if (meses <= 24) return '12 A 24'
    if (meses <= 36) return '25 A 36'
    return 'ACIMA 36'
  }
  
  return 'Não informado'
}

// Função para calcular meses a partir da era
function calcularMesesDaEra(era) {
  if (!era) return null
  
  const eraLower = era.toLowerCase().trim()
  
  if (eraLower.includes('0') && eraLower.includes('3')) return 1.5 // média
  if (eraLower.includes('3') && eraLower.includes('8')) return 5.5
  if (eraLower.includes('8') && eraLower.includes('12')) return 10
  if (eraLower.includes('12') && eraLower.includes('24')) return 18
  if (eraLower.includes('25') && eraLower.includes('36')) return 30.5
  if (eraLower.includes('acima') || eraLower.includes('36')) return 48
  
  // Tentar extrair número de meses diretamente
  const mesesMatch = era.match(/(\d+)\s*meses?/i)
  if (mesesMatch) {
    return parseInt(mesesMatch[1])
  }
  
  return null
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { numeroNF, localidade } = req.query
      
      if (!numeroNF) {
        return res.status(400).json({
          success: false,
          message: 'Número da nota fiscal é obrigatório'
        })
      }

      // Buscar animais da nota fiscal
      const animaisResult = await query(`
        SELECT 
          a.id,
          a.serie,
          a.rg,
          a.tatuagem,
          a.sexo,
          a.raca,
          a.meses,
          a.era,
          a.data_nascimento,
          a.peso_entrada,
          a.valor_compra,
          nf.numero_nf,
          nf.data as data_nf,
          nf.fornecedor
        FROM animais a
        LEFT JOIN notas_fiscais nf ON a.numero_nf = nf.numero_nf
        WHERE nf.numero_nf = $1
        ORDER BY a.sexo, a.meses, a.era
      `, [numeroNF])

      if (animaisResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum animal encontrado para esta nota fiscal'
        })
      }

      const animais = animaisResult.rows
      
      // Agrupar por era e sexo
      const resumo = {
        '0 A 3': { M: 0, F: 0 },
        '3 A 8': { M: 0, F: 0 },
        '8 A 12': { M: 0, F: 0 },
        '12 A 24': { M: 0, F: 0 },
        '25 A 36': { M: 0, F: 0 },
        'ACIMA 36': { M: 0, F: 0 }
      }

      animais.forEach(animal => {
        let era = animal.era
        
        // Se não tiver era, calcular a partir dos meses
        if (!era && animal.meses) {
          era = calcularEra(animal.meses, animal.sexo)
        } else if (!era && animal.data_nascimento) {
          // Calcular meses a partir da data de nascimento
          const hoje = new Date()
          const nascimento = new Date(animal.data_nascimento)
          const meses = Math.floor((hoje - nascimento) / (1000 * 60 * 60 * 24 * 30))
          era = calcularEra(meses, animal.sexo)
        }
        
        // Normalizar sexo
        const sexo = animal.sexo?.toUpperCase() === 'M' || animal.sexo?.toLowerCase().includes('macho') ? 'M' : 'F'
        
        // Normalizar era
        if (era && resumo[era]) {
          resumo[era][sexo] = (resumo[era][sexo] || 0) + 1
        }
      })

      // Calcular subtotais e total
      const subtotais = {
        M: Object.values(resumo).reduce((sum, era) => sum + (era.M || 0), 0),
        F: Object.values(resumo).reduce((sum, era) => sum + (era.F || 0), 0)
      }
      
      const total = subtotais.M + subtotais.F

      // Informações da NF
      const nfInfo = animais[0] ? {
        numeroNF: animais[0].numero_nf,
        dataNF: animais[0].data_nf,
        fornecedor: animais[0].fornecedor,
        localidade: localidade || 'AGROPECUÁRIA PARDINHO LTDA'
      } : null

      return res.status(200).json({
        success: true,
        data: {
          resumo,
          subtotais,
          total,
          nfInfo,
          totalAnimais: animais.length,
          animais: animais.map(a => ({
            id: a.id,
            tatuagem: a.tatuagem || `${a.serie}${a.rg}`,
            sexo: a.sexo,
            raca: a.raca,
            meses: a.meses,
            era: a.era || calcularEra(a.meses, a.sexo)
          }))
        }
      })
    }

    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido' 
    })
  } catch (error) {
    console.error('Erro na API de resumo de animais:', error)
    return res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
}

