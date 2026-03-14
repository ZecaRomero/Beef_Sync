import React, { useState } from 'react'
import { XMarkIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Checkbox from '../ui/Checkbox'

// ImportaÃ§Ã£o dinÃ¢mica do XLSX
let XLSX = null
if (typeof window !== 'undefined') {
  try {
    XLSX = require('xlsx')
  } catch (e) {
    console.warn('Biblioteca xlsx nÃ£o encontrada. Use arquivos CSV.')
  }
}

export default function AnimalExcelUpdater({ isOpen, onClose, animalId, onUpdate, currentAnimal }) {
  const [file, setFile] = useState(null)
  const [pastedData, setPastedData] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [selectedFields, setSelectedFields] = useState({})
  const [matchStatus, setMatchStatus] = useState(null)
  const [availableFields, setAvailableFields] = useState([])
  const [parsedRows, setParsedRows] = useState([])
  const [bulkMode, setBulkMode] = useState(false)
  
  // Campos disponÃ­veis para seleÃ§Ã£o (sempre visÃ­veis)
  const [camposSelecionados, setCamposSelecionados] = useState({
    pai: true,
    mae: true,
    receptora: true,
    avo_materno: true,
    abczg: true,
    deca: true,
    nome: false,
    tatuagem: false,
    sexo: false,
    raca: false,
    data_nascimento: false,
    meses: false,
    peso: false,
    situacao: false,
    cor: false
  })

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      setError('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV')
      return
    }

    setFile(selectedFile)
    setError('')
    setMatchStatus(null)
    parseFile(selectedFile)
  }

  const parseFile = async (file) => {
    try {
      setMatchStatus(null)
      const fileExtension = file.name.split('.').pop().toLowerCase()
      let rowsData = []
      let headers = []

      const normalizeDecimalString = (value) => {
        if (value === null || value === undefined) return value
        const s = String(value).trim()
        if (!s) return s
        const hasComma = s.includes(',')
        const hasDot = s.includes('.')
        if (hasComma && hasDot) {
          return s.replace(/\./g, '').replace(',', '.')
        }
        if (hasComma) return s.replace(',', '.')
        return s
      }

      const normalizeDateToISO = (value) => {
        if (value === null || value === undefined) return value
        if (typeof value === 'number' && !Number.isNaN(value)) {
          const date = new Date((value - 25569) * 86400 * 1000)
          if (Number.isNaN(date.getTime())) return null
          return date.toISOString().split('T')[0]
        }

        const s = String(value).trim()
        if (!s) return s

        const m1 = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
        if (m1) {
          const [, dd, mm, yyyy] = m1
          return `${yyyy}-${mm}-${dd}`
        }

        const m2 = s.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/)
        if (m2) {
          const [, yyyy, mm, dd] = m2
          return `${yyyy}-${mm}-${dd}`
        }

        return s
      }

      const normalizeSexo = (value) => {
        const s = String(value || '').trim().toUpperCase()
        if (!s) return null
        if (s === 'F' || s === 'FEMEA' || s === 'FÃÅ MEA') return 'FÃªmea'
        if (s === 'M' || s === 'MACHO') return 'Macho'
        if (s === 'FÃÅ MEA') return 'FÃªmea'
        return String(value).trim()
      }

      const mapDataToFields = (data) => {
        const mappedData = {}
        const foundFields = {}

        const getMappedValue = (targetField, sourceKeys) => {
          // FunÃ§Ã£o para normalizar chaves (remover acentos, espaÃ§os, case-insensitive)
          const normalizeKey = (k) => {
            if (!k) return ''
            return String(k)
              .toLowerCase()
              .trim()
              .replace(/\s+/g, ' ')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          }
          
          // Primeiro tentar o nome exato do campo
          if (data[targetField] !== undefined && data[targetField] !== null && data[targetField] !== '') {
            return data[targetField]
          }
          
          // Tentar todas as variaÃ§Ãµes de chave (case-insensitive e normalizado)
          const dataKeys = Object.keys(data)
          
          // Buscar exato primeiro
          for (const key of sourceKeys) {
            if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
              return data[key]
            }
          }
          
          // Buscar case-insensitive e normalizado
          for (const key of sourceKeys) {
            const normalizedSourceKey = normalizeKey(key)
            const matchingKey = dataKeys.find(dk => {
              const normalizedDataKey = normalizeKey(dk)

              // ProteÃ§Ã£o contra falsos positivos:
              // Se estamos procurando campos do prÃ³prio animal (nome, rg, serie), 
              // a coluna nÃ£o deve conter referÃªncias a parentes (pai, mÃ£e, avÃ´, receptora)
              if (['nome', 'rg', 'serie', 'raca', 'sexo'].includes(targetField)) {
                const termosProibidos = ['pai', 'mae', 'mÃ£e', 'avo', 'avÃ´', 'receptora', 'rec']
                if (termosProibidos.some(termo => normalizedDataKey.includes(termo))) {
                  return false
                }
              }

              return normalizedDataKey === normalizedSourceKey || 
                     normalizedDataKey.includes(normalizedSourceKey) ||
                     normalizedSourceKey.includes(normalizedDataKey)
            })
            if (matchingKey && data[matchingKey] !== undefined && data[matchingKey] !== null && data[matchingKey] !== '') {
              return data[matchingKey]
            }
          }
          
          return null
        }

        const fieldMappings = {
          nome: ['nome', 'name', 'animal'],
          abczg: ['abczg', 'iabcz', 'iabczg', '!abczg', 'Â¡abczg'],
          deca: ['deca'],
          pai: ['pai', 'pai_nome', 'nome_pai', 'nome do pai', 'pat', 'pat (pai)'],
          mae: ['mae', 'mÃ£e', 'mae_nome', 'nome_mae', 'nome da mÃ£e', 'nome da mae'],
          mae_serie: ['mae_serie', 'serie_mae', 'sÃ©rie mÃ£e', 'serie mÃ£e', 'serie_mae', 'serie mae', 'sÃ©rie mÃ£e', 'serie mÃ£e', 'seriemae', 'sÃ©riemÃ£e', 'serie_mÃ£e'],
          mae_rg: ['mae_rg', 'rg_mae', 'rgn mÃ£e', 'rgnmae', 'rgn mÃ£e', 'rg mÃ£e', 'rg_mae', 'rgnmÃ£e', 'rgn_mÃ£e', 'rg_mÃ£e'],
          avo_materno: ['avo_materno', 'avÃ´ materno', 'avo materno'],
          serie: ['serie', 'sÃ©rie'],
          rg: ['rg', 'registro', 'rgn', 'rgd'],
          receptora: ['receptora', 'rec', 'nome_receptora'],
          sexo: ['sexo'],
          raca: ['raca', 'raÃ§a'],
          cor: ['cor', 'pelagem'],
          peso: ['peso'],
          data_nascimento: ['data_nascimento', 'nascimento', 'nasc', 'dta_nasc']
        }

        Object.entries(fieldMappings).forEach(([targetField, sourceKeys]) => {
          const value = getMappedValue(targetField, sourceKeys)
          if (value !== null && value !== undefined && String(value).trim() !== '') {
            if (targetField === 'data_nascimento') {
              mappedData[targetField] = normalizeDateToISO(value)
            } else if (targetField === 'abczg' || targetField === 'deca') {
              mappedData[targetField] = normalizeDecimalString(value)
            } else if (targetField === 'sexo') {
              mappedData[targetField] = normalizeSexo(value)
            } else {
              mappedData[targetField] = String(value).trim()
            }
            foundFields[targetField] = true
          }
        })

        // Combinar dados da mÃ£e se temos sÃ©rie e RG separados
        if (mappedData.mae_serie || mappedData.mae_rg) {
          const maeNome = mappedData.mae || ''
          const maeSerie = mappedData.mae_serie || ''
          const maeRg = mappedData.mae_rg || ''
          
          if (maeSerie || maeRg) {
            const partes = [maeSerie, maeRg].filter(v => v && String(v).trim())
            let maeCompleta = partes.length > 0 ? partes.join('-') : maeNome
            if (maeNome && partes.length > 0 && !maeNome.includes(partes.join('-'))) {
              maeCompleta = `${maeNome} (${partes.join('-')})`
            }
            if (maeCompleta) {
              mappedData.mae = maeCompleta.trim()
              foundFields.mae = true
            }
          }
        }

        return { mappedData, foundFields }
      }

      if (fileExtension === 'csv') {
        const text = await file.text()
        const lines = text.split('\n').filter(line => line.trim())
        if (lines.length < 2) {
          setError('Arquivo CSV deve ter pelo menos 2 linhas (cabeÃ§alho + dados)')
          return
        }

        headers = lines[0].split(',').map(h => h.trim())
        rowsData = lines.slice(1).map((line, idx) => {
          const values = line.split(',').map(v => v.trim())
          const data = {}
          headers.forEach((header, index) => {
            const key = header.toLowerCase().trim()
            data[key] = values[index] || ''
          })
          return { rowNumber: idx + 2, data }
        })
      } else {
        if (!XLSX) {
          setError('Biblioteca Excel nÃ£o disponÃ­vel. Por favor, use arquivo CSV ou instale a biblioteca xlsx.')
          return
        }

        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })

        console.log('ðÅ¸â€�� Arquivo Excel parseado:', {
          totalLinhas: jsonData.length,
          primeiraLinha: jsonData[0],
          segundaLinha: jsonData[1]
        })

        if (jsonData.length < 2) {
          setError('Arquivo Excel deve ter pelo menos 2 linhas (cabeÃ§alho + dados)')
          return
        }

        const row0 = (jsonData[0] || []).map(h => String(h || '').trim().toUpperCase())
        const row1 = (jsonData[1] || []).map(h => String(h || '').trim().toUpperCase())

        const categorySet = new Set(['ANIMAL', 'PAI', 'MAE', 'MÃÆ’E', 'AVÃâ€� MATERNO', 'AVO MATERNO', 'RECEPTORA'])
        
        // Verificar se Ã© cabeÃ§alho duplo
        // CritÃ©rio 1: Alguma coluna do cabeÃ§alho Ã© uma categoria conhecida
        const hasCategory = row0.some(h => categorySet.has(h))
        
        // CritÃ©rio 2: Verificar se NÃÆ’O parece ser um cabeÃ§alho simples (que mistura categoria e campo, ex: "Nome do Pai")
        const singleHeaderIndicators = [
            'NOME DO PAI', 'NOME_PAI', 
            'SÃâ€°RIE MÃÆ’E', 'SERIE MAE', 'SERIEMÃÆ’E', 'SERIEMAE', 'SÃâ€°RIE_MÃÆ’E', 'SERIE_MAE',
            'RGN MÃÆ’E', 'RGN MAE', 'RGNMÃÆ’E', 'RGNMAE', 'RGN_MÃÆ’E', 'RGN_MAE',
            'NOME DA MÃÆ’E', 'NOME DA MAE',
            'SÃâ€°RIE PAI', 'SERIE PAI', 'RGN PAI', 'RG PAI'
        ]
        const hasSingleHeaderIndicator = row0.some(h => {
            const normalized = h.replace(/\s+/g, ' ') // Normalizar espaÃ§os
            return singleHeaderIndicators.some(indicator => normalized.includes(indicator) || indicator.includes(normalized))
        })

        // CritÃ©rio 3: Verificar se a linha 2 parece conter sub-cabeÃ§alhos (SÃ©rie, RG, Nome, etc)
        const subHeaderKeywords = ['SERIE', 'SÃâ€°RIE', 'RG', 'RGN', 'NOME', 'SEXO', 'DATA', 'PESO', 'RAÃâ€¡A', 'RACA', 'COR', 'PELAGEM']
        const row1HasKeywords = row1.some(h => subHeaderKeywords.some(k => h.includes(k)))

        // Ãâ€° cabeÃ§alho duplo se tem categoria, NÃÆ’O tem indicadores de cabeÃ§alho simples explÃ­citos,
        // E a segunda linha parece ter cabeÃ§alhos (ou tem pelo menos uma keyword)
        const isDoubleHeader = hasCategory && !hasSingleHeaderIndicator && row1HasKeywords

        if (isDoubleHeader) {
          if (jsonData.length < 3) {
            setError('Arquivo Excel com cabeÃ§alho duplo deve ter pelo menos 3 linhas (2 de cabeÃ§alho + dados)')
            return
          }

          let currentCategory = 'ANIMAL'
          const columnMap = {}

          row0.forEach((cat, idx) => {
            if (cat) currentCategory = cat
            const colName = row1[idx]
            if (!colName) return

            if (currentCategory === 'ANIMAL') {
              if (colName.includes('NOME')) columnMap[idx] = 'nome'
              if (colName.includes('SERIE') || colName.includes('SÃâ€°RIE')) columnMap[idx] = 'serie'
              if (colName === 'RG' || colName === 'RGN' || colName === 'RGD' || colName.includes('REGISTRO')) columnMap[idx] = 'rg'
              if (colName.includes('SEXO')) columnMap[idx] = 'sexo'
              if (colName.includes('NASC') || colName.includes('DATA')) columnMap[idx] = 'data_nascimento'
              if (colName.includes('IABCZ') || colName.includes('ABCZ')) columnMap[idx] = 'abczg'
              if (colName === 'DECA') columnMap[idx] = 'deca'
              if (colName.includes('PESO')) columnMap[idx] = 'peso'
              if (colName.includes('RACA') || colName.includes('RAÃâ€¡A')) columnMap[idx] = 'raca'
              if (colName.includes('COR') || colName.includes('PELAGEM')) columnMap[idx] = 'cor'
              return
            }

            if (currentCategory === 'PAI') {
              if (colName.includes('NOME') || colName === 'PAI') columnMap[idx] = 'pai_nome'
              if (colName.includes('SERIE') || colName.includes('SÃâ€°RIE')) columnMap[idx] = 'pai_serie'
              if (colName === 'RG' || colName === 'RGN' || colName === 'RGD') columnMap[idx] = 'pai_rg'
              return
            }

            if (['MAE', 'MÃÆ’E'].includes(currentCategory)) {
              if (colName.includes('NOME') || colName === 'MAE' || colName === 'MÃÆ’E') columnMap[idx] = 'mae_nome'
              if (colName.includes('SERIE') || colName.includes('SÃâ€°RIE')) columnMap[idx] = 'mae_serie'
              if (colName === 'RG' || colName === 'RGN' || colName === 'RGD') columnMap[idx] = 'mae_rg'
              return
            }

            if (['AVÃâ€� MATERNO', 'AVO MATERNO'].includes(currentCategory)) {
              if (colName.includes('NOME') || colName.includes('AVO') || colName.includes('AVÃâ€�')) columnMap[idx] = 'avo_materno_nome'
              if (colName.includes('SERIE') || colName.includes('SÃâ€°RIE')) columnMap[idx] = 'avo_materno_serie'
              if (colName === 'RG' || colName === 'RGN' || colName === 'RGD') columnMap[idx] = 'avo_materno_rg'
              return
            }

            if (currentCategory === 'RECEPTORA') {
              if (colName.includes('NOME') || colName.includes('RECEPTORA')) columnMap[idx] = 'receptora_nome'
              if (colName.includes('SERIE') || colName.includes('SÃâ€°RIE')) columnMap[idx] = 'receptora_serie'
              if (colName === 'RG' || colName === 'RGN' || colName === 'RGD') columnMap[idx] = 'receptora_rg'
              return
            }
          })

          const combineFiliation = (name, serie, rg) => {
            const nameStr = String(name || '').trim()
            const extra = [serie, rg].map(v => String(v || '').trim()).filter(Boolean).join('-')
            if (!nameStr) return null
            if (!extra) return nameStr
            return `${nameStr} (${extra})`
          }

          rowsData = []
          for (let i = 2; i < jsonData.length; i++) {
            const values = jsonData[i] || []
            const raw = {}

            Object.entries(columnMap).forEach(([idxStr, fieldKey]) => {
              const idx = Number(idxStr)
              const val = values[idx]
              if (val === undefined || val === null || val === '') return
              raw[fieldKey] = val
            })

            // Combinar dados da mÃ£e - verificar diferentes formatos de cabeÃ§alho
            let maeCompleta = ''
            if (raw.mae_nome || raw.mae_serie || raw.mae_rg) {
              maeCompleta = combineFiliation(raw.mae_nome, raw.mae_serie, raw.mae_rg) || ''
            } else if (raw['sÃ©rie mÃ£e'] || raw['serie mÃ£e'] || raw['serie_mae'] || raw['serie mae']) {
              // Formato alternativo: SÃ©rie MÃ£e e RgnMÃ£e separados
              const serieMae = raw['sÃ©rie mÃ£e'] || raw['serie mÃ£e'] || raw['serie_mae'] || raw['serie mae'] || ''
              const rgMae = raw['rgn mÃ£e'] || raw['rgnmae'] || raw['rgn mÃ£e'] || raw['rg mÃ£e'] || raw['rg_mae'] || ''
              const nomeMae = raw['nome da mÃ£e'] || raw['nome da mae'] || raw['mae'] || raw['mÃ£e'] || ''
              maeCompleta = combineFiliation(nomeMae, serieMae, rgMae) || ''
            }

            const data = {
              nome: raw.nome ? String(raw.nome).trim() : '',
              serie: raw.serie ? String(raw.serie).trim() : '',
              rg: raw.rg ? String(raw.rg).trim() : '',
              sexo: raw.sexo ? normalizeSexo(raw.sexo) : '',
              data_nascimento: raw.data_nascimento ? normalizeDateToISO(raw.data_nascimento) : '',
              abczg: raw.abczg !== undefined ? normalizeDecimalString(raw.abczg) : '',
              deca: raw.deca !== undefined ? normalizeDecimalString(raw.deca) : '',
              pai: combineFiliation(raw.pai_nome, raw.pai_serie, raw.pai_rg) || raw['nome do pai'] || '',
              mae: maeCompleta,
              receptora: combineFiliation(raw.receptora_nome, raw.receptora_serie, raw.receptora_rg) || raw.receptora || '',
              avo_materno: combineFiliation(raw.avo_materno_nome, raw.avo_materno_serie, raw.avo_materno_rg) || '',
              peso: raw.peso !== undefined ? normalizeDecimalString(raw.peso) : '',
              raca: raw.raca ? String(raw.raca).trim() : '',
              cor: raw.cor ? String(raw.cor).trim() : ''
            }

            if (Object.values(data).some(v => v !== null && v !== undefined && String(v).trim() !== '')) {
              rowsData.push({ rowNumber: i + 1, data })
            }
          }
        } else {
          // CabeÃ§alho simples - mapear diretamente
          headers = (jsonData[0] || []).map(h => String(h || '').trim())
          console.log('ðÅ¸â€�� CabeÃ§alhos encontrados (simples):', headers)
          
          rowsData = []
          for (let i = 1; i < jsonData.length; i++) {
            const values = (jsonData[i] || []).map(v => v)
            const data = {}
            
            headers.forEach((header, index) => {
              const headerLower = String(header).toLowerCase().trim()
              const headerUpper = String(header).toUpperCase().trim()
              const headerNormalized = headerUpper.replace(/\s+/g, ' ').trim()
              const value = values[index] ?? ''
              
              // Mapear campos especÃ­ficos da planilha do usuÃ¡rio (case-insensitive e tolerante a espaÃ§os)
              if (headerNormalized === 'SÃâ€°RIE' || headerNormalized === 'SERIE') {
                data['serie'] = value
                data['sÃ©rie'] = value
              } else if (headerNormalized === 'RGN' || headerNormalized === 'RG' || headerNormalized === 'RGD') {
                data['rg'] = value
                data['rgn'] = value
              } else if (headerNormalized.includes('NOME') && headerNormalized.includes('PAI')) {
                data['nome do pai'] = value
                data['pai'] = value
                data['nome_pai'] = value
                data['pai_nome'] = value
              } else if (headerNormalized.includes('SÃâ€°RIE') && (headerNormalized.includes('MÃÆ’E') || headerNormalized.includes('MAE'))) {
                data['serie mÃ£e'] = value
                data['sÃ©rie mÃ£e'] = value
                data['mae_serie'] = value
                data['serie_mae'] = value
              } else if ((headerNormalized.includes('RGN') || headerNormalized.includes('RG')) && (headerNormalized.includes('MÃÆ’E') || headerNormalized.includes('MAE'))) {
                data['rgn mÃ£e'] = value
                data['rgnmÃ£e'] = value
                data['mae_rg'] = value
                data['rg_mae'] = value
              } else if (headerNormalized.includes('RECEPTORA')) {
                data['receptora'] = value
                data['rec'] = value
                data['nome_receptora'] = value
              } else {
                // Mapeamento padrÃ£o - salvar com o nome original e lowercase
                data[headerLower] = value
                data[header] = value // TambÃ©m salvar com o nome original
              }
            })
            
            // Combinar dados da mÃ£e se temos sÃ©rie e RG separados
            if (data['serie mÃ£e'] || data['rgn mÃ£e'] || data['mae_serie'] || data['mae_rg']) {
              const serieMae = data['serie mÃ£e'] || data['mae_serie'] || ''
              const rgMae = data['rgn mÃ£e'] || data['mae_rg'] || ''
              const nomeMae = data['nome da mÃ£e'] || data['mae'] || data['mÃ£e'] || ''
              
              // Formato: SÃ©rie-RG ou apenas SÃ©rie RG se nÃ£o tiver nome
              if (serieMae || rgMae) {
                const partes = [serieMae, rgMae].filter(v => v && String(v).trim())
                let maeCompleta = partes.length > 0 ? partes.join('-') : nomeMae
                if (nomeMae && partes.length > 0 && !nomeMae.includes(partes.join('-'))) {
                  maeCompleta = `${nomeMae} (${partes.join('-')})`
                }
                if (maeCompleta) {
                  data['mae'] = maeCompleta.trim()
                }
              }
            }
            
            // SÃ³ adicionar se tiver pelo menos um campo com valor
            const hasData = Object.values(data).some(v => v !== null && v !== undefined && String(v).trim() !== '')
            if (hasData) {
              rowsData.push({ rowNumber: i + 1, data })
            }
          }
          
          console.log('ðÅ¸â€�� Linhas de dados processadas:', rowsData.length)
          if (rowsData.length > 0) {
            console.log('ðÅ¸â€�� Primeira linha processada:', rowsData[0])
          }
        }
      }

      const mappedRows = rowsData.map(r => {
        const { mappedData, foundFields } = mapDataToFields(r.data)
        return { rowNumber: r.rowNumber, mappedData, foundFields }
      }).filter(r => Object.keys(r.mappedData).length > 0)

      // Debug: mostrar dados brutos antes do mapeamento
      console.log('ðÅ¸â€�� Total de linhas processadas:', rowsData.length)
      console.log('ðÅ¸â€�� Primeira linha de dados brutos:', rowsData[0])
      if (rowsData.length > 0 && rowsData[0]?.data) {
        const allFields = Object.keys(rowsData[0].data)
        console.log('ðÅ¸â€�� Campos encontrados no arquivo:', allFields.join(', '))
        console.log('ðÅ¸â€�� Valores da primeira linha:', rowsData[0].data)
      }

      if (mappedRows.length === 0) {
        // Debug: mostrar quais campos foram encontrados no arquivo
        const allFields = new Set()
        rowsData.forEach(r => {
          if (r && r.data) {
            Object.keys(r.data).forEach(k => allFields.add(k))
          }
        })
        const fieldsList = Array.from(allFields).join(', ')
        console.log('ðÅ¸â€�� Campos encontrados no arquivo (apÃ³s mapeamento):', fieldsList)
        console.log('ðÅ¸â€�� Primeira linha de dados:', rowsData[0]?.data)
        
        setError(`Nenhum campo compatÃ­vel encontrado no arquivo. Campos encontrados: ${fieldsList || 'nenhum'}. Verifique se os cabeÃ§alhos correspondem aos campos esperados (SÃ©rie, RGN, Nome do Pai, SÃ©rie MÃ£e, RgnMÃ£e, Receptora).`)
        setPreview(null)
        setAvailableFields([])
        setParsedRows([])
        return
      }

      const fieldSet = new Set()
      mappedRows.forEach(r => Object.keys(r.mappedData).forEach(k => fieldSet.add(k)))
      const fieldList = Array.from(fieldSet)

      setAvailableFields(fieldList)
      setParsedRows(mappedRows)

      let selectedRow = mappedRows[0]
      let foundByExactMatch = false
      let foundByName = false

      if (currentAnimal) {
        const currentSerie = String(currentAnimal.serie || '').trim().toUpperCase()
        const currentRg = String(currentAnimal.rg || '').trim().toUpperCase()
        const currentName = String(currentAnimal.nome || '').trim().toUpperCase()

        const exact = mappedRows.find(r => {
          const rowSerie = String(r.mappedData.serie || '').trim().toUpperCase()
          const rowRg = String(r.mappedData.rg || '').trim().toUpperCase()
          return rowSerie && rowRg && rowSerie === currentSerie && rowRg === currentRg
        })
        if (exact) {
          selectedRow = exact
          foundByExactMatch = true
        } else if (currentName) {
          const byName = mappedRows.find(r => {
            const rowName = String(r.mappedData.nome || '').trim().toUpperCase()
            return rowName && rowName === currentName
          })
          if (byName) {
            selectedRow = byName
            foundByName = true
          }
        }

        if (foundByExactMatch) {
          setMatchStatus({ found: true, message: `Animal identificado por SÃ©rie/RG na linha ${selectedRow.rowNumber}` })
        } else if (foundByName) {
          setMatchStatus({ found: true, message: `Animal identificado por Nome na linha ${selectedRow.rowNumber}` })
        } else {
          setMatchStatus({ found: false, message: `Animal nÃ£o encontrado automaticamente. Mostrando linha ${selectedRow.rowNumber} (primeira com dados).` })
        }
      }

      const initialSelected = {}
      fieldList.forEach(k => { initialSelected[k] = false })
      Object.keys(selectedRow.foundFields || {}).forEach(k => { initialSelected[k] = true })

      setPreview(selectedRow.mappedData)
      setSelectedFields(initialSelected)
    } catch (err) {
      setError(`Erro ao processar arquivo: ${err.message}`)
      setPreview(null)
      setAvailableFields([])
      setParsedRows([])
    }
  }

  const toggleField = (field) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleUpdate = async () => {
    if (bulkMode) {
      if (!parsedRows || parsedRows.length === 0) {
        setError('Nenhum dado vÃ¡lido encontrado no arquivo')
        return
      }

      const animals = []
      let skippedNoId = 0

      // Helper para combinar campos de filiaÃ§Ã£o (Nome + SÃ©rie + RG)
      const combineFiliation = (name, serie, rg) => {
        const nameStr = String(name || '').trim()
        const extra = [serie, rg].map(v => String(v || '').trim()).filter(Boolean).join('-')
        if (!nameStr) return extra
        if (!extra) return nameStr
        if (nameStr.includes(extra)) return nameStr
        return `${nameStr} (${extra})`
      }

      parsedRows.forEach(r => {
        const serie = String(r.mappedData.serie || '').trim()
        const rg = String(r.mappedData.rg || '').trim()
        if (!serie || !rg) {
          skippedNoId++
          return
        }

        const payload = { serie, rg }

        // PrÃ©-processar filiaÃ§Ã£o antes de montar o payload
        const roles = ['mae', 'pai', 'receptora', 'avo_materno']
        roles.forEach(role => {
          const serieKey = `${role}_serie`
          const rgKey = `${role}_rg`
          
          // Se houver campos de sÃ©rie ou RG para atualizar
          if (r.mappedData[serieKey] || r.mappedData[rgKey]) {
             // Verificar se o usuÃ¡rio quer atualizar este campo (verificando o campo principal ou os componentes)
             const shouldUpdate = camposSelecionados[role] || selectedFields[role] || 
                                  camposSelecionados[serieKey] || selectedFields[serieKey] ||
                                  camposSelecionados[rgKey] || selectedFields[rgKey]

             if (shouldUpdate) {
                const name = r.mappedData[role] || ''
                const serie = r.mappedData[serieKey] || ''
                const rg = r.mappedData[rgKey] || ''
                
                const combined = combineFiliation(name, serie, rg)
                if (combined) {
                  payload[role] = combined
                }
             }
          }
        })

        availableFields.forEach(key => {
          if (key === 'serie' || key === 'rg') return
          
          // Ignorar campos de filiaÃ§Ã£o que jÃ¡ foram tratados acima (para nÃ£o sobrescrever ou enviar dados parciais)
          if (['mae_serie', 'mae_rg', 'pai_serie', 'pai_rg', 'receptora_serie', 'receptora_rg', 'avo_materno_serie', 'avo_materno_rg'].includes(key)) return
          
          // Verificar se o campo estÃ¡ marcado em camposSelecionados OU selectedFields
          const estaMarcado = camposSelecionados[key] || selectedFields[key]
          if (!estaMarcado) return
          const value = r.mappedData[key]
          if (value === undefined || value === null) return
          if (typeof value === 'string' && value.trim() === '') return
          payload[key] = value
        })

        animals.push(payload)
      })

      if (animals.length === 0) {
        setError('Nenhum animal com SÃ©rie e RG encontrado no arquivo')
        return
      }

      setLoading(true)
      setError('')

      console.log('ðÅ¸â€œ¦ Enviando payload para batch update:', {
        quantidade: animals.length,
        exemplo: animals[0],
        usuario: 'excel'
      })

      try {
        const response = await fetch('/api/animals/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ animais: animals, usuario: 'excel' })
        })

        let result
        try {
          result = await response.json()
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta:', parseError)
          setError(`Erro no servidor (${response.status}): ${response.statusText || 'Resposta invÃ¡lida'}`)
          return
        }

        if (!response.ok) {
          const errorMessage = result?.message || result?.error || `Erro ${response.status}: ${response.statusText}`
          setError(errorMessage)
          console.error('Erro na resposta:', result)
          return
        }

        if (!result?.success) {
          setError(result?.message || 'Erro ao atualizar animais via lote')
          return
        }

        const resumo = result.data?.resumo || {}
        const resultados = result.data?.resultados || {}

        let msg = `âÅ“â€¦ Processamento concluÃ­do!\n\n`
        msg += `Processados: ${resumo.total_processados ?? animals.length}\n`
        msg += `Sucessos: ${resumo.total_sucessos ?? 0}\n`
        msg += `Erros: ${resumo.total_erros ?? 0}\n`
        if (skippedNoId > 0) msg += `Ignorados (sem SÃ©rie/RG): ${skippedNoId}\n`
        if (result.data?.lote) msg += `Lote: ${result.data.lote}\n`

        if (Array.isArray(resultados.erros) && resultados.erros.length > 0) {
          const exemplos = resultados.erros.slice(0, 10).map(e => {
            const brinco = e.brinco || e.id || 'N/D'
            const err = e.erro || e.error || 'Erro'
            return `- ${brinco}: ${err}`
          }).join('\n')
          msg += `\nExemplos de erros:\n${exemplos}`
        }

        alert(msg)
        handleClose()
      } catch (err) {
        setError(`Erro ao atualizar em lote: ${err.message}`)
      } finally {
        setLoading(false)
      }

      return
    }

    if (!preview || Object.keys(preview).length === 0) {
      setError('Nenhum dado vÃ¡lido encontrado no arquivo')
      return
    }

    // Filtrar apenas campos selecionados (usar camposSelecionados + selectedFields)
    const dataToUpdate = {}
    Object.keys(preview).forEach(key => {
      // Verificar se o campo estÃ¡ marcado em camposSelecionados OU selectedFields
      const estaMarcado = camposSelecionados[key] || selectedFields[key]
      if (estaMarcado) {
        dataToUpdate[key] = preview[key]
      }
    })

    if (Object.keys(dataToUpdate).length === 0) {
      setError('Selecione pelo menos um campo para atualizar')
      return
    }

    // Helper para combinar campos de filiaÃ§Ã£o (Nome + SÃ©rie + RG)
    const combineFiliation = (name, serie, rg) => {
      const nameStr = String(name || '').trim()
      const extra = [serie, rg].map(v => String(v || '').trim()).filter(Boolean).join('-')
      if (!nameStr) return extra
      if (!extra) return nameStr
      if (nameStr.includes(extra)) return nameStr
      return `${nameStr} (${extra})`
    }

    // Processar campos compostos (Mae, Pai, etc) que podem vir separados (Serie/RG)
    const roles = ['mae', 'pai', 'receptora', 'avo_materno']
    roles.forEach(role => {
      const serieKey = `${role}_serie`
      const rgKey = `${role}_rg`
      
      // Se houver campos de sÃ©rie ou RG para atualizar, OU se o campo principal estiver sendo atualizado
      if (dataToUpdate[serieKey] || dataToUpdate[rgKey] || dataToUpdate[role]) {
        // Obter valores (priorizando o que estÃ¡ no dataToUpdate, fallback para preview)
        const name = dataToUpdate[role] || preview[role] || ''
        const serie = dataToUpdate[serieKey] || preview[serieKey] || ''
        const rg = dataToUpdate[rgKey] || preview[rgKey] || ''
        
        // Combinar e atualizar o campo principal
        const combined = combineFiliation(name, serie, rg)
        if (combined) {
          dataToUpdate[role] = combined
        }
        
        // Remover campos auxiliares que nÃ£o existem no banco
        delete dataToUpdate[serieKey]
        delete dataToUpdate[rgKey]
      }
    })

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/animals/${animalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToUpdate)
      })

      const result = await response.json()

      if (result.status === 'success' || response.ok) {
        if (onUpdate) {
          onUpdate(result.data || dataToUpdate)
        }
        alert('âÅ“â€¦ Dados atualizados com sucesso!')
        handleClose()
      } else {
        let msg = result.message || 'Erro ao atualizar dados'
        
        // Tratamento de erro de duplicidade (Unique Constraint)
        if (msg.includes('animais_serie_rg_key') || msg.includes('duplicate key') || msg.includes('duplicar valor')) {
          msg = `Erro: JÃ¡ existe outro animal cadastrado com a SÃ©rie "${dataToUpdate.serie || '?'}" e RG "${dataToUpdate.rg || '?'}".\n\nDica: Se vocÃª deseja atualizar apenas as outras informaÃ§Ãµes (Peso, ABCZ, etc.), desmarque as opÃ§Ãµes "SÃ©rie" e "Rg" na lista abaixo e tente novamente.`
        }
        
        setError(msg)
      }
    } catch (err) {
      setError(`Erro ao atualizar: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePasteData = async (text) => {
    if (!text || !text.trim()) {
      setError('Cole os dados do Excel no campo de texto')
      return
    }

    setLoading(true)
    setError('')
    setFile(null)
    setPastedData(text)

    try {
      let headers = []
      let rowsData = []

      // Processar dados colados como CSV (separado por tab ou vÃ­rgula)
      const lines = text.split(/\r?\n/).filter(line => line.trim())
      if (lines.length < 2) {
        setError('Dados devem ter pelo menos 2 linhas (cabeÃ§alho + dados)')
        setLoading(false)
        return
      }

      // Detectar separador: tab (quando copiado do Excel) ou vÃ­rgula
      const firstLine = lines[0]
      const hasTab = firstLine.includes('\t')
      const separator = hasTab ? '\t' : ','

      headers = firstLine.split(separator).map(h => String(h || '').trim())
      console.log('ðÅ¸â€�� CabeÃ§alhos encontrados (colado):', headers)

      rowsData = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(separator).map(v => String(v || '').trim())
        const data = {}

        headers.forEach((header, index) => {
          const headerLower = String(header).toLowerCase().trim()
          const headerUpper = String(header).toUpperCase().trim()
          const headerNormalized = headerUpper.replace(/\s+/g, ' ').trim()
          const value = values[index] ?? ''

          // Mapear campos especÃ­ficos da planilha do usuÃ¡rio
          if (headerNormalized === 'SÃâ€°RIE' || headerNormalized === 'SERIE') {
            data['serie'] = value
            data['sÃ©rie'] = value
          } else if (headerNormalized === 'RGN' || headerNormalized === 'RG' || headerNormalized === 'RGD') {
            data['rg'] = value
            data['rgn'] = value
          } else if (headerNormalized.includes('NOME') && headerNormalized.includes('PAI')) {
            data['nome do pai'] = value
            data['pai'] = value
            data['nome_pai'] = value
            data['pai_nome'] = value
          } else if (headerNormalized.includes('SÃâ€°RIE') && (headerNormalized.includes('MÃÆ’E') || headerNormalized.includes('MAE'))) {
            data['serie mÃ£e'] = value
            data['sÃ©rie mÃ£e'] = value
            data['mae_serie'] = value
            data['serie_mae'] = value
          } else if ((headerNormalized.includes('RGN') || headerNormalized.includes('RG')) && (headerNormalized.includes('MÃÆ’E') || headerNormalized.includes('MAE'))) {
            data['rgn mÃ£e'] = value
            data['rgnmÃ£e'] = value
            data['mae_rg'] = value
            data['rg_mae'] = value
          } else if (headerNormalized.includes('RECEPTORA')) {
            data['receptora'] = value
            data['rec'] = value
            data['nome_receptora'] = value
          } else {
            data[headerLower] = value
            data[header] = value
          }
        })

        // Combinar dados da mÃ£e se temos sÃ©rie e RG separados
        if (data['serie mÃ£e'] || data['rgn mÃ£e'] || data['mae_serie'] || data['mae_rg']) {
          const serieMae = data['serie mÃ£e'] || data['mae_serie'] || ''
          const rgMae = data['rgn mÃ£e'] || data['mae_rg'] || ''
          const nomeMae = data['nome da mÃ£e'] || data['mae'] || data['mÃ£e'] || ''

          if (serieMae || rgMae) {
            const partes = [serieMae, rgMae].filter(v => v && String(v).trim())
            const maeCompleta = partes.length > 0 ? partes.join('-') : nomeMae
            if (maeCompleta) {
              data['mae'] = maeCompleta.trim()
            }
          }
        }

        const hasData = Object.values(data).some(v => v !== null && v !== undefined && String(v).trim() !== '')
        if (hasData) {
          rowsData.push({ rowNumber: i + 1, data })
        }
      }

      console.log('ðÅ¸â€�� Linhas de dados processadas (colado):', rowsData.length)
      if (rowsData.length > 0) {
        console.log('ðÅ¸â€�� Primeira linha processada:', rowsData[0])
      }

      // Processar dados usando a mesma lÃ³gica do arquivo - criar funÃ§Ãµes auxiliares
      const normalizeDecimalString = (value) => {
        if (value === null || value === undefined) return value
        const s = String(value).trim()
        if (!s) return s
        const hasComma = s.includes(',')
        const hasDot = s.includes('.')
        if (hasComma && hasDot) {
          return s.replace(/\./g, '').replace(',', '.')
        }
        if (hasComma) return s.replace(',', '.')
        return s
      }

      const normalizeDateToISO = (value) => {
        if (value === null || value === undefined) return value
        if (typeof value === 'number' && !Number.isNaN(value)) {
          const date = new Date((value - 25569) * 86400 * 1000)
          if (Number.isNaN(date.getTime())) return null
          return date.toISOString().split('T')[0]
        }
        const s = String(value).trim()
        if (!s) return s
        const m1 = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
        if (m1) {
          const [, dd, mm, yyyy] = m1
          return `${yyyy}-${mm}-${dd}`
        }
        const m2 = s.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/)
        if (m2) {
          const [, yyyy, mm, dd] = m2
          return `${yyyy}-${mm}-${dd}`
        }
        return s
      }

      const normalizeSexo = (value) => {
        const s = String(value || '').trim().toUpperCase()
        if (!s) return null
        if (s === 'F' || s === 'FEMEA' || s === 'FÃÅ MEA') return 'FÃªmea'
        if (s === 'M' || s === 'MACHO') return 'Macho'
        return String(value).trim()
      }

      const mapDataToFields = (data) => {
        const mappedData = {}
        const foundFields = {}

        const getMappedValue = (targetField, sourceKeys) => {
          const normalizeKey = (k) => {
            if (!k) return ''
            return String(k)
              .toLowerCase()
              .trim()
              .replace(/\s+/g, ' ')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
          }
          
          if (data[targetField] !== undefined && data[targetField] !== null && data[targetField] !== '') {
            return data[targetField]
          }
          
          const dataKeys = Object.keys(data)
          for (const key of sourceKeys) {
            if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
              return data[key]
            }
          }
          
          for (const key of sourceKeys) {
            const normalizedSourceKey = normalizeKey(key)
            const matchingKey = dataKeys.find(dk => {
              const normalizedDataKey = normalizeKey(dk)
              return normalizedDataKey === normalizedSourceKey || 
                     normalizedDataKey.includes(normalizedSourceKey) ||
                     normalizedSourceKey.includes(normalizedDataKey)
            })
            if (matchingKey && data[matchingKey] !== undefined && data[matchingKey] !== null && data[matchingKey] !== '') {
              return data[matchingKey]
            }
          }
          
          return null
        }

        const fieldMappings = {
          nome: ['nome', 'name', 'animal'],
          abczg: ['abczg', 'iabcz', 'iabczg', '!abczg', 'Â¡abczg'],
          deca: ['deca'],
          pai: ['pai', 'pai_nome', 'nome_pai', 'nome do pai', 'pat', 'pat (pai)'],
          mae: ['mae', 'mÃ£e', 'mae_nome', 'nome_mae', 'nome da mÃ£e', 'nome da mae'],
          mae_serie: ['mae_serie', 'serie_mae', 'sÃ©rie mÃ£e', 'serie mÃ£e', 'serie_mae', 'serie mae'],
          mae_rg: ['mae_rg', 'rg_mae', 'rgn mÃ£e', 'rgnmae', 'rgn mÃ£e', 'rg mÃ£e', 'rg_mae', 'rgnmÃ£e'],
          avo_materno: ['avo_materno', 'avÃ´ materno', 'avo materno'],
          serie: ['serie', 'sÃ©rie'],
          rg: ['rg', 'registro', 'rgn', 'rgd'],
          receptora: ['receptora', 'rec', 'nome_receptora'],
          sexo: ['sexo'],
          raca: ['raca', 'raÃ§a'],
          cor: ['cor', 'pelagem'],
          peso: ['peso'],
          data_nascimento: ['data_nascimento', 'nascimento', 'nasc', 'dta_nasc']
        }

        Object.entries(fieldMappings).forEach(([targetField, sourceKeys]) => {
          const value = getMappedValue(targetField, sourceKeys)
          if (value !== null && value !== undefined && String(value).trim() !== '') {
            if (targetField === 'data_nascimento') {
              mappedData[targetField] = normalizeDateToISO(value)
            } else if (targetField === 'abczg' || targetField === 'deca') {
              mappedData[targetField] = normalizeDecimalString(value)
            } else if (targetField === 'sexo') {
              mappedData[targetField] = normalizeSexo(value)
            } else {
              mappedData[targetField] = String(value).trim()
            }
            foundFields[targetField] = true
          }
        })

        if (mappedData.mae_serie || mappedData.mae_rg) {
          const maeNome = mappedData.mae || ''
          const maeSerie = mappedData.mae_serie || ''
          const maeRg = mappedData.mae_rg || ''
          if (maeSerie || maeRg) {
            const partes = [maeSerie, maeRg].filter(v => v && String(v).trim())
            const maeCompleta = partes.length > 0 ? partes.join('-') : maeNome
            if (maeCompleta) {
              mappedData.mae = maeCompleta.trim()
              foundFields.mae = true
            }
          }
        }

        return { mappedData, foundFields }
      }

      const mappedRows = rowsData.map(r => {
        const { mappedData, foundFields } = mapDataToFields(r.data)
        return { rowNumber: r.rowNumber, mappedData, foundFields }
      }).filter(r => Object.keys(r.mappedData).length > 0)

      if (mappedRows.length === 0) {
        const allFields = new Set()
        rowsData.forEach(r => {
          if (r && r.data) {
            Object.keys(r.data).forEach(k => allFields.add(k))
          }
        })
        const fieldsList = Array.from(allFields).join(', ')
        console.log('ðÅ¸â€�� Campos encontrados no arquivo (apÃ³s mapeamento):', fieldsList)
        setError(`Nenhum campo compatÃ­vel encontrado. Campos encontrados: ${fieldsList || 'nenhum'}. Verifique se os cabeÃ§alhos correspondem aos campos esperados (SÃ©rie, RGN, Nome do Pai, SÃ©rie MÃ£e, RgnMÃ£e, Receptora).`)
        setPreview(null)
        setAvailableFields([])
        setParsedRows([])
        setLoading(false)
        return
      }

      const fieldSet = new Set()
      mappedRows.forEach(r => Object.keys(r.mappedData).forEach(k => fieldSet.add(k)))
      const fieldList = Array.from(fieldSet)

      setAvailableFields(fieldList)
      setParsedRows(mappedRows)

      let selectedRow = mappedRows[0]
      let foundByExactMatch = false
      let foundByName = false

      if (currentAnimal) {
        const currentSerie = String(currentAnimal.serie || '').trim().toUpperCase()
        const currentRg = String(currentAnimal.rg || '').trim()

        selectedRow = mappedRows.find(r => {
          const rowSerie = String(r.mappedData.serie || '').trim().toUpperCase()
          const rowRg = String(r.mappedData.rg || '').trim()
          if (rowSerie === currentSerie && rowRg === currentRg) {
            foundByExactMatch = true
            return true
          }
          return false
        }) || mappedRows.find(r => {
          const rowNome = String(r.mappedData.nome || '').trim().toUpperCase()
          const currentNome = String(currentAnimal.nome || '').trim().toUpperCase()
          if (rowNome && currentNome && rowNome === currentNome) {
            foundByName = true
            return true
          }
          return false
        }) || mappedRows[0]
      }

      if (foundByExactMatch) {
        setMatchStatus({ found: true, message: 'Animal encontrado automaticamente pela SÃ©rie e RG!' })
      } else if (foundByName) {
        setMatchStatus({ found: true, message: 'Animal encontrado automaticamente pelo nome!' })
      } else {
        setMatchStatus({ found: false, message: `Animal nÃ£o encontrado automaticamente. Mostrando linha ${selectedRow.rowNumber} (primeira com dados).` })
      }

      const initialSelected = {}
      fieldList.forEach(k => { initialSelected[k] = false })
      Object.keys(selectedRow.foundFields || {}).forEach(k => { initialSelected[k] = true })

      setPreview(selectedRow.mappedData)
      setSelectedFields(initialSelected)
    } catch (err) {
      setError(`Erro ao processar dados colados: ${err.message}`)
      setPreview(null)
      setAvailableFields([])
      setParsedRows([])
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPastedData('')
    setPreview(null)
    setSelectedFields({})
    setError('')
    setAvailableFields([])
    setParsedRows([])
    setBulkMode(false)
    setMatchStatus(null)
    onClose()
  }

  const downloadTemplate = () => {
    const headers = [
      'Nome', 'SÃ©rie', 'RG', 'Sexo', 'Nascimento', 'Peso', 'RaÃ§a', 'Cor',
      'Pai', 'MÃ£e', 'Receptora', 'AvÃ´ Materno', 'ABCZg', 'DECA'
    ]
    
    if (!XLSX) {
      // Se XLSX nÃ£o estiver disponÃ­vel, criar CSV
      const csvContent = headers.join(',') + '\n' + Array(headers.length).fill('').join(',')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'template_atualizacao_animal.csv'
      link.click()
      return
    }

    // Criar template Excel
    const templateData = [
      headers,
      Array(headers.length).fill('')
    ]

    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Dados')
    
    // Ajustar largura das colunas
    ws['!cols'] = headers.map(() => ({ wch: 20 }))

    XLSX.writeFile(wb, 'template_atualizacao_animal.xlsx')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DocumentArrowUpIcon className="h-6 w-6" />
            Atualizar Dados via Excel
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

          <div className="space-y-4">
          {/* SeleÃ§Ã£o de Campos para ImportaÃ§Ã£o */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              ðÅ¸â€œâ€¹ Campos para Importar/Atualizar
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Selecione quais campos deseja importar. Campos nÃ£o marcados serÃ£o ignorados.
            </p>
            
            {/* Campos de Genealogia */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">ðÅ¸â€˜¨ââ‚¬�ðÅ¸â€˜©ââ‚¬�ðÅ¸â€˜§ Genealogia</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <label className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={camposSelecionados.pai}
                    onChange={(e) => setCamposSelecionados({...camposSelecionados, pai: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">ðÅ¸â€˜¨ Pai</span>
                </label>
                <label className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={camposSelecionados.mae}
                    onChange={(e) => setCamposSelecionados({...camposSelecionados, mae: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">ðÅ¸â€˜© MÃ£e</span>
                </label>
                <label className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={camposSelecionados.receptora}
                    onChange={(e) => setCamposSelecionados({...camposSelecionados, receptora: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">ðÅ¸�â€ž Receptora</span>
                </label>
                <label className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={camposSelecionados.avo_materno}
                    onChange={(e) => setCamposSelecionados({...camposSelecionados, avo_materno: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">ðÅ¸â€˜´ AvÃ´ Materno</span>
                </label>
              </div>
            </div>

            {/* Campos GenÃ©ticos */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">ðÅ¸§¬ GenÃ©tica</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <label className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={camposSelecionados.abczg}
                    onChange={(e) => setCamposSelecionados({...camposSelecionados, abczg: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">ðÅ¸â€œÅ  ABCZg</span>
                </label>
                <label className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={camposSelecionados.deca}
                    onChange={(e) => setCamposSelecionados({...camposSelecionados, deca: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">ðÅ¸â€œË† DECA</span>
                </label>
              </div>
            </div>

            {/* BotÃµes de AÃ§Ã£o RÃ¡pida */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCamposSelecionados({
                    pai: true, mae: true, receptora: true, avo_materno: true, abczg: true, deca: true,
                    nome: false, tatuagem: false, sexo: false, raca: false, data_nascimento: false,
                    meses: false, peso: false, situacao: false, cor: false
                  })}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  ðÅ¸â€œâ€¹ Apenas Genealogia
                </button>
                <button
                  onClick={() => setCamposSelecionados({
                    pai: true, mae: true, receptora: true, avo_materno: true, abczg: true, deca: true,
                    nome: true, tatuagem: true, sexo: true, raca: true, data_nascimento: true,
                    meses: true, peso: true, situacao: true, cor: true
                  })}
                  className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
                >
                  âÅ“â€¦ Todos
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              ðÅ¸â€œâ€¹ Formato do Arquivo
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-400 mb-2">
              O arquivo Excel/CSV pode ter 1 ou 2 linhas de cabeÃ§alho e os dados na linha seguinte:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-400 list-disc list-inside space-y-1">
              <li><strong>Nome</strong> - Nome do animal</li>
              <li><strong>SÃ©rie</strong> e <strong>RG</strong> - IdentificaÃ§Ã£o</li>
              <li><strong>Pai</strong> e <strong>MÃ£e</strong> - Genealogia</li>
              <li><strong>Receptora</strong> - Se houver</li>
              <li><strong>ABCZg</strong> ou <strong>IABCZ</strong> - Valor genÃ©tico</li>
              <li><strong>DECA</strong> - Valor DECA</li>
            </ul>
            <Button
              variant="secondary"
              onClick={downloadTemplate}
              className="mt-3 text-sm"
            >
              ðÅ¸â€œ¥ Baixar Template Excel
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecione o arquivo Excel ou CSV
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-blue-900/20 dark:file:text-blue-300
                dark:hover:file:bg-blue-900/30
                cursor-pointer"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-400 whitespace-pre-line">{error}</p>
            </div>
          )}

          {matchStatus && (
            <div className={`rounded-lg p-4 border ${
              matchStatus.found 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-lg ${matchStatus.found ? 'text-green-500' : 'text-yellow-500'}`}>
                  {matchStatus.found ? 'âÅ“â€œ' : 'âÅ¡ ï¸�'}
                </span>
                <p className={`text-sm ${
                  matchStatus.found 
                    ? 'text-green-800 dark:text-green-400' 
                    : 'text-yellow-800 dark:text-yellow-400'
                }`}>
                  {matchStatus.message}
                </p>
              </div>
            </div>
          )}

          {parsedRows && parsedRows.length > 1 && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <Checkbox
                label={<span className="font-medium">Atualizar todos os animais do arquivo ({parsedRows.length})</span>}
                checked={bulkMode}
                onChange={() => setBulkMode(v => !v)}
              />
            </div>
          )}

          {availableFields && availableFields.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                ðÅ¸â€œÅ  Campos encontrados no arquivo (adicional Ã  seleÃ§Ã£o acima):
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Estes campos foram detectados no arquivo. Marque apenas os que vocÃª quer importar alÃ©m dos jÃ¡ selecionados acima.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableFields.map((key) => {
                  // Pular campos que jÃ¡ estÃ£o em camposSelecionados
                  if (camposSelecionados[key]) return null
                  
                  const value = preview ? preview[key] : ''
                  return (
                  <div key={key} className="bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                    <Checkbox
                      label={
                        <span className="flex flex-col">
                          <span className="font-medium capitalize">{key.replace('_', ' ')}</span>
                          <span className="text-xs text-gray-500 truncate">{value === undefined || value === null || String(value).trim() === '' ? '(sem valor nesta linha)' : String(value)}</span>
                        </span>
                      }
                      checked={!!selectedFields[key]}
                      onChange={() => toggleField(key)}
                    />
                  </div>
                )})}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdate}
              disabled={loading || (!bulkMode && (!preview || Object.keys(preview).length === 0)) || (bulkMode && (!parsedRows || parsedRows.length === 0))}
            >
              {loading ? 'Atualizando...' : 'Atualizar Dados'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

