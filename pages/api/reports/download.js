import { generatePDFReport, generateExcelReport } from '../../../utils/reportGenerator'
import { sendSuccess, sendValidationError, sendMethodNotAllowed, sendError, asyncHandler } from '../../../utils/apiResponse'
import logger from '../../../utils/logger'

// Import the report generation functions directly
import { 
  generateMonthlySummary, 
  generateBirthsAnalysis, 
  generateBreedingReport, 
  generateFinancialSummary,
  generateInventoryReport,
  generateLocationReport
} from './generate'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, 'POST')
  }

  const { reports, period, sections, format = 'pdf', filters } = req.body

  console.log('📊 Requisição de download recebida:', {
    reports,
    period,
    format,
    hasFilters: !!filters,
    hasSections: !!sections
  })

  if (!reports || !Array.isArray(reports) || reports.length === 0) {
    console.error('❌ Erro de validação: reports inválido')
    return sendValidationError(res, 'Tipos de relatório são obrigatórios')
  }

  if (!period || !period.startDate || !period.endDate) {
    console.error('❌ Erro de validação: period inválido')
    return sendValidationError(res, 'Período é obrigatório')
  }

  try {
    // Generate report data directly instead of making HTTP request
    console.log('🔄 Gerando dados do relatório...')
    const reportData = {
      success: true,
      data: {
        data: {}
      },
      period,
      generatedAt: new Date().toISOString()
    }

    // Generate each requested report type
    console.log('📋 Processando tipos de relatório:', reports)
    for (const reportType of reports) {
      console.log(`🔄 Gerando: ${reportType}`)
      switch (reportType) {
        case 'monthly_summary':
          reportData.data.data.monthly_summary = await generateMonthlySummary(period, sections?.[reportType])
          break
        case 'births_analysis':
          reportData.data.data.births_analysis = await generateBirthsAnalysis(period, sections?.[reportType])
          break
        case 'breeding_report':
          reportData.data.data.breeding_report = await generateBreedingReport(period, sections?.[reportType])
          break
        case 'financial_summary':
          reportData.data.data.financial_summary = await generateFinancialSummary(period, sections?.[reportType])
          break
        case 'inventory_report':
          reportData.data.data.inventory_report = await generateInventoryReport(period, sections?.[reportType])
          break
        case 'location_report':
          reportData.data.data.location_report = await generateLocationReport(period, sections?.[reportType])
          break
        default:
          console.warn(`⚠️ Tipo de relatório desconhecido: ${reportType}`)
      }
    }

    console.log('📊 Dados gerados, iniciando criação do arquivo...')
    let fileBuffer
    let contentType
    let fileExtension

    if (format === 'pdf') {
      console.log('📄 Gerando PDF...')
      fileBuffer = await generatePDFReport(reportData, period)
      contentType = 'application/pdf'
      fileExtension = 'pdf'
    } else if (format === 'xlsx' || format === 'excel') {
      console.log('📊 Gerando Excel...')
      fileBuffer = await generateExcelReport(reportData, period)
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      fileExtension = 'xlsx'
    } else {
      console.error('❌ Formato não suportado:', format)
      return sendValidationError(res, 'Formato não suportado')
    }

    console.log(`✅ Arquivo gerado: ${fileBuffer.length} bytes`)

    // Gerar nome do arquivo baseado nos tipos de relatório
    let reportNames = []
    const reportTypeNames = {
      'monthly_summary': 'Resumo-Mensal',
      'births_analysis': 'Analise-Nascimentos',
      'breeding_report': 'Relatorio-Reproducao',
      'financial_summary': 'Resumo-Financeiro',
      'inventory_report': 'Relatorio-Estoque',
      'location_report': 'Relatorio-Localizacao'
    }

    reports.forEach(reportType => {
      if (reportTypeNames[reportType]) {
        reportNames.push(reportTypeNames[reportType])
      }
    })

    const reportNamePart = reportNames.length > 0 ? reportNames.join('-') : 'Relatorio'
    const datePart = `${period.startDate}-${period.endDate}`
    const filename = `${reportNamePart}_${datePart}.${fileExtension}`

    console.log('📁 Nome do arquivo:', filename)
    console.log('📋 Content-Type:', contentType)

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', fileBuffer.length)

    console.log('✅ Enviando arquivo para o cliente...')
    res.send(fileBuffer)
  } catch (error) {
    console.error('❌ Erro detalhado ao gerar relatório:', {
      message: error.message,
      stack: error.stack,
      reports,
      period,
      format
    })
    logger.error('Erro ao gerar relatório para download:', error)
    return sendError(res, `Erro interno do servidor: ${error.message}`)
  }
}

export default asyncHandler(handler)