import { query, pool } from '../../../lib/database'
import logger from '../../../utils/logger'
import { 
  sendSuccess, 
  sendValidationError, 
  sendError,
  sendMethodNotAllowed
} from '../../../utils/apiResponse'
import * as XLSX from 'xlsx'

export default async function importObitosExcelHandler(req, res) {
  const { method } = req

  if (method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST'])
  }

  try {
    logger.info('📥 Iniciando importação de óbitos via Excel')
    
    const { fileData, fileName } = req.body

    if (!fileData) {
      logger.warn('❌ Arquivo Excel não fornecido')
      return sendValidationError(res, 'Arquivo Excel é obrigatório')
    }

    logger.info(`📄 Processando arquivo: ${fileName}`)

    // Converter base64 para buffer
    let buffer
    try {
      if (typeof fileData === 'string') {
        const base64Data = fileData.replace(/^data:.*,/, '')
        buffer = Buffer.from(base64Data, 'base64')
        logger.info(`✅ Base64 convertido para buffer, tamanho: ${buffer.length} bytes`)
      } else {
        buffer = Buffer.from(fileData)
      }
    } catch (error) {
      logger.error('❌ Erro ao converter arquivo:', error)
      return sendError(res, `Erro ao processar arquivo: ${error.message}`)
    }

    if (!buffer || buffer.length === 0) {
      return sendError(res, 'Arquivo inválido ou vazio')
    }

    // Ler arquivo Excel
    let workbook, worksheet
    try {
      workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false
      })
      const sheetName = workbook.SheetNames[0]
      worksheet = workbook.Sheets[sheetName]
      logger.info(`✅ Arquivo Excel lido, planilha: ${sheetName}`)
    } catch (error) {
      logger.error('❌ Erro ao ler arquivo Excel:', error)
      return sendError(res, `Erro ao ler arquivo Excel: ${error.message}`)
    }
    
    // Converter para JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: null,
      raw: true
    })

    if (data.length < 2) {
      return sendValidationError(res, 'Planilha vazia ou sem dados')
    }

    // Encontrar cabeçalho
    let headerRowIndex = 0
    for (let i = 0; i < Math.min(5, data.length); i++) {
      if (data[i] && data[i].some(cell => cell !== null && cell !== '')) {
        headerRowIndex = i
        break
      }
    }

    const headers = data[headerRowIndex].map(h => String(h || '').trim().toLowerCase())
    logger.info(`📋 Cabeçalhos: ${headers.filter(h => h).join(', ')}`)
    
    // Mapear colunas
    const columnMap = {
      serie: headers.findIndex(h => 
        h.includes('série') || h.includes('serie')
      ),
      rg: headers.findIndex(h => 
        h === 'rg' || (h.includes('rg') && !h.includes('rgd'))
      ),
      data_morte: headers.findIndex(h => 
        h.includes('data') && (h.includes('morte') || h.includes('óbito') || h.includes('obito'))
      ),
      motivo: headers.findIndex(h => 
        h.includes('motivo') || h.includes('causa') || h.includes('razão') || h.includes('razao')
      ),
      observacoes: headers.findIndex(h => 
        h.includes('observ') || h.includes('obs') || h.includes('nota') || h.includes('comentario')
      ),
      valor_perda: headers.findIndex(h => 
        h.includes('valor') && (h.includes('perda') || h.includes('prejuizo') || h.includes('prejuízo'))
      ),
      local: headers.findIndex(h => 
        h.includes('local') || h.includes('piquete') || h.includes('lote')
      )
    }
    
    logger.info(`🔍 Mapeamento de colunas:`)
    logger.info(`   Série: ${columnMap.serie}, RG: ${columnMap.rg}`)
    logger.info(`   Data Morte: ${columnMap.data_morte}, Motivo: ${columnMap.motivo}`)
    logger.info(`   Observações: ${columnMap.observacoes}, Valor Perda: ${columnMap.valor_perda}`)
    logger.info(`   Local: ${columnMap.local}`)
    
    // Validar colunas obrigatórias
    if (columnMap.rg === -1 || columnMap.data_morte === -1) {
      return sendValidationError(res, 'Colunas obrigatórias não encontradas: RG e Data da Morte são obrigatórios')
    }

    // Processar dados
    const rows = data.slice(headerRowIndex + 1)
    const processedData = []
    const errors = []
    const warnings = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = headerRowIndex + 2 + i

      // Pular linhas vazias
      if (!row || row.every(cell => cell === null || cell === '' || String(cell).trim() === '')) {
        continue
      }

      // Extrair dados
      const serie = columnMap.serie !== -1 && row[columnMap.serie] 
        ? String(row[columnMap.serie]).trim() 
        : null
      
      const rg = columnMap.rg !== -1 && row[columnMap.rg] 
        ? String(row[columnMap.rg]).trim() 
        : null

      const dataVal = row[columnMap.data_morte]
      const motivo = columnMap.motivo !== -1 && row[columnMap.motivo] 
        ? String(row[columnMap.motivo]).trim() 
        : null

      if (!rg || !dataVal) {
        warnings.push(`Linha ${rowNum}: RG ou Data da Morte faltando`)
        continue
      }

      // Processar data
      let dataMorte = null
      try {
        let dateObj = null
        
        if (dataVal instanceof Date) {
          dateObj = dataVal
          dateObj.setHours(12, 0, 0, 0)
        } else if (typeof dataVal === 'number') {
          const excelEpoch = new Date(1899, 11, 30)
          const days = Math.floor(dataVal)
          const milliseconds = (dataVal - days) * 86400000
          dateObj = new Date(excelEpoch.getTime() + days * 86400000 + milliseconds)
          dateObj.setHours(12, 0, 0, 0)
        } else {
          const dataStr = String(dataVal).trim()
          
          if (dataStr.includes('/')) {
            const parts = dataStr.split('/')
            if (parts.length === 3) {
              const day = parseInt(parts[0])
              const month = parseInt(parts[1]) - 1
              let year = parseInt(parts[2])
              
              if (year < 100) {
                year += 2000
              }
              
              dateObj = new Date(year, month, day, 12, 0, 0, 0)
            }
          } else if (dataStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            dateObj = new Date(dataStr + 'T12:00:00')
          } else {
            dateObj = new Date(dataStr)
            if (!isNaN(dateObj.getTime())) {
              dateObj.setHours(12, 0, 0, 0)
            }
          }
        }

        if (!dateObj || isNaN(dateObj.getTime())) {
          throw new Error(`Data inválida: ${dataVal}`)
        }

        dataMorte = dateObj.toISOString().split('T')[0]
      } catch (error) {
        errors.push(`Linha ${rowNum}: Data inválida "${dataVal}" - ${error.message}`)
        continue
      }

      // Buscar animal
      let animal = null
      let animalId = null
      let animalNome = null

      try {
        let animalResult
        
        if (serie && rg) {
          // Buscar com série e RG
          animalResult = await query(
            `SELECT id, nome, rg, serie, sexo, raca 
             FROM animais 
             WHERE UPPER(COALESCE(serie, '')) = UPPER($1) 
             AND UPPER(CAST(rg AS TEXT)) = UPPER($2)
             LIMIT 1`,
            [serie, rg]
          )
        } else {
          // Buscar apenas por RG
          animalResult = await query(
            `SELECT id, nome, rg, serie, sexo, raca 
             FROM animais 
             WHERE UPPER(CAST(rg AS TEXT)) = UPPER($1)
             LIMIT 1`,
            [rg]
          )
        }

        if (animalResult.rows.length > 0) {
          animal = animalResult.rows[0]
          animalId = animal.id
          animalNome = animal.nome || `${animal.serie || ''} ${animal.rg || ''}`.trim()
        } else {
          warnings.push(`Linha ${rowNum}: Animal não encontrado - ${serie ? serie + ' ' : ''}${rg}`)
          // Continuar mesmo sem encontrar o animal
          animalNome = `${serie ? serie + ' ' : ''}${rg}`
        }
      } catch (error) {
        logger.warn(`Erro ao buscar animal linha ${rowNum}:`, error)
        animalNome = `${serie ? serie + ' ' : ''}${rg}`
      }

      // Extrair outros campos
      const observacoes = columnMap.observacoes !== -1 && row[columnMap.observacoes] 
        ? String(row[columnMap.observacoes]).trim() 
        : null

      const valorPerda = columnMap.valor_perda !== -1 && row[columnMap.valor_perda] 
        ? parseFloat(row[columnMap.valor_perda]) || 0
        : 0

      const local = columnMap.local !== -1 && row[columnMap.local] 
        ? String(row[columnMap.local]).trim() 
        : null

      processedData.push({
        animal_id: animalId,
        serie: serie,
        rg: rg,
        animal_nome: animalNome,
        data_morte: dataMorte,
        motivo: motivo || 'Não informado',
        observacoes: observacoes,
        valor_perda: valorPerda,
        local: local
      })
    }

    logger.info(`✅ ${processedData.length} registros processados`)
    if (warnings.length > 0) {
      logger.warn(`⚠️ ${warnings.length} avisos`)
    }
    if (errors.length > 0) {
      logger.error(`❌ ${errors.length} erros`)
    }

    if (processedData.length === 0) {
      return sendValidationError(res, 'Nenhum dado válido encontrado na planilha')
    }

    // Inserir no banco
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      const createdItems = []
      const insertErrors = []

      for (const item of processedData) {
        try {
          const { rows } = await client.query(
            `INSERT INTO obitos 
            (animal_id, serie, rg, animal_nome, data_morte, motivo, observacoes, valor_perda, local, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
              item.animal_id,
              item.serie,
              item.rg,
              item.animal_nome,
              item.data_morte,
              item.motivo,
              item.observacoes,
              item.valor_perda,
              item.local
            ]
          )
          createdItems.push(rows[0])
        } catch (error) {
          insertErrors.push(`Erro ao inserir ${item.animal_nome}: ${error.message}`)
          logger.error(`Erro ao inserir óbito:`, error)
        }
      }
      
      await client.query('COMMIT')
      
      logger.info(`✅ ${createdItems.length} óbitos importados com sucesso`)
      
      return sendSuccess(res, {
        created: createdItems.length,
        total: processedData.length,
        errors: insertErrors.length > 0 ? insertErrors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        items: createdItems
      }, `Importação concluída: ${createdItems.length} óbitos importados`, 201)
      
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Erro ao importar óbitos:', error)
      return sendError(res, `Erro ao importar dados: ${error.message}`)
    } finally {
      client.release()
    }

  } catch (error) {
    logger.error('Erro ao processar arquivo Excel:', error)
    return sendError(res, `Erro ao processar arquivo: ${error.message}`)
  }
}