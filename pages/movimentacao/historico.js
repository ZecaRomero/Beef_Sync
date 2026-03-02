import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ClockIcon, MapPinIcon, MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon, DocumentArrowDownIcon, XMarkIcon, TrashIcon } from '../../components/ui/Icons'

export default function HistoricoMovimentacoes() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [movimentacoes, setMovimentacoes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [piqueteModal, setPiqueteModal] = useState(null)
  const [exportando, setExportando] = useState(false)
  const [filtroAvancado, setFiltroAvancado] = useState({
    animal_id: '',
    piquete: '',
    data_inicio: '',
    data_fim: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      carregarMovimentacoes()
    }
  }, [mounted, filtroAvancado])

  // Considerar ativo: sem data_saida OU datas inconsistentes (data_saida < data_entrada, ex: erro de importação)
  const ehLocalizacaoAtiva = (m) => {
    if (!m.data_saida) return true
    const de = m.data_entrada ? new Date(m.data_entrada) : null
    const ds = new Date(m.data_saida)
    return de && !isNaN(ds.getTime()) && ds < de
  }

  // Calcular resumo por piquete (localizações ativas)
  const resumoPorPiquete = React.useMemo(() => {
    const ativos = movimentacoes.filter(ehLocalizacaoAtiva)
    const porPiquete = {}
    ativos.forEach(mov => {
      const piquete = mov.piquete || 'Sem local'
      if (!porPiquete[piquete]) {
        porPiquete[piquete] = { total: 0, machos: 0, femeas: 0 }
      }
      porPiquete[piquete].total++
      const sexo = (mov.sexo || '').toLowerCase()
      if (sexo.includes('macho') || sexo === 'm') {
        porPiquete[piquete].machos++
      } else if (sexo.includes('fêmea') || sexo.includes('femea') || sexo === 'f') {
        porPiquete[piquete].femeas++
      }
    })
    return Object.entries(porPiquete)
      .map(([nome, dados]) => ({ piquete: nome, ...dados }))
      .sort((a, b) => b.total - a.total)
  }, [movimentacoes])

  const totais = React.useMemo(() => {
    const ativos = movimentacoes.filter(ehLocalizacaoAtiva)
    const machos = ativos.filter(m => (m.sexo || '').toLowerCase().includes('macho') || (m.sexo || '').toLowerCase() === 'm').length
    const femeas = ativos.filter(m => (m.sexo || '').toLowerCase().includes('fêmea') || (m.sexo || '').toLowerCase().includes('femea') || (m.sexo || '').toLowerCase() === 'f').length
    return { total: ativos.length, machos, femeas }
  }, [movimentacoes])

  const animaisDoPiquete = React.useMemo(() => {
    if (!piqueteModal) return []
    if (piqueteModal === '__TODOS__') return movimentacoes.filter(ehLocalizacaoAtiva)
    return movimentacoes.filter(m => ehLocalizacaoAtiva(m) && (m.piquete || 'Sem local') === piqueteModal)
  }, [movimentacoes, piqueteModal])

  const exportarPiqueteExcel = async () => {
    if (!piqueteModal || animaisDoPiquete.length === 0) return
    setExportando(true)
    try {
      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()
      const sheetName = (piqueteModal === '__TODOS__' ? 'Todos' : piqueteModal).replace(/[^\w\s]/g, '').substring(0, 31)
      const worksheet = workbook.addWorksheet(sheetName || 'Animais')
      worksheet.columns = [
        { header: 'Série', key: 'serie', width: 12 },
        { header: 'RG', key: 'rg', width: 12 },
        { header: 'Raça', key: 'raca', width: 15 },
        { header: 'Sexo', key: 'sexo', width: 10 },
        { header: 'Piquete', key: 'piquete', width: 15 },
        { header: 'Data Entrada', key: 'data_entrada', width: 15 },
        { header: 'Motivo', key: 'motivo', width: 25 }
      ]
      animaisDoPiquete.forEach(m => {
        worksheet.addRow({
          serie: m.serie || '',
          rg: m.rg || '',
          raca: m.raca || '',
          sexo: m.sexo || '',
          piquete: m.piquete || '',
          data_entrada: m.data_entrada ? new Date(m.data_entrada).toLocaleDateString('pt-BR') : '',
          motivo: m.motivo_movimentacao || ''
        })
      })
      const headerRow = worksheet.getRow(1)
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7030A0' } }
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
      })
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `animais_${(piqueteModal === '__TODOS__' ? 'todos' : piqueteModal).replace(/\s+/g, '_')}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro ao exportar:', err)
      alert('Erro ao exportar para Excel')
    } finally {
      setExportando(false)
    }
  }

  const carregarMovimentacoes = async () => {
    try {
      setIsLoading(true)
      
      let url = '/api/localizacoes'
      const params = new URLSearchParams()
      
      if (filtroAvancado.animal_id) {
        params.append('animal_id', filtroAvancado.animal_id)
      }
      
      if (filtroAvancado.piquete) {
        params.append('piquete', filtroAvancado.piquete)
      }
      
      if (filtroAvancado.data_inicio) {
        params.append('data_inicio', filtroAvancado.data_inicio)
      }
      
      if (filtroAvancado.data_fim) {
        params.append('data_fim', filtroAvancado.data_fim)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        let movimentacoesData = data.data || []
        
        // Ordenar por data de entrada (mais recente primeiro)
        movimentacoesData.sort((a, b) => {
          const dateA = new Date(a.data_entrada || a.created_at)
          const dateB = new Date(b.data_entrada || b.created_at)
          return dateB - dateA
        })
        
        // Aplicar filtro de texto se houver
        if (filtro) {
          movimentacoesData = movimentacoesData.filter(mov => {
            const serie = mov.serie || ''
            const rg = mov.rg || ''
            const animalId = mov.animal_id ? String(mov.animal_id) : ''
            const piquete = mov.piquete || ''
            const motivo = mov.motivo_movimentacao || ''
            const searchText = `${serie} ${rg} ${animalId} ${piquete} ${motivo}`.toLowerCase()
            return searchText.includes(filtro.toLowerCase())
          })
        }
        
        setMovimentacoes(movimentacoesData)
      } else {
        console.error('Erro ao carregar movimentações:', response.status)
        setMovimentacoes([])
      }
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error)
      setMovimentacoes([])
    } finally {
      setIsLoading(false)
    }
  }

  const limparLocalizacoesPorPiquete = async (piquete) => {
    // Primeira confirmação
    if (!confirm(`⚠️ ATENÇÃO!\n\nVocê está prestes a excluir TODAS as localizações do piquete "${piquete}".\n\nEsta ação NÃO pode ser desfeita.\n\nDeseja continuar?`)) {
      return
    }

    // Segunda confirmação
    if (!confirm(`🔴 CONFIRMAÇÃO FINAL\n\nTem CERTEZA ABSOLUTA que deseja excluir todas as localizações do piquete "${piquete}"?\n\nEsta é sua última chance de cancelar!`)) {
      return
    }

    try {
      const response = await fetch(`/api/localizacoes/limpar-por-piquete?piquete=${encodeURIComponent(piquete)}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert(`✅ ${data.message}\n\n• Localizações removidas: ${data.deleted}\n• Animais afetados: ${data.animais_afetados}`)
        // Recarregar dados
        await carregarMovimentacoes()
      } else {
        alert(`❌ Erro: ${data.error || 'Falha ao limpar localizações'}`)
      }
    } catch (error) {
      console.error('Erro ao limpar localizações do piquete:', error)
      alert('❌ Erro ao limpar localizações. Verifique a conexão.')
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClockIcon className="w-8 h-8 text-purple-600" />
            Histórico de Movimentações
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Visualize todo o histórico de transferências e movimentações dos animais
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por ID, animal, piquete ou motivo..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <FunnelIcon className="w-4 h-4" />
            Filtros Avançados
          </summary>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID do Animal
              </label>
              <input
                type="number"
                value={filtroAvancado.animal_id}
                onChange={(e) => setFiltroAvancado({...filtroAvancado, animal_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Ex: 123"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Piquete
              </label>
              <input
                type="text"
                value={filtroAvancado.piquete}
                onChange={(e) => setFiltroAvancado({...filtroAvancado, piquete: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Ex: Piquete 1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={filtroAvancado.data_inicio}
                onChange={(e) => setFiltroAvancado({...filtroAvancado, data_inicio: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filtroAvancado.data_fim}
                onChange={(e) => setFiltroAvancado({...filtroAvancado, data_fim: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>
          <button
            onClick={() => {
              setFiltroAvancado({
                animal_id: '',
                piquete: '',
                data_inicio: '',
                data_fim: ''
              })
              setFiltro('')
            }}
            className="mt-4 text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            Limpar filtros
          </button>
        </details>
      </div>

      {/* Resumo por Piquete */}
      {!isLoading && movimentacoes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-purple-600" />
            Resumo por Piquete (localizações ativas)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card total geral - clicável */}
            <button
              type="button"
              onClick={() => setPiqueteModal('__TODOS__')}
              className="text-left bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div className="text-sm font-medium opacity-90">Total de Animais</div>
              <div className="text-3xl font-bold mt-1">{totais.total}</div>
              <div className="mt-2 text-sm opacity-90 flex gap-4">
                <span>🐂 {totais.machos} machos</span>
                <span>🐄 {totais.femeas} fêmeas</span>
              </div>
              <div className="text-xs opacity-75 mt-2">Clique para ver todos →</div>
            </button>
            {/* Cards por piquete - clicáveis */}
            {resumoPorPiquete.slice(0, 11).map((item) => (
              <div
                key={item.piquete}
                className="relative bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 shadow hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-500 transition-all group"
              >
                <button
                  type="button"
                  onClick={() => setPiqueteModal(item.piquete)}
                  className="text-left w-full"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPinIcon className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-gray-900 dark:text-white truncate" title={item.piquete}>
                      {item.piquete}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{item.total}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    🐂 {item.machos} machos • 🐄 {item.femeas} fêmeas
                  </div>
                  <div className="text-xs text-purple-500 dark:text-purple-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Clique para ver animais →
                  </div>
                </button>
                {/* Botão de excluir localizações do piquete */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    limparLocalizacoesPorPiquete(item.piquete)
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title={`Limpar localizações do ${item.piquete}`}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {resumoPorPiquete.length > 12 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              + {resumoPorPiquete.length - 12} piquete(s) com animais
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-gray-500">Carregando histórico...</div>
        </div>
      ) : movimentacoes.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <ArrowPathIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma movimentação encontrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filtro || Object.values(filtroAvancado).some(v => v) 
              ? 'Nenhuma movimentação corresponde aos filtros aplicados'
              : 'Registre movimentações na página de Localização de Animais'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Animal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Piquete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data Entrada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data Saída
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {movimentacoes.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {mov.serie || ''} {mov.rg || ''}
                      </div>
                      {(mov.raca || mov.sexo) && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {mov.raca} {mov.sexo ? `• ${mov.sexo}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-900 dark:text-white">{mov.piquete || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {mov.data_entrada 
                        ? new Date(mov.data_entrada).toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {mov.data_saida 
                        ? new Date(mov.data_saida).toLocaleDateString('pt-BR')
                        : <span className="text-green-600 dark:text-green-400 font-medium">Ativo</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mov.motivo_movimentacao ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {mov.motivo_movimentacao}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mov.data_saida ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Finalizada
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Ativa
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {movimentacoes.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total de {movimentacoes.length} movimentação(ões) registrada(s)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal Animais do Piquete */}
      {piqueteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPiqueteModal(null)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {piqueteModal === '__TODOS__' ? 'Todos os Animais' : piqueteModal}
                </h3>
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-sm font-medium">
                  {animaisDoPiquete.length} animal(is)
                </span>
              </div>
              <button
                onClick={() => setPiqueteModal(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={exportarPiqueteExcel}
                disabled={exportando || animaisDoPiquete.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                {exportando ? 'Exportando...' : 'Exportar Excel'}
              </button>
              {piqueteModal !== '__TODOS__' && (
                <button
                  onClick={() => {
                    setFiltroAvancado(prev => ({ ...prev, piquete: piqueteModal }))
                    setPiqueteModal(null)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FunnelIcon className="w-5 h-5" />
                  Filtrar tabela
                </button>
              )}
              <button
                onClick={() => {
                  router.push('/movimentacao/localizacao')
                  setPiqueteModal(null)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <MapPinIcon className="w-5 h-5" />
                Página de Localização
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Animal</th>
                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Raça</th>
                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Sexo</th>
                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Data Entrada</th>
                  </tr>
                </thead>
                <tbody>
                  {animaisDoPiquete.map((mov) => (
                    <tr 
                      key={mov.id} 
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => router.push(`/animals/${mov.animal_id}`)}
                    >
                      <td className="py-2 font-medium text-gray-900 dark:text-white">
                        {mov.serie || ''} {mov.rg || ''}
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{mov.raca || '-'}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{mov.sexo || '-'}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">
                        {mov.data_entrada ? new Date(mov.data_entrada).toLocaleDateString('pt-BR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

