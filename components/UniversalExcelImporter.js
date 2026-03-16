import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { extrairSerieRG } from '../utils/animalUtils'
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import Modal from './ui/Modal'
import Button from './ui/Button'
import ImportProgressOverlay from './ImportProgressOverlay'
import { usePermissions } from '../hooks/usePermissions'
import { useAuth } from '../contexts/AuthContext'

export default function UniversalExcelImporter({ isOpen, onClose, onImportSuccess }) {
  const permissions = usePermissions()
  const { user } = useAuth()
  const normalizedUserName = String(permissions?.userName || '').toLowerCase()
  const canImportExcel = permissions?.isDeveloper && normalizedUserName.includes('zeca')

  const [file, setFile] = useState(null)
  const [detectedType, setDetectedType] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [importProgress, setImportProgress] = useState(null) // { current, total, processed }
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [importMethod, setImportMethod] = useState('file') // 'file' ou 'paste'
  const [pastedText, setPastedText] = useState('')
  const [selectedType, setSelectedType] = useState(null) // override do tipo detectado

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      setError('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV')
      return
    }

    setFile(selectedFile)
    setError(null)
    setSuccess(null)
    detectAndParseFile(selectedFile)
  }

  const detectAndParseFile = async (file) => {
    try {
      setLoading(true)
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })

          if (jsonData.length === 0) {
            setError('Arquivo vazio ou sem dados')
            return
          }

          // Detectar tipo de dados (usa planilha + nome do arquivo)
          const type = detectDataType(jsonData[0], workbook.SheetNames[0], file?.name || '')
          setDetectedType(type)
          setSelectedType(null) // reset ao trocar arquivo

          // Processar preview
          const processed = processDataByType(jsonData, type)
          setPreview({
            type,
            total: jsonData.length,
            sample: processed.slice(0, 5),
            all: processed
          })
        } catch (err) {
          setError(`Erro ao processar arquivo: ${err.message}`)
        } finally {
          setLoading(false)
        }
      }

      reader.readAsArrayBuffer(file)
    } catch (err) {
      setError(`Erro ao ler arquivo: ${err.message}`)
      setLoading(false)
    }
  }

  const detectDataType = (firstRow, sheetName, fileName = '') => {
    const keys = Object.keys(firstRow).map(k => k.toLowerCase())
    const sheetLower = sheetName.toLowerCase()
    const fileLower = String(fileName).toLowerCase()

    // Se nome da planilha/arquivo sugere vendas ou baixas, priorizar
    if (sheetLower.includes('venda') || sheetLower.includes('baixa') || fileLower.includes('venda') || fileLower.includes('baixa')) {
      const temSerieRg = keys.some(k => (k === 'ser' || k === 'sér' || k.includes('serie')) && !k.includes('mae')) && keys.some(k => k === 'rg' || k.includes('rg'))
      const temIdentificacao = keys.some(k => k.includes('identific'))
      if (temSerieRg || temIdentificacao) return 'baixas'
    }

    // Detectar por colunas específicas
    if (keys.some(k => k.includes('data_ia') || k.includes('dataia') || k.includes('data ia'))) {
      return 'inseminacao'
    }
    if (keys.some(k => k.includes('data_fiv') || k.includes('datafiv') || k.includes('data fiv'))) {
      return 'fiv'
    }
    if (keys.some(k => k.includes('data_nascimento') || k.includes('datanascimento') || k.includes('data nascimento'))) {
      if (keys.some(k => k.includes('serie') && k.includes('rg'))) {
        return 'nascimentos'
      }
    }
    if (keys.some(k => k.includes('data_dg') || k.includes('datadg') || k.includes('data dg'))) {
      return 'diagnostico_gestacao'
    }
    if (keys.some(k => k.includes('numero_nf') || k.includes('numeronf') || k.includes('numero nf') || k.includes('nf'))) {
      return 'notas_fiscais'
    }
    // Baixas: SÉRIE, RG, OCORRENCIA (MORTE/BAIXA ou VENDA), Causa/COMPRADOR, Data/DATA
    if (keys.some(k => (k.includes('ocorrencia') || k.includes('ocorrenc')) && keys.some(k => k.includes('serie')) && keys.some(k => k === 'rg' || k.includes('rg')))) {
      const ocorKey = Object.keys(firstRow).find(k => k.toLowerCase().includes('ocorren'))
      const ocorVal = ocorKey ? String(firstRow[ocorKey] || '').toUpperCase() : ''
      if (ocorVal.includes('MORTE') || ocorVal.includes('BAIXA') || ocorVal.includes('VENDA')) {
        return 'baixas'
      }
    }
    // Formato VENDAS-only: SÉR/SÉRIE, RG, DATA, COMPRADOR/CLIENTE, VALOR, NOTA FISCAL (sem OCORRENCIA)
    const temSerieRg = keys.some(k => (k === 'ser' || k === 'sér' || k.includes('serie') || k.includes('identific')) && !k.includes('mae')) && (keys.some(k => k === 'rg' || k.includes('rg')) || keys.some(k => k.includes('identific')))
    const temData = keys.some(k => k.includes('data') || k === 'dt')
    const temComprador = keys.some(k => k.includes('comprador') || k.includes('cliente') || k.includes('destinat'))
    const temValor = keys.some(k => k.includes('valor') || k.includes('preco') || k.includes('preço') || k.includes('vlr'))
    const temDataCompradorValor = temData && temComprador && temValor
    const temNf = keys.some(k => k.includes('nota') || k.includes('fiscal') || (k.includes('nf') && !k.includes('confer')))
    if (temSerieRg && (temDataCompradorValor || temNf)) {
      return 'baixas'
    }
    if (keys.some(k => k.includes('serie') && k.includes('rg'))) {
      return 'animais'
    }
    if (sheetLower.includes('ia') || sheetLower.includes('inseminação') || sheetLower.includes('inseminacao')) {
      return 'inseminacao'
    }
    if (sheetLower.includes('fiv')) {
      return 'fiv'
    }
    if (sheetLower.includes('nascimento')) {
      return 'nascimentos'
    }
    if (sheetLower.includes('nota') || sheetLower.includes('nf')) {
      return 'notas_fiscais'
    }
    if (sheetLower.includes('baixa') || sheetLower.includes('venda')) {
      return 'baixas'
    }

    return 'animais' // Padrão
  }

  const processDataByType = (data, type) => {
    switch (type) {
      case 'inseminacao':
        return processInseminacaoData(data)
      case 'fiv':
        return processFIVData(data)
      case 'nascimentos':
        return processNascimentosData(data)
      case 'diagnostico_gestacao':
        return processDGData(data)
      case 'notas_fiscais':
        return processNotasFiscaisData(data)
      case 'baixas':
        return data.map((row, idx) => ({ id: idx + 1, ...row }))
      default:
        return processAnimaisData(data)
    }
  }

  const processInseminacaoData = (data) => {
    return data.map((row, idx) => {
      const getVal = (keys) => {
        for (const key of keys) {
          const val = row[key] || row[key.toLowerCase()] || row[key.toUpperCase()]
          if (val !== undefined && val !== null && val !== '') return val
        }
        return null
      }

      return {
        id: idx + 1,
        serie: getVal(['Serie', 'Série', 'serie', 'SERIE', 'Serie Animal', 'Série Animal']),
        rg: getVal(['RG', 'rg', 'Rg', 'RG Animal', 'Rg Animal']),
        touro1: getVal(['Touro1', 'Touro 1', 'touro1', 'Touro', 'touro', 'TOURO']),
        serie_touro1: getVal(['Serie Touro1', 'Série Touro1', 'serie_touro1', 'SerieTouro1']),
        rg_touro1: getVal(['RG Touro1', 'Rg Touro1', 'rg_touro1', 'RGTouro1']),
        data_ia1: getVal(['Data IA1', 'DataIA1', 'data_ia1', 'Data IA', 'data_ia', 'DataIA']),
        data_dg1: getVal(['Data DG1', 'DataDG1', 'data_dg1', 'Data DG', 'data_dg', 'DataDG']),
        resultado1: getVal(['Resultado1', 'Resultado 1', 'resultado1', 'Resultado', 'resultado', 'RESULTADO']),
        touro2: getVal(['Touro2', 'Touro 2', 'touro2']),
        serie_touro2: getVal(['Serie Touro2', 'Série Touro2', 'serie_touro2']),
        rg_touro2: getVal(['RG Touro2', 'Rg Touro2', 'rg_touro2']),
        data_ia2: getVal(['Data IA2', 'DataIA2', 'data_ia2']),
        data_dg2: getVal(['Data DG2', 'DataDG2', 'data_dg2']),
        resultado2: getVal(['Resultado2', 'Resultado 2', 'resultado2']),
        touro3: getVal(['Touro3', 'Touro 3', 'touro3']),
        serie_touro3: getVal(['Serie Touro3', 'Série Touro3', 'serie_touro3']),
        rg_touro3: getVal(['RG Touro3', 'Rg Touro3', 'rg_touro3']),
        data_ia3: getVal(['Data IA3', 'DataIA3', 'data_ia3']),
        data_dg3: getVal(['Data DG3', 'DataDG3', 'data_dg3']),
        resultado3: getVal(['Resultado3', 'Resultado 3', 'resultado3']),
        observacoes: getVal(['Observações', 'Observacoes', 'observações', 'observacoes', 'Obs', 'obs'])
      }
    })
  }

  const processFIVData = (data) => {
    return data.map((row, idx) => {
      const getVal = (keys) => {
        for (const key of keys) {
          const val = row[key] || row[key.toLowerCase()] || row[key.toUpperCase()]
          if (val !== undefined && val !== null && val !== '') return val
        }
        return null
      }

      return {
        id: idx + 1,
        doadora_serie: getVal(['Serie Doadora', 'Série Doadora', 'serie_doadora', 'Serie', 'Série']),
        doadora_rg: getVal(['RG Doadora', 'Rg Doadora', 'rg_doadora', 'RG', 'rg']),
        doadora_nome: getVal(['Nome Doadora', 'nome_doadora', 'Doadora', 'doadora']),
        laboratorio: getVal(['Laboratório', 'Laboratorio', 'laboratório', 'laboratorio', 'Lab', 'lab']),
        veterinario: getVal(['Veterinário', 'Veterinario', 'veterinário', 'veterinario', 'Vet', 'vet']),
        data_fiv: getVal(['Data FIV', 'DataFIV', 'data_fiv', 'Data', 'data']),
        quantidade_oocitos: getVal(['Quantidade Oócitos', 'Quantidade Oocitos', 'quantidade_oocitos', 'Oócitos', 'Oocitos']),
        touro: getVal(['Touro', 'touro', 'TOURO']),
        observacoes: getVal(['Observações', 'Observacoes', 'observações', 'observacoes'])
      }
    })
  }

  const processNascimentosData = (data) => {
    return data.map((row, idx) => {
      const getVal = (keys) => {
        for (const key of keys) {
          const val = row[key] || row[key.toLowerCase()] || row[key.toUpperCase()]
          if (val !== undefined && val !== null && val !== '') return val
        }
        return null
      }

      return {
        id: idx + 1,
        serie: getVal(['Serie', 'Série', 'serie', 'SERIE']),
        rg: getVal(['RG', 'rg', 'Rg', 'RG']),
        nome: getVal(['Nome', 'nome', 'NOME']),
        sexo: getVal(['Sexo', 'sexo', 'SEXO']),
        raca: getVal(['Raça', 'Raca', 'raca', 'Raça', 'RACA']),
        data_nascimento: getVal(['Data Nascimento', 'DataNascimento', 'data_nascimento', 'Data', 'data']),
        hora_nascimento: getVal(['Hora Nascimento', 'HoraNascimento', 'hora_nascimento', 'Hora', 'hora']),
        peso: getVal(['Peso', 'peso', 'PESO']),
        tipo_nascimento: getVal(['Tipo Nascimento', 'TipoNascimento', 'tipo_nascimento', 'Tipo', 'tipo']),
        pai: getVal(['Pai', 'pai', 'PAI']),
        mae: getVal(['Mãe', 'Mae', 'mae', 'MAE']),
        receptora: getVal(['Receptora', 'receptora', 'RECEPTORA']),
        avo_materno: getVal(['Avô Materno', 'Avo Materno', 'avo_materno', 'Avô', 'Avo']),
        is_fiv: getVal(['FIV', 'fiv', 'Is FIV', 'is_fiv']),
        observacoes: getVal(['Observações', 'Observacoes', 'observações', 'observacoes'])
      }
    })
  }

  const processDGData = (data) => {
    return data.map((row, idx) => {
      const getVal = (keys) => {
        for (const key of keys) {
          const val = row[key] || row[key.toLowerCase()] || row[key.toUpperCase()]
          if (val !== undefined && val !== null && val !== '') return val
        }
        return null
      }

      return {
        id: idx + 1,
        serie: getVal(['Serie', 'Série', 'serie']),
        rg: getVal(['RG', 'rg', 'Rg']),
        data_dg: getVal(['Data DG', 'DataDG', 'data_dg', 'Data', 'data']),
        resultado: getVal(['Resultado', 'resultado', 'RESULTADO', 'Status', 'status']),
        observacoes: getVal(['Observações', 'Observacoes', 'observações'])
      }
    })
  }

  const processNotasFiscaisData = (data) => {
    return data.map((row, idx) => {
      const getVal = (keys) => {
        for (const key of keys) {
          const val = row[key] || row[key.toLowerCase()] || row[key.toUpperCase()]
          if (val !== undefined && val !== null && val !== '') return val
        }
        return null
      }

      return {
        id: idx + 1,
        numero_nf: getVal(['Número NF', 'Numero NF', 'numero_nf', 'NF', 'nf']),
        tipo: getVal(['Tipo', 'tipo', 'TIPO']),
        data: getVal(['Data', 'data', 'DATA']),
        origem: getVal(['Origem', 'origem', 'ORIGEM']),
        destino: getVal(['Destino', 'destino', 'DESTINO']),
        valor_total: getVal(['Valor Total', 'ValorTotal', 'valor_total', 'Valor', 'valor'])
      }
    })
  }

  const processPastedText = (text) => {
    if (!text || !text.trim()) {
      setError('Cole os dados do Excel no campo de texto')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Processar dados colados como CSV (separado por tab ou vírgula)
      const lines = text.split(/\r?\n/).filter(line => line.trim())
      if (lines.length < 2) {
        setError('Dados devem ter pelo menos 2 linhas (cabeçalho + dados)')
        setLoading(false)
        return
      }

      // Detectar separador: tab (quando copiado do Excel) ou vírgula
      const firstLine = lines[0]
      const hasTab = firstLine.includes('\t')
      const separator = hasTab ? '\t' : ','

      const headers = firstLine.split(separator).map(h => String(h || '').trim())
      console.log('📋 Cabeçalhos encontrados (colado):', headers)

      // Converter para formato de objeto (como se fosse JSON do Excel)
      const jsonData = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(separator)
        const row = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx] ? String(values[idx]).trim() : ''
        })
        jsonData.push(row)
      }

      console.log('📊 Total de linhas processadas:', jsonData.length)
      console.log('🔍 Primeira linha:', jsonData[0])

      // Detectar tipo de dados
      const type = detectDataType(jsonData[0] || {}, '')
      setDetectedType(type)

      // Processar preview
      const processed = processDataByType(jsonData, type)
      setPreview({
        type,
        total: jsonData.length,
        sample: processed.slice(0, 5),
        all: processed
      })

      setLoading(false)
    } catch (err) {
      console.error('Erro ao processar texto colado:', err)
      setError(`Erro ao processar dados colados: ${err.message}`)
      setLoading(false)
    }
  }

  const processAnimaisData = (data) => {
    if (!data || data.length === 0) return []

    const normalizeKey = (key) =>
      String(key || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[._-]/g, ' ')
        .replace(/\s+/g, ' ')

    const normalizeDate = (value) => {
      if (!value) return null
      const raw = String(value).trim()
      if (!raw) return null

      const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
      if (br) {
        const day = Number(br[1])
        const month = Number(br[2]) - 1
        const year = br[3].length === 2 ? Number(`20${br[3]}`) : Number(br[3])
        const parsed = new Date(year, month, day)
        if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0]
      }

      const parsed = new Date(raw)
      return isNaN(parsed.getTime()) ? raw : parsed.toISOString().split('T')[0]
    }

    const normalizeSexo = (value) => {
      const text = String(value || '').trim().toUpperCase()
      if (!text) return null
      if (text === 'M' || text === 'MACHO') return 'Macho'
      if (text === 'F' || text === 'FEMEA' || text === 'FÊMEA') return 'Fêmea'
      return value
    }

    const aliases = {
      serie: ['serie', 'série', 'serie animal', 'série animal'],
      rg: ['rg', 'rgn', 'rg animal', 'r g'],
      nome: ['nome', 'nome animal', 'nome do animal'],
      sexo: ['sexo', 'sexo animal', 'sx'],
      raca: ['raca', 'raça', 'raca animal', 'raça animal'],
      data_nascimento: ['data nascimento', 'data de nascimento', 'nascimento', 'data_nascimento'],
      meses: ['meses'],
      peso: ['peso', 'peso animal'],
      pai: ['pai', 'nome do pai', 'nome pai'],
      mae: ['mae', 'mãe', 'nome da mae', 'nome da mãe'],
      serie_mae: ['serie mae', 'série mae', 'serie da mae', 'série da mãe'],
      rg_mae: ['rg mae', 'rg da mae', 'rg da mãe', 'rgn mae'],
      receptora: ['receptora'],
      avo_materno: ['avo materno', 'avô materno'],
      iabcz: ['iabcz', 'iabz'],
      deca: ['deca'],
      serie_rg_mae: ['serie e rg da mae', 'série e rg da mãe', 'serie rg mae', 'identificacao mae', 'identificação mãe'],
    }

    return data.map((row, idx) => {
      const keyMap = {}
      Object.keys(row || {}).forEach((originalKey) => {
        keyMap[normalizeKey(originalKey)] = originalKey
      })

      const getByAliases = (field) => {
        for (const alias of aliases[field] || []) {
          const normalizedAlias = normalizeKey(alias)
          if (keyMap[normalizedAlias] !== undefined) {
            const value = row[keyMap[normalizedAlias]]
            if (value !== undefined && value !== null && String(value).trim() !== '') {
              return String(value).trim()
            }
          }
        }
        return null
      }

      const processed = {
        id: idx + 1,
        serie: getByAliases('serie'),
        rg: getByAliases('rg'),
        nome: getByAliases('nome'),
        sexo: normalizeSexo(getByAliases('sexo')),
        raca: getByAliases('raca'),
        data_nascimento: normalizeDate(getByAliases('data_nascimento')),
        meses: getByAliases('meses'),
        peso: getByAliases('peso'),
        pai: getByAliases('pai'),
        mae: getByAliases('mae'),
        serie_mae: getByAliases('serie_mae'),
        rg_mae: getByAliases('rg_mae'),
        receptora: getByAliases('receptora'),
        avo_materno: getByAliases('avo_materno'),
        iabcz: getByAliases('iabcz'),
        deca: getByAliases('deca'),
      }

      const serieRgMaeCombined = getByAliases('serie_rg_mae')
      if (serieRgMaeCombined && (!processed.serie_mae || !processed.rg_mae)) {
        const { serie: s, rg: r } = extrairSerieRG(serieRgMaeCombined, processed.serie)
        if (s || r) {
          processed.serie_mae = processed.serie_mae || s
          processed.rg_mae = processed.rg_mae || r
        }
      }

      return processed
    })
  }

  const handleImport = async () => {
    if (!canImportExcel) {
      setError('Apenas Zeca Desenvolvedor pode realizar importações de Excel.')
      return
    }

    if (!preview || !preview.all || preview.all.length === 0) {
      setError('Nenhum dado para importar')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const tipoParaUsar = selectedType || preview.type
      const CHUNK_SIZE = 300 // Evita timeout e ERR_CONNECTION_RESET em arquivos grandes
      const usaBatch = tipoParaUsar === 'animais' || tipoParaUsar === 'nascimentos'
      const usarChunks = usaBatch && preview.all.length > CHUNK_SIZE

      console.log('🚀 Iniciando importação...')
      console.log('📊 Tipo:', tipoParaUsar, selectedType ? '(selecionado manualmente)' : '(detectado)')
      console.log('📦 Total de registros:', preview.all.length)
      if (usarChunks) console.log(`📦 Enviando em lotes de ${CHUNK_SIZE} (evita timeout)`)

      const totalSteps = usarChunks ? Math.ceil(preview.all.length / CHUNK_SIZE) : preview.all.length
      setImportProgress({ atual: 0, total: totalSteps, etapa: usarChunks ? `Importando ${getTypeLabel(tipoParaUsar)}` : `Enviando ${preview.all.length} registros...` })

      let response
      let result = {}

      if (usarChunks) {
        const chunks = []
        for (let i = 0; i < preview.all.length; i += CHUNK_SIZE) {
          chunks.push(preview.all.slice(i, i + CHUNK_SIZE))
        }
        const totalChunks = chunks.length
        let totalSucessos = 0
        let totalErros = 0
        const todosErros = []

        for (let c = 0; c < chunks.length; c++) {
          setImportProgress({ current: c + 1, total: totalChunks, processed: (c * CHUNK_SIZE) + chunks[c].length, atual: c + 1, etapa: `Processando lote ${c + 1} de ${totalChunks}...` })
          const r = await fetch('/api/animals/batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-role': permissions?.isDeveloper ? 'desenvolvedor' : 'externo',
              'x-user-name': permissions?.userName || '',
              'x-user-email': user?.email || '',
            },
            body: JSON.stringify({
              animais: chunks[c],
              userRole: permissions?.isDeveloper ? 'desenvolvedor' : 'externo',
              userName: permissions?.userName || '',
              userEmail: user?.email || '',
            })
          })
          const data = await r.json().catch(() => ({}))
          if (r.ok && data.success && data.data?.resumo) {
            totalSucessos += data.data.resumo.total_sucessos ?? 0
            totalErros += data.data.resumo.total_erros ?? 0
            if (data.data.resultados?.erros?.length) {
              todosErros.push(...data.data.resultados.erros)
            }
          } else {
            throw new Error(data.message || `Lote ${c + 1} falhou`)
          }
        }

        setImportProgress(null)
        result = {
          success: true,
          data: {
            resultados: {
              importados: totalSucessos,
              erros: todosErros
            },
            resumo: {
              total_sucessos: totalSucessos,
              total_erros: totalErros,
              total_processados: preview.all.length
            }
          }
        }
      } else {
        switch (tipoParaUsar) {
          case 'inseminacao':
            response = await fetch('/api/reproducao/inseminacao/import-excel', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-role': permissions?.isDeveloper ? 'desenvolvedor' : 'externo',
                'x-user-name': permissions?.userName || '',
                'x-user-email': user?.email || '',
              },
              body: JSON.stringify({
                data: preview.all,
                userRole: permissions?.isDeveloper ? 'desenvolvedor' : 'externo',
                userName: permissions?.userName || '',
                userEmail: user?.email || '',
              })
            })
            break
          case 'fiv':
            response = await fetch('/api/reproducao/coleta-fiv/import-excel', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-role': permissions?.isDeveloper ? 'desenvolvedor' : 'externo',
                'x-user-name': permissions?.userName || '',
                'x-user-email': user?.email || '',
              },
              body: JSON.stringify({
                data: preview.all,
                userRole: permissions?.isDeveloper ? 'desenvolvedor' : 'externo',
                userName: permissions?.userName || '',
                userEmail: user?.email || '',
              })
            })
            break
          case 'nascimentos':
            response = await fetch('/api/animals/batch', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-role': permissions?.isDeveloper ? 'desenvolvedor' : 'externo',
                'x-user-name': permissions?.userName || '',
                'x-user-email': user?.email || '',
              },
              body: JSON.stringify({
                animais: preview.all,
                userRole: permissions?.isDeveloper ? 'desenvolvedor' : 'externo',
                userName: permissions?.userName || '',
                userEmail: user?.email || '',
              })
            })
            break
          case 'diagnostico_gestacao':
            response = await fetch('/api/reproducao/diagnostico-gestacao/import-excel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: preview.all })
            })
            break
          case 'notas_fiscais':
            response = await fetch('/api/notas-fiscais/import-excel', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-role': permissions?.isDeveloper ? 'desenvolvedor' : 'externo',
                'x-user-name': permissions?.userName || '',
                'x-user-email': user?.email || '',
              },
              body: JSON.stringify({
                data: preview.all,
                userRole: permissions?.isDeveloper ? 'desenvolvedor' : 'externo',
                userName: permissions?.userName || '',
                userEmail: user?.email || '',
              })
            })
            break
          case 'baixas':
            if (!file) {
              setError('Arquivo não disponível. Selecione novamente.')
              setLoading(false)
              return
            }
            const formData = new FormData()
            formData.append('file', file)
            formData.append('userRole', permissions?.isDeveloper ? 'desenvolvedor' : 'externo')
            formData.append('userName', permissions?.userName || '')
            formData.append('userEmail', user?.email || '')
            response = await fetch('/api/import/baixas', {
              method: 'POST',
              headers: {
                'x-user-role': permissions?.isDeveloper ? 'desenvolvedor' : 'externo',
                'x-user-name': permissions?.userName || '',
                'x-user-email': user?.email || '',
              },
              body: formData
            })
            break
          default:
            response = await fetch('/api/animals/batch', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-role': permissions?.isDeveloper ? 'desenvolvedor' : 'externo',
                'x-user-name': permissions?.userName || '',
                'x-user-email': user?.email || '',
              },
              body: JSON.stringify({
                animais: preview.all,
                userRole: permissions?.isDeveloper ? 'desenvolvedor' : 'externo',
                userName: permissions?.userName || '',
                userEmail: user?.email || '',
              })
            })
        }
        result = await response.json().catch(() => ({}))
      }

      console.log('📥 Resposta da API:', result)

      const totalImportados = result.data?.resumo?.total_sucessos ?? result.resultados?.importados ?? result.data?.importados ?? preview.total
      if (result.success && (usarChunks || response?.ok)) {
        const msg = tipoParaUsar === 'baixas' && result.resultados
          ? `✅ ${result.resultados.importados} baixas importadas${result.resultados.erroCount > 0 ? ` (${result.resultados.erroCount} erros)` : ''}${result.resultados.ignorados > 0 ? ` • ${result.resultados.ignorados} ignorados` : ''}`
          : `✅ ${totalImportados} registros importados com sucesso!`
        setSuccess({
          message: msg,
          details: result.data || result.resultados || {}
        })
        
        if (onImportSuccess) {
          onImportSuccess(tipoParaUsar, tipoParaUsar === 'baixas' ? (result.resultados?.importados ?? 0) : preview.total)
        }

        // Limpar após 3 segundos
        setTimeout(() => {
          handleClose()
        }, 3000)
      } else {
        // Mostrar erro detalhado (garantir que message seja string - API pode retornar objeto)
        const rawMessage = result.message || result.errors || 'Erro ao importar dados'
        const errorMessage = typeof rawMessage === 'string'
          ? rawMessage
          : (rawMessage?.required
            ? `Animal ${rawMessage.animal_index || '?'}: campos obrigatórios ausentes (${(rawMessage.required || []).join(', ')})`
            : JSON.stringify(rawMessage))
        const errorDetails = result.data?.resultados?.erros || []
        
        console.error('❌ Erro na importação:', errorMessage)
        console.error('📋 Detalhes dos erros:', errorDetails)
        
        // Montar mensagem de erro detalhada (sempre string)
        let fullErrorMessage = String(errorMessage)
        if (errorDetails.length > 0) {
          fullErrorMessage += '\n\nDetalhes:\n'
          errorDetails.slice(0, 5).forEach(err => {
            fullErrorMessage += `\n• ${err.brinco || err.animal || 'Animal'}: ${err.erro || err.msg || '—'}`
          })
          if (errorDetails.length > 5) {
            fullErrorMessage += `\n\n... e mais ${errorDetails.length - 5} erros`
          }
        }
        
        setError(fullErrorMessage)
      }
    } catch (err) {
      console.error('❌ Erro ao importar:', err)
      setError(`Erro ao importar: ${err.message}`)
    } finally {
      setLoading(false)
      setImportProgress(null)
    }
  }

  const handleClose = () => {
    setFile(null)
    setDetectedType(null)
    setPreview(null)
    setError(null)
    setSuccess(null)
    setImportProgress(null)
    onClose()
  }

  const getTypeLabel = (type) => {
    const labels = {
      inseminacao: 'Inseminação Artificial (IA)',
      fiv: 'Fertilização In Vitro (FIV)',
      nascimentos: 'Nascimentos',
      diagnostico_gestacao: 'Diagnóstico de Gestação (DG)',
      notas_fiscais: 'Notas Fiscais',
      baixas: 'Baixas (MORTE/BAIXA e VENDA)',
      animais: 'Animais'
    }
    return labels[type] || 'Dados'
  }

  if (!isOpen) return null

  return (
    <>
      <ImportProgressOverlay
        importando={loading}
        progress={importProgress ? { atual: importProgress.atual ?? importProgress.current, total: importProgress.total, etapa: importProgress.etapa || `Lote ${importProgress.current}/${importProgress.total} (${importProgress.processed} registros)...` } : {}}
      />
      <Modal isOpen={isOpen} onClose={handleClose} title="Importação Universal de Excel" size="xl">
      <div className="space-y-4">
        {/* Método de Importação */}
        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={() => {
              setImportMethod('file')
              setPastedText('')
              setPreview(null)
              setError(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              importMethod === 'file'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            📁 Upload de Arquivo
          </button>
          <button
            type="button"
            onClick={() => {
              setImportMethod('paste')
              setFile(null)
              setPreview(null)
              setError(null)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              importMethod === 'paste'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            📋 Copiar e Colar
          </button>
        </div>

        {/* Upload de Arquivo */}
        {importMethod === 'file' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecione o arquivo Excel
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
            />
          </div>
        )}

        {/* Copiar e Colar */}
        {importMethod === 'paste' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📋 Cole os dados do Excel aqui (Ctrl+C → Ctrl+V)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              💡 Dica: Selecione os dados no Excel (incluindo o cabeçalho) e pressione Ctrl+C, depois cole aqui com Ctrl+V
            </p>
            <textarea
              value={pastedText}
              onChange={(e) => {
                const newText = e.target.value
                setPastedText(newText)
                // Processar automaticamente quando houver dados suficientes
                if (newText.trim().split('\n').length >= 2) {
                  setTimeout(() => {
                    processPastedText(newText)
                  }, 300)
                }
              }}
              placeholder="Cole aqui os dados do Excel (incluindo cabeçalho)..."
              rows={10}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
            {pastedText && (
              <button
                type="button"
                onClick={() => processPastedText(pastedText)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Processando...' : 'Processar Dados Colados'}
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {importProgress
                  ? `Lote ${importProgress.current}/${importProgress.total} (${importProgress.processed} registros)...`
                  : 'Processando arquivo...'}
              </span>
            </div>
            {importProgress && (
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                Aguarde, não feche a janela. Arquivos grandes são enviados em partes.
              </p>
            )}
          </div>
        )}

        {/* Detected Type + Seletor manual */}
        {detectedType && !loading && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                Tipo detectado: {getTypeLabel(detectedType)}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm text-blue-700 dark:text-blue-300">
                Usar tipo:
              </label>
              <select
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value || null)}
                className="text-sm border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Detectado ({getTypeLabel(detectedType)})</option>
                <option value="baixas">Baixas (MORTE/BAIXA e VENDA)</option>
                <option value="animais">Animais</option>
                <option value="inseminacao">Inseminação (IA)</option>
                <option value="fiv">FIV</option>
                <option value="nascimentos">Nascimentos</option>
                <option value="diagnostico_gestacao">Diagnóstico de Gestação</option>
                <option value="notas_fiscais">Notas Fiscais</option>
              </select>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              {preview?.total || 0} registros encontrados
            </p>
          </div>
        )}

        {/* Preview */}
        {preview && !loading && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Preview (mostrando 5 primeiros registros)
            </h3>
            
            {/* Aviso sobre campos vazios (apenas para Animais, não para Baixas) */}
            {preview.sample && preview.sample.length > 0 && (selectedType || detectedType) !== 'baixas' && (() => {
              const firstRow = preview.sample[0]
              const camposVazios = []
              const camposObrigatorios = ['serie', 'rg']
              const camposImportantes = ['sexo', 'raca', 'nome']
              
              camposObrigatorios.forEach(campo => {
                if (!firstRow[campo] || firstRow[campo] === null) {
                  camposVazios.push({ campo, tipo: 'obrigatório' })
                }
              })
              
              camposImportantes.forEach(campo => {
                if (!firstRow[campo] || firstRow[campo] === null) {
                  camposVazios.push({ campo, tipo: 'importante' })
                }
              })
              
              if (camposVazios.length > 0) {
                const obrigatorios = camposVazios.filter(c => c.tipo === 'obrigatório')
                const importantes = camposVazios.filter(c => c.tipo === 'importante')
                
                return (
                  <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                          ⚠️ Atenção: Campos vazios detectados
                        </p>
                        {obrigatorios.length > 0 && (
                          <p className="text-yellow-700 dark:text-yellow-300 mb-1">
                            <strong>Campos obrigatórios vazios:</strong> {obrigatorios.map(c => c.campo.toUpperCase()).join(', ')}
                            <br />
                            <span className="text-xs">Estes campos são obrigatórios e a importação pode falhar sem eles.</span>
                          </p>
                        )}
                        {importantes.length > 0 && (
                          <p className="text-yellow-700 dark:text-yellow-300">
                            <strong>Campos importantes vazios:</strong> {importantes.map(c => c.campo.toUpperCase()).join(', ')}
                            <br />
                            <span className="text-xs">Estes campos serão importados como vazios se não estiverem no Excel.</span>
                          </p>
                        )}
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                          💡 Dica: Verifique se os nomes das colunas no Excel correspondem aos esperados (Serie, RG, Nome, Sexo, Raça, etc.)
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })()}
            
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {Object.keys(preview.sample[0] || {}).map((key) => (
                      <th
                        key={key}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {preview.sample.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, vIdx) => (
                        <td
                          key={vIdx}
                          className={`px-3 py-2 text-xs whitespace-nowrap ${
                            val === null || val === '' || val === undefined
                              ? 'text-gray-400 dark:text-gray-600 italic'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {val === null || val === '' || val === undefined ? '-' : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800 dark:text-red-200 whitespace-pre-wrap">{typeof error === 'string' ? error : JSON.stringify(error)}</span>
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="space-y-2">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-green-800 dark:text-green-200">{typeof success.message === 'string' ? success.message : String(success.message || '')}</span>
              </div>
            </div>
            {/* Exemplos de erros quando há muitos */}
            {success.details?.erros?.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  Exemplos de erros (primeiros {Math.min(5, success.details.erros.length)}):
                </p>
                <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
                  {success.details.erros.slice(0, 5).map((e, i) => (
                    <li key={i}>Linha {e.linha}: {e.animal || '—'} — {e.msg}</li>
                  ))}
                </ul>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  💡 Verifique se as colunas do Excel estão corretas (SÉR/SÉRIE, RG, DATA, COMPRADOR, VALOR). Data no formato DD/MM/AAAA.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          {!canImportExcel && (
            <span className="self-center text-xs text-red-600 dark:text-red-400">
              Somente Zeca Desenvolvedor pode importar Excel.
            </span>
          )}
          {preview && !loading && (
            <Button onClick={handleImport} disabled={loading || !canImportExcel}>
              {loading ? 'Importando...' : `Importar ${preview.total} registros`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
    </>
  )
}
