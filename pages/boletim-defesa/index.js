import { useState, useEffect, Fragment } from 'react'
import Head from 'next/head'
import ModernLayout from '../../components/layout/ModernLayout'
import BoletimCampo from '../../components/boletim/BoletimCampo'
import { DocumentTextIcon, ArrowDownTrayIcon, PlusIcon, TrashIcon, TableCellsIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function BoletimDefesa() {
  const [abaAtiva, setAbaAtiva] = useState('defesa')
  const [fazendas, setFazendas] = useState([])
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [deletandoId, setDeletandoId] = useState(null)
  const [editingCell, setEditingCell] = useState(null)
  const [pendingChange, setPendingChange] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  const [redirecionandoMobile, setRedirecionandoMobile] = useState(false)

  // Redirecionar para versão mobile em dispositivos móveis (igual ao app)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.pathname === '/boletim-defesa/mobile') return
    const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (isMobile) {
      setRedirecionandoMobile(true)
      window.location.replace('/boletim-defesa/mobile')
    }
  }, [])

  const [isAdelso, setIsAdelso] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const id = localStorage.getItem('beef_usuario_identificado')
      if (id) {
        const parsed = JSON.parse(id)
        setCurrentUser(parsed?.nome || null)
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setCurrentUser('Zeca')
      }
      const adelsoAuth = localStorage.getItem('beef_adelso_auth')
      if (adelsoAuth) {
        try {
          const data = JSON.parse(adelsoAuth)
          if (data.nome === 'Adelso' && data.expiresAt > Date.now()) {
            setIsAdelso(true)
          }
        } catch (_) {}
      }
    } catch (_) {}
  }, [])

  const carregarDados = async () => {
    try {
      const response = await fetch('/api/boletim-defesa')
      const data = await response.json()
      setFazendas(data.fazendas || [])
      setHistorico(data.historico || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCellChange = async (fazendaId, faixa, sexo, novoValor) => {
    const valorNumerico = parseInt(novoValor) || 0
    
    // Buscar valor antigo
    const fazenda = fazendas.find(f => f.id === fazendaId)
    const valorAntigo = fazenda?.quantidades[faixa]?.[sexo] || 0
    
    // Se o valor não mudou, não fazer nada
    if (valorAntigo === valorNumerico) return
    
    // Preparar informações para confirmação
    const faixaLabels = {
      '0a3': '0 a 3 meses',
      '3a8': '3 a 8 meses',
      '8a12': '8 a 12 meses',
      '12a24': '12 a 24 meses',
      '25a36': '25 a 36 meses',
      'acima36': 'Acima de 36 meses'
    }
    
    const sexoLabel = sexo === 'M' ? 'Machos' : 'Fêmeas'
    
    setPendingChange({
      fazendaId,
      fazendaNome: fazenda.nome,
      faixa,
      faixaLabel: faixaLabels[faixa],
      sexo,
      sexoLabel,
      valorAntigo,
      valorNovo: valorNumerico
    })
    
    setShowConfirmModal(true)
  }

  const confirmarAlteracao = async () => {
    if (!pendingChange) return
    
    const { fazendaId, faixa, sexo, valorNovo, valorAntigo } = pendingChange
    
    // Atualizar localmente
    setFazendas(prev => prev.map(f => {
      if (f.id === fazendaId) {
        return {
          ...f,
          quantidades: {
            ...f.quantidades,
            [faixa]: {
              ...f.quantidades[faixa],
              [sexo]: valorNovo
            }
          }
        }
      }
      return f
    }))

    // Salvar no banco
    try {
      let usuario = null
      if (typeof window !== 'undefined') {
        try {
          const id = localStorage.getItem('beef_usuario_identificado')
          if (id) {
            const parsed = JSON.parse(id)
            usuario = parsed?.nome || null
          }
        } catch (_) {}
      }
      await fetch('/api/boletim-defesa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fazendaId,
          faixa,
          sexo,
          valor: valorNovo,
          valorAntigo,
          fazendaNome: pendingChange.fazendaNome,
          usuario
        })
      })
      carregarDados()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('❌ Erro ao salvar alteração')
      
      // Reverter alteração localmente em caso de erro
      setFazendas(prev => prev.map(f => {
        if (f.id === fazendaId) {
          return {
            ...f,
            quantidades: {
              ...f.quantidades,
              [faixa]: {
                ...f.quantidades[faixa],
                [sexo]: valorAntigo
              }
            }
          }
        }
        return f
      }))
    }
    
    setShowConfirmModal(false)
    setPendingChange(null)
  }

  const cancelarAlteracao = () => {
    setShowConfirmModal(false)
    setPendingChange(null)
    // Recarregar dados para reverter a mudança visual
    carregarDados()
  }

  const podeExcluirRegistro = (h) => {
    if (!currentUser || isAdelso) return false
    const regUser = (h.usuario || '').trim()
    return regUser === '' || regUser === '-' || regUser === currentUser || currentUser === 'Zeca'
  }

  const excluirHistorico = async (id) => {
    if (!currentUser) return
    setDeletandoId(id)
    try {
      const res = await fetch('/api/boletim-defesa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, usuario: currentUser })
      })
      const data = await res.json()
      if (data.success) {
        setHistorico(prev => prev.filter(h => h.id !== id))
      } else {
        alert(data.message || 'Não foi possível excluir')
      }
    } catch (err) {
      alert('Erro ao excluir')
    } finally {
      setDeletandoId(null)
    }
  }

  const calcularSubtotais = (quantidades) => {
    const faixas = ['0a3', '3a8', '8a12', '12a24', '25a36', 'acima36']
    let totalM = 0
    let totalF = 0

    faixas.forEach(faixa => {
      totalM += quantidades[faixa]?.M || 0
      totalF += quantidades[faixa]?.F || 0
    })

    return { M: totalM, F: totalF, total: totalM + totalF }
  }

  const exportarExcel = async () => {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()

    // Cores
    const corAzul = { argb: 'FF3B82F6' }
    const corRosa = { argb: 'FFEC4899' }
    const corAmarelo = { argb: 'FFF59E0B' }
    const corVermelho = { argb: 'FFEF4444' }
    const corVerde = { argb: 'FF10B981' }
    const corCinza = { argb: 'FF6B7280' }
    const corBranco = { argb: 'FFFFFFFF' }
    const corAzulClaro = { argb: 'FFDBEAFE' }
    const corRosaClaro = { argb: 'FFFCE7F3' }

    // Criar aba para cada fazenda
    fazendas.forEach(fazenda => {
      const sheet = workbook.addWorksheet(fazenda.nome.substring(0, 30))
      const q = fazenda.quantidades
      const subtotais = calcularSubtotais(q)

      // Título
      sheet.mergeCells('A1:P1')
      const titleCell = sheet.getCell('A1')
      titleCell.value = `QUANTIDADES DE GADO NA DEFESA (${new Date().toLocaleDateString('pt-BR')})`
      titleCell.font = { bold: true, size: 14, color: corBranco }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: corAzul }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      sheet.getRow(1).height = 25

      // Subtítulo
      sheet.mergeCells('A2:P2')
      const subtitleCell = sheet.getCell('A2')
      subtitleCell.value = `${fazenda.nome} - ${fazenda.cnpj}`
      subtitleCell.font = { bold: true, size: 12, color: corBranco }
      subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: corCinza }
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      sheet.getRow(2).height = 20

      // Cabeçalho - Faixas etárias
      sheet.mergeCells('B3:C3')
      sheet.mergeCells('D3:E3')
      sheet.mergeCells('F3:G3')
      sheet.mergeCells('H3:I3')
      sheet.mergeCells('J3:K3')
      sheet.mergeCells('L3:M3')
      sheet.mergeCells('N3:O3')

      const faixas = [
        { cell: 'B3', label: '0 A 3' },
        { cell: 'D3', label: '3 A 8' },
        { cell: 'F3', label: '8 A 12' },
        { cell: 'H3', label: '12 A 24' },
        { cell: 'J3', label: '25 A 36' },
        { cell: 'L3', label: 'ACIMA 36' },
        { cell: 'N3', label: 'SUBTOTAL' },
        { cell: 'P3', label: 'TOTAL' }
      ]

      faixas.forEach(({ cell, label }) => {
        const c = sheet.getCell(cell)
        c.value = label
        c.font = { bold: true, size: 11, color: corBranco }
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: corAzul }
        c.alignment = { horizontal: 'center', vertical: 'middle' }
        c.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      // Cabeçalho - M/F
      const row4 = sheet.getRow(4)
      const sexos = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O']
      sexos.forEach((col, idx) => {
        const cell = sheet.getCell(`${col}4`)
        const isMacho = idx % 2 === 0
        cell.value = isMacho ? 'M' : 'F'
        cell.font = { bold: true, size: 11, color: isMacho ? corAzul : corRosa }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      // Dados
      const row5 = sheet.getRow(5)
      const valores = [
        q['0a3']?.M || 0, q['0a3']?.F || 0,
        q['3a8']?.M || 0, q['3a8']?.F || 0,
        q['8a12']?.M || 0, q['8a12']?.F || 0,
        q['12a24']?.M || 0, q['12a24']?.F || 0,
        q['25a36']?.M || 0, q['25a36']?.F || 0,
        q['acima36']?.M || 0, q['acima36']?.F || 0,
        subtotais.M, subtotais.F
      ]

      valores.forEach((val, idx) => {
        const col = String.fromCharCode(66 + idx) // B=66
        const cell = sheet.getCell(`${col}5`)
        cell.value = val
        const isMacho = idx % 2 === 0
        cell.font = { bold: true, size: 12, color: isMacho ? corAzul : corRosa }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: idx >= 12 ? { argb: 'FFFEF3C7' } : corBranco }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      // Total
      const totalCell = sheet.getCell('P5')
      totalCell.value = subtotais.total
      totalCell.font = { bold: true, size: 14, color: corVermelho }
      totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } }
      totalCell.alignment = { horizontal: 'center', vertical: 'middle' }
      totalCell.border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }

      // Largura das colunas
      sheet.getColumn('A').width = 5
      for (let i = 2; i <= 16; i++) {
        sheet.getColumn(i).width = 10
      }

      // Altura das linhas
      sheet.getRow(3).height = 20
      sheet.getRow(4).height = 18
      sheet.getRow(5).height = 22
    })

    // Planilha consolidada
    const consolidado = workbook.addWorksheet('CONSOLIDADO')

    // Título
    consolidado.mergeCells('A1:Q1')
    const titleCons = consolidado.getCell('A1')
    titleCons.value = `CONSOLIDADO - QUANTIDADES DE GADO NA DEFESA (${new Date().toLocaleDateString('pt-BR')})`
    titleCons.font = { bold: true, size: 14, color: corBranco }
    titleCons.fill = { type: 'pattern', pattern: 'solid', fgColor: corVerde }
    titleCons.alignment = { horizontal: 'center', vertical: 'middle' }
    consolidado.getRow(1).height = 25

    // Cabeçalho
    consolidado.mergeCells('B3:C3')
    consolidado.mergeCells('D3:E3')
    consolidado.mergeCells('F3:G3')
    consolidado.mergeCells('H3:I3')
    consolidado.mergeCells('J3:K3')
    consolidado.mergeCells('L3:M3')
    consolidado.mergeCells('N3:O3')

    const faixasCons = [
      { cell: 'A3', label: 'FAZENDA' },
      { cell: 'B3', label: '0 A 3' },
      { cell: 'D3', label: '3 A 8' },
      { cell: 'F3', label: '8 A 12' },
      { cell: 'H3', label: '12 A 24' },
      { cell: 'J3', label: '25 A 36' },
      { cell: 'L3', label: 'ACIMA 36' },
      { cell: 'N3', label: 'SUBTOTAL' },
      { cell: 'Q3', label: 'TOTAL' }
    ]

    faixasCons.forEach(({ cell, label }) => {
      const c = consolidado.getCell(cell)
      c.value = label
      c.font = { bold: true, size: 11, color: corBranco }
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: corVerde }
      c.alignment = { horizontal: 'center', vertical: 'middle' }
      c.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // M/F
    const row4Cons = consolidado.getRow(4)
    const sexosCons = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O']
    sexosCons.forEach((col, idx) => {
      const cell = consolidado.getCell(`${col}4`)
      const isMacho = idx % 2 === 0
      cell.value = isMacho ? 'M' : 'F'
      cell.font = { bold: true, size: 11, color: isMacho ? corAzul : corRosa }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Dados das fazendas
    fazendas.forEach((fazenda, idx) => {
      const rowNum = 5 + idx
      const row = consolidado.getRow(rowNum)
      const q = fazenda.quantidades
      const subtotais = calcularSubtotais(q)

      // Nome da fazenda
      const nomeCell = consolidado.getCell(`A${rowNum}`)
      nomeCell.value = fazenda.nome
      nomeCell.font = { bold: true, size: 10 }
      nomeCell.alignment = { horizontal: 'left', vertical: 'middle' }
      nomeCell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }

      // Valores
      const valoresCons = [
        q['0a3']?.M || 0, q['0a3']?.F || 0,
        q['3a8']?.M || 0, q['3a8']?.F || 0,
        q['8a12']?.M || 0, q['8a12']?.F || 0,
        q['12a24']?.M || 0, q['12a24']?.F || 0,
        q['25a36']?.M || 0, q['25a36']?.F || 0,
        q['acima36']?.M || 0, q['acima36']?.F || 0,
        subtotais.M, subtotais.F
      ]

      valoresCons.forEach((val, i) => {
        const col = String.fromCharCode(66 + i)
        const cell = consolidado.getCell(`${col}${rowNum}`)
        cell.value = val
        const isMacho = i % 2 === 0
        cell.font = { bold: true, size: 11, color: isMacho ? corAzul : corRosa }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: i >= 12 ? { argb: 'FFFEF3C7' } : corBranco }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      // Total
      const totalCell = consolidado.getCell(`Q${rowNum}`)
      totalCell.value = subtotais.total
      totalCell.font = { bold: true, size: 12, color: corVermelho }
      totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } }
      totalCell.alignment = { horizontal: 'center', vertical: 'middle' }
      totalCell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Linha de totais gerais
    const totalRowNum = 5 + fazendas.length
    const totalRow = consolidado.getRow(totalRowNum)
    
    const totalGeralCell = consolidado.getCell(`A${totalRowNum}`)
    totalGeralCell.value = 'TOTAL GERAL'
    totalGeralCell.font = { bold: true, size: 12, color: corBranco }
    totalGeralCell.fill = { type: 'pattern', pattern: 'solid', fgColor: corVerde }
    totalGeralCell.alignment = { horizontal: 'center', vertical: 'middle' }
    totalGeralCell.border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    // Calcular totais gerais
    const faixasArray = ['0a3', '3a8', '8a12', '12a24', '25a36', 'acima36']
    const totaisGerais = []
    
    faixasArray.forEach(faixa => {
      const totalM = fazendas.reduce((sum, f) => sum + (f.quantidades[faixa]?.M || 0), 0)
      const totalF = fazendas.reduce((sum, f) => sum + (f.quantidades[faixa]?.F || 0), 0)
      totaisGerais.push(totalM, totalF)
    })

    const subtotalGeralM = fazendas.reduce((sum, f) => sum + calcularSubtotais(f.quantidades).M, 0)
    const subtotalGeralF = fazendas.reduce((sum, f) => sum + calcularSubtotais(f.quantidades).F, 0)
    totaisGerais.push(subtotalGeralM, subtotalGeralF)

    totaisGerais.forEach((val, i) => {
      const col = String.fromCharCode(66 + i)
      const cell = consolidado.getCell(`${col}${totalRowNum}`)
      cell.value = val
      const isMacho = i % 2 === 0
      cell.font = { bold: true, size: 12, color: corBranco }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: corVerde }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' }
      }
    })

    // Total geral final
    const totalGeralFinal = consolidado.getCell(`Q${totalRowNum}`)
    totalGeralFinal.value = fazendas.reduce((sum, f) => sum + calcularSubtotais(f.quantidades).total, 0)
    totalGeralFinal.font = { bold: true, size: 14, color: corBranco }
    totalGeralFinal.fill = { type: 'pattern', pattern: 'solid', fgColor: corVermelho }
    totalGeralFinal.alignment = { horizontal: 'center', vertical: 'middle' }
    totalGeralFinal.border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' }
    }

    // Largura das colunas
    consolidado.getColumn('A').width = 35
    for (let i = 2; i <= 17; i++) {
      consolidado.getColumn(i).width = 10
    }

    // Altura das linhas
    consolidado.getRow(3).height = 20
    consolidado.getRow(4).height = 18
    totalRow.height = 25

    // Salvar arquivo
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Boletim_Defesa_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading || redirecionandoMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {redirecionandoMobile ? 'Abrindo versão mobile...' : 'Carregando...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Boletim Defesa - Beef-Sync</title>
      </Head>

      {/* Modal de Confirmação */}
      {showConfirmModal && pendingChange && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-blue-500 dark:border-blue-600">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Confirmar Alteração
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Você está prestes a alterar uma quantidade
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 mb-6 border border-blue-200 dark:border-gray-600">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fazenda:</p>
                  <p className="font-bold text-gray-900 dark:text-white">{pendingChange.fazendaNome}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Faixa Etária:</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{pendingChange.faixaLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Categoria:</p>
                    <p className={`font-semibold text-sm ${pendingChange.sexo === 'M' ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400'}`}>
                      {pendingChange.sexoLabel}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Valor Anterior:</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{pendingChange.valorAntigo}</p>
                    </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Novo Valor:</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{pendingChange.valorNovo}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelarAlteracao}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                ✕ Cancelar
              </button>
              <button
                onClick={confirmarAlteracao}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-colors shadow-lg"
              >
                ✓ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <ModernLayout
        title="Boletim Defesa"
        subtitle={abaAtiva === 'defesa' ? 'Quantidades de gado na defesa por faixa etária' : 'Boletim Campo - LOCAL, QUANT., SEXO, CATEGORIA, RAÇA, ERA'}
        icon={<DocumentTextIcon className="w-8 h-8 text-white" />}
      >
        <div className="space-y-6">
          {/* Abas Boletim Defesa / Boletim Campo */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
            <button
              onClick={() => setAbaAtiva('defesa')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
                abaAtiva === 'defesa'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <ShieldCheckIcon className="w-5 h-5" />
              Boletim Defesa
            </button>
            <button
              onClick={() => setAbaAtiva('campo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
                abaAtiva === 'campo'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <TableCellsIcon className="w-5 h-5" />
              Boletim Campo
            </button>
          </div>

          {abaAtiva === 'campo' && (
            <BoletimCampo usuario={currentUser} isAdelso={isAdelso} />
          )}

          {abaAtiva === 'defesa' && (
          <>
          {/* Botões de ação */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportarExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Exportar Excel
            </button>

            {!isAdelso && (
              <>
                <button
                  onClick={() => window.location.href = '/boletim-defesa/nova-fazenda'}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <PlusIcon className="w-5 h-5" />
                  Nova Fazenda
                </button>
                <button
                  onClick={() => window.location.href = '/boletim-defesa/mobile'}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Versão Mobile
                </button>
              </>
            )}
            {isAdelso && (
              <span className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">Somente consulta</span>
            )}
          </div>

          {/* Tabela Unificada */}
          {fazendas.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse table-fixed">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-900 text-xs uppercase tracking-wider">
                      <th className="px-2 py-3 border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300" colSpan="2">0 A 3</th>
                      <th className="px-2 py-3 border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300" colSpan="2">3 A 8</th>
                      <th className="px-2 py-3 border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300" colSpan="2">8 A 12</th>
                      <th className="px-2 py-3 border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300" colSpan="2">12 A 24</th>
                      <th className="px-2 py-3 border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300" colSpan="2">25 A 36</th>
                      <th className="px-2 py-3 border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300" colSpan="2">ACIMA 36</th>
                      <th className="px-2 py-3 border border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20 font-bold text-gray-800 dark:text-gray-200" colSpan="2">SUBTOTAL</th>
                      <th className="px-2 py-3 border border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 font-bold text-gray-800 dark:text-gray-200">TOTAL</th>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-xs">
                      {['0a3', '3a8', '8a12', '12a24', '25a36', 'acima36'].map(faixa => (
                        <Fragment key={faixa}>
                          <th className="px-1 py-2 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 font-bold w-[6%]">M</th>
                          <th className="px-1 py-2 border border-gray-200 dark:border-gray-700 text-pink-600 dark:text-pink-400 font-bold w-[6%]">F</th>
                        </Fragment>
                      ))}
                      <th className="px-1 py-2 border border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20 text-blue-600 dark:text-blue-400 font-bold w-[7%]">M</th>
                      <th className="px-1 py-2 border border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20 text-pink-600 dark:text-pink-400 font-bold w-[7%]">F</th>
                      <th className="px-1 py-2 border border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 w-[14%]">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fazendas.map(fazenda => {
                      const subtotais = calcularSubtotais(fazenda.quantidades)
                      
                      return (
                        <Fragment key={fazenda.id}>
                          <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                            <td colSpan="15" className="px-4 py-2 border-x border-t border-blue-700 rounded-t-lg">
                              <div className="flex justify-between items-center">
                                <h2 className="text-sm font-bold uppercase tracking-wider">{fazenda.nome}</h2>
                                <span className="bg-blue-800/50 px-2 py-0.5 rounded text-xs font-mono text-blue-100">{fazenda.cnpj}</span>
                              </div>
                            </td>
                          </tr>
                          <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            {['0a3', '3a8', '8a12', '12a24', '25a36', 'acima36'].map(faixa => (
                              <Fragment key={faixa}>
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                                  {isAdelso ? (
                                    (fazenda.quantidades[faixa]?.M || 0)
                                  ) : (
                                    <input
                                      type="number"
                                      defaultValue={fazenda.quantidades[faixa]?.M || 0}
                                      onBlur={(e) => handleCellChange(fazenda.id, faixa, 'M', e.target.value)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                                      className="w-full h-full px-1 py-3 text-center text-gray-700 dark:text-gray-300 bg-transparent focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 font-medium transition-all"
                                      placeholder="0"
                                    />
                                  )}
                                </td>
                                <td className="border border-gray-200 dark:border-gray-700 px-1 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                                  {isAdelso ? (
                                    (fazenda.quantidades[faixa]?.F || 0)
                                  ) : (
                                    <input
                                      type="number"
                                      defaultValue={fazenda.quantidades[faixa]?.F || 0}
                                      onBlur={(e) => handleCellChange(fazenda.id, faixa, 'F', e.target.value)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                                      className="w-full h-full px-1 py-3 text-center text-gray-700 dark:text-gray-300 bg-transparent focus:bg-pink-50 dark:focus:bg-pink-900/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500 font-medium transition-all"
                                      placeholder="0"
                                    />
                                  )}
                                </td>
                              </Fragment>
                            ))}
                            <td className="px-1 py-2 text-center border border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/10 font-bold text-blue-700 dark:text-blue-400">
                              {subtotais.M}
                            </td>
                            <td className="px-1 py-2 text-center border border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/10 font-bold text-pink-700 dark:text-pink-400">
                              {subtotais.F}
                            </td>
                            <td className="px-1 py-2 text-center border border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/10 font-bold text-red-700 dark:text-red-400 text-lg">
                              {subtotais.total}
                            </td>
                          </tr>
                          {/* Spacer Row */}
                          <tr className="h-6 bg-transparent border-none pointer-events-none select-none">
                            <td colSpan="15" className="border-none"></td>
                          </tr>
                        </Fragment>
                      )
                    })}

                    {/* Totais Consolidados */}
                    {fazendas.length > 0 && (
                      <>
                        <tr className="bg-gray-900 text-white">
                          <td colSpan="15" className="px-4 py-3 border-x border-t border-gray-900 rounded-t-lg shadow-sm">
                            <div className="flex justify-between items-center">
                              <h2 className="text-sm font-bold uppercase tracking-wider text-green-400">TOTAIS CONSOLIDADOS</h2>
                              <span className="text-gray-400 text-xs uppercase tracking-widest">Resumo Geral</span>
                            </div>
                          </td>
                        </tr>
                        <tr className="bg-gray-100 dark:bg-gray-900 font-bold border-b-4 border-gray-900 dark:border-gray-700">
                          {['0a3', '3a8', '8a12', '12a24', '25a36', 'acima36'].map(faixa => {
                            const totalM = fazendas.reduce((sum, f) => sum + (f.quantidades[faixa]?.M || 0), 0)
                            const totalF = fazendas.reduce((sum, f) => sum + (f.quantidades[faixa]?.F || 0), 0)
                            return (
                              <Fragment key={faixa}>
                                <td className="px-1 py-4 text-center border border-gray-300 dark:border-gray-600 text-blue-800 dark:text-blue-400 text-lg bg-gray-50 dark:bg-gray-800">
                                  {totalM}
                                </td>
                                <td className="px-1 py-4 text-center border border-gray-300 dark:border-gray-600 text-pink-800 dark:text-pink-400 text-lg bg-gray-50 dark:bg-gray-800">
                                  {totalF}
                                </td>
                              </Fragment>
                            )
                          })}
                          <td className="px-1 py-4 text-center border border-gray-300 dark:border-gray-600 bg-yellow-100 dark:bg-yellow-900/30 text-blue-800 dark:text-blue-400 text-xl">
                            {fazendas.reduce((sum, f) => sum + calcularSubtotais(f.quantidades).M, 0)}
                          </td>
                          <td className="px-1 py-4 text-center border border-gray-300 dark:border-gray-600 bg-yellow-100 dark:bg-yellow-900/30 text-pink-800 dark:text-pink-400 text-xl">
                            {fazendas.reduce((sum, f) => sum + calcularSubtotais(f.quantidades).F, 0)}
                          </td>
                          <td className="px-1 py-4 text-center border border-gray-300 dark:border-gray-600 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-2xl shadow-inner">
                            {fazendas.reduce((sum, f) => sum + calcularSubtotais(f.quantidades).total, 0)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Histórico de alterações */}
          {historico.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <h3 className="px-4 py-3 bg-gray-100 dark:bg-gray-900 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Histórico de alterações
              </h3>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data/Hora</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fazenda</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Campo alterado</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">De → Para</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usuário</th>
                      {currentUser && !isAdelso && <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-12">Excluir</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {historico.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {new Date(h.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{h.fazenda_nome}</td>
                        <td className="px-3 py-2">
                          <span className="text-gray-700 dark:text-gray-300">{h.faixa_label}</span>
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-bold ${h.sexo === 'M' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'}`}>
                            {h.sexo_label}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-red-600 dark:text-red-400 font-medium">{h.valor_anterior}</span>
                          <span className="mx-1 text-gray-400">→</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">{h.valor_novo}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">{h.usuario || '-'}</td>
                        {currentUser && !isAdelso && (
                          <td className="px-2 py-2 text-center">
                            {podeExcluirRegistro(h) ? (
                              <button
                                onClick={() => excluirHistorico(h.id)}
                                disabled={deletandoId === h.id}
                                className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                                title="Excluir este registro"
                              >
                                {deletandoId === h.id ? (
                                  <span className="inline-block w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <TrashIcon className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600" title="Somente o autor pode excluir">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {fazendas.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
              <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nenhuma fazenda cadastrada
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Adicione uma fazenda para começar a registrar as quantidades
              </p>
              <button
                onClick={() => window.location.href = '/boletim-defesa/nova-fazenda'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Adicionar Fazenda
              </button>
            </div>
          )}
          </>
          )}
        </div>
      </ModernLayout>
    </>
  )
}
