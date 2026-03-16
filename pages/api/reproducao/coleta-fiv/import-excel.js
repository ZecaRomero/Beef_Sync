import { query, pool } from '../../../../lib/database'
import logger from '../../../../utils/logger'
import {
  sendSuccess,
  sendValidationError,
  sendError,
  sendMethodNotAllowed,
} from '../../../../utils/apiResponse'
import { readExcelFileDetailed } from '../../../../lib/import/excelReader'
import { sanitizeRow } from '../../../../lib/import/sanitizer'
import { validateRowsWithSchema } from '../../../../lib/import/validator'
import { detectDuplicates } from '../../../../lib/import/duplicateChecker'
import { ColetaFivImportSchema } from '../../../../schemas/coletaFivSchema'
import { blockIfNotZecaDeveloper } from '../../../../utils/importAccess'

const normalizeHeader = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')

const findHeader = (headers, aliases) => {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }))

  for (const alias of aliases) {
    const target = normalizeHeader(alias)
    const match = normalizedHeaders.find(
      (item) => item.normalized === target || item.normalized.includes(target)
    )
    if (match?.original) return match.original
  }

  return null
}

const toInt = (value) => {
  if (value === null || value === undefined || value === '') return 0
  const parsed = Number(
    String(value)
      .trim()
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.')
  )
  return Number.isNaN(parsed) ? 0 : Math.max(0, Math.floor(parsed))
}

async function resolveDoadora(identificador) {
  const normalized = String(identificador || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()

  if (!normalized) {
    return { doadora_id: null, doadora_nome: null, doadora_identificador: null }
  }

  const partes = normalized.split(/\s+/)
  const serieBusca = partes.length >= 2 ? partes[0] : null
  const rgBusca = partes.length >= 2 ? partes.slice(1).join(' ') : partes[0]
  const compact = normalized.replace(/\s+/g, '')

  try {
    const result = await query(
      `SELECT id, nome, serie, rg
       FROM animais
       WHERE (
         (UPPER(COALESCE(serie, '')) = $1 AND UPPER(CAST(rg AS TEXT)) = $2)
         OR UPPER(REPLACE(COALESCE(serie, '') || CAST(rg AS TEXT), ' ', '')) = $3
         OR UPPER(REPLACE(COALESCE(serie, '') || ' ' || CAST(rg AS TEXT), ' ', '')) = $3
         OR UPPER(REPLACE(nome, ' ', '')) = $3
       )
       AND (sexo ILIKE 'F%' OR sexo = 'F')
       LIMIT 1`,
      [serieBusca || '', rgBusca || '', compact]
    )

    if (!result.rows.length) {
      return {
        doadora_id: null,
        doadora_nome: normalized,
        doadora_identificador: normalized,
      }
    }

    const animal = result.rows[0]
    return {
      doadora_id: animal.id,
      doadora_nome:
        animal.nome || `${animal.serie || ''} ${animal.rg || ''}`.trim() || normalized,
      doadora_identificador: normalized,
    }
  } catch (error) {
    logger.warn(`Erro ao buscar doadora ${normalized}:`, error)
    return {
      doadora_id: null,
      doadora_nome: normalized,
      doadora_identificador: normalized,
    }
  }
}

async function checkDuplicatesAgainstDatabase(validRows) {
  if (!validRows.length) return []

  const datas = [...new Set(validRows.map((item) => item.row.data_fiv).filter(Boolean))]
  const laboratorios = [
    ...new Set(validRows.map((item) => String(item.row.laboratorio || '').trim()).filter(Boolean)),
  ]

  if (!datas.length || !laboratorios.length) return []

  const result = await query(
    `SELECT
      UPPER(COALESCE(doadora_identificador, TRIM(doadora_nome), '')) AS doadora_key,
      data_fiv,
      LOWER(TRIM(COALESCE(laboratorio, ''))) AS laboratorio_key
    FROM coleta_fiv
    WHERE data_fiv = ANY($1::date[])
      AND LOWER(TRIM(COALESCE(laboratorio, ''))) = ANY($2::text[])`,
    [datas, laboratorios.map((item) => item.toLowerCase())]
  )

  return result.rows.map(
    (item) => `${item.doadora_key}|${String(item.data_fiv).slice(0, 10)}|${item.laboratorio_key}`
  )
}

function buildPreviewRows(allRows, allErrors) {
  return allRows.map((item) => {
    const rowErrors = allErrors.filter((err) => err.row === item.rowNumber)
    return {
      rowNumber: item.rowNumber,
      isValid: rowErrors.length === 0,
      data: item.row,
      errors: rowErrors,
    }
  })
}

export default async function importExcelHandler(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, req.method)
  }

  const blocked = blockIfNotZecaDeveloper(
    req,
    res,
    'Acesso negado. Importação de Excel da Coleta FIV permitida somente para Zeca Desenvolvedor.'
  )
  if (blocked) return blocked

  try {
    const { fileData, fileName, laboratorio, veterinario, mode = 'import', data } = req.body || {}

    let mappedRows = []

    if (Array.isArray(data) && data.length > 0) {
      logger.info(`📥 Importação coleta FIV iniciada por dados JSON (${data.length} linhas)`)
      mappedRows = data.map((raw, index) => ({
        rowNumber: index + 2,
        row: sanitizeRow(
          {
            doadora_identificador:
              raw.doadora_identificador ||
              [raw.doadora_serie, raw.doadora_rg].filter(Boolean).join(' ').trim() ||
              raw.doadora_nome ||
              null,
            doadora_nome: raw.doadora_nome || null,
            laboratorio: raw.laboratorio || laboratorio || null,
            veterinario: raw.veterinario || veterinario || null,
            data_fiv: raw.data_fiv || null,
            touro: raw.touro || null,
            quantidade_oocitos: raw.quantidade_oocitos ?? 0,
            embrioes_produzidos: raw.embrioes_produzidos ?? 0,
            embrioes_transferidos: raw.embrioes_transferidos ?? 0,
            quantidade_te: raw.quantidade_te ?? raw.embrioes_transferidos ?? 0,
            observacoes: raw.observacoes || null,
          },
          {
            uppercaseFields: ['doadora_identificador'],
            dateFields: ['data_fiv'],
          }
        ),
      }))
    } else {
      if (!fileData) {
        return sendValidationError(res, [{ field: 'fileData', message: 'Arquivo Excel é obrigatório' }])
      }
      if (!laboratorio || !veterinario) {
        return sendValidationError(res, [
          { field: 'laboratorio', message: 'Laboratório é obrigatório' },
          { field: 'veterinario', message: 'Veterinário é obrigatório' },
        ])
      }

      logger.info(`📥 Importação coleta FIV iniciada. Arquivo: ${fileName || 'não informado'}`)

      const buffer =
        typeof fileData === 'string'
          ? Buffer.from(fileData.replace(/^data:.*,/, ''), 'base64')
          : Buffer.from(fileData)

      const excel = readExcelFileDetailed(buffer)
      if (!excel.rows.length) {
        return sendValidationError(res, [{ field: 'fileData', message: 'Planilha vazia ou sem dados' }])
      }

      const serieHeader = findHeader(excel.headers, ['série', 'serie'])
      const rgHeader = findHeader(excel.headers, ['rg'])
      const rgdHeader = findHeader(excel.headers, ['rgd', 'rqd', 'registro da doadora', 'doadora'])
      const dataHeader = findHeader(excel.headers, ['data fiv', 'data'])
      const touroHeader = findHeader(excel.headers, ['touro'])
      const viaveisHeader = findHeader(excel.headers, ['viáveis', 'viaveis'])
      const cultivadosHeader = findHeader(excel.headers, ['cultivados'])
      const embrioesHeader = findHeader(excel.headers, ['embriões', 'embrioes', 'embrião', 'embriao'])
      const pctEmbHeader = findHeader(excel.headers, ['%emb', 'percentual emb', 'porcentagem emb'])
      const teHeader = findHeader(excel.headers, ['te', 't.e.', 'transferidos', 'transferido'])

      if (!dataHeader || (!rgHeader && !rgdHeader)) {
        return sendValidationError(
          res,
          {
            headersEncontrados: excel.headers,
            erro:
              'A planilha precisa ter ao menos as colunas de identificação da doadora (RG, RGD ou RQd) e data da FIV.',
          },
          'Colunas obrigatórias não encontradas'
        )
      }

      mappedRows = excel.rows
        .map((item) => {
        const raw = item.row || {}
        const serie = serieHeader ? String(raw[serieHeader] || '').trim() : ''
        const rg = rgHeader ? String(raw[rgHeader] || '').trim() : ''
        const rgd = rgdHeader ? String(raw[rgdHeader] || '').trim() : ''
        const identificador = [serie, rg || rgd].filter(Boolean).join(' ').trim()
        const dataFiv = dataHeader ? raw[dataHeader] : null
        const embrioes = embrioesHeader ? raw[embrioesHeader] : null
        const te = teHeader ? raw[teHeader] : null
        const viaveis = viaveisHeader ? raw[viaveisHeader] : null
        const cultivados = cultivadosHeader ? raw[cultivadosHeader] : null
        const pctEmb = pctEmbHeader ? raw[pctEmbHeader] : null

        const observacoesParts = []
        if (embrioes !== null && embrioes !== undefined && embrioes !== '') {
          observacoesParts.push(`Embriões: ${embrioes}`)
        }
        if (pctEmb !== null && pctEmb !== undefined && pctEmb !== '') {
          observacoesParts.push(`%Emb: ${pctEmb}`)
        }

        return {
          rowNumber: item.rowNumber,
          row: sanitizeRow(
            {
              doadora_identificador: identificador || null,
              doadora_nome: identificador || null,
              laboratorio,
              veterinario,
              data_fiv: dataFiv,
              touro: touroHeader ? raw[touroHeader] : null,
              quantidade_oocitos: viaveis ?? cultivados ?? 0,
              embrioes_produzidos: embrioes ?? 0,
              embrioes_transferidos: te ?? 0,
              quantidade_te: te ?? 0,
              observacoes: observacoesParts.join(' | ') || null,
            },
            {
              uppercaseFields: ['doadora_identificador'],
              dateFields: ['data_fiv'],
            }
          ),
        }
      })
      .filter((item) => {
        const row = item.row || {}
        return Object.values(row).some((value) => value !== null && value !== undefined && String(value).trim() !== '')
      })
    }

    const schemaValidation = validateRowsWithSchema(mappedRows, ColetaFivImportSchema)
    const duplicateCheck = await detectDuplicates(schemaValidation.validRows, {
      uniqueBy: (row) =>
        `${String(row.doadora_identificador || '').toUpperCase()}|${row.data_fiv}|${String(
          row.laboratorio || ''
        )
          .trim()
          .toLowerCase()}`,
      checkDuplicatesAgainstDatabase: checkDuplicatesAgainstDatabase,
    })

    const duplicateErrors = [
      ...duplicateCheck.duplicatesInFile,
      ...duplicateCheck.duplicatesInDatabase,
    ].map((item) => ({
      row: item.row,
      column: item.column,
      value: item.value,
      error: item.error,
    }))

    const allErrors = [...schemaValidation.errors, ...duplicateErrors]
    const invalidRowNumbers = new Set(allErrors.map((item) => item.row))
    const validRows = schemaValidation.allRows.filter((item) => !invalidRowNumbers.has(item.rowNumber))
    const invalidRows = schemaValidation.allRows.filter((item) => invalidRowNumbers.has(item.rowNumber))
    const previewRows = buildPreviewRows(schemaValidation.allRows, allErrors)

    const report = {
      totalRows: schemaValidation.allRows.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      errors: allErrors,
      duplicates: [...duplicateCheck.duplicatesInFile, ...duplicateCheck.duplicatesInDatabase],
    }

    if (String(mode).toLowerCase() === 'preview') {
      return sendSuccess(res, { previewRows, report }, 'Preview de importação gerado com sucesso')
    }

    if (!validRows.length) {
      return sendValidationError(res, report, 'Nenhuma linha válida para importar')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const createdItems = []
      const createdTEs = []
      const insertErrors = []

      for (let idx = 0; idx < validRows.length; idx++) {
        const item = validRows[idx].row
        const savepointName = `sp_${idx}`
        await client.query(`SAVEPOINT ${savepointName}`)
        try {
          const doadoraResolved = await resolveDoadora(item.doadora_identificador)
          const fivDate = new Date(`${item.data_fiv}T12:00:00`)
          const transferDate = new Date(fivDate)
          transferDate.setDate(transferDate.getDate() + 7)
          const dataTransferencia = transferDate.toISOString().slice(0, 10)

          const obsParts = [item.observacoes]
          if (item.embrioes_produzidos != null) obsParts.push(`Embriões: ${item.embrioes_produzidos}`)
          if (item.embrioes_transferidos != null) obsParts.push(`TE: ${item.embrioes_transferidos}`)
          const observacoesFinal = obsParts.filter(Boolean).join(' | ') || null

          const insertColeta = await client.query(
            `INSERT INTO coleta_fiv
              (doadora_id, doadora_nome, doadora_identificador, laboratorio, veterinario, data_fiv, data_transferencia, quantidade_oocitos, touro, observacoes, created_at, updated_at)
             VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING *`,
            [
              doadoraResolved.doadora_id,
              doadoraResolved.doadora_nome || item.doadora_identificador,
              doadoraResolved.doadora_identificador || item.doadora_identificador,
              item.laboratorio,
              item.veterinario,
              item.data_fiv,
              dataTransferencia,
              toInt(item.quantidade_oocitos),
              item.touro || null,
              observacoesFinal,
            ]
          )

          createdItems.push(insertColeta.rows[0])

          const quantidadeTe = toInt(item.quantidade_te)
          if (quantidadeTe > 0) {
            let touroId = null
            if (item.touro) {
              const touroResult = await client.query(
                `SELECT id
                 FROM animais
                 WHERE nome ILIKE $1
                    OR (COALESCE(serie, '') || ' ' || CAST(rg AS TEXT)) ILIKE $1
                 LIMIT 1`,
                [`%${item.touro}%`]
              )
              if (touroResult.rows.length > 0) touroId = touroResult.rows[0].id
            }

            for (let teNum = 1; teNum <= quantidadeTe; teNum++) {
              const teDateStr = dataTransferencia.replace(/-/g, '')
              const numeroTE = `TE-${teDateStr}-${idx}-${teNum}-${Date.now()}`

              const teObs = [
                doadoraResolved.doadora_nome && `Doadora: ${doadoraResolved.doadora_nome}`,
                item.touro && `Touro: ${item.touro}`,
              ]
                .filter(Boolean)
                .join(' | ')

              const teResult = await client.query(
                `INSERT INTO transferencias_embrioes
                  (numero_te, data_te, doadora_id, touro_id, data_fiv, local_te, tecnico_responsavel, observacoes, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'realizada')
                 RETURNING *`,
                [
                  numeroTE,
                  dataTransferencia,
                  doadoraResolved.doadora_id || null,
                  touroId,
                  item.data_fiv,
                  item.laboratorio || null,
                  item.veterinario || null,
                  teObs || null,
                ]
              )
              createdTEs.push(teResult.rows[0])
            }
          }

          await client.query(`RELEASE SAVEPOINT ${savepointName}`)
        } catch (error) {
          await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`)
          insertErrors.push(`Linha ${validRows[idx].rowNumber}: ${error.message}`)
        }
      }

      await client.query('COMMIT')

      return sendSuccess(
        res,
        {
          created: createdItems.length,
          createdTEs: createdTEs.length,
          total: validRows.length,
          report,
          previewRows,
          importErrors: insertErrors.length ? insertErrors : undefined,
          items: createdItems,
          tes: createdTEs,
        },
        `Importação concluída: ${createdItems.length} coletas FIV e ${createdTEs.length} TEs`,
        201
      )
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Erro ao importar coletas FIV:', error)
      return sendError(res, `Erro ao importar dados: ${error.message}`)
    } finally {
      client.release()
    }
  } catch (error) {
    logger.error('Erro ao processar importação FIV:', error)
    return sendError(res, `Erro ao processar arquivo: ${error.message}`)
  }
}
