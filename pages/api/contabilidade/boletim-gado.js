import ExcelJS from 'exceljs'
import databaseService from '../../../services/databaseService'
import { RACAS_POR_SERIE as racasPorSerie } from '../../../utils/constants'

// FunÃ§Ã£o para corrigir raÃ§a baseada na sÃ©rie
function corrigirRacaPorSerie(animal) {
  if (animal.serie && racasPorSerie[animal.serie]) {
    const racaCorreta = racasPorSerie[animal.serie]
    if (animal.raca !== racaCorreta) {
      return { ...animal, raca: racaCorreta }
    }
  }
  return animal
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period, animalsData, sendToAccounting } = req.body

    if (!period || !period.startDate || !period.endDate) {
      return res.status(400).json({ message: 'PerÃ­odo Ã© obrigatÃ³rio' })
    }

    // Buscar animais diretamente do banco ao invÃ©s de receber no body
    // Isso evita problemas com limite de tamanho do body (1MB)
    let animals = []
    
    try {
      console.log('ðÅ¸â€�â€ž Buscando animais diretamente do banco de dados...')
      animals = await databaseService.buscarAnimais({})
      console.log(`âÅ“â€¦ ${animals.length} animais encontrados no banco`)
      
      // Converter formato do banco para formato esperado pelo cÃ³digo e corrigir raÃ§a por sÃ©rie
      animals = animals.map(animal => {
        const animalFormatado = {
          ...animal,
          dataNascimento: animal.data_nascimento || animal.dataNascimento,
          custoTotal: animal.custo_total || animal.custoTotal || 0,
          situacao: animal.situacao || 'Ativo'
        }
        // Corrigir raÃ§a baseada na sÃ©rie
        return corrigirRacaPorSerie(animalFormatado)
      })
    } catch (dbError) {
      console.error('â�Å’ Erro ao buscar animais do banco:', dbError)
      
      // Fallback: usar dados enviados se disponÃ­vel (para compatibilidade)
      if (animalsData && Array.isArray(animalsData) && animalsData.length > 0) {
        console.log('âÅ¡ ï¸� Usando animais do body como fallback:', animalsData.length)
        animals = animalsData
      } else {
        throw new Error('NÃ£o foi possÃ­vel buscar animais do banco de dados')
      }
    }
    
    if (animals.length === 0) {
      return res.status(400).json({ message: 'Nenhum animal encontrado no banco de dados' })
    }
    
    console.log(`ðÅ¸â€œÅ  Processando ${animals.length} animais para o boletim`)
    
    const workbook = new ExcelJS.Workbook()
    
    // Criar mÃºltiplas abas
    const boletimSheet = workbook.addWorksheet('Boletim por RaÃ§a')
    const resumoSheet = workbook.addWorksheet('Resumo Executivo')
    const detalhesSheet = workbook.addWorksheet('Detalhes dos Animais')

    // ============ ABA 1: BOLETIM POR RAÃâ€¡A ============
    
    // ConfiguraÃ§Ã£o do cabeÃ§alho principal
    boletimSheet.mergeCells('A1:H1')
    boletimSheet.getCell('A1').value = 'ðÅ¸�â€ž BOLETIM DE GADO - BEEF SYNC'
    boletimSheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FFFFFF' } }
    boletimSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
    boletimSheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E40AF' }
    }
    boletimSheet.getRow(1).height = 35

    // InformaÃ§Ãµes da empresa
    boletimSheet.mergeCells('A2:H2')
    boletimSheet.getCell('A2').value = 'RELATÃâ€œRIO CONTÃ�BIL PARA CONTABILIDADE'
    boletimSheet.getCell('A2').font = { size: 14, bold: true, color: { argb: '1E40AF' } }
    boletimSheet.getCell('A2').alignment = { horizontal: 'center' }
    boletimSheet.getRow(2).height = 25

    // PerÃ­odo
    boletimSheet.mergeCells('A3:H3')
    boletimSheet.getCell('A3').value = `PerÃ­odo: ${formatDate(period.startDate)} atÃ© ${formatDate(period.endDate)}`
    boletimSheet.getCell('A3').font = { size: 12, bold: true }
    boletimSheet.getCell('A3').alignment = { horizontal: 'center' }
    boletimSheet.getRow(3).height = 20

    // Data de geraÃ§Ã£o
    boletimSheet.mergeCells('A4:H4')
    boletimSheet.getCell('A4').value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`
    boletimSheet.getCell('A4').font = { size: 10, italic: true }
    boletimSheet.getCell('A4').alignment = { horizontal: 'center' }
    boletimSheet.getRow(4).height = 18

    boletimSheet.addRow([]) // Linha vazia

    // CabeÃ§alhos da tabela principal - separados por sexo
    const headerRowFemea = boletimSheet.addRow([
      'RaÃ§a',
      'FÃÅ MEA - 0-7 meses',
      'FÃÅ MEA - 7-12 meses',
      'FÃÅ MEA - 12-18 meses',
      'FÃÅ MEA - 18-24 meses',
      'FÃÅ MEA - 24+ meses',
      'MACHO - 0-7 meses',
      'MACHO - 7-15 meses',
      'MACHO - 15-18 meses',
      'MACHO - 18-22 meses',
      'MACHO - 22+ meses',
      'Total'
    ])
    
    headerRowFemea.font = { bold: true, color: { argb: 'FFFFFF' } }
    headerRowFemea.height = 30
    headerRowFemea.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E40AF' }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Calcular dados reais dos animais
    console.log('ðÅ¸â€�� Animais recebidos:', animals.length)
    console.log('ðÅ¸â€�� Dados dos animais:', animals.map(a => ({ 
      serie: a.serie, 
      rg: a.rg, 
      raca: a.raca, 
      dataNascimento: a.dataNascimento,
      data_nascimento: a.data_nascimento 
    })))
    
    const racas = [...new Set(animals.map(a => a.raca || 'NÃ£o informado'))]
    console.log('ðÅ¸â€�� RaÃ§as encontradas:', racas)
    
    const dadosPorRaca = {}
    
    // Inicializar contadores para cada raÃ§a - separados por sexo
    racas.forEach(raca => {
      dadosPorRaca[raca] = {
        // FÃªmeas
        'femea_0-7': 0,
        'femea_7-12': 0,
        'femea_12-18': 0,
        'femea_18-24': 0,
        'femea_24+': 0,
        // Machos
        'macho_0-7': 0,
        'macho_7-15': 0,
        'macho_15-18': 0,
        'macho_18-22': 0,
        'macho_22+': 0,
        total: 0
      }
    })

    // Calcular idade de cada animal e categorizar
    animals.forEach(animal => {
      // Verificar mÃºltiplos campos de data de nascimento
      const dataNascimento = animal.dataNascimento || animal.data_nascimento
      let idadeMeses = 0
      
      if (dataNascimento) {
      const nascimento = new Date(dataNascimento)
      const hoje = new Date()
      
      // Verificar se a data Ã© vÃ¡lida
        if (!isNaN(nascimento.getTime())) {
          idadeMeses = Math.floor((hoje - nascimento) / (1000 * 60 * 60 * 24 * 30.44)) // MÃ©dia de dias por mÃªs
        }
      }
      
      // Se nÃ£o tem data de nascimento ou Ã© invÃ¡lida, usar campo meses
      if (idadeMeses === 0 && animal.meses) {
        idadeMeses = parseInt(animal.meses) || 0
        console.log(`âÅ¡ ï¸� Animal sem data de nascimento, usando campo meses: ${animal.serie} ${animal.rg} | ${idadeMeses} meses`)
      }
      
      if (idadeMeses === 0) {
        console.log('âÅ¡ ï¸� Animal sem idade vÃ¡lida:', animal.serie, animal.rg)
        return // Pular animais sem idade vÃ¡lida
      }
      
      const raca = animal.raca || 'NÃ£o informado'
      
      console.log(`ðÅ¸â€�� Animal: ${animal.serie} ${animal.rg} | RaÃ§a: ${raca} | Idade: ${idadeMeses} meses | Data: ${dataNascimento || 'N/A'}`)
      
      if (!dadosPorRaca[raca]) {
        dadosPorRaca[raca] = {
          'femea_0-7': 0, 'femea_7-12': 0, 'femea_12-18': 0, 'femea_18-24': 0, 'femea_24+': 0,
          'macho_0-7': 0, 'macho_7-15': 0, 'macho_15-18': 0, 'macho_18-22': 0, 'macho_22+': 0,
          total: 0
        }
      }
      
      // Obter sexo do animal
      const sexo = animal.sexo || ''
      const isFemea = sexo.toLowerCase().includes('fÃªmea') || sexo.toLowerCase().includes('femea') || sexo === 'F'
      const isMacho = sexo.toLowerCase().includes('macho') || sexo === 'M'
      
      // Categorizar por faixa etÃ¡ria baseado no sexo
      if (isFemea) {
        // FÃÅ MEA: 0-7 / 7-12 / 12-18 / 18-24 / 24+
        if (idadeMeses >= 0 && idadeMeses <= 7) {
          dadosPorRaca[raca]['femea_0-7']++
          console.log(`âÅ“â€¦ ${raca} (FÃªmea): Categorizado como 0-7 meses`)
        } else if (idadeMeses > 7 && idadeMeses <= 12) {
          dadosPorRaca[raca]['femea_7-12']++
          console.log(`âÅ“â€¦ ${raca} (FÃªmea): Categorizado como 7-12 meses`)
        } else if (idadeMeses > 12 && idadeMeses <= 18) {
          dadosPorRaca[raca]['femea_12-18']++
          console.log(`âÅ“â€¦ ${raca} (FÃªmea): Categorizado como 12-18 meses`)
        } else if (idadeMeses > 18 && idadeMeses <= 24) {
          dadosPorRaca[raca]['femea_18-24']++
          console.log(`âÅ“â€¦ ${raca} (FÃªmea): Categorizado como 18-24 meses`)
        } else if (idadeMeses > 24) {
          dadosPorRaca[raca]['femea_24+']++
          console.log(`âÅ“â€¦ ${raca} (FÃªmea): Categorizado como 24+ meses`)
        }
      } else if (isMacho) {
        // MACHO: 0-7 / 7-15 / 15-18 / 18-22 / 22+
        if (idadeMeses >= 0 && idadeMeses <= 7) {
          dadosPorRaca[raca]['macho_0-7']++
          console.log(`âÅ“â€¦ ${raca} (Macho): Categorizado como 0-7 meses`)
        } else if (idadeMeses > 7 && idadeMeses <= 15) {
          dadosPorRaca[raca]['macho_7-15']++
          console.log(`âÅ“â€¦ ${raca} (Macho): Categorizado como 7-15 meses`)
        } else if (idadeMeses > 15 && idadeMeses <= 18) {
          dadosPorRaca[raca]['macho_15-18']++
          console.log(`âÅ“â€¦ ${raca} (Macho): Categorizado como 15-18 meses`)
        } else if (idadeMeses > 18 && idadeMeses <= 22) {
          dadosPorRaca[raca]['macho_18-22']++
          console.log(`âÅ“â€¦ ${raca} (Macho): Categorizado como 18-22 meses`)
        } else if (idadeMeses > 22) {
          dadosPorRaca[raca]['macho_22+']++
          console.log(`âÅ“â€¦ ${raca} (Macho): Categorizado como 22+ meses`)
        }
      } else {
        // Se nÃ£o tem sexo definido, nÃ£o categorizar
        console.log(`âÅ¡ ï¸� ${raca}: Animal sem sexo definido, nÃ£o categorizado`)
      }
      
      dadosPorRaca[raca].total++
    })
    
    console.log('ðÅ¸â€�� Dados por raÃ§a:', dadosPorRaca)

    // Adicionar linhas com dados reais (ordenadas por raÃ§a)
    const racasOrdenadas = racas.sort()
    racasOrdenadas.forEach(raca => {
      const dados = dadosPorRaca[raca]
      const row = boletimSheet.addRow([
        raca,
        dados['femea_0-7'],
        dados['femea_7-12'],
        dados['femea_12-18'],
        dados['femea_18-24'],
        dados['femea_24+'],
        dados['macho_0-7'],
        dados['macho_7-15'],
        dados['macho_15-18'],
        dados['macho_18-22'],
        dados['macho_22+'],
        dados.total
      ])
      
      row.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
          cell.alignment = { horizontal: 'center' }
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'CCCCCC' } },
          left: { style: 'thin', color: { argb: 'CCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
          right: { style: 'thin', color: { argb: 'CCCCCC' } }
        }
      })
    })

    // Calcular totais
    const totais = {
      'femea_0-7': racasOrdenadas.reduce((sum, raca) => sum + dadosPorRaca[raca]['femea_0-7'], 0),
      'femea_7-12': racasOrdenadas.reduce((sum, raca) => sum + dadosPorRaca[raca]['femea_7-12'], 0),
      'femea_12-18': racasOrdenadas.reduce((sum, raca) => sum + dadosPorRaca[raca]['femea_12-18'], 0),
      'femea_18-24': racasOrdenadas.reduce((sum, raca) => sum + dadosPorRaca[raca]['femea_18-24'], 0),
      'femea_24+': racasOrdenadas.reduce((sum, raca) => sum + dadosPorRaca[raca]['femea_24+'], 0),
      'macho_0-7': racasOrdenadas.reduce((sum, raca) => sum + dadosPorRaca[raca]['macho_0-7'], 0),
      'macho_7-15': racasOrdenadas.reduce((sum, raca) => sum + dadosPorRaca[raca]['macho_7-15'], 0),
      'macho_15-18': racasOrdenadas.reduce((sum, raca) => sum + dadosPorRaca[raca]['macho_15-18'], 0),
      'macho_18-22': racasOrdenadas.reduce((sum, raca) => sum + dadosPorRaca[raca]['macho_18-22'], 0),
      'macho_22+': racasOrdenadas.reduce((sum, raca) => sum + dadosPorRaca[raca]['macho_22+'], 0),
      total: racasOrdenadas.reduce((sum, raca) => sum + dadosPorRaca[raca].total, 0)
    }

    // Linha de total
    const totalRow = boletimSheet.addRow([
      'TOTAL GERAL',
      totais['femea_0-7'],
      totais['femea_7-12'],
      totais['femea_12-18'],
      totais['femea_18-24'],
      totais['femea_24+'],
      totais['macho_0-7'],
      totais['macho_7-15'],
      totais['macho_15-18'],
      totais['macho_18-22'],
      totais['macho_22+'],
      totais.total
    ])
    totalRow.font = { bold: true, color: { argb: 'FFFFFF' } }
    // Usar o Ã­ndice da coluna fornecido pelo eachCell para maior compatibilidade
    totalRow.eachCell((cell, colNumber) => {
      if (colNumber > 1) {
        cell.alignment = { horizontal: 'center' }
      }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E40AF' }
      }
      cell.border = {
        top: { style: 'double' },
        left: { style: 'thin' },
        bottom: { style: 'double' },
        right: { style: 'thin' }
      }
    })

    // Ajustar largura das colunas
    boletimSheet.columns = [
      { width: 25 }, // RaÃ§a
      { width: 18 }, // FÃÅ MEA - 0-7
      { width: 18 }, // FÃÅ MEA - 7-12
      { width: 18 }, // FÃÅ MEA - 12-18
      { width: 18 }, // FÃÅ MEA - 18-24
      { width: 18 }, // FÃÅ MEA - 24+
      { width: 18 }, // MACHO - 0-7
      { width: 18 }, // MACHO - 7-15
      { width: 18 }, // MACHO - 15-18
      { width: 18 }, // MACHO - 18-22
      { width: 18 }, // MACHO - 22+
      { width: 15 }  // Total
    ]

    // ============ ABA 2: RESUMO EXECUTIVO ============
    
    // CabeÃ§alho do resumo
    resumoSheet.mergeCells('A1:F1')
    resumoSheet.getCell('A1').value = 'ðÅ¸â€œÅ  RESUMO EXECUTIVO - REBANHO'
    resumoSheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFF' } }
    resumoSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
    resumoSheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '059669' }
    }
    resumoSheet.getRow(1).height = 30

    // EstatÃ­sticas gerais
    const estatisticasGerais = [
      ['Total de Animais', totais.total],
      ['Total de RaÃ§as', racasOrdenadas.length],
      ['Animais Ativos', animals.filter(a => a.situacao === 'Ativo').length],
      ['Animais Vendidos', animals.filter(a => a.situacao === 'Vendido').length],
      ['Animais Mortos', animals.filter(a => a.situacao === 'Morto').length]
    ]

    resumoSheet.addRow(['EstatÃ­sticas Gerais', '', '', '', '', ''])
    resumoSheet.addRow(['Item', 'Quantidade', '', '', '', ''])
    
    estatisticasGerais.forEach(([item, quantidade]) => {
      const row = resumoSheet.addRow([item, quantidade, '', '', '', ''])
      row.getCell(1).font = { bold: true }
      row.getCell(2).font = { bold: true, color: { argb: '059669' } }
    })

    resumoSheet.addRow([])

    // Resumo por raÃ§a
    resumoSheet.addRow(['Resumo por RaÃ§a', '', '', '', '', ''])
    resumoSheet.addRow(['RaÃ§a', 'Total', '0-3m', '4-7m', '8-12m', '13-24m'])
    
    racasOrdenadas.forEach(raca => {
      const dados = dadosPorRaca[raca]
      resumoSheet.addRow([
        raca,
        dados.total,
        dados['0-3'],
        dados['4-7'],
        dados['8-12'],
        dados['13-24']
      ])
    })

    // Ajustar largura das colunas
    resumoSheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 12 }
    ]

    // ============ ABA 3: DETALHES DOS ANIMAIS ============
    
    // CabeÃ§alho dos detalhes
    detalhesSheet.mergeCells('A1:P1')
    detalhesSheet.getCell('A1').value = 'ðÅ¸â€œâ€¹ DETALHES INDIVIDUAIS DOS ANIMAIS'
    detalhesSheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFF' } }
    detalhesSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
    detalhesSheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '7C3AED' }
    }
    detalhesSheet.getRow(1).height = 30

    // CabeÃ§alhos da tabela de detalhes
    const detalhesHeader = detalhesSheet.addRow([
      'SÃ©rie',
      'RG',
      'RaÃ§a',
      'Sexo',
      'Idade (meses)',
      'SituaÃ§Ã£o',
      'Custo Total',
      'Data Nascimento',
      'Peso',
      'ObservaÃ§Ãµes',
      'Data Cadastro',
      'Data da Morte',
      'Causa da Morte',
      'Valor da Perda (R$)',
      'ObservaÃ§Ãµes da Morte'
    ])
    
    detalhesHeader.font = { bold: true, color: { argb: 'FFFFFF' } }
    detalhesHeader.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '7C3AED' }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Buscar dados de morte para animais mortos
    const mortesData = {}
    try {
      const mortes = await databaseService.buscarMortes()
      mortes.forEach(morte => {
        mortesData[morte.animal_id] = morte
      })
    } catch (error) {
      console.warn('Erro ao buscar dados de morte:', error)
    }

    // Adicionar dados dos animais (ordenados por sÃ©rie e RG)
    const animaisOrdenados = animals.sort((a, b) => {
      const serieA = (a.serie || '').toLowerCase()
      const serieB = (b.serie || '').toLowerCase()
      if (serieA !== serieB) return serieA.localeCompare(serieB)
      return (a.rg || '').localeCompare(b.rg || '')
    })

    animaisOrdenados.forEach(animal => {
      const dataNascimento = animal.dataNascimento || animal.data_nascimento
      const idadeMeses = animal.meses || (dataNascimento ? 
        Math.floor((new Date() - new Date(dataNascimento)) / (1000 * 60 * 60 * 24 * 30.44)) : 0)
      
      // Buscar dados de morte para este animal
      const morteData = mortesData[animal.id]
      
      detalhesSheet.addRow([
        animal.serie || '',
        animal.rg || '',
        animal.raca || '',
        animal.sexo || '',
        idadeMeses,
        animal.situacao || '',
        animal.custoTotal || animal.custo_total || 0,
        dataNascimento ? formatDate(dataNascimento) : '',
        animal.peso || '',
        animal.observacoes || '',
        animal.created_at ? formatDate(animal.created_at) : '',
        morteData?.data_morte ? formatDate(morteData.data_morte) : '',
        morteData?.causa_morte || '',
        morteData?.valor_perda || '',
        morteData?.observacoes || ''
      ])
    })

    // Ajustar largura das colunas
    detalhesSheet.columns = [
      { width: 12 }, // SÃ©rie
      { width: 12 }, // RG
      { width: 20 }, // RaÃ§a
      { width: 10 }, // Sexo
      { width: 12 }, // Idade
      { width: 12 }, // SituaÃ§Ã£o
      { width: 15 }, // Custo
      { width: 15 }, // Data Nascimento
      { width: 10 }, // Peso
      { width: 30 }, // ObservaÃ§Ãµes
      { width: 15 }, // Data Cadastro
      { width: 15 }, // Data da Morte
      { width: 20 }, // Causa da Morte
      { width: 15 }, // Valor da Perda
      { width: 30 }  // ObservaÃ§Ãµes da Morte
    ]

    // Adicionar observaÃ§Ãµes finais na primeira aba
    const obsRow = boletimSheet.lastRow.number + 3
    boletimSheet.mergeCells(`A${obsRow}:H${obsRow}`)
    boletimSheet.getCell(`A${obsRow}`).value = 'ObservaÃ§Ãµes Importantes'
    boletimSheet.getCell(`A${obsRow}`).font = { bold: true, size: 12 }
    boletimSheet.getCell(`A${obsRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FEF3C7' }
    }

    const obs = [
      'ââ‚¬¢ Os dados apresentados referem-se ao rebanho no perÃ­odo especificado',
      'ââ‚¬¢ A idade Ã© calculada com base na data de nascimento ou campo meses registrado no sistema',
      'ââ‚¬¢ Animais sem idade vÃ¡lida nÃ£o sÃ£o incluÃ­dos nas faixas etÃ¡rias',
      'ââ‚¬¢ Este relatÃ³rio foi gerado automaticamente pelo sistema Beef Sync',
      'ââ‚¬¢ RelatÃ³rio destinado Ã  contabilidade para fins de controle patrimonial'
    ]

    obs.forEach((texto, index) => {
      const row = boletimSheet.addRow([texto])
      boletimSheet.mergeCells(`A${row.number}:H${row.number}`)
      row.getCell(1).font = { size: 9, italic: true }
      row.getCell(1).alignment = { horizontal: 'left' }
    })

    // Gerar o arquivo
    const buffer = await workbook.xlsx.writeBuffer()

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="boletim-gado-contabilidade-${period.startDate}-${period.endDate}.xlsx"`)
    res.send(Buffer.from(buffer))

  } catch (error) {
    console.error('Erro ao gerar boletim de gado:', error)
    res.status(500).json({ 
      message: 'Erro ao gerar boletim de gado',
      error: error.message 
    })
  }
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR')
}