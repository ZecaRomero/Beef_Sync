import ExcelJS from 'exceljs'
import { query } from '../../../lib/database'

// FunÃ§Ã£o auxiliar para calcular meses a partir da era
function calcularMesesDaEra(eraStr) {
  if (!eraStr) return null
  const eraLower = String(eraStr).toLowerCase().trim()
  // IMPORTANTE: Verificar faixas especÃ­ficas ANTES de verificar valores isolados
  if (eraLower.includes('24/36') || eraLower.includes('24-36')) {
    return 30 // Idade mÃ©dia da faixa 24/36 meses
  }
  if (eraLower.includes('12/24') || eraLower.includes('12-24')) {
    return 18 // Idade mÃ©dia da faixa 12/24 meses
  }
  // Tentar parsear como nÃºmero
  const eraNum = parseInt(eraStr)
  if (!isNaN(eraNum)) {
    return eraNum
  }
  // Verificar outras faixas
  if (eraLower.includes('18-22') || eraLower.includes('18/22')) {
    return 20
  } else if (eraLower.includes('7-15') || eraLower.includes('7/15')) {
    return 11
  } else if (eraLower.includes('15-18') || eraLower.includes('15/18')) {
    return 16.5
  } else if (eraLower.includes('12-18') || eraLower.includes('12/18')) {
    return 15
  } else if (eraLower.includes('36') || eraLower.includes('+36')) {
    return 36
  } else if (eraLower.includes('24') || eraLower.includes('+24')) {
    return 24
  } else if (eraLower.includes('22') || eraLower.includes('+22')) {
    return 22
  } else if (eraLower.includes('18')) {
    return 18
  } else if (eraLower.includes('15')) {
    return 15
  } else if (eraLower.includes('12')) {
    return 12
  } else if (eraLower.includes('7')) {
    return 7
  }
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('ðÅ¸â€œ¥ Recebendo requisiÃ§Ã£o para gerar boletim PARDINHO')
    const { period, sendToAccounting } = req.body
    console.log('ðÅ¸â€œâ€¹ PerÃ­odo recebido:', period)

    if (!period || !period.startDate || !period.endDate) {
      console.error('â�Å’ PerÃ­odo nÃ£o fornecido')
      return res.status(400).json({ message: 'PerÃ­odo Ã© obrigatÃ³rio' })
    }

    // Normalizar datas para formato YYYY-MM-DD aceito pelo PostgreSQL
    const toPgDate = (value) => {
      if (!value) return null
      if (value instanceof Date) {
        return value.toISOString().split('T')[0]
      }
      if (typeof value === 'string') {
        // ISO direto
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
        // dd/MM/yyyy
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          const [d, m, y] = value.split('/')
          return `${y}-${m}-${d}`
        }
        // Tentar parse genÃ©rico
        const d = new Date(value)
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
        return null
      }
      // Qualquer outro tipo
      const d = new Date(value)
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
    }

    const pgStart = toPgDate(period.startDate)
    const pgEnd = toPgDate(period.endDate)
    if (!pgStart || !pgEnd) {
      console.error('â�Å’ Formato de data invÃ¡lido:', period)
      return res.status(400).json({ message: 'Formato de data invÃ¡lido. Use YYYY-MM-DD ou dd/MM/yyyy.' })
    }
    
    // Garantir que inÃ­cio <= fim
    if (new Date(pgStart) > new Date(pgEnd)) {
      return res.status(400).json({ message: 'Data inicial maior que a final.' })
    }
    
    console.log(`ðÅ¸â€œâ€¦ PerÃ­odo recebido: ${period.startDate} atÃ© ${period.endDate}`)
    console.log(`ðÅ¸â€œâ€¦ PerÃ­odo convertido: ${pgStart} atÃ© ${pgEnd}`)

    console.log('ðÅ¸â€�� Validando esquema e buscando movimentaÃ§Ãµes de entrada...')

    // Verificar existÃªncia da tabela e colunas opcionais
    let hasTable = true
    let hasLocalidade = true
    let hasDadosExtras = true
    let hasEraOnAnimais = true
    try {
      const tbl = await query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema='public' AND table_name='movimentacoes_contabeis'
        ) AS exists
      `)
      hasTable = !!tbl.rows?.[0]?.exists
    } catch (e) {
      console.warn('âÅ¡ ï¸� NÃ£o foi possÃ­vel verificar existÃªncia da tabela movimentacoes_contabeis:', e.message)
    }

    if (!hasTable) {
      return res.status(400).json({
        message: 'Tabela movimentacoes_contabeis nÃ£o encontrada. Execute a inicializaÃ§Ã£o do banco.'
      })
    }

    try {
      const col = await query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema='public' AND table_name='movimentacoes_contabeis' AND column_name='localidade'
        ) AS exists
      `)
      hasLocalidade = !!col.rows?.[0]?.exists
    } catch (e) {
      console.warn('âÅ¡ ï¸� NÃ£o foi possÃ­vel verificar coluna localidade:', e.message)
    }

    try {
      const col = await query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema='public' AND table_name='movimentacoes_contabeis' AND column_name='dados_extras'
        ) AS exists
      `)
      hasDadosExtras = !!col.rows?.[0]?.exists
    } catch (e) {
      console.warn('âÅ¡ ï¸� NÃ£o foi possÃ­vel verificar coluna dados_extras:', e.message)
    }

    try {
      const col = await query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema='public' AND table_name='animais' AND column_name='era'
        ) AS exists
      `)
      hasEraOnAnimais = !!col.rows?.[0]?.exists
    } catch (e) {
      console.warn('âÅ¡ ï¸� NÃ£o foi possÃ­vel verificar coluna era na tabela animais:', e.message)
    }

    // Construir query condicionalmente conforme existÃªncia da coluna 'localidade'
    let animaisResult
    try {
      // Montar lista de colunas dinamicamente para evitar erros em bancos mais antigos
      const selectColumns = [
        'a.id',
        'a.serie',
        'a.rg',
        'a.tatuagem',
        'a.sexo',
        'a.raca',
        'a.meses',
        'a.data_nascimento',
        hasEraOnAnimais ? 'a.era' : null,
        'a.peso',
        'mc.data_movimento',
        hasDadosExtras ? 'mc.dados_extras' : null
      ].filter(Boolean).join(',\n          ')

      let sql = `
        SELECT DISTINCT
          ${selectColumns}
        FROM movimentacoes_contabeis mc
        LEFT JOIN animais a ON mc.animal_id = a.id
        WHERE mc.data_movimento >= $1
          AND mc.data_movimento <= $2
          AND mc.tipo = 'entrada'
      `
      const params = [pgStart, pgEnd]
      if (hasLocalidade) {
        // Tornar o filtro de localidade mais flexÃ­vel para variaÃ§Ãµes de nomenclatura
        // Ex.: "AGROPECUÃ�RIA PARDINHO", "AGROPECUARIA PARDINHO", "AgropecuÃ¡ria Pardinho LTDA"
        sql += ` AND COALESCE(mc.localidade, '') ILIKE $3`
        params.push('%pardinho%')
      } else {
        console.warn('âÅ¡ ï¸� Coluna localidade ausente em movimentacoes_contabeis. Prosseguindo sem filtro de localidade.')
      }

      sql += ` ORDER BY a.raca, a.sexo, a.meses`

      animaisResult = await query(sql, params)
      console.log('âÅ“â€¦ Query executada com sucesso')
    } catch (queryError) {
      console.error('â�Å’ Erro na query SQL:', queryError)
      throw new Error(`Erro ao buscar animais: ${queryError.message}`)
    }

    let animais = animaisResult.rows || []
    console.log(`ðÅ¸â€œÅ  Encontrados ${animais.length} animais nas movimentaÃ§Ãµes de entrada da AGROPECUÃ�RIA PARDINHO`)

    // IMPORTANTE: Buscar tambÃ©m SAÃ�DAS (NF de venda) para subtrair do saldo
    let saidasResult = []
    try {
      let sqlSaidas = `
        SELECT 
          mc.id,
          mc.animal_id,
          mc.data_movimento,
          mc.dados_extras,
          a.serie, a.rg, a.tatuagem, a.sexo, a.raca, a.meses, a.data_nascimento,
          ${hasEraOnAnimais ? 'a.era,' : ''}
          a.peso
        FROM movimentacoes_contabeis mc
        LEFT JOIN animais a ON mc.animal_id = a.id
        WHERE mc.data_movimento >= $1
          AND mc.data_movimento <= $2
          AND mc.tipo = 'saida'
      `
      const paramsSaidas = [pgStart, pgEnd]
      if (hasLocalidade) {
        sqlSaidas += ` AND COALESCE(mc.localidade, '') ILIKE $3`
        paramsSaidas.push('%pardinho%')
      }
      sqlSaidas += ` ORDER BY mc.data_movimento`
      saidasResult = (await query(sqlSaidas, paramsSaidas)).rows || []
      console.log(`ðÅ¸â€œ¤ Encontradas ${saidasResult.length} movimentaÃ§Ãµes de SAÃ�DA da AGROPECUÃ�RIA PARDINHO (serÃ£o subtraÃ­das do saldo)`)
    } catch (saidasError) {
      console.warn('âÅ¡ ï¸� Erro ao buscar saÃ­das (continuando sem subtrair):', saidasError.message)
    }

    // Se nÃ£o encontrou animais em movimentacoes_contabeis, buscar diretamente das notas fiscais
    if (animais.length === 0) {
      console.log('âÅ¡ ï¸� Nenhum animal encontrado em movimentacoes_contabeis. Buscando diretamente das notas fiscais...')
      
      try {
        // CNPJs relacionados Ã  AGROPECUÃ�RIA PARDINHO
        // CNPJ de destino (quem comprou): 18978214000445
        // CNPJ do fornecedor (quem vendeu): 44017440001018
        const cnpjDestinoPardinho = '18978214000445'
        const cnpjFornecedorPardinho = '44017440001018'
        
        console.log(`ðÅ¸â€œâ€¦ PerÃ­odo selecionado: ${pgStart} atÃ© ${pgEnd}`)
        
        // Primeiro, buscar NFs de entrada do perÃ­odo onde o CNPJ de destino OU fornecedor Ã© relacionado Ã  AGROPECUÃ�RIA PARDINHO
        // Para NF de entrada: fornecedor vendeu (CNPJ 44017440001018), destino comprou (CNPJ 18978214000445)
        // O campo cnpj_origem_destino pode conter qualquer um dos dois CNPJs
        let nfsResult = await query(`
          SELECT 
            nf.id,
            nf.numero_nf,
            nf.data_compra,
            nf.data,
            nf.fornecedor,
            nf.cnpj_origem_destino,
            nf.itens,
            nf.observacoes
          FROM notas_fiscais nf
          WHERE nf.tipo = 'entrada'
            AND (
              (nf.data_compra BETWEEN $1 AND $2)
              OR (nf.data BETWEEN $1 AND $2)
              OR nf.data_compra IS NULL
              OR nf.data IS NULL
            )
            AND (
              nf.cnpj_origem_destino = $3
              OR nf.cnpj_origem_destino = $4
              OR COALESCE(nf.fornecedor, '') ILIKE $5
              OR COALESCE(nf.observacoes, '') ILIKE $5
            )
          ORDER BY COALESCE(nf.data_compra, nf.data) DESC
        `, [pgStart, pgEnd, cnpjDestinoPardinho, cnpjFornecedorPardinho, '%pardinho%'])
        
        console.log(`ðÅ¸â€œâ€¹ Encontradas ${nfsResult.rows?.length || 0} notas fiscais de entrada no perÃ­odo relacionadas Ã  AGROPECUÃ�RIA PARDINHO`)
        console.log(`   (Buscando por CNPJ destino: ${cnpjDestinoPardinho} ou CNPJ fornecedor: ${cnpjFornecedorPardinho})`)
        if (nfsResult.rows?.length > 0) {
          nfsResult.rows.forEach((nf, idx) => {
            console.log(`   ${idx + 1}. NF ${nf.numero_nf} - Data: ${nf.data_compra || nf.data || 'N/A'} - CNPJ: ${nf.cnpj_origem_destino || 'N/A'}`)
          })
        }
        
        // SEMPRE buscar tambÃ©m pela NF 4346 especificamente (IGNORANDO o perÃ­odo)
        // A NF 4346 saiu do CNPJ 44017440001018 e entrou no CNPJ 18978214000445
        console.log('ðÅ¸â€�� Buscando especificamente pela NF 4346 (ignorando perÃ­odo)...')
        const nf4346Result = await query(`
          SELECT 
            nf.id,
            nf.numero_nf,
            nf.data_compra,
            nf.data,
            nf.fornecedor,
            nf.cnpj_origem_destino,
            nf.itens,
            nf.observacoes
          FROM notas_fiscais nf
          WHERE nf.tipo = 'entrada'
            AND (
              nf.numero_nf = $1 
              OR nf.numero_nf LIKE $2
              OR nf.numero_nf LIKE $3
              OR CAST(nf.numero_nf AS TEXT) = $1
              OR nf.observacoes LIKE $2
            )
          ORDER BY COALESCE(nf.data_compra, nf.data) DESC
        `, ['4346', '%4346%', '4346%'])
        console.log(`ðÅ¸â€œâ€¹ Encontradas ${nf4346Result.rows?.length || 0} notas fiscais com nÃºmero 4346 (sem filtro de perÃ­odo)`)
        
        if (nf4346Result.rows?.length > 0) {
          nf4346Result.rows.forEach((nf, idx) => {
            const dataNF = nf.data_compra || nf.data || 'N/A'
            const dentroPeriodo = dataNF !== 'N/A' && 
              ((dataNF >= pgStart && dataNF <= pgEnd) || 
               (nf.data_compra >= pgStart && nf.data_compra <= pgEnd))
            console.log(`   ${idx + 1}. NF ${nf.numero_nf} - Data: ${dataNF} - CNPJ: ${nf.cnpj_origem_destino || 'N/A'} - ${dentroPeriodo ? 'âÅ“â€¦ DENTRO' : 'âÅ¡ ï¸� FORA'} do perÃ­odo`)
          })
        }
        
        // Combinar resultados, evitando duplicatas
        const nfsMap = new Map()
        ;(nfsResult.rows || []).forEach(nf => {
          nfsMap.set(nf.id, nf)
        })
        ;(nf4346Result.rows || []).forEach(nf => {
          nfsMap.set(nf.id, nf)
        })
        console.log(`ðÅ¸â€œâ€¹ Total de NFs Ãºnicas encontradas (busca inicial): ${nfsMap.size}`)
        
        // Buscar tambÃ©m as Ãºltimas 20 NFs de entrada (independente do perÃ­odo) para garantir que nada seja perdido
        console.log('ðÅ¸â€�� Buscando Ãºltimas 20 NFs de entrada (sem filtro de perÃ­odo) para garantir inclusÃ£o completa...')
        const ultimasNFs = await query(`
          SELECT 
            nf.id,
            nf.numero_nf,
            nf.data_compra,
            nf.data,
            nf.fornecedor,
            nf.cnpj_origem_destino,
            nf.itens,
            nf.observacoes
          FROM notas_fiscais nf
          WHERE nf.tipo = 'entrada'
          ORDER BY nf.id DESC
          LIMIT 20
        `)
        console.log(`ðÅ¸â€œâ€¹ Encontradas ${ultimasNFs.rows?.length || 0} Ãºltimas NFs de entrada (top 20)`)
        
        // Adicionar Ã s NFs encontradas se ainda nÃ£o estiverem lÃ¡
        let novasAdicionadas = 0
        ultimasNFs.rows.forEach(nf => {
          if (!nfsMap.has(nf.id)) {
            nfsMap.set(nf.id, nf)
            novasAdicionadas++
            console.log(`   âÅ¾â€¢ Adicionando NF ${nf.numero_nf} (ID: ${nf.id}) que nÃ£o estava na busca anterior`)
          }
        })
        console.log(`ðÅ¸â€œâ€¹ Total de novas NFs adicionadas: ${novasAdicionadas}`)
        
        // Se nÃ£o encontrou NF 4346 especificamente, mostrar debug
        if (nf4346Result.rows?.length === 0) {
          console.log('âÅ¡ ï¸� NF 4346 nÃ£o encontrada. ÃÅ¡ltimas 10 NFs de entrada:')
          ultimasNFs.rows.slice(0, 10).forEach((nf, idx) => {
            console.log(`   ${idx + 1}. NF ${nf.numero_nf} - CNPJ: ${nf.cnpj_origem_destino || 'N/A'} - Fornecedor: ${nf.fornecedor || 'N/A'} - Data: ${nf.data_compra || nf.data || 'N/A'}`)
          })
        }
        
        // Log detalhado da NF 4346 se encontrada
        if (nf4346Result.rows?.length > 0) {
          nf4346Result.rows.forEach(nf => {
            console.log(`ðÅ¸â€œâ€¹ NF 4346 encontrada:`)
            console.log(`   - ID: ${nf.id}`)
            console.log(`   - CNPJ origem/destino: ${nf.cnpj_origem_destino || 'N/A'}`)
            console.log(`   - Fornecedor: ${nf.fornecedor || 'N/A'}`)
            console.log(`   - Data: ${nf.data_compra || nf.data || 'N/A'}`)
          })
        }
        
        nfsResult.rows = Array.from(nfsMap.values())
        console.log(`ðÅ¸â€œâ€¹ Total final de NFs Ãºnicas encontradas: ${nfsResult.rows.length}`)
        
        // Log detalhado de cada NF encontrada
        if (nfsResult.rows?.length > 0) {
          console.log('ðÅ¸â€œâ€¹ Notas fiscais encontradas:')
          nfsResult.rows.forEach((nf, idx) => {
            console.log(`  ${idx + 1}. NF ${nf.numero_nf} - CNPJ: ${nf.cnpj_origem_destino || 'N/A'} - Fornecedor: ${nf.fornecedor || 'N/A'} - Data: ${nf.data_compra || nf.data || 'N/A'}`)
            console.log(`     Itens (tipo): ${typeof nf.itens}`)
            if (nf.itens) {
              try {
                const itensParsed = typeof nf.itens === 'string' ? JSON.parse(nf.itens) : nf.itens
                const itensArray = Array.isArray(itensParsed) ? itensParsed : (itensParsed?.itens || [])
                console.log(`     Quantidade de itens: ${itensArray.length}`)
                itensArray.forEach((item, i) => {
                  console.log(`       Item ${i + 1}:`, JSON.stringify(item).substring(0, 200))
                })
              } catch (e) {
                console.log(`     Erro ao processar itens: ${e.message}`)
              }
            }
          })
        }
        
        // Processar itens das notas fiscais para criar registros de animais
        const animaisDasNFs = []
        
        console.log(`ðÅ¸â€�â€ž Processando ${nfsResult.rows?.length || 0} notas fiscais...`)
        
        for (const nf of nfsResult.rows || []) {
          console.log(`\nðÅ¸â€œâ€ž Processando NF ${nf.numero_nf} (ID: ${nf.id})`)
          console.log(`   Tipo de itens: ${typeof nf.itens}`)
          console.log(`   Itens raw: ${JSON.stringify(nf.itens).substring(0, 500)}`)
          
          let itens = []
          try {
            // Primeiro, tentar buscar do campo JSONB itens
            if (nf.itens) {
              if (typeof nf.itens === 'string') {
                console.log(`   Parseando itens como string JSON...`)
                itens = JSON.parse(nf.itens)
              } else if (Array.isArray(nf.itens)) {
                console.log(`   Itens jÃ¡ Ã© um array`)
                itens = nf.itens
              } else if (nf.itens && typeof nf.itens === 'object') {
                console.log(`   Itens Ã© um objeto, tentando extrair array...`)
                itens = Array.isArray(nf.itens.itens) ? nf.itens.itens : []
                if (itens.length === 0 && nf.itens.length !== undefined) {
                  // Pode ser um objeto array-like
                  itens = Object.values(nf.itens)
                }
              }
            }
            
            // Se nÃ£o encontrou itens no campo JSONB, buscar da tabela notas_fiscais_itens
            if ((!itens || itens.length === 0) && nf.id) {
              console.log(`   âÅ¡ ï¸� Campo itens vazio, buscando da tabela notas_fiscais_itens...`)
              try {
                const itensTabela = await query(`
                  SELECT 
                    nfi.*,
                    nfi.dados_item
                  FROM notas_fiscais_itens nfi
                  WHERE nfi.nota_fiscal_id = $1
                  ORDER BY nfi.id
                `, [nf.id])
                
                console.log(`   ðÅ¸â€œâ€¹ Encontrados ${itensTabela.rows?.length || 0} itens na tabela notas_fiscais_itens`)
                
                if (itensTabela.rows && itensTabela.rows.length > 0) {
                  // Converter itens da tabela para o formato esperado
                  itens = itensTabela.rows.map(row => {
                    let dadosItem = row.dados_item
                    if (typeof dadosItem === 'string') {
                      try {
                        dadosItem = JSON.parse(dadosItem)
                      } catch (e) {
                        console.warn(`     âÅ¡ ï¸� Erro ao parsear dados_item: ${e.message}`)
                        dadosItem = {}
                      }
                    }
                    
                    // Retornar dados do item no formato esperado
                    return {
                      ...dadosItem,
                      tipo_produto: row.tipo_produto || dadosItem.tipo_produto || 'bovino',
                      // Garantir campos principais
                      sexo: dadosItem.sexo || dadosItem.sexo_animal || dadosItem.sexoAnimal,
                      raca: dadosItem.raca || dadosItem.raca_animal || dadosItem.racaAnimal,
                      era: dadosItem.era || dadosItem.meses,
                      meses: dadosItem.meses || (dadosItem.era ? calcularMesesDaEra(dadosItem.era) : null),
                      tatuagem: dadosItem.tatuagem || dadosItem.tat,
                      quantidade: dadosItem.quantidade || 1,
                      valor_unitario: dadosItem.valor_unitario || dadosItem.valorUnitario,
                      peso: dadosItem.peso
                    }
                  })
                  
                  console.log(`   âÅ“â€¦ ${itens.length} itens convertidos da tabela`)
                  if (itens.length > 0) {
                    console.log(`   Primeiro item da tabela: ${JSON.stringify(itens[0]).substring(0, 300)}`)
                  }
                }
              } catch (e) {
                console.warn(`   âÅ¡ ï¸� Erro ao buscar itens da tabela: ${e.message}`)
                // Continuar mesmo se der erro na busca da tabela
              }
            }
            
            console.log(`   âÅ“â€¦ Itens processados: ${itens.length} itens encontrados`)
            if (itens.length > 0) {
              console.log(`   Primeiro item: ${JSON.stringify(itens[0]).substring(0, 300)}`)
            }
          } catch (e) {
            console.error(`   â�Å’ Erro ao processar itens da NF ${nf.numero_nf}:`, e.message)
            console.error(`   Stack:`, e.stack)
            itens = []
          }
          
          if (!Array.isArray(itens)) {
            console.warn(`   âÅ¡ ï¸� Itens nÃ£o Ã© um array, convertendo...`)
            itens = []
          }
          
          console.log(`   ðÅ¸â€œÅ  Total de itens para processar: ${itens.length}`)
          
          // Para cada item, criar um registro de animal
          for (const item of itens) {
            console.log(`  Processando item da NF ${nf.numero_nf}:`, JSON.stringify(item).substring(0, 300))
            
            // Extrair dados do item (suportar diferentes estruturas)
            const sexo = item.sexo || item.sexo_animal || item.sexoAnimal || 
                        (typeof item === 'string' && item.toLowerCase().includes('macho') ? 'Macho' : null) ||
                        (typeof item === 'string' && item.toLowerCase().includes('fÃªmea') ? 'FÃªmea' : null)
            
            const raca = item.raca || item.raca_animal || item.racaAnimal || 'NÃ£o informado'
            
            // Tentar extrair idade/era de diferentes campos
            let meses = null
            let era = null
            
            if (item.meses) {
              meses = parseInt(item.meses)
            } else if (item.era) {
              era = String(item.era)
              meses = calcularMesesDaEra(era)
            } else if (item.idade) {
              meses = parseInt(item.idade)
            }
            
            const animalData = {
              id: null,
              serie: item.serie || (item.tatuagem ? item.tatuagem.split('-')[0] : null),
              rg: item.rg || (item.tatuagem ? item.tatuagem.split('-')[1] : null),
              tatuagem: item.tatuagem || `${item.serie || ''}-${item.rg || ''}`,
              sexo: sexo,
              raca: raca,
              meses: meses,
              data_nascimento: item.data_nascimento || item.dataNascimento || nf.data_compra || nf.data,
              era: era || item.era || null,
              peso: item.peso || null,
              data_movimento: nf.data_compra || nf.data,
              dados_extras: {
                nf_id: nf.id,
                numero_nf: nf.numero_nf,
                fornecedor: nf.fornecedor,
                quantidade: item.quantidade || 1,
                valor_unitario: item.valor_unitario || item.valorUnitario || null,
                item_original: item // Guardar item original para debug
              }
            }
            
            // Se o item tem quantidade > 1, criar mÃºltiplos registros
            const quantidade = parseInt(item.quantidade) || 1
            console.log(`  ðÅ¸â€œÅ  Item processado: Quantidade=${quantidade}, Sexo=${animalData.sexo}, RaÃ§a=${animalData.raca}, Meses=${animalData.meses}, Era=${animalData.era}`)
            
            for (let i = 0; i < quantidade; i++) {
              animaisDasNFs.push({ ...animalData })
            }
            
            if (quantidade > 1) {
              console.log(`  âÅ“â€¦ Criados ${quantidade} registros de animais para este item`)
            }
          }
        }
        
        animais = animaisDasNFs
        console.log(`\nâÅ“â€¦ Total de animais processados das notas fiscais: ${animais.length}`)
        
        if (animais.length > 0) {
          console.log(`ðÅ¸â€œâ€¹ Primeiros 3 animais processados:`)
          animais.slice(0, 3).forEach((animal, idx) => {
            console.log(`   ${idx + 1}. Sexo: ${animal.sexo}, RaÃ§a: ${animal.raca}, Meses: ${animal.meses}, Era: ${animal.era}`)
          })
        } else {
          console.warn('âÅ¡ ï¸� Nenhum animal encontrado nas notas fiscais ââ‚¬â€� gerando Excel vazio com aviso')
          console.warn('âÅ¡ ï¸� Verifique se:')
          console.warn('   1. A NF 4346 existe no banco de dados')
          console.warn('   2. A NF 4346 tem itens cadastrados')
          console.warn('   3. Os itens tÃªm os campos sexo, raÃ§a e idade/era preenchidos')
        }
      } catch (nfError) {
        console.error('â�Å’ Erro ao buscar animais das notas fiscais:', nfError)
        console.warn('âÅ¡ ï¸� Continuando com lista vazia de animais')
      }
    }

    console.log(`ðÅ¸â€œÅ  Processando ${animais.length} animais das movimentaÃ§Ãµes de entrada da AGROPECUÃ�RIA PARDINHO`)

    console.log('ðÅ¸â€œ� Criando workbook Excel...')
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Boletim AGROPECUÃ�RIA PARDINHO')
    console.log('âÅ“â€¦ Workbook criado')

    // CabeÃ§alho principal com bordas
    sheet.mergeCells('A1:L1')
    const headerCell = sheet.getCell('A1')
    headerCell.value = 'ðÅ¸�â€ž BOLETIM DE GADO - AGROPECUÃ�RIA PARDINHO LTDA'
    headerCell.font = { size: 18, bold: true, color: { argb: 'FFFFFF' } }
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' }
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E40AF' }
    }
    headerCell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    }
    sheet.getRow(1).height = 35

    // SubtÃ­tulo
    sheet.mergeCells('A2:L2')
    const subtitleCell = sheet.getCell('A2')
    subtitleCell.value = 'RELATÃâ€œRIO CONTÃ�BIL PARA CONTABILIDADE'
    subtitleCell.font = { size: 12, bold: true, color: { argb: '1E40AF' } }
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(2).height = 20

    // FunÃ§Ã£o auxiliar para formatar data de forma segura
    const formatarData = (dateString) => {
      try {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return dateString
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      } catch (e) {
        return dateString
      }
    }

    // PerÃ­odo com bordas
    sheet.mergeCells('A3:L3')
    const periodCell = sheet.getCell('A3')
    const dataInicio = formatarData(period.startDate)
    const dataFim = formatarData(period.endDate)
    periodCell.value = `PerÃ­odo: ${dataInicio} atÃ© ${dataFim}`
    periodCell.font = { size: 11, bold: true }
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(3).height = 18

    // Data de geraÃ§Ã£o
    sheet.mergeCells('A4:L4')
    const dateCell = sheet.getCell('A4')
    const agora = new Date()
    const dia = String(agora.getDate()).padStart(2, '0')
    const mes = String(agora.getMonth() + 1).padStart(2, '0')
    const ano = agora.getFullYear()
    const hora = String(agora.getHours()).padStart(2, '0')
    const minuto = String(agora.getMinutes()).padStart(2, '0')
    const segundo = String(agora.getSeconds()).padStart(2, '0')
    dateCell.value = `Gerado em: ${dia}/${mes}/${ano}, ${hora}:${minuto}:${segundo}`
    dateCell.font = { size: 10, italic: true }
    dateCell.alignment = { horizontal: 'center' }
    sheet.getRow(4).height = 18

    sheet.addRow([]) // Linha vazia

    // CabeÃ§alhos da tabela principal - separados por sexo
    const headerRow = sheet.addRow([
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
      'MACHO - 36+ meses',
      'Total'
    ])
    
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
    headerRow.height = 30
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E40AF' }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      }
    })

    console.log('ðÅ¸â€œÅ  Calculando dados dos animais agrupados por raÃ§a, sexo e faixa etÃ¡ria...')
    // Calcular dados dos animais agrupados por raÃ§a, sexo e faixa etÃ¡ria (entradas - saÃ­das)
    const racasEntrada = animais.map(a => a.raca || 'NÃ£o informado')
    const racasSaida = saidasResult.map(s => {
      const dex = typeof s.dados_extras === 'string' ? (() => { try { return JSON.parse(s.dados_extras) } catch { return {} } })() : (s.dados_extras || {})
      if (dex && typeof dex === 'object' && dex.raca) return dex.raca
      return s.raca || 'NÃ£o informado'
    })
    const racas = [...new Set([...racasEntrada, ...racasSaida])]
    console.log(`ðÅ¸â€œâ€¹ RaÃ§as encontradas: ${racas.join(', ')}`)
    const dadosPorRaca = {}
    
    // Inicializar contadores para cada raÃ§a
    racas.forEach(raca => {
      dadosPorRaca[raca] = {
        'femea_0-7': 0,
        'femea_7-12': 0,
        'femea_12-18': 0,
        'femea_18-24': 0,
        'femea_24+': 0,
        'macho_0-7': 0,
        'macho_7-15': 0,
        'macho_15-18': 0,
        'macho_18-22': 0,
        'macho_36+': 0,
        total: 0
      }
    })

    // Calcular idade de cada animal e categorizar
    let animaisProcessados = 0
    let animaisSemIdade = 0
    
    animais.forEach((animal, index) => {
      try {
        const dataNascimento = animal.data_nascimento
        const dadosExtras = animal.dados_extras || null
        let idadeMeses = 0
        
        if (dataNascimento) {
          const nascimento = new Date(dataNascimento)
          const hoje = new Date()
          if (!isNaN(nascimento.getTime())) {
            idadeMeses = Math.floor((hoje - nascimento) / (1000 * 60 * 60 * 24 * 30.44))
          }
        }
        
        // Se nÃ£o tem data de nascimento, usar campo meses
        if ((!idadeMeses || idadeMeses === 0) && animal.meses) {
          idadeMeses = parseInt(animal.meses) || 0
        }

        // Fallback via dados_extras (ex.: era: '36+', '7-15', '18-22', ou meses numÃ©rico)
        if ((!idadeMeses || idadeMeses === 0) && dadosExtras && typeof dadosExtras === 'object') {
          const mesesInfo = dadosExtras.meses
          const era = dadosExtras.era ? String(dadosExtras.era).toLowerCase() : ''
          if (typeof mesesInfo === 'number' && !isNaN(mesesInfo) && mesesInfo > 0) {
            idadeMeses = mesesInfo
          } else if (era) {
            // Processar era como "24/36", "24-36", "36+", "36+ meses", etc.
            // IMPORTANTE: Verificar faixas especÃ­ficas ANTES de verificar valores isolados
            if (era.includes('24/36') || era.includes('24-36')) {
              // Faixa 24/36 meses: usar idade mÃ©dia de 30 meses
              idadeMeses = 30
            } else if (era.includes('18-22') || era.includes('18/22')) {
              idadeMeses = 20 // Idade mÃ©dia da faixa
            } else if (era.includes('7-15') || era.includes('7/15')) {
              idadeMeses = 11 // Idade mÃ©dia da faixa
            } else if (era.includes('15-18') || era.includes('15/18')) {
              idadeMeses = 16.5 // Idade mÃ©dia da faixa
            } else if (era.includes('12-18') || era.includes('12/18')) {
              idadeMeses = 15 // Idade mÃ©dia da faixa
            } else if (era.includes('36') || era.includes('+36')) {
              // Verificar "36+" isoladamente apenas se nÃ£o for "24/36"
              idadeMeses = 36 // Machos com 36+ meses vÃ£o para a categoria 36+
            } else if (era.includes('24') || era.includes('+24')) {
              idadeMeses = 24
            } else if (era.includes('22') || era.includes('+22')) {
              idadeMeses = 22
            } else if (era.includes('18') && !era.includes('22') && !era.includes('15')) {
              idadeMeses = 18
            } else if (era.includes('15')) {
              idadeMeses = 15
            } else if (era.includes('12')) {
              idadeMeses = 12
            } else if (era.includes('7') && !era.includes('15')) {
              idadeMeses = 7
            }
          }
        }
        
        // TambÃ©m verificar o campo era diretamente no animal (quando vem de notas fiscais)
        if ((!idadeMeses || idadeMeses === 0) && animal.era) {
          const era = String(animal.era).toLowerCase()
          // IMPORTANTE: Verificar faixas especÃ­ficas ANTES de verificar valores isolados
          if (era.includes('24/36') || era.includes('24-36')) {
            // Faixa 24/36 meses: usar idade mÃ©dia de 30 meses
            idadeMeses = 30
          } else if (era.includes('18-22') || era.includes('18/22')) {
            idadeMeses = 20 // Idade mÃ©dia da faixa
          } else if (era.includes('7-15') || era.includes('7/15')) {
            idadeMeses = 11 // Idade mÃ©dia da faixa
          } else if (era.includes('15-18') || era.includes('15/18')) {
            idadeMeses = 16.5 // Idade mÃ©dia da faixa
          } else if (era.includes('12/24') || era.includes('12-24')) {
            idadeMeses = 18 // Idade mÃ©dia da faixa 12/24 meses
          } else if (era.includes('12-18') || era.includes('12/18')) {
            idadeMeses = 15 // Idade mÃ©dia da faixa
          } else if (era.includes('36') || era.includes('+36')) {
            // Verificar "36+" isoladamente apenas se nÃ£o for "24/36"
            idadeMeses = 36
          } else if (era.includes('24') || era.includes('+24')) {
            idadeMeses = 24
          } else if (era.includes('22') || era.includes('+22')) {
            idadeMeses = 22
          } else if (era.includes('18') && !era.includes('22') && !era.includes('15')) {
            idadeMeses = 18
          } else if (era.includes('15')) {
            idadeMeses = 15
          } else if (era.includes('12')) {
            idadeMeses = 12
          } else if (era.includes('7') && !era.includes('15')) {
            idadeMeses = 7
          }
        }
        
        // Se nÃ£o tem idade mas tem era, tentar processar novamente
        if ((!idadeMeses || idadeMeses === 0) && animal.era) {
          const eraStr = String(animal.era).toLowerCase()
          // Verificar faixas especÃ­ficas primeiro
          if (eraStr.includes('24/36') || eraStr.includes('24-36')) {
            idadeMeses = 30
            console.log(`   âÅ“â€¦ Animal sem idade mas com era "${animal.era}" - usando 30 meses (mÃ©dia de 24/36)`)
          } else if (eraStr.includes('12/24') || eraStr.includes('12-24')) {
            idadeMeses = 18
            console.log(`   âÅ“â€¦ Animal sem idade mas com era "${animal.era}" - usando 18 meses (mÃ©dia de 12/24)`)
          } else if (eraStr.includes('36') || eraStr.includes('+36')) {
            idadeMeses = 36
            console.log(`   âÅ“â€¦ Animal sem idade mas com era "${animal.era}" - usando 36 meses`)
          }
        }
        
        if (!idadeMeses || idadeMeses === 0) {
          animaisSemIdade++
          console.log(`   âÅ¡ ï¸� Animal ${index} sem idade vÃ¡lida - sexo: ${animal.sexo}, era: ${animal.era}, meses: ${animal.meses}`)
          return // Pular animais sem idade vÃ¡lida
        }
        
        animaisProcessados++
        
        const raca = animal.raca || (dadosExtras && dadosExtras.raca) || 'NÃ£o informado'
        const sexoRaw = animal.sexo || ''
        const sexoExtra = dadosExtras && dadosExtras.sexo ? String(dadosExtras.sexo) : ''
        const sexoFinal = (sexoRaw || sexoExtra).toLowerCase()
        const isFemea = sexoFinal.includes('fÃªmea') || sexoFinal.includes('femea') || sexoFinal === 'f' || sexoFinal === 'fÃªmea'
        const isMacho = sexoFinal.includes('macho') || sexoFinal === 'm' || sexoFinal === 'macho'
        
        // Log para debug
        if (index < 5) { // Log apenas os primeiros 5 para nÃ£o poluir
          console.log(`Animal ${index}: sexoRaw="${sexoRaw}", sexoFinal="${sexoFinal}", isMacho=${isMacho}, isFemea=${isFemea}, idadeMeses=${idadeMeses}`)
        }
        
        if (!dadosPorRaca[raca]) {
          dadosPorRaca[raca] = {
            'femea_0-7': 0, 'femea_7-12': 0, 'femea_12-18': 0, 'femea_18-24': 0, 'femea_24+': 0,
            'macho_0-7': 0, 'macho_7-15': 0, 'macho_15-18': 0, 'macho_18-22': 0, 'macho_36+': 0,
            total: 0
          }
        }
        
        // Quantidade (se houver em dados_extras), padrÃ£o 1
        const quantidade = dadosExtras && typeof dadosExtras === 'object' && Number.isInteger(dadosExtras.quantidade) ? Math.max(1, dadosExtras.quantidade) : 1

        // Categorizar por faixa etÃ¡ria baseado no sexo
        if (isFemea) {
          if (idadeMeses >= 0 && idadeMeses <= 7) {
            dadosPorRaca[raca]['femea_0-7'] += quantidade
          } else if (idadeMeses > 7 && idadeMeses <= 12) {
            dadosPorRaca[raca]['femea_7-12'] += quantidade
          } else if (idadeMeses > 12 && idadeMeses <= 18) {
            dadosPorRaca[raca]['femea_12-18'] += quantidade
          } else if (idadeMeses > 18 && idadeMeses <= 24) {
            dadosPorRaca[raca]['femea_18-24'] += quantidade
          } else if (idadeMeses > 24) {
            dadosPorRaca[raca]['femea_24+'] += quantidade
          }
        } else if (isMacho) {
          if (idadeMeses >= 0 && idadeMeses <= 7) {
            dadosPorRaca[raca]['macho_0-7'] += quantidade
          } else if (idadeMeses > 7 && idadeMeses <= 15) {
            dadosPorRaca[raca]['macho_7-15'] += quantidade
          } else if (idadeMeses > 15 && idadeMeses <= 18) {
            dadosPorRaca[raca]['macho_15-18'] += quantidade
          } else if (idadeMeses > 18 && idadeMeses <= 22) {
            dadosPorRaca[raca]['macho_18-22'] += quantidade
          } else if (idadeMeses > 22) {
            // Machos com mais de 22 meses vÃ£o para a categoria 36+ meses
            dadosPorRaca[raca]['macho_36+'] += quantidade
          }
        }
        
        dadosPorRaca[raca].total += quantidade
      } catch (animalError) {
        console.error(`â�Å’ Erro ao processar animal ${index}:`, animalError)
        console.error('Animal:', animal)
      }
    })

    // SUBTRAIR SAÃ�DAS (NF de venda) do saldo
    let saidasProcessadas = 0
    saidasResult.forEach((saida, index) => {
      try {
        const dadosExtras = typeof saida.dados_extras === 'string' ? (() => { try { return JSON.parse(saida.dados_extras) } catch { return {} } })() : (saida.dados_extras || {})
        const animal = { ...saida, dados_extras: dadosExtras }
        let idadeMeses = 0
        if (saida.data_nascimento) {
          const nascimento = new Date(saida.data_nascimento)
          const hoje = new Date()
          if (!isNaN(nascimento.getTime())) idadeMeses = Math.floor((hoje - nascimento) / (1000 * 60 * 60 * 24 * 30.44))
        }
        if ((!idadeMeses || idadeMeses === 0) && saida.meses) idadeMeses = parseInt(saida.meses) || 0
        if ((!idadeMeses || idadeMeses === 0) && dadosExtras && typeof dadosExtras === 'object') {
          const era = dadosExtras.era ? String(dadosExtras.era).toLowerCase() : ''
          if (dadosExtras.meses && typeof dadosExtras.meses === 'number') idadeMeses = dadosExtras.meses
          else if (era) {
            if (era.includes('24/36') || era.includes('24-36')) idadeMeses = 30
            else if (era.includes('18-22') || era.includes('18/22')) idadeMeses = 20
            else if (era.includes('7-15') || era.includes('7/15')) idadeMeses = 11
            else if (era.includes('15-18') || era.includes('15/18')) idadeMeses = 16.5
            else if (era.includes('12-18') || era.includes('12/18')) idadeMeses = 15
            else if (era.includes('36') || era.includes('+36')) idadeMeses = 36
            else if (era.includes('24') || era.includes('+24')) idadeMeses = 24
            else if (era.includes('22') || era.includes('+22')) idadeMeses = 22
            else if (era.includes('18')) idadeMeses = 18
            else if (era.includes('15')) idadeMeses = 15
            else if (era.includes('12')) idadeMeses = 12
            else if (era.includes('7')) idadeMeses = 7
          }
        }
        if ((!idadeMeses || idadeMeses === 0) && saida.era) {
          const era = String(saida.era).toLowerCase()
          if (era.includes('24/36') || era.includes('24-36')) idadeMeses = 30
          else if (era.includes('12/24') || era.includes('12-24')) idadeMeses = 18
          else if (era.includes('36') || era.includes('+36')) idadeMeses = 36
        }
        if (!idadeMeses || idadeMeses === 0) return
        const raca = saida.raca || (dadosExtras && dadosExtras.raca) || 'NÃ£o informado'
        const sexoRaw = saida.sexo || (dadosExtras && dadosExtras.sexo) || ''
        const sexoFinal = String(sexoRaw).toLowerCase()
        const isFemea = sexoFinal.includes('fÃªmea') || sexoFinal.includes('femea') || sexoFinal === 'f'
        const isMacho = sexoFinal.includes('macho') || sexoFinal === 'm'
        if (!dadosPorRaca[raca]) {
          dadosPorRaca[raca] = { 'femea_0-7': 0, 'femea_7-12': 0, 'femea_12-18': 0, 'femea_18-24': 0, 'femea_24+': 0, 'macho_0-7': 0, 'macho_7-15': 0, 'macho_15-18': 0, 'macho_18-22': 0, 'macho_36+': 0, total: 0 }
        }
        const quantidade = (dadosExtras && Number.isInteger(dadosExtras.quantidade) ? Math.max(1, dadosExtras.quantidade) : 1)
        if (isFemea) {
          if (idadeMeses >= 0 && idadeMeses <= 7) dadosPorRaca[raca]['femea_0-7'] -= quantidade
          else if (idadeMeses > 7 && idadeMeses <= 12) dadosPorRaca[raca]['femea_7-12'] -= quantidade
          else if (idadeMeses > 12 && idadeMeses <= 18) dadosPorRaca[raca]['femea_12-18'] -= quantidade
          else if (idadeMeses > 18 && idadeMeses <= 24) dadosPorRaca[raca]['femea_18-24'] -= quantidade
          else if (idadeMeses > 24) dadosPorRaca[raca]['femea_24+'] -= quantidade
        } else if (isMacho) {
          if (idadeMeses >= 0 && idadeMeses <= 7) dadosPorRaca[raca]['macho_0-7'] -= quantidade
          else if (idadeMeses > 7 && idadeMeses <= 15) dadosPorRaca[raca]['macho_7-15'] -= quantidade
          else if (idadeMeses > 15 && idadeMeses <= 18) dadosPorRaca[raca]['macho_15-18'] -= quantidade
          else if (idadeMeses > 18 && idadeMeses <= 22) dadosPorRaca[raca]['macho_18-22'] -= quantidade
          else if (idadeMeses > 22) dadosPorRaca[raca]['macho_36+'] -= quantidade
        }
        dadosPorRaca[raca].total -= quantidade
        saidasProcessadas++
      } catch (err) {
        console.warn(`âÅ¡ ï¸� Erro ao processar saÃ­da ${index}:`, err.message)
      }
    })

    console.log(`âÅ“â€¦ Processados ${animaisProcessados} entradas, ${saidasProcessadas} saÃ­das subtraÃ­das (${animaisSemIdade} sem idade vÃ¡lida)`)

    // Adicionar linhas com dados (ordenadas por raÃ§a)
    const racasOrdenadas = racas.sort()
    
    if (racasOrdenadas.length === 0) {
      console.warn('âÅ¡ ï¸� Nenhuma raÃ§a encontrada apÃ³s processamento')
      sheet.addRow(['Nenhum dado disponÃ­vel'])
    } else {
      racasOrdenadas.forEach(raca => {
        const dados = dadosPorRaca[raca] || {
          'femea_0-7': 0, 'femea_7-12': 0, 'femea_12-18': 0, 'femea_18-24': 0, 'femea_24+': 0,
          'macho_0-7': 0, 'macho_7-15': 0, 'macho_15-18': 0, 'macho_18-22': 0, 'macho_36+': 0,
          total: 0
        }
        const row = sheet.addRow([
          raca,
          dados['femea_0-7'] || 0,
          dados['femea_7-12'] || 0,
          dados['femea_12-18'] || 0,
          dados['femea_18-24'] || 0,
          dados['femea_24+'] || 0,
          dados['macho_0-7'] || 0,
          dados['macho_7-15'] || 0,
          dados['macho_15-18'] || 0,
          dados['macho_18-22'] || 0,
          dados['macho_36+'] || 0,
          dados.total || 0
        ])
      
        row.eachCell((cell, colNumber) => {
          if (colNumber > 1) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' }
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          }
          cell.font = { size: 10 }
        })
      })
    }

    // Calcular totais de forma segura
    const totais = {
      'femea_0-7': racasOrdenadas.reduce((sum, raca) => sum + (dadosPorRaca[raca]?.['femea_0-7'] || 0), 0),
      'femea_7-12': racasOrdenadas.reduce((sum, raca) => sum + (dadosPorRaca[raca]?.['femea_7-12'] || 0), 0),
      'femea_12-18': racasOrdenadas.reduce((sum, raca) => sum + (dadosPorRaca[raca]?.['femea_12-18'] || 0), 0),
      'femea_18-24': racasOrdenadas.reduce((sum, raca) => sum + (dadosPorRaca[raca]?.['femea_18-24'] || 0), 0),
      'femea_24+': racasOrdenadas.reduce((sum, raca) => sum + (dadosPorRaca[raca]?.['femea_24+'] || 0), 0),
      'macho_0-7': racasOrdenadas.reduce((sum, raca) => sum + (dadosPorRaca[raca]?.['macho_0-7'] || 0), 0),
      'macho_7-15': racasOrdenadas.reduce((sum, raca) => sum + (dadosPorRaca[raca]?.['macho_7-15'] || 0), 0),
      'macho_15-18': racasOrdenadas.reduce((sum, raca) => sum + (dadosPorRaca[raca]?.['macho_15-18'] || 0), 0),
      'macho_18-22': racasOrdenadas.reduce((sum, raca) => sum + (dadosPorRaca[raca]?.['macho_18-22'] || 0), 0),
      'macho_36+': racasOrdenadas.reduce((sum, raca) => sum + (dadosPorRaca[raca]?.['macho_36+'] || 0), 0),
      total: racasOrdenadas.reduce((sum, raca) => sum + (dadosPorRaca[raca]?.total || 0), 0)
    }

    // Linha de total (sÃ³ adicionar se houver dados)
    if (racasOrdenadas.length > 0) {
      const totalRow = sheet.addRow([
        'TOTAL GERAL',
        totais['femea_0-7'] || 0,
        totais['femea_7-12'] || 0,
        totais['femea_12-18'] || 0,
        totais['femea_18-24'] || 0,
        totais['femea_24+'] || 0,
        totais['macho_0-7'] || 0,
        totais['macho_7-15'] || 0,
        totais['macho_15-18'] || 0,
        totais['macho_18-22'] || 0,
        totais['macho_36+'] || 0,
        totais.total || 0
      ])
      totalRow.font = { bold: true, color: { argb: 'FFFFFF' } }
      // Usar o Ã­ndice da coluna fornecido pelo eachCell para evitar acessar propriedades inexistentes
      totalRow.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1E40AF' }
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        }
      })
    }

    // Formatar largura das colunas de forma compatÃ­vel com ExcelJS
    // Em algumas versÃµes, sheet.columns pode estar indefinido se nÃ£o configurado explicitamente.
    // Usamos getColumn(index) para garantir que a coluna exista.
    const totalColumns = 12 // A1..L1
    for (let i = 1; i <= totalColumns; i++) {
      const column = sheet.getColumn(i)
      column.width = i === 1 ? 20 : 15
    }

    console.log('ðÅ¸â€™¾ Gerando buffer do Excel...')
    // Gerar buffer
    let buffer
    try {
      buffer = await workbook.xlsx.writeBuffer()
      console.log('âÅ“â€¦ Buffer gerado com sucesso')
    } catch (bufferError) {
      console.error('â�Å’ Erro ao gerar buffer:', bufferError)
      throw new Error(`Erro ao gerar arquivo Excel: ${bufferError.message}`)
    }

    console.log('ðÅ¸â€œ¤ Enviando resposta...')
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=boletim-agropecuaria-pardinho-${pgStart}-${pgEnd}.xlsx`)
    res.send(Buffer.from(buffer))
    console.log('âÅ“â€¦ Arquivo enviado com sucesso')

  } catch (error) {
    console.error('Erro ao gerar boletim AGROPECUÃ�RIA PARDINHO:', error)
    console.error('Stack trace:', error.stack)
    
    // Retornar mensagem de erro mais detalhada em desenvolvimento
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Erro ao gerar boletim. Verifique os logs do servidor.'
    
    res.status(500).json({ 
      message: 'Erro ao gerar boletim',
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

