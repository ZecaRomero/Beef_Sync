import { query } from '../../../lib/database'
import ExcelJS from 'exceljs'
import logger from '../../../utils/logger'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { relatorioId, formato = 'xlsx' } = req.body

    if (!relatorioId) {
      return res.status(400).json({ message: 'ID do relatório é obrigatório' })
    }

    // Buscar configuração do relatório
    const relatorioResult = await query(
      'SELECT * FROM relatorios_personalizados WHERE id = $1',
      [relatorioId]
    )
    if (relatorioResult.rows.length === 0) {
      return res.status(404).json({ message: 'Relatório não encontrado' })
    }

    const relatorio = relatorioResult.rows[0]
    
    // Parse dos campos JSON se necessário
    let camposExibicao = []
    try {
      if (typeof relatorio.campos_exibicao === 'string') {
        camposExibicao = JSON.parse(relatorio.campos_exibicao) || []
      } else if (Array.isArray(relatorio.campos_exibicao)) {
        camposExibicao = relatorio.campos_exibicao
      }
    } catch (e) {
      logger.error('Erro ao fazer parse de campos_exibicao', { error: e?.message })
      camposExibicao = []
    }

    let filtros = {}
    try {
      if (typeof relatorio.filtros === 'string') {
        filtros = JSON.parse(relatorio.filtros) || {}
      } else if (typeof relatorio.filtros === 'object' && relatorio.filtros !== null) {
        filtros = relatorio.filtros
      }
    } catch (e) {
      console.error('Erro ao fazer parse de filtros:', e)
      filtros = {}
    }

    const tipo = relatorio.tipo

    // Buscar dados baseado no tipo de relatório
    let dados = []
    let headers = []

    switch (tipo) {
      case 'animais':
        dados = await buscarDadosAnimais(camposExibicao, filtros)
        if (camposExibicao.length > 0) {
          headers = camposExibicao.map(campo => {
            const labels = {
              serie: 'Série',
              rg: 'RG',
              raca: 'Raça',
              data_nascimento: 'Data de Nascimento',
              situacao: 'Situação',
              custo_aquisicao: 'Custo de Aquisição',
              custo_total: 'Custo Total',
              valor_venda: 'Valor de Venda'
            }
            return labels[campo] || campo
          })
        } else if (dados.length > 0) {
          headers = Object.keys(dados[0]).map(key => {
            const labels = {
              serie: 'Série',
              rg: 'RG',
              raca: 'Raça',
              data_nascimento: 'Data de Nascimento',
              situacao: 'Situação',
              custo_aquisicao: 'Custo de Aquisição',
              custo_total: 'Custo Total',
              valor_venda: 'Valor de Venda'
            }
            return labels[key] || key
          })
        }
        break

      case 'reprodutivo':
        dados = await buscarDadosReprodutivo(camposExibicao, filtros)
        if (camposExibicao.length > 0) {
          headers = camposExibicao.map(campo => {
            const labels = {
              numero_te: 'Número TE',
              data_te: 'Data TE',
              receptora: 'Receptora',
              doadora: 'Doadora',
              touro: 'Touro',
              resultado: 'Resultado',
              status: 'Status'
            }
            return labels[campo] || campo
          })
        } else if (dados.length > 0) {
          headers = Object.keys(dados[0]).map(key => {
            const labels = {
              numero_te: 'Número TE',
              data_te: 'Data TE',
              receptora: 'Receptora',
              doadora: 'Doadora',
              touro: 'Touro',
              resultado: 'Resultado',
              status: 'Status'
            }
            return labels[key] || key
          })
        }
        break

      case 'financeiro':
        dados = await buscarDadosFinanceiro(camposExibicao, filtros)
        if (dados.length > 0) {
          headers = Object.keys(dados[0]).map(key => {
            const labels = {
              animal: 'Animal',
              custo_aquisicao: 'Custo Aquisição',
              custo_total: 'Custo Total',
              valor_venda: 'Valor Venda',
              lucro: 'Lucro',
              roi: 'ROI (%)'
            }
            return labels[key] || key
          })
        }
        break

      case 'estoque':
        dados = await buscarDadosEstoque(camposExibicao, filtros)
        if (dados.length > 0) {
          headers = Object.keys(dados[0]).map(key => {
            const labels = {
              touro: 'Touro',
              raca: 'Raça',
              quantidade: 'Quantidade',
              preco_unitario: 'Preço Unitário',
              valor_total: 'Valor Total'
            }
            return labels[key] || key
          })
        }
        break

      default:
        return res.status(400).json({ message: 'Tipo de relatório não suportado' })
    }

    console.log('✅ Dados obtidos:', dados.length, 'registros')
    console.log('📋 Headers:', headers.length)

    // Garantir que dados é um array
    if (!Array.isArray(dados)) {
      dados = []
    }

    if (formato === 'xlsx' || formato === 'excel') {
      console.log('📄 Gerando arquivo Excel...')
      try {
        // Gerar arquivo Excel
        const workbook = new ExcelJS.Workbook()
        const worksheetName = (relatorio.nome || 'Relatório').substring(0, 31) // Excel limita a 31 caracteres
        const worksheet = workbook.addWorksheet(worksheetName)

        // Determinar número de colunas
        let numCols = 1
        if (headers.length > 0) {
          numCols = headers.length
        } else if (dados.length > 0 && dados[0]) {
          numCols = Object.keys(dados[0]).length
        }

        // Adicionar cabeçalho
        worksheet.addRow([relatorio.nome || 'Relatório Personalizado'])
        if (numCols > 1) {
          worksheet.mergeCells(1, 1, 1, numCols)
        }
        worksheet.getRow(1).font = { size: 16, bold: true }
        worksheet.getRow(1).alignment = { horizontal: 'center' }
        worksheet.addRow([]) // Linha em branco

        // Adicionar cabeçalhos das colunas
        if (headers.length > 0) {
          worksheet.addRow(headers)
          const headerRow = worksheet.getRow(worksheet.rowCount)
          headerRow.font = { bold: true }
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE67E22' }
          }
          headerRow.alignment = { horizontal: 'center' }

          // Adicionar dados
          if (dados.length > 0) {
            dados.forEach(row => {
              if (row && typeof row === 'object') {
                const rowData = camposExibicao.length > 0 
                  ? camposExibicao.map(campo => {
                      const value = row[campo]
                      if (value instanceof Date) {
                        return value.toLocaleDateString('pt-BR')
                      }
                      return value !== null && value !== undefined ? String(value) : ''
                    })
                  : Object.values(row)
                worksheet.addRow(rowData)
              }
            })
          }
        } else if (dados.length > 0 && dados[0]) {
          // Se não houver campos específicos, adicionar todos os dados
          const firstRow = dados[0]
          const allHeaders = Object.keys(firstRow)
          worksheet.addRow(allHeaders)
          const headerRow = worksheet.getRow(worksheet.rowCount)
          headerRow.font = { bold: true }
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE67E22' }
          }
          headerRow.alignment = { horizontal: 'center' }

          dados.forEach(row => {
            if (row && typeof row === 'object') {
              const rowData = allHeaders.map(header => {
                const value = row[header]
                if (value instanceof Date) {
                  return value.toLocaleDateString('pt-BR')
                }
                return value !== null && value !== undefined ? String(value) : ''
              })
              worksheet.addRow(rowData)
            }
          })
        } else {
          // Sem dados
          worksheet.addRow(['Nenhum dado encontrado'])
        }

        // Ajustar largura das colunas
        worksheet.columns.forEach((column, index) => {
          column.width = 15
        })

        // Configurar resposta
        const filename = `${(relatorio.nome || 'relatorio').replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.xlsx`
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

        await workbook.xlsx.write(res)
        return res.end()
      } catch (excelError) {
        console.error('❌ Erro ao gerar Excel:', excelError)
        throw excelError
      }
    } else {
      // Retornar JSON
      res.status(200).json({
        success: true,
        relatorio: relatorio.nome,
        headers,
        dados,
        total: dados.length
      })
    }
  } catch (error) {
    logger.error('Erro ao gerar relatório', { error: error?.message, stack: error?.stack })
    
    // Se a resposta já foi enviada, não tente enviar novamente
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Erro ao gerar relatório', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
}

async function buscarDadosAnimais(campos, filtros = {}) {
  // Se não houver campos especificados, usar campos padrão
  if (!campos || campos.length === 0) {
    campos = ['serie', 'rg', 'raca', 'data_nascimento', 'situacao']
  }

  // Validar campos permitidos (removido custo_aquisicao que não existe na tabela)
  const camposValidos = ['serie', 'rg', 'raca', 'data_nascimento', 'situacao', 'custo_total', 'valor_venda']
  const camposFiltrados = campos.filter(c => camposValidos.includes(c))
  
  const camposSelect = camposFiltrados.length > 0 ? camposFiltrados.join(', ') : '*'
  let sql = `SELECT ${camposSelect} FROM animais WHERE 1=1`
  const params = []
  let paramCount = 0

  if (filtros && filtros.raca) {
    sql += ` AND raca = $${++paramCount}`
    params.push(filtros.raca)
  }

  if (filtros && filtros.situacao) {
    sql += ` AND situacao = $${++paramCount}`
    params.push(filtros.situacao)
  }

  sql += ' ORDER BY serie ASC LIMIT 1000'

  const result = await query(sql, params)
  return result.rows
}

async function buscarDadosReprodutivo(campos, filtros = {}) {
  // Se não houver campos especificados, usar campos padrão
  if (!campos || campos.length === 0) {
    campos = ['numero_te', 'data_te', 'receptora', 'doadora', 'touro', 'resultado', 'status']
  }

  // Mapeamento de campos para colunas do banco
  const mapaCampos = {
    'numero_te': 'numero_te',
    'data_te': 'data_te',
    'receptora': 'receptora_nome',
    'doadora': 'doadora_nome',
    'touro': 'touro',
    'resultado': 'resultado',
    'status': 'status'
  }

  // Validar campos permitidos
  const camposValidos = Object.keys(mapaCampos)
  const camposFiltrados = campos.filter(c => camposValidos.includes(c))
  
  // Construir SELECT com aliases
  const camposSelect = camposFiltrados.length > 0 
    ? camposFiltrados.map(c => `${mapaCampos[c]} AS ${c}`).join(', ') 
    : '*'
    
  let sql = `SELECT ${camposSelect} FROM transferencias_embrioes WHERE 1=1`
  const params = []
  let paramCount = 0

  if (filtros && filtros.touro) {
    sql += ` AND touro = $${++paramCount}`
    params.push(filtros.touro)
  }

  if (filtros && filtros.resultado) {
    sql += ` AND resultado = $${++paramCount}`
    params.push(filtros.resultado)
  }

  sql += ' ORDER BY data_te DESC LIMIT 1000'

  const result = await query(sql, params)
  return result.rows
}

async function buscarDadosFinanceiro(campos, filtros = {}) {
  // Sempre buscar campos calculados para financeiro
  let sql = `
    SELECT 
      a.serie as animal,
      0 as custo_aquisicao,
      COALESCE(SUM(c.valor), 0) as custo_total,
      a.valor_venda,
      COALESCE(a.valor_venda, 0) - COALESCE(SUM(c.valor), 0) as lucro,
      CASE 
        WHEN COALESCE(SUM(c.valor), 0) > 0 
        THEN ROUND(((COALESCE(a.valor_venda, 0) - COALESCE(SUM(c.valor), 0)) / COALESCE(SUM(c.valor), 0)) * 100, 2)
        ELSE 0
      END as roi
    FROM animais a
    LEFT JOIN custos c ON c.animal_id = a.id
    WHERE 1=1
  `
  const params = []
  let paramCount = 0

  if (filtros && filtros.animal) {
    sql += ` AND a.serie LIKE $${++paramCount}`
    params.push(`%${filtros.animal}%`)
  }

  sql += ' GROUP BY a.id, a.serie, a.valor_venda'
  sql += ' ORDER BY a.serie ASC LIMIT 1000'

  const result = await query(sql, params)
  return result.rows
}

async function buscarDadosEstoque(campos, filtros = {}) {
  // Sempre buscar campos calculados para estoque
  let sql = `
    SELECT 
      s.nome_touro as touro,
      s.raca,
      SUM(s.doses_disponiveis) as quantidade,
      AVG(s.valor_compra) as preco_unitario,
      SUM(s.valor_compra) as valor_total
    FROM estoque_semen s
    WHERE 1=1
  `
  const params = []
  let paramCount = 0

  if (filtros && filtros.touro) {
    sql += ` AND s.nome_touro = $${++paramCount}`
    params.push(filtros.touro)
  }

  if (filtros && filtros.raca) {
    sql += ` AND s.raca = $${++paramCount}`
    params.push(filtros.raca)
  }

  sql += ' GROUP BY s.nome_touro, s.raca'
  sql += ' ORDER BY s.nome_touro ASC LIMIT 1000'

  const result = await query(sql, params)
  return result.rows
}
