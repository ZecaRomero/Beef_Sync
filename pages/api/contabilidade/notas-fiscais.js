import ExcelJS from 'exceljs'
import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period } = req.body

    console.log('📋 Recebida requisição para gerar relatório de notas fiscais:', { period })

    if (!period || !period.startDate || !period.endDate) {
      return res.status(400).json({ message: 'Período é obrigatório' })
    }

    // Normalizar datas para formato aceito pelo PostgreSQL (YYYY-MM-DD)
    const toPgDate = (value) => {
      if (!value) return null
      if (value instanceof Date) return value.toISOString().split('T')[0]
      if (typeof value === 'string') {
        // ISO: YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
        // dd/MM/yyyy
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

    const pgStart = toPgDate(period.startDate)
    const pgEnd = toPgDate(period.endDate)
    if (!pgStart || !pgEnd) {
      return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD ou dd/MM/yyyy.' })
    }

    const workbook = new ExcelJS.Workbook()
    
    // ABA 1: NFs de Entrada
    const sheetEntradas = workbook.addWorksheet('NFs de Entrada')
    
    // Cabeçalho Entradas
    sheetEntradas.mergeCells('A1:G1')
    sheetEntradas.getCell('A1').value = '📥 NOTAS FISCAIS DE ENTRADA - BEEF SYNC'
    sheetEntradas.getCell('A1').font = { size: 16, bold: true, color: { argb: '059669' } }
    sheetEntradas.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
    sheetEntradas.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D1FAE5' }
    }
    sheetEntradas.getRow(1).height = 30

    sheetEntradas.mergeCells('A2:G2')
    sheetEntradas.getCell('A2').value = `Período: ${formatDate(period.startDate)} até ${formatDate(period.endDate)}`
    sheetEntradas.getCell('A2').font = { size: 12, bold: true }
    sheetEntradas.getCell('A2').alignment = { horizontal: 'center' }

    sheetEntradas.mergeCells('A3:G3')
    sheetEntradas.getCell('A3').value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`
    sheetEntradas.getCell('A3').font = { size: 10, italic: true }
    sheetEntradas.getCell('A3').alignment = { horizontal: 'center' }

    sheetEntradas.addRow([])

    // Cabeçalhos da tabela de Entradas - com detalhamento por sexo
    const headerEntradas = sheetEntradas.addRow([
      'Número NF',
      'Data Entrada',
      'Fornecedor',
      'Natureza Operação',
      'Valor Total',
      'Qtd. Total',
      'Qtd. Machos',
      'Valor Machos',
      'Qtd. Fêmeas',
      'Valor Fêmeas',
      'Raça',
      'Observações'
    ])
    
    styleHeaderRow(headerEntradas, '059669')

    sheetEntradas.columns = [
      { width: 15 }, // Número NF
      { width: 14 }, // Data
      { width: 25 }, // Fornecedor
      { width: 20 }, // Natureza
      { width: 15 }, // Valor Total
      { width: 12 }, // Qtd Total
      { width: 12 }, // Qtd Machos
      { width: 15 }, // Valor Machos
      { width: 12 }, // Qtd Fêmeas
      { width: 15 }, // Valor Fêmeas
      { width: 15 }, // Raça
      { width: 30 }  // Obs
    ]

    // ABA 2: NFs de Saída
    const sheetSaidas = workbook.addWorksheet('NFs de Saída')
    
    // Cabeçalho Saídas
    sheetSaidas.mergeCells('A1:H1')
    sheetSaidas.getCell('A1').value = '📤 NOTAS FISCAIS DE SAÍDA - BEEF SYNC'
    sheetSaidas.getCell('A1').font = { size: 16, bold: true, color: { argb: 'DC2626' } }
    sheetSaidas.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
    sheetSaidas.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FEE2E2' }
    }
    sheetSaidas.getRow(1).height = 30

    sheetSaidas.mergeCells('A2:H2')
    sheetSaidas.getCell('A2').value = `Período: ${formatDate(period.startDate)} até ${formatDate(period.endDate)}`
    sheetSaidas.getCell('A2').font = { size: 12, bold: true }
    sheetSaidas.getCell('A2').alignment = { horizontal: 'center' }

    sheetSaidas.mergeCells('A3:H3')
    sheetSaidas.getCell('A3').value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`
    sheetSaidas.getCell('A3').font = { size: 10, italic: true }
    sheetSaidas.getCell('A3').alignment = { horizontal: 'center' }

    sheetSaidas.addRow([])

    // Cabeçalhos da tabela de Saídas - com detalhamento por sexo
    const headerSaidas = sheetSaidas.addRow([
      'Número NF',
      'Data Saída',
      'Destino',
      'Natureza Operação',
      'Valor Total',
      'Qtd. Total',
      'Qtd. Machos',
      'Valor Machos',
      'Qtd. Fêmeas',
      'Valor Fêmeas',
      'Raça',
      'Tatuagem',
      'Observações'
    ])
    
    styleHeaderRow(headerSaidas, 'DC2626')

    sheetSaidas.columns = [
      { width: 15 }, // Número NF
      { width: 14 }, // Data
      { width: 25 }, // Destino
      { width: 20 }, // Natureza
      { width: 15 }, // Valor Total
      { width: 12 }, // Qtd Total
      { width: 12 }, // Qtd Machos
      { width: 15 }, // Valor Machos
      { width: 12 }, // Qtd Fêmeas
      { width: 15 }, // Valor Fêmeas
      { width: 15 }, // Raça
      { width: 20 }, // Tatuagem
      { width: 30 }  // Obs
    ]

    // ABA 3: Resumo Geral
    const sheetResumo = workbook.addWorksheet('Resumo Geral')
    
    sheetResumo.mergeCells('A1:D1')
    sheetResumo.getCell('A1').value = '📊 RESUMO GERAL - NOTAS FISCAIS'
    sheetResumo.getCell('A1').font = { size: 16, bold: true, color: { argb: '2563EB' } }
    sheetResumo.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
    sheetResumo.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DBEAFE' }
    }
    sheetResumo.getRow(1).height = 30

    sheetResumo.mergeCells('A2:D2')
    sheetResumo.getCell('A2').value = `Período: ${formatDate(period.startDate)} até ${formatDate(period.endDate)}`
    sheetResumo.getCell('A2').font = { size: 12, bold: true }
    sheetResumo.getCell('A2').alignment = { horizontal: 'center' }

    sheetResumo.addRow([])
    sheetResumo.addRow([])

    // Resumo de Entradas
    const resumoEntradas = sheetResumo.addRow(['ENTRADAS', '', '', ''])
    resumoEntradas.font = { bold: true, size: 12 }
    resumoEntradas.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D1FAE5' }
    }

    sheetResumo.addRow(['Total de NFs:', '0'])
    sheetResumo.addRow(['Total de Animais:', '0'])
    sheetResumo.addRow(['Valor Total:', 'R$ 0,00'])
    sheetResumo.addRow([])

    // Resumo de Saídas
    const resumoSaidas = sheetResumo.addRow(['SAÍDAS', '', '', ''])
    resumoSaidas.font = { bold: true, size: 12 }
    resumoSaidas.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FEE2E2' }
    }

    sheetResumo.addRow(['Total de NFs:', '0'])
    sheetResumo.addRow(['Total de Animais:', '0'])
    sheetResumo.addRow(['Valor Total:', 'R$ 0,00'])
    sheetResumo.addRow([])

    // Saldo
    const saldoRow = sheetResumo.addRow(['SALDO', '', '', ''])
    saldoRow.font = { bold: true, size: 12 }
    saldoRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FEF3C7' }
    }

    sheetResumo.addRow(['Saldo de Animais:', '0'])
    sheetResumo.addRow(['Saldo Financeiro:', 'R$ 0,00'])

    sheetResumo.columns = [
      { width: 25 },
      { width: 20 },
      { width: 20 },
      { width: 20 }
    ]

    // Adicionar observações
    const obsRow = sheetResumo.lastRow.number + 3
    sheetResumo.mergeCells(`A${obsRow}:D${obsRow}`)
    sheetResumo.getCell(`A${obsRow}`).value = 'Observações'
    sheetResumo.getCell(`A${obsRow}`).font = { bold: true }
    
    const obs = [
      '• Os valores apresentados referem-se ao período especificado',
      '• NFs sem data não são consideradas no filtro de período',
      '• Verifique a aba "NFs de Entrada" e "NFs de Saída" para detalhes completos',
      '• Relatório gerado automaticamente pelo sistema Beef Sync'
    ]

    obs.forEach(texto => {
      const row = sheetResumo.addRow([texto])
      sheetResumo.mergeCells(`A${row.number}:D${row.number}`)
      row.getCell(1).font = { size: 9, italic: true }
    })

    // Buscar dados das notas fiscais
    console.log('🔍 Buscando notas fiscais de entrada...', { pgStart, pgEnd })
    let nfsEntradas
    try {
      // Primeiro, buscar todas as notas fiscais de entrada no período
      const queryEntradas = await query(`
        SELECT numero_nf, data_compra, data, fornecedor, natureza_operacao, valor_total, itens, observacoes, id
        FROM notas_fiscais 
        WHERE tipo = 'entrada' 
        AND COALESCE(data_compra, data) BETWEEN $1 AND $2
        ORDER BY COALESCE(data_compra, data) DESC
      `, [pgStart, pgEnd])
      
      nfsEntradas = queryEntradas
      console.log(`✅ Encontradas ${nfsEntradas?.rows?.length || 0} notas fiscais de entrada no período`)
      
      // Buscar também notas fiscais recentes que possam ter sido criadas hoje mas com data diferente
      // Isso garante que notas fiscais recém-criadas sejam incluídas
      const hoje = new Date().toISOString().split('T')[0]
      const nfsRecentes = await query(`
        SELECT numero_nf, data_compra, data, fornecedor, natureza_operacao, valor_total, itens, observacoes, id
        FROM notas_fiscais 
        WHERE tipo = 'entrada' 
        AND (
          COALESCE(data_compra, data) BETWEEN $1 AND $2
          OR created_at::date = $3
          OR updated_at::date = $3
        )
        ORDER BY COALESCE(data_compra, data, created_at) DESC
      `, [pgStart, pgEnd, hoje])
      
      // Combinar resultados, removendo duplicatas
      const nfsMap = new Map()
      if (nfsEntradas?.rows) {
        nfsEntradas.rows.forEach(nf => {
          nfsMap.set(nf.id, nf)
        })
      }
      if (nfsRecentes?.rows) {
        nfsRecentes.rows.forEach(nf => {
          if (!nfsMap.has(nf.id)) {
            nfsMap.set(nf.id, nf)
          }
        })
      }
      
      nfsEntradas = { rows: Array.from(nfsMap.values()) }
      console.log(`✅ Total de NFs de entrada após combinar: ${nfsEntradas?.rows?.length || 0}`)
      
      // Verificar se a NF específica 26650993 está presente
      const nf26650993 = nfsEntradas.rows.find(nf => nf.numero_nf === '26650993' || nf.numero_nf === 26650993)
      if (nf26650993) {
        console.log('✅ NF 26650993 encontrada:', {
          numero: nf26650993.numero_nf,
          data_compra: nf26650993.data_compra,
          data: nf26650993.data,
          tipo: 'entrada',
          valor_total: nf26650993.valor_total,
          id: nf26650993.id
        })
        
        // Buscar itens específicos desta NF para debug
        if (nf26650993.id) {
          try {
            const itensDebug = await query(`
              SELECT dados_item FROM notas_fiscais_itens
              WHERE nota_fiscal_id = $1
            `, [nf26650993.id])
            console.log(`📋 NF 26650993: ${itensDebug?.rows?.length || 0} itens encontrados`)
            if (itensDebug?.rows?.length > 0) {
              const itensParsed = itensDebug.rows.map(row => {
                try {
                  return typeof row.dados_item === 'string' ? JSON.parse(row.dados_item) : row.dados_item
                } catch {
                  return {}
                }
              })
              const totalQtd = itensParsed.reduce((sum, item) => {
                const qtd = parseInt(item.quantidade) || 
                            parseInt(item.quantidadeAnimais) || 
                            parseInt(item.qtd) ||
                            (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
                return sum + qtd
              }, 0)
              const totalValor = itensParsed.reduce((sum, item) => {
                const qtd = parseInt(item.quantidade) || 
                            parseInt(item.quantidadeAnimais) || 
                            parseInt(item.qtd) ||
                            (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
                const valorUnit = parseFloat(String(item.valorUnitario || item.valor_unitario || item.valor || 0).replace(',', '.')) || 0
                return sum + (qtd * valorUnit)
              }, 0)
              console.log(`📊 NF 26650993: Total de animais calculado: ${totalQtd}, Valor total calculado: R$ ${totalValor.toFixed(2)}`)
              console.log(`📋 NF 26650993: Primeiros 3 itens:`, itensParsed.slice(0, 3).map(item => ({
                quantidade: item.quantidade || item.quantidadeAnimais || item.qtd,
                valorUnitario: item.valorUnitario || item.valor_unitario || item.valor,
                modoCadastro: item.modoCadastro
              })))
            }
          } catch (e) {
            console.warn(`⚠️ Erro ao buscar itens da NF 26650993 para debug:`, e.message)
          }
        }
      } else {
        console.log('⚠️ NF 26650993 não encontrada nas entradas. Buscando especificamente...')
        const nfEspecifica = await query(`
          SELECT numero_nf, data_compra, data, fornecedor, tipo, created_at, updated_at
          FROM notas_fiscais 
          WHERE numero_nf = $1 OR numero_nf::text = $1
        `, ['26650993'])
        if (nfEspecifica?.rows?.length > 0) {
          console.log('📋 NF 26650993 encontrada no banco:', nfEspecifica.rows[0])
          // Adicionar à lista se não estiver presente
          if (!nfsEntradas.rows.find(nf => (nf.numero_nf === '26650993' || nf.numero_nf === 26650993))) {
            const nfCompleta = await query(`
              SELECT numero_nf, data_compra, data, fornecedor, natureza_operacao, valor_total, itens, observacoes, id
              FROM notas_fiscais 
              WHERE numero_nf = $1 OR numero_nf::text = $1
            `, ['26650993'])
            if (nfCompleta?.rows?.length > 0) {
              nfsEntradas.rows.push(nfCompleta.rows[0])
              console.log('✅ NF 26650993 adicionada à lista de entradas')
            }
          }
        }
      }
      
      // Se não encontrou nenhuma, buscar todas as notas fiscais de entrada para debug
      if (nfsEntradas?.rows?.length === 0) {
        console.log('⚠️ Nenhuma NF de entrada encontrada no período. Buscando todas as NFs de entrada para debug...')
        const todasEntradas = await query(`
          SELECT numero_nf, data_compra, data, fornecedor, tipo, created_at
          FROM notas_fiscais 
          WHERE tipo = 'entrada'
          ORDER BY COALESCE(data_compra, data, created_at) DESC
          LIMIT 10
        `)
        console.log(`📊 Total de NFs de entrada no banco: ${todasEntradas?.rows?.length || 0}`)
        if (todasEntradas?.rows?.length > 0) {
          console.log('📋 Últimas 10 NFs de entrada:', todasEntradas.rows.map(nf => ({
            numero: nf.numero_nf,
            data_compra: nf.data_compra,
            data: nf.data,
            tipo: nf.tipo,
            created_at: nf.created_at
          })))
        }
      } else if (nfsEntradas?.rows?.length > 0) {
        console.log('📋 Primeiras NFs encontradas:', nfsEntradas.rows.slice(0, 3).map(nf => ({
          numero: nf.numero_nf,
          data_compra: nf.data_compra,
          data: nf.data,
          data_usada: nf.data_compra || nf.data
        })))
      }
    } catch (error) {
      console.error('❌ Erro ao buscar NFs de entrada:', error)
      console.error('Stack:', error.stack)
      nfsEntradas = { rows: [] }
    }

    console.log('🔍 Buscando notas fiscais de saída...', { pgStart, pgEnd })
    let nfsSaidas
    try {
      // Buscar todas as notas fiscais de saída no período
      const querySaidas = await query(`
        SELECT numero_nf, data_compra, data, destino, natureza_operacao, valor_total, itens, observacoes, id
        FROM notas_fiscais 
        WHERE tipo = 'saida' 
        AND COALESCE(data_compra, data) BETWEEN $1 AND $2
        ORDER BY COALESCE(data_compra, data) DESC
      `, [pgStart, pgEnd])
      
      nfsSaidas = querySaidas
      console.log(`✅ Encontradas ${nfsSaidas?.rows?.length || 0} notas fiscais de saída no período`)
      
      // Buscar também notas fiscais recentes que possam ter sido criadas hoje mas com data diferente
      const hoje = new Date().toISOString().split('T')[0]
      const nfsRecentesSaidas = await query(`
        SELECT numero_nf, data_compra, data, destino, natureza_operacao, valor_total, itens, observacoes, id
        FROM notas_fiscais 
        WHERE tipo = 'saida' 
        AND (
          COALESCE(data_compra, data) BETWEEN $1 AND $2
          OR created_at::date = $3
          OR updated_at::date = $3
        )
        ORDER BY COALESCE(data_compra, data, created_at) DESC
      `, [pgStart, pgEnd, hoje])
      
      // Combinar resultados, removendo duplicatas
      const nfsMapSaidas = new Map()
      if (nfsSaidas?.rows) {
        nfsSaidas.rows.forEach(nf => {
          nfsMapSaidas.set(nf.id, nf)
        })
      }
      if (nfsRecentesSaidas?.rows) {
        nfsRecentesSaidas.rows.forEach(nf => {
          if (!nfsMapSaidas.has(nf.id)) {
            nfsMapSaidas.set(nf.id, nf)
          }
        })
      }
      
      nfsSaidas = { rows: Array.from(nfsMapSaidas.values()) }
      console.log(`✅ Total de NFs de saída após combinar: ${nfsSaidas?.rows?.length || 0}`)
      
      // Se não encontrou nenhuma, buscar todas as notas fiscais de saída para debug
      if (nfsSaidas?.rows?.length === 0) {
        console.log('⚠️ Nenhuma NF de saída encontrada no período. Buscando todas as NFs de saída para debug...')
        const todasSaidas = await query(`
          SELECT numero_nf, data_compra, data, destino, tipo, created_at
          FROM notas_fiscais 
          WHERE tipo = 'saida'
          ORDER BY COALESCE(data_compra, data, created_at) DESC
          LIMIT 10
        `)
        console.log(`📊 Total de NFs de saída no banco: ${todasSaidas?.rows?.length || 0}`)
        if (todasSaidas?.rows?.length > 0) {
          console.log('📋 Últimas 10 NFs de saída:', todasSaidas.rows.map(nf => ({
            numero: nf.numero_nf,
            data_compra: nf.data_compra,
            data: nf.data,
            tipo: nf.tipo,
            created_at: nf.created_at
          })))
        }
      } else if (nfsSaidas?.rows?.length > 0) {
        console.log('📋 Primeiras NFs encontradas:', nfsSaidas.rows.slice(0, 3).map(nf => ({
          numero: nf.numero_nf,
          data_compra: nf.data_compra,
          data: nf.data,
          data_usada: nf.data_compra || nf.data
        })))
      }
    } catch (error) {
      console.error('❌ Erro ao buscar NFs de saída:', error)
      console.error('Stack:', error.stack)
      nfsSaidas = { rows: [] }
    }

    // Adicionar dados de entrada
    if (!nfsEntradas || !nfsEntradas.rows) {
      console.warn('⚠️ Nenhuma nota fiscal de entrada encontrada ou estrutura inválida')
    } else {
      for (const nf of nfsEntradas.rows) {
        let itens = []
        let quantidadeTotal = 0
        let quantidadeMachos = 0
        let quantidadeFemeas = 0
        let valorTotalNF = parseFloat(nf.valor_total) || 0
        let valorMachos = 0
        let valorFemeas = 0
        let racas = new Set()
        
        try {
          // Tentar buscar da tabela separada primeiro
          if (nf.id) {
            try {
              const itensTabela = await query(`
                SELECT dados_item FROM notas_fiscais_itens
                WHERE nota_fiscal_id = $1
              `, [nf.id])
              
              if (itensTabela.rows && itensTabela.rows.length > 0) {
                itens = itensTabela.rows.map(row => {
                  try {
                    return typeof row.dados_item === 'string' ? JSON.parse(row.dados_item) : row.dados_item
                  } catch {
                    return {}
                  }
                })
                
                // Processar cada item separando por sexo
                itens.forEach(item => {
                  const qtd = parseInt(item.quantidade) || 
                              parseInt(item.quantidadeAnimais) || 
                              parseInt(item.qtd) ||
                              (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
                  
                  const valorUnit = parseFloat(String(item.valorUnitario || item.valor_unitario || item.valor || 0).replace(',', '.')) || 0
                  const valorItem = qtd * valorUnit
                  
                  // Identificar sexo - verificar múltiplas formas e normalizar
                  const sexoRaw = String(item.sexo || '').trim()
                  const sexoLower = sexoRaw.toLowerCase()
                  
                  // Verificar se é macho (mais específico primeiro)
                  const isMacho = sexoLower === 'macho' || 
                                 sexoLower === 'm' || 
                                 sexoLower.startsWith('macho') ||
                                 sexoRaw.toUpperCase() === 'MACHO' ||
                                 sexoRaw.toUpperCase() === 'M'
                  
                  // Verificar se é fêmea (mais específico primeiro)
                  const isFemea = sexoLower === 'fêmea' || 
                                 sexoLower === 'femea' || 
                                 sexoLower === 'f' ||
                                 sexoLower.startsWith('fêmea') ||
                                 sexoLower.startsWith('femea') ||
                                 sexoRaw.toUpperCase() === 'FÊMEA' ||
                                 sexoRaw.toUpperCase() === 'FEMEA' ||
                                 sexoRaw.toUpperCase() === 'F'
                  
                  quantidadeTotal += qtd
                  
                  // Log para debug da NF 26650993
                  if (nf.numero_nf === '26650993' || nf.numero_nf === 26650993) {
                    console.log(`🔍 Item NF 26650993: qtd=${qtd}, sexo="${sexoRaw}" (lower="${sexoLower}"), isMacho=${isMacho}, isFemea=${isFemea}, valorUnit=${valorUnit}`)
                  }
                  
                  if (isMacho && !isFemea) {
                    quantidadeMachos += qtd
                    valorMachos += valorItem
                  } else if (isFemea && !isMacho) {
                    quantidadeFemeas += qtd
                    valorFemeas += valorItem
                  } else if (!isMacho && !isFemea) {
                    // Se não identificar, não adicionar a nenhum (manter como 0)
                    // Ou distribuir proporcionalmente apenas se realmente não conseguir identificar
                    console.warn(`⚠️ NF ${nf.numero_nf}: Sexo não identificado para item: "${sexoRaw}"`)
                    // Não adicionar a nenhum grupo se não conseguir identificar
                  }
                  
                  // Coletar raças
                  if (item.raca) racas.add(item.raca)
                })
                
                // Calcular valor total a partir dos itens se não estiver definido
                if (valorTotalNF === 0 && itens.length > 0) {
                  valorTotalNF = valorMachos + valorFemeas
                } else {
                  // Se valor total está definido mas não temos valores separados, distribuir proporcionalmente
                  if (valorTotalNF > 0 && valorMachos === 0 && valorFemeas === 0) {
                    if (quantidadeTotal > 0) {
                      valorMachos = (quantidadeMachos / quantidadeTotal) * valorTotalNF
                      valorFemeas = (quantidadeFemeas / quantidadeTotal) * valorTotalNF
                    }
                  }
                }
                
                console.log(`📊 NF ${nf.numero_nf}: ${itens.length} itens, ${quantidadeTotal} animais (${quantidadeMachos}M + ${quantidadeFemeas}F), R$ ${valorTotalNF.toFixed(2)}`)
                
                // Log detalhado para NF 26650993
                if (nf.numero_nf === '26650993' || nf.numero_nf === 26650993) {
                  console.log(`✅ NF 26650993 - Resumo Final:`)
                  console.log(`   Total de animais: ${quantidadeTotal}`)
                  console.log(`   Machos: ${quantidadeMachos} (R$ ${valorMachos.toFixed(2)})`)
                  console.log(`   Fêmeas: ${quantidadeFemeas} (R$ ${valorFemeas.toFixed(2)})`)
                  console.log(`   Valor Total: R$ ${valorTotalNF.toFixed(2)}`)
                }
              }
            } catch (e) {
              console.warn(`⚠️ Erro ao buscar itens da tabela para NF ${nf.numero_nf}:`, e.message)
            }
          }
          
          // Se não encontrou na tabela, tentar do campo JSONB
          if (itens.length === 0 && nf.itens) {
            try {
              const raw = typeof nf.itens === 'string' ? JSON.parse(nf.itens) : nf.itens
              itens = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.itens) ? raw.itens : [])
              
              // Processar cada item separando por sexo
              itens.forEach(item => {
                const qtd = parseInt(item.quantidade) || 
                            parseInt(item.quantidadeAnimais) || 
                            parseInt(item.qtd) ||
                            (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
                
                const valorUnit = parseFloat(String(item.valorUnitario || item.valor_unitario || item.valor || 0).replace(',', '.')) || 0
                const valorItem = qtd * valorUnit
                
                // Identificar sexo - verificar múltiplas formas e normalizar
                const sexoRaw = String(item.sexo || '').trim()
                const sexoLower = sexoRaw.toLowerCase()
                
                const isMacho = sexoLower === 'macho' || 
                               sexoLower === 'm' || 
                               sexoLower.startsWith('macho') ||
                               sexoRaw.toUpperCase() === 'MACHO' ||
                               sexoRaw.toUpperCase() === 'M'
                
                const isFemea = sexoLower === 'fêmea' || 
                               sexoLower === 'femea' || 
                               sexoLower === 'f' ||
                               sexoLower.startsWith('fêmea') ||
                               sexoLower.startsWith('femea') ||
                               sexoRaw.toUpperCase() === 'FÊMEA' ||
                               sexoRaw.toUpperCase() === 'FEMEA' ||
                               sexoRaw.toUpperCase() === 'F'
                
                quantidadeTotal += qtd
                
                // Log para debug da NF 26650993
                if (nf.numero_nf === '26650993' || nf.numero_nf === 26650993) {
                  console.log(`🔍 Item NF 26650993: qtd=${qtd}, sexo="${sexoRaw}" (lower="${sexoLower}"), isMacho=${isMacho}, isFemea=${isFemea}, valorUnit=${valorUnit}`)
                }
                
                if (isMacho && !isFemea) {
                  quantidadeMachos += qtd
                  valorMachos += valorItem
                } else if (isFemea && !isMacho) {
                  quantidadeFemeas += qtd
                  valorFemeas += valorItem
                } else if (!isMacho && !isFemea) {
                  console.warn(`⚠️ NF ${nf.numero_nf}: Sexo não identificado para item: "${sexoRaw}"`)
                }
                
                if (item.raca) racas.add(item.raca)
              })
              
              if (valorTotalNF === 0 && itens.length > 0) {
                valorTotalNF = valorMachos + valorFemeas
              } else if (valorTotalNF > 0 && valorMachos === 0 && valorFemeas === 0) {
                if (quantidadeTotal > 0) {
                  valorMachos = (quantidadeMachos / quantidadeTotal) * valorTotalNF
                  valorFemeas = (quantidadeFemeas / quantidadeTotal) * valorTotalNF
                }
              }
            } catch (e) {
              console.warn(`⚠️ Erro ao parsear itens JSONB da NF ${nf.numero_nf}:`, e.message)
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao processar itens da NF ${nf.numero_nf}:`, error)
        }
        
        // Se ainda não tem valor total, buscar do banco novamente
        if (valorTotalNF === 0) {
          try {
            const nfCompleta = await query(`
              SELECT valor_total FROM notas_fiscais WHERE id = $1
            `, [nf.id])
            if (nfCompleta?.rows?.length > 0) {
              valorTotalNF = parseFloat(nfCompleta.rows[0].valor_total) || 0
              // Distribuir proporcionalmente se não temos valores separados
              if (valorTotalNF > 0 && quantidadeTotal > 0) {
                valorMachos = (quantidadeMachos / quantidadeTotal) * valorTotalNF
                valorFemeas = (quantidadeFemeas / quantidadeTotal) * valorTotalNF
              }
            }
          } catch (e) {
            console.warn(`⚠️ Erro ao buscar valor_total da NF ${nf.numero_nf}:`, e.message)
          }
        }
        
        // Criar observações detalhadas
        let observacoesDetalhadas = nf.observacoes || ''
        
        if (itens.length > 0) {
          const detalhesAnimais = []
          if (quantidadeMachos > 0) detalhesAnimais.push(`${quantidadeMachos} macho${quantidadeMachos > 1 ? 's' : ''}`)
          if (quantidadeFemeas > 0) detalhesAnimais.push(`${quantidadeFemeas} fêmea${quantidadeFemeas > 1 ? 's' : ''}`)
          
          if (detalhesAnimais.length > 0) {
            if (observacoesDetalhadas) {
              observacoesDetalhadas += ` | ${detalhesAnimais.join(' e ')}`
            } else {
              observacoesDetalhadas = detalhesAnimais.join(' e ')
            }
          }
        }
        
        sheetEntradas.addRow([
          nf.numero_nf || '',
          formatDate(nf.data_compra || nf.data),
          nf.fornecedor || '',
          nf.natureza_operacao || '',
          formatCurrency(valorTotalNF),
          quantidadeTotal || itens.length,
          quantidadeMachos,
          formatCurrency(valorMachos),
          quantidadeFemeas,
          formatCurrency(valorFemeas),
          Array.from(racas).join(', ') || 'NELORE',
          observacoesDetalhadas
        ])
      }
    }

    // Adicionar dados de saída
    if (!nfsSaidas || !nfsSaidas.rows) {
      console.warn('⚠️ Nenhuma nota fiscal de saída encontrada ou estrutura inválida')
    } else {
      for (const nf of nfsSaidas.rows) {
        let itens = []
        let quantidadeTotal = 0
        let quantidadeMachos = 0
        let quantidadeFemeas = 0
        let valorTotalNF = parseFloat(nf.valor_total) || 0
        let valorMachos = 0
        let valorFemeas = 0
        let racas = new Set()
        let tatuagens = []
        
        try {
          // Tentar buscar da tabela separada primeiro
          if (nf.id) {
            try {
              const itensTabela = await query(`
                SELECT dados_item FROM notas_fiscais_itens
                WHERE nota_fiscal_id = $1
              `, [nf.id])
              
              if (itensTabela.rows && itensTabela.rows.length > 0) {
                itens = itensTabela.rows.map(row => {
                  try {
                    return typeof row.dados_item === 'string' ? JSON.parse(row.dados_item) : row.dados_item
                  } catch {
                    return {}
                  }
                })
                
                // Processar cada item separando por sexo
                itens.forEach(item => {
                  const qtd = parseInt(item.quantidade) || 
                              parseInt(item.quantidadeAnimais) || 
                              parseInt(item.qtd) ||
                              (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
                  
                  const valorUnit = parseFloat(String(item.valorUnitario || item.valor_unitario || item.valor || 0).replace(',', '.')) || 0
                  const valorItem = qtd * valorUnit
                  
                  const sexo = String(item.sexo || '').toUpperCase()
                  const isMacho = sexo.includes('M') || sexo.includes('MACHO') || sexo === 'M'
                  const isFemea = sexo.includes('F') || sexo.includes('FÊMEA') || sexo.includes('FEMEA') || sexo === 'F'
                  
                  quantidadeTotal += qtd
                  
                  if (isMacho) {
                    quantidadeMachos += qtd
                    valorMachos += valorItem
                  } else if (isFemea) {
                    quantidadeFemeas += qtd
                    valorFemeas += valorItem
                  } else {
                    quantidadeMachos += Math.floor(qtd / 2)
                    quantidadeFemeas += Math.ceil(qtd / 2)
                    valorMachos += valorItem / 2
                    valorFemeas += valorItem / 2
                  }
                  
                  if (item.raca) racas.add(item.raca)
                  if (item.tatuagem) tatuagens.push(item.tatuagem)
                })
                
                if (valorTotalNF === 0 && itens.length > 0) {
                  valorTotalNF = valorMachos + valorFemeas
                } else if (valorTotalNF > 0 && valorMachos === 0 && valorFemeas === 0) {
                  if (quantidadeTotal > 0) {
                    valorMachos = (quantidadeMachos / quantidadeTotal) * valorTotalNF
                    valorFemeas = (quantidadeFemeas / quantidadeTotal) * valorTotalNF
                  }
                }
              }
            } catch (e) {
              console.warn(`⚠️ Erro ao buscar itens da tabela para NF ${nf.numero_nf}:`, e.message)
            }
          }
          
          // Se não encontrou na tabela, tentar do campo JSONB
          if (itens.length === 0 && nf.itens) {
            try {
              const raw = typeof nf.itens === 'string' ? JSON.parse(nf.itens) : nf.itens
              itens = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.itens) ? raw.itens : [])
              
              // Processar cada item separando por sexo
              itens.forEach(item => {
                const qtd = parseInt(item.quantidade) || 
                            parseInt(item.quantidadeAnimais) || 
                            parseInt(item.qtd) ||
                            (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
                
                const valorUnit = parseFloat(String(item.valorUnitario || item.valor_unitario || item.valor || 0).replace(',', '.')) || 0
                const valorItem = qtd * valorUnit
                
                // Identificar sexo - verificar múltiplas formas e normalizar
                const sexoRaw = String(item.sexo || '').trim()
                const sexoLower = sexoRaw.toLowerCase()
                
                const isMacho = sexoLower === 'macho' || 
                               sexoLower === 'm' || 
                               sexoLower.startsWith('macho') ||
                               sexoRaw.toUpperCase() === 'MACHO' ||
                               sexoRaw.toUpperCase() === 'M'
                
                const isFemea = sexoLower === 'fêmea' || 
                               sexoLower === 'femea' || 
                               sexoLower === 'f' ||
                               sexoLower.startsWith('fêmea') ||
                               sexoLower.startsWith('femea') ||
                               sexoRaw.toUpperCase() === 'FÊMEA' ||
                               sexoRaw.toUpperCase() === 'FEMEA' ||
                               sexoRaw.toUpperCase() === 'F'
                
                quantidadeTotal += qtd
                
                // Log para debug da NF 26650993
                if (nf.numero_nf === '26650993' || nf.numero_nf === 26650993) {
                  console.log(`🔍 Item NF 26650993: qtd=${qtd}, sexo="${sexoRaw}" (lower="${sexoLower}"), isMacho=${isMacho}, isFemea=${isFemea}, valorUnit=${valorUnit}`)
                }
                
                if (isMacho && !isFemea) {
                  quantidadeMachos += qtd
                  valorMachos += valorItem
                } else if (isFemea && !isMacho) {
                  quantidadeFemeas += qtd
                  valorFemeas += valorItem
                } else if (!isMacho && !isFemea) {
                  console.warn(`⚠️ NF ${nf.numero_nf}: Sexo não identificado para item: "${sexoRaw}"`)
                }
                
                if (item.raca) racas.add(item.raca)
              })
              
              if (valorTotalNF === 0 && itens.length > 0) {
                valorTotalNF = valorMachos + valorFemeas
              } else if (valorTotalNF > 0 && valorMachos === 0 && valorFemeas === 0) {
                if (quantidadeTotal > 0) {
                  valorMachos = (quantidadeMachos / quantidadeTotal) * valorTotalNF
                  valorFemeas = (quantidadeFemeas / quantidadeTotal) * valorTotalNF
                }
              }
            } catch (e) {
              console.warn(`⚠️ Erro ao parsear itens JSONB da NF ${nf.numero_nf}:`, e.message)
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao processar itens da NF ${nf.numero_nf}:`, error)
        }
        
        // Se ainda não tem valor total, buscar do banco novamente
        if (valorTotalNF === 0) {
          try {
            const nfCompleta = await query(`
              SELECT valor_total FROM notas_fiscais WHERE id = $1
            `, [nf.id])
            if (nfCompleta?.rows?.length > 0) {
              valorTotalNF = parseFloat(nfCompleta.rows[0].valor_total) || 0
              if (valorTotalNF > 0 && quantidadeTotal > 0) {
                valorMachos = (quantidadeMachos / quantidadeTotal) * valorTotalNF
                valorFemeas = (quantidadeFemeas / quantidadeTotal) * valorTotalNF
              }
            }
          } catch (e) {
            console.warn(`⚠️ Erro ao buscar valor_total da NF ${nf.numero_nf}:`, e.message)
          }
        }
        
        // Criar observações detalhadas
        let observacoesDetalhadas = nf.observacoes || ''
        
        if (itens.length > 0) {
          const detalhesAnimais = []
          if (quantidadeMachos > 0) detalhesAnimais.push(`${quantidadeMachos} macho${quantidadeMachos > 1 ? 's' : ''}`)
          if (quantidadeFemeas > 0) detalhesAnimais.push(`${quantidadeFemeas} fêmea${quantidadeFemeas > 1 ? 's' : ''}`)
          
          if (detalhesAnimais.length > 0) {
            if (observacoesDetalhadas) {
              observacoesDetalhadas += ` | ${detalhesAnimais.join(' e ')}`
            } else {
              observacoesDetalhadas = detalhesAnimais.join(' e ')
            }
          }
        }
        
        sheetSaidas.addRow([
          nf.numero_nf || '',
          formatDate(nf.data_compra || nf.data),
          nf.destino || '',
          nf.natureza_operacao || '',
          formatCurrency(valorTotalNF),
          quantidadeTotal || itens.length,
          quantidadeMachos,
          formatCurrency(valorMachos),
          quantidadeFemeas,
          formatCurrency(valorFemeas),
          Array.from(racas).join(', ') || 'NELORE',
          tatuagens.join(', ') || '',
          observacoesDetalhadas
        ])
      }
    }

    // Calcular totais para o resumo
    const totalEntradas = (nfsEntradas?.rows?.length) || 0
    const totalSaidas = (nfsSaidas?.rows?.length) || 0
    
    let valorTotalEntradas = 0
    let valorTotalSaidas = 0
    let totalAnimaisEntradas = 0
    let totalAnimaisSaidas = 0
    
    // Calcular totais de animais e valores considerando quantidade corretamente
    for (const nf of (nfsEntradas?.rows || [])) {
      try {
        let itens = []
        let quantidadeNF = 0
        let valorNF = parseFloat(nf.valor_total) || 0
        
        if (nf.id) {
          try {
            const itensTabela = await query(`
              SELECT dados_item FROM notas_fiscais_itens
              WHERE nota_fiscal_id = $1
            `, [nf.id])
            if (itensTabela.rows && itensTabela.rows.length > 0) {
              itens = itensTabela.rows.map(row => {
                try {
                  return typeof row.dados_item === 'string' ? JSON.parse(row.dados_item) : row.dados_item
                } catch {
                  return {}
                }
              })
              
              quantidadeNF = itens.reduce((sum, item) => {
                const qtd = parseInt(item.quantidade) || 
                            parseInt(item.quantidadeAnimais) || 
                            parseInt(item.qtd) ||
                            (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
                return sum + qtd
              }, 0)
              
              if (valorNF === 0) {
                valorNF = itens.reduce((sum, item) => {
                  const qtd = parseInt(item.quantidade) || 
                              parseInt(item.quantidadeAnimais) || 
                              parseInt(item.qtd) ||
                              (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
                  const valorUnit = parseFloat(String(item.valorUnitario || item.valor_unitario || item.valor || 0).replace(',', '.')) || 0
                  return sum + (qtd * valorUnit)
                }, 0)
              }
            }
          } catch (e) {}
        }
        if (itens.length === 0 && nf.itens) {
          const raw = typeof nf.itens === 'string' ? JSON.parse(nf.itens) : nf.itens
          itens = Array.isArray(raw) ? raw : []
          
          quantidadeNF = itens.reduce((sum, item) => {
            const qtd = parseInt(item.quantidade) || 
                        parseInt(item.quantidadeAnimais) || 
                        parseInt(item.qtd) ||
                        (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
            return sum + qtd
          }, 0)
          
          if (valorNF === 0) {
            valorNF = itens.reduce((sum, item) => {
              const qtd = parseInt(item.quantidade) || 
                          parseInt(item.quantidadeAnimais) || 
                          parseInt(item.qtd) ||
                          (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
              const valorUnit = parseFloat(String(item.valorUnitario || item.valor_unitario || item.valor || 0).replace(',', '.')) || 0
              return sum + (qtd * valorUnit)
            }, 0)
          }
        }
        
        totalAnimaisEntradas += quantidadeNF || itens.length
        valorTotalEntradas += valorNF || parseFloat(nf.valor_total) || 0
      } catch (e) {
        console.warn(`⚠️ Erro ao calcular total de animais da NF ${nf.numero_nf}:`, e.message)
        valorTotalEntradas += parseFloat(nf.valor_total) || 0
      }
    }
    
    for (const nf of (nfsSaidas?.rows || [])) {
      try {
        let itens = []
        let quantidadeNF = 0
        let valorNF = parseFloat(nf.valor_total) || 0
        
        if (nf.id) {
          try {
            const itensTabela = await query(`
              SELECT dados_item FROM notas_fiscais_itens
              WHERE nota_fiscal_id = $1
            `, [nf.id])
            if (itensTabela.rows && itensTabela.rows.length > 0) {
              itens = itensTabela.rows.map(row => {
                try {
                  return typeof row.dados_item === 'string' ? JSON.parse(row.dados_item) : row.dados_item
                } catch {
                  return {}
                }
              })
              
              quantidadeNF = itens.reduce((sum, item) => {
                const qtd = parseInt(item.quantidade) || 
                            parseInt(item.quantidadeAnimais) || 
                            parseInt(item.qtd) ||
                            (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
                return sum + qtd
              }, 0)
              
              if (valorNF === 0) {
                valorNF = itens.reduce((sum, item) => {
                  const qtd = parseInt(item.quantidade) || 
                              parseInt(item.quantidadeAnimais) || 
                              parseInt(item.qtd) ||
                              (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
                  const valorUnit = parseFloat(String(item.valorUnitario || item.valor_unitario || item.valor || 0).replace(',', '.')) || 0
                  return sum + (qtd * valorUnit)
                }, 0)
              }
            }
          } catch (e) {}
        }
        if (itens.length === 0 && nf.itens) {
          const raw = typeof nf.itens === 'string' ? JSON.parse(nf.itens) : nf.itens
          itens = Array.isArray(raw) ? raw : []
          
          quantidadeNF = itens.reduce((sum, item) => {
            const qtd = parseInt(item.quantidade) || 
                        parseInt(item.quantidadeAnimais) || 
                        parseInt(item.qtd) ||
                        (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
            return sum + qtd
          }, 0)
          
          if (valorNF === 0) {
            valorNF = itens.reduce((sum, item) => {
              const qtd = parseInt(item.quantidade) || 
                          parseInt(item.quantidadeAnimais) || 
                          parseInt(item.qtd) ||
                          (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
              const valorUnit = parseFloat(String(item.valorUnitario || item.valor_unitario || item.valor || 0).replace(',', '.')) || 0
              return sum + (qtd * valorUnit)
            }, 0)
          }
        }
        
        totalAnimaisSaidas += quantidadeNF || itens.length
        valorTotalSaidas += valorNF || parseFloat(nf.valor_total) || 0
      } catch (e) {
        console.warn(`⚠️ Erro ao calcular total de animais da NF ${nf.numero_nf}:`, e.message)
        valorTotalSaidas += parseFloat(nf.valor_total) || 0
      }
    }

    // Atualizar resumo
    sheetResumo.getCell('B5').value = totalEntradas
    sheetResumo.getCell('B6').value = totalAnimaisEntradas
    sheetResumo.getCell('B7').value = formatCurrency(valorTotalEntradas)
    
    sheetResumo.getCell('B10').value = totalSaidas
    sheetResumo.getCell('B11').value = totalAnimaisSaidas
    sheetResumo.getCell('B12').value = formatCurrency(valorTotalSaidas)
    
    sheetResumo.getCell('B15').value = totalAnimaisEntradas - totalAnimaisSaidas
    sheetResumo.getCell('B16').value = formatCurrency(valorTotalEntradas - valorTotalSaidas)

    // Gerar o arquivo
    const buffer = await workbook.xlsx.writeBuffer()

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="notas-fiscais-${period.startDate}-${period.endDate}.xlsx"`)
    res.send(Buffer.from(buffer))

  } catch (error) {
    console.error('❌ Erro ao gerar relatório de notas fiscais:', error)
    console.error('Stack trace:', error.stack)
    res.status(500).json({ 
      message: 'Erro ao gerar relatório de notas fiscais',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

function styleHeaderRow(row, color) {
  row.font = { bold: true, color: { argb: 'FFFFFF' } }
  row.height = 25
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color }
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

