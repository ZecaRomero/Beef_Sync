import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { BeakerIcon, CalendarIcon, UserIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, DocumentArrowUpIcon } from '../../components/ui/Icons'
import { useDebouncedCallback } from '../../hooks/useDebounce'
import { formatDoadoraIdentificacao } from '../../utils/formatters'
import ImportProgressOverlay from '../../components/ImportProgressOverlay'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../contexts/AuthContext'

export default function ColetaFiv() {
  const permissions = usePermissions()
  const { user } = useAuth()
  const normalizedUserName = String(permissions.userName || '').toLowerCase()
  const canImportExcel = permissions.isDeveloper && normalizedUserName.includes('zeca')

  const [coletas, setColetas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLab, setFilterLab] = useState('')
  const [filterVet, setFilterVet] = useState('')
  const [filterDateStart, setFilterDateStart] = useState('')
  const [filterDateEnd, setFilterDateEnd] = useState('')
  
  // Form State
  const [formData, setFormData] = useState({
    laboratorio: '',
    veterinario: '',
    data_fiv: new Date().toISOString().split('T')[0],
    data_transferencia: '',
    observacoes: '',
    itens: []
  })

  // State for the item currently being added
  const [currentItem, setCurrentItem] = useState({
    doadora_id: null,
    doadora_nome: '',
    touro: '',
    quantidade_oocitos: ''
  })

  // Calculate transfer date whenever FIV date changes
  useEffect(() => {
    if (formData.data_fiv) {
      const fivDate = new Date(formData.data_fiv)
      const transferDate = new Date(fivDate)
      transferDate.setDate(transferDate.getDate() + 7)
      
      // Handle timezone offset issues by setting time to noon
      transferDate.setHours(12, 0, 0, 0)
      
      setFormData(prev => ({
        ...prev,
        data_transferencia: transferDate.toISOString().split('T')[0]
      }))
    }
  }, [formData.data_fiv])

  // Autocomplete States
  const [doadoraOptions, setDoadoraOptions] = useState([])
  const [showDoadoraOptions, setShowDoadoraOptions] = useState(false)
  const [loadingDoadora, setLoadingDoadora] = useState(false)

  const [touroOptions, setTouroOptions] = useState([])
  const [showTouroOptions, setShowTouroOptions] = useState(false)
  const [loadingTouro, setLoadingTouro] = useState(false)

  const [labOptions, setLabOptions] = useState([])
  const [vetOptions, setVetOptions] = useState([])

  // Import Excel States
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')
  const [importLaboratorio, setImportLaboratorio] = useState('')
  const [importVeterinario, setImportVeterinario] = useState('')

  // Initial Load
  useEffect(() => {
    loadColetas()
    loadAutocompleteOptions()
  }, [])

  const loadAutocompleteOptions = async () => {
    try {
      const response = await fetch('/api/reproducao/autocomplete-fiv')
      if (response.ok) {
        const data = await response.json()
        setLabOptions(data.data.laboratorios || [])
        setVetOptions(data.data.veterinarios || [])
      }
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error)
    }
  }

  const loadColetas = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/reproducao/coleta-fiv')
      if (response.ok) {
        const data = await response.json()
        setColetas(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar coletas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Criar TE manual para uma coleta (D+7)
  const handleCriarTE = async (coleta) => {
    try {
      const fivDate = new Date(coleta.data_fiv)
      const transferDate = new Date(fivDate)
      transferDate.setDate(transferDate.getDate() + 7)
      transferDate.setHours(12, 0, 0, 0)
      const dataTE = (coleta.data_transferencia || transferDate.toISOString().split('T')[0])
      const numeroTE = `TE-${(dataTE || '').replace(/-/g, '')}-${Date.now().toString().slice(-6)}-1`
      const body = {
        numero_te: numeroTE,
        data_te: dataTE,
        local_te: coleta.laboratorio || '',
        tecnico_responsavel: coleta.veterinario || 'Equipe',
        status: 'pendente',
        doadora_nome: coleta.doadora_nome || '',
        touro: coleta.touro || null,
        observacoes: `Agendada automaticamente a partir da FIV ${new Date(coleta.data_fiv).toLocaleDateString('pt-BR')}`
      }
      const res = await fetch('/api/transferencias-embrioes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        await loadColetas()
        alert('TE criada e vinculada à coleta!')
      } else {
        const err = await res.json()
        alert(`Erro ao criar TE: ${err.message}`)
      }
    } catch (error) {
      console.error('Erro ao criar TE:', error)
      alert('Erro ao criar TE')
    }
  }

  const handleAddItem = () => {
    if (!currentItem.doadora_nome) {
      alert('Selecione uma doadora')
      return
    }
    
    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, { ...currentItem }]
    }))
    
    // Reset doadora and oocitos, keep touro for convenience
    setCurrentItem(prev => ({
      ...prev,
      doadora_id: null,
      doadora_nome: '',
      quantidade_oocitos: ''
    }))
  }

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.itens.length === 0) {
      alert('Adicione pelo menos uma doadora à lista')
      return
    }
    
    try {
      const response = await fetch('/api/reproducao/coleta-fiv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Coletas FIV registradas com sucesso!')
        setShowForm(false)
        setFormData({
          laboratorio: '',
          veterinario: '',
          data_fiv: new Date().toISOString().split('T')[0],
          data_transferencia: '',
          observacoes: '',
          itens: []
        })
        setCurrentItem({
            doadora_id: null,
            doadora_nome: '',
            touro: '',
            quantidade_oocitos: ''
        })
        loadColetas()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar registro')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return

    try {
      const response = await fetch(`/api/reproducao/coleta-fiv?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadColetas()
      } else {
        alert('Erro ao excluir registro')
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
    }
  }

  // Search Functions
  const searchDoadora = useDebouncedCallback(async (query) => {
    if (!query || query.length < 1) {
      setDoadoraOptions([])
      return
    }
    
    setLoadingDoadora(true)
    try {
      const response = await fetch(`/api/search/animals?q=${encodeURIComponent(query)}&type=doadora`)
      if (response.ok) {
        const data = await response.json()
        const options = (data.data || []).map(animal => ({
          value: animal.nome || animal.rg || 'Sem Nome',
          id: animal.id,
          label: `${animal.nome || 'Sem Nome'} ${animal.rg ? `(RG: ${animal.rg})` : ''} - ${animal.raca || ''}`.trim()
        }))
        setDoadoraOptions(options)
        setShowDoadoraOptions(true)
      }
    } catch (error) {
      console.error('Erro ao buscar doadoras:', error)
    } finally {
      setLoadingDoadora(false)
    }
  }, 300)

  const searchTouro = useDebouncedCallback(async (query) => {
    if (!query || query.length < 1) {
      setTouroOptions([])
      return
    }
    
    setLoadingTouro(true)
    try {
      const response = await fetch(`/api/search/animals?q=${encodeURIComponent(query)}&type=touro`)
      if (response.ok) {
        const data = await response.json()
        const options = (data.data || []).map(animal => ({
          value: animal.nome || animal.rg || 'Sem Nome',
          label: `${animal.nome || 'Sem Nome'} ${animal.rg ? `(RG: ${animal.rg})` : ''} - ${animal.raca || ''} ${animal.source === 'semen' ? '(Sêmen)' : ''}`.trim()
        }))
        setTouroOptions(options)
        setShowTouroOptions(true)
      }
    } catch (error) {
      console.error('Erro ao buscar touros:', error)
    } finally {
      setLoadingTouro(false)
    }
  }, 300)

  // Import Excel Functions
  const handleImportFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const fileExtension = file.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls'].includes(fileExtension)) {
      setImportError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)')
      return
    }

    setImportFile(file)
    setImportError('')
    setImportSuccess('')
  }

  // Função de filtro
  const filteredColetas = coletas.filter(coleta => {
    // Filtro de busca (doadora, touro, laboratório)
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      (coleta.doadora_nome && coleta.doadora_nome.toLowerCase().includes(searchLower)) ||
      (coleta.touro && coleta.touro.toLowerCase().includes(searchLower)) ||
      (coleta.laboratorio && coleta.laboratorio.toLowerCase().includes(searchLower)) ||
      (coleta.veterinario && coleta.veterinario.toLowerCase().includes(searchLower))
    
    // Filtro de laboratório
    const matchesLab = !filterLab || coleta.laboratorio === filterLab
    
    // Filtro de veterinário
    const matchesVet = !filterVet || coleta.veterinario === filterVet
    
    // Filtro de data
    const coletaDate = new Date(coleta.data_fiv)
    const matchesDateStart = !filterDateStart || coletaDate >= new Date(filterDateStart)
    const matchesDateEnd = !filterDateEnd || coletaDate <= new Date(filterDateEnd)
    
    return matchesSearch && matchesLab && matchesVet && matchesDateStart && matchesDateEnd
  })

  // Obter listas únicas para os filtros
  const uniqueLabs = [...new Set(coletas.map(c => c.laboratorio).filter(Boolean))].sort()
  const uniqueVets = [...new Set(coletas.map(c => c.veterinario).filter(Boolean))].sort()

  const handleImportExcel = async () => {
    if (!canImportExcel) {
      setImportError('Apenas Zeca Desenvolvedor pode importar Excel nesta tela.')
      return
    }

    if (!importFile) {
      setImportError('Selecione um arquivo Excel')
      return
    }

    if (!importLaboratorio || !importVeterinario) {
      setImportError('Laboratório e veterinário são obrigatórios')
      return
    }

    setImportLoading(true)
    setImportError('')
    setImportSuccess('')

    console.log('📤 Iniciando importação...', { fileName: importFile.name, size: importFile.size })

    // Converter arquivo para base64 usando Promise
    const fileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const arrayBuffer = reader.result
            const bytes = new Uint8Array(arrayBuffer)
            let binary = ''
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i])
            }
            const base64 = btoa(binary)
            console.log('✅ Arquivo convertido para base64, tamanho:', base64.length)
            resolve(base64)
          } catch (error) {
            console.error('❌ Erro ao converter para base64:', error)
            reject(error)
          }
        }
        reader.onerror = (error) => {
          console.error('❌ Erro ao ler arquivo:', error)
          reject(new Error('Erro ao ler arquivo'))
        }
        reader.readAsArrayBuffer(file)
      })
    }

    try {
      console.log('🔄 Convertendo arquivo para base64...')
      const base64 = await fileToBase64(importFile)

      console.log('📡 Enviando para API...')
      const response = await fetch('/api/reproducao/coleta-fiv/import-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': permissions.isDeveloper ? 'desenvolvedor' : 'externo',
          'x-user-name': permissions.userName || '',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          fileData: base64,
          fileName: importFile.name,
          laboratorio: importLaboratorio,
          veterinario: importVeterinario,
          userRole: permissions.isDeveloper ? 'desenvolvedor' : 'externo',
          userName: permissions.userName || '',
          userEmail: user?.email || '',
        })
      })

      console.log('📥 Resposta recebida:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erro na resposta:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText || 'Erro ao importar arquivo' }
        }
        setImportError(errorData.message || `Erro ${response.status}: ${response.statusText}`)
        setImportLoading(false)
        return
      }

      const data = await response.json()
      console.log('✅ Dados recebidos:', data)

      if (data.success) {
        setImportSuccess(
          `Importação concluída! ${data.data.created} de ${data.data.total} registros importados com sucesso.`
        )
        if (data.data.warnings && data.data.warnings.length > 0) {
          console.warn('⚠️ Avisos na importação:', data.data.warnings)
        }
        if (data.data.errors && data.data.errors.length > 0) {
          console.error('❌ Erros na importação:', data.data.errors)
        }
        
        // Limpar formulário e recarregar dados
        setTimeout(() => {
          setImportFile(null)
          setImportLaboratorio('')
          setImportVeterinario('')
          setShowImportModal(false)
          loadColetas()
        }, 2000)
      } else {
        setImportError(data.message || 'Erro ao importar arquivo')
      }
    } catch (error) {
      console.error('❌ Erro ao importar:', error)
      setImportError('Erro ao importar: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ImportProgressOverlay importando={importLoading} progress={{ etapa: 'Importando coletas FIV...' }} />
      <Head>
        <title>Coleta de Oócitos (FIV) - Beef Sync</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <BeakerIcon className="h-8 w-8 mr-2 text-pink-600" />
              Coleta de Oócitos (FIV)
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gestão de coletas para Fertilização In Vitro
            </p>
          </div>
          <div className="flex gap-2">
            {canImportExcel ? (
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                Importar Excel
              </button>
            ) : (
              <button
                disabled
                className="flex items-center px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                title="Somente Zeca Desenvolvedor pode importar Excel"
              >
                <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                Importar Excel (restrito)
              </button>
            )}
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              {showForm ? 'Cancelar' : (
                <>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nova Coleta
                </>
              )}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Nova Coleta</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Common Data Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                 {/* Laboratório */}
                 <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Laboratório *
                  </label>
                  <input
                    type="text"
                    value={formData.laboratorio}
                    onChange={(e) => setFormData({...formData, laboratorio: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                    list="lab-options"
                    placeholder="Selecione ou digite um novo..."
                  />
                  <datalist id="lab-options">
                    {labOptions.map((opt, idx) => (
                      <option key={idx} value={opt} />
                    ))}
                  </datalist>
                </div>

                {/* Veterinário */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Veterinário *
                  </label>
                  <input
                    type="text"
                    value={formData.veterinario}
                    onChange={(e) => setFormData({...formData, veterinario: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                    list="vet-options"
                    placeholder="Selecione ou digite um novo..."
                  />
                  <datalist id="vet-options">
                    {vetOptions.map((opt, idx) => (
                      <option key={idx} value={opt} />
                    ))}
                  </datalist>
                </div>

                {/* Data FIV */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data da FIV *
                  </label>
                  <input
                    type="date"
                    value={formData.data_fiv}
                    onChange={(e) => setFormData({...formData, data_fiv: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                {/* Data Transferência (Calculada) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data Prevista Transferência (D+7)
                  </label>
                  <input
                    type="date"
                    value={formData.data_transferencia}
                    readOnly
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-300 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Itens List Section */}
              <div>
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Doadoras e Oócitos</h3>
                
                {formData.itens.length > 0 && (
                  <div className="mb-4 overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Doadora</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Touro</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Oócitos</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {formData.itens.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{formatDoadoraIdentificacao(item.doadora_nome)}</td>
                            <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{item.touro || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.quantidade_oocitos}</td>
                            <td className="px-4 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add Item Form */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    
                    {/* Doadora Input */}
                    <div className="md:col-span-5 relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Doadora *
                      </label>
                      <input
                        type="text"
                        value={currentItem.doadora_nome}
                        onChange={(e) => {
                          setCurrentItem({...currentItem, doadora_nome: e.target.value, doadora_id: null})
                          searchDoadora(e.target.value)
                        }}
                        onFocus={() => currentItem.doadora_nome && setShowDoadoraOptions(true)}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Buscar doadora..."
                      />
                      {showDoadoraOptions && doadoraOptions.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {doadoraOptions.map((opt, idx) => (
                            <li
                              key={idx}
                              onClick={() => {
                                setCurrentItem({
                                  ...currentItem, 
                                  doadora_nome: opt.value,
                                  doadora_id: opt.id
                                })
                                setShowDoadoraOptions(false)
                              }}
                              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-white"
                            >
                              {opt.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Touro Input */}
                    <div className="md:col-span-4 relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Touro
                      </label>
                      <input
                        type="text"
                        value={currentItem.touro}
                        onChange={(e) => {
                          setCurrentItem({...currentItem, touro: e.target.value})
                          searchTouro(e.target.value)
                        }}
                        onFocus={() => currentItem.touro && setShowTouroOptions(true)}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Buscar touro..."
                      />
                      {showTouroOptions && touroOptions.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {touroOptions.map((opt, idx) => (
                            <li
                              key={idx}
                              onClick={() => {
                                setCurrentItem({...currentItem, touro: opt.value})
                                setShowTouroOptions(false)
                              }}
                              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-white"
                            >
                              {opt.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Qtd Oócitos */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Qtd.
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={currentItem.quantidade_oocitos}
                        onChange={(e) => setCurrentItem({...currentItem, quantidade_oocitos: e.target.value})}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                      />
                    </div>

                    {/* Add Button */}
                    <div className="md:col-span-1">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-full h-[42px] flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                        title="Adicionar Doadora"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações Gerais
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows="2"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="mr-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Salvar Coletas ({formData.itens.length})
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Coletas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          {/* Barra de Busca e Filtros */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              
              {/* Campo de Busca */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por doadora, touro, laboratório..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtro Laboratório */}
              <div>
                <select
                  value={filterLab}
                  onChange={(e) => setFilterLab(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Todos os laboratórios</option>
                  {uniqueLabs.map((lab, idx) => (
                    <option key={idx} value={lab}>{lab}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Veterinário */}
              <div>
                <select
                  value={filterVet}
                  onChange={(e) => setFilterVet(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Todos os veterinários</option>
                  {uniqueVets.map((vet, idx) => (
                    <option key={idx} value={vet}>{vet}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Data */}
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filterDateStart}
                  onChange={(e) => setFilterDateStart(e.target.value)}
                  placeholder="Data início"
                  className="w-full py-2 px-3 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                  title="Data início"
                />
                <input
                  type="date"
                  value={filterDateEnd}
                  onChange={(e) => setFilterDateEnd(e.target.value)}
                  placeholder="Data fim"
                  className="w-full py-2 px-3 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                  title="Data fim"
                />
              </div>
            </div>

            {/* Indicador de resultados e limpar filtros */}
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {filteredColetas.length} {filteredColetas.length === 1 ? 'resultado' : 'resultados'}
                {filteredColetas.length !== coletas.length && ` de ${coletas.length} total`}
              </span>
              {(searchTerm || filterLab || filterVet || filterDateStart || filterDateEnd) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterLab('')
                    setFilterVet('')
                    setFilterDateStart('')
                    setFilterDateEnd('')
                  }}
                  className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 font-medium"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data FIV</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Doadora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Laboratório</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Oócitos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Touro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transferência</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : filteredColetas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <MagnifyingGlassIcon className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                        <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredColetas.map((coleta) => (
                    <tr key={coleta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(coleta.data_fiv).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                        {formatDoadoraIdentificacao(coleta.doadora_nome)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {coleta.laboratorio}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {coleta.quantidade_oocitos}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {coleta.touro || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {(() => {
                          const fiv = new Date(coleta.data_fiv)
                          const expected = new Date(fiv)
                          expected.setDate(expected.getDate() + 7)
                          const expectedStr = expected.toLocaleDateString('pt-BR')
                          const hasTransfer = !!coleta.data_transferencia
                          const shown = hasTransfer ? new Date(coleta.data_transferencia).toLocaleDateString('pt-BR') : expectedStr
                          const mismatch = hasTransfer && shown !== expectedStr
                          return (
                            <span className="inline-flex items-center gap-2">
                              <span>{shown}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${coleta.te_exists ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                                {coleta.te_exists ? `Transferido${coleta.te_count ? ` (${coleta.te_count})` : ''}` : 'Agendado D+7'}
                              </span>
                              {mismatch && (
                                <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                  Ajustar para D+7
                                </span>
                              )}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!coleta.te_exists && (
                          <button
                            onClick={() => handleCriarTE(coleta)}
                            className="mr-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Criar TE (D+7)"
                          >
                            Agendar TE
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(coleta.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Importação Excel */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {!canImportExcel && (
                  <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Acesso restrito: apenas Zeca Desenvolvedor pode importar planilhas Excel.
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <DocumentArrowUpIcon className="h-6 w-6 mr-2 text-blue-600" />
                    Importar Coletas FIV do Excel
                  </h2>
                  <button
                    onClick={() => {
                      setShowImportModal(false)
                      setImportFile(null)
                      setImportError('')
                      setImportSuccess('')
                      setImportLaboratorio('')
                      setImportVeterinario('')
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Arquivo Excel *
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImportFileChange}
                      disabled={importLoading || !canImportExcel}
                      className="w-full text-sm text-gray-500 dark:text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        dark:file:bg-blue-900 dark:file:text-blue-300
                        dark:hover:file:bg-blue-800
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {importFile && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Arquivo selecionado: {importFile.name}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Laboratório *
                      </label>
                      <input
                        type="text"
                        value={importLaboratorio}
                        onChange={(e) => setImportLaboratorio(e.target.value)}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Digite o laboratório..."
                        list="import-lab-options"
                      />
                      <datalist id="import-lab-options">
                        {labOptions.map((opt, idx) => (
                          <option key={idx} value={opt} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Veterinário *
                      </label>
                      <input
                        type="text"
                        value={importVeterinario}
                        onChange={(e) => setImportVeterinario(e.target.value)}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Digite o veterinário..."
                        list="import-vet-options"
                      />
                      <datalist id="import-vet-options">
                        {vetOptions.map((opt, idx) => (
                          <option key={idx} value={opt} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      Formato esperado da planilha:
                    </h3>
                    <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                      <li><strong>Rgd</strong> - Registro da doadora (obrigatório)</li>
                      <li><strong>Data</strong> - Data da FIV (obrigatório)</li>
                      <li><strong>Touro</strong> - Nome do touro (opcional)</li>
                      <li><strong>Viaveis</strong> - Quantidade de oócitos viáveis (usado como quantidade de oócitos)</li>
                      <li><strong>Cultivados</strong> - Quantidade cultivada (alternativa se Viaveis não existir)</li>
                      <li><strong>Embriao</strong>, <strong>%Emb</strong>, <strong>Cong.</strong>, <strong>NaoTe</strong>, <strong>Te</strong> - Dados adicionais (irão para observações)</li>
                    </ul>
                  </div>

                  {importError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm text-red-800 dark:text-red-400">{importError}</p>
                    </div>
                  )}

                  {importSuccess && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-sm text-green-800 dark:text-green-400">{importSuccess}</p>
                    </div>
                  )}

                  {/* Mensagem de validação */}
                  {!importFile || !importLaboratorio || !importVeterinario ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-400">
                        {!importFile && 'Selecione um arquivo Excel para continuar.'}
                        {importFile && !importLaboratorio && 'Preencha o campo Laboratório para continuar.'}
                        {importFile && importLaboratorio && !importVeterinario && 'Preencha o campo Veterinário para continuar.'}
                      </p>
                    </div>
                  ) : null}

                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setShowImportModal(false)
                        setImportFile(null)
                        setImportError('')
                        setImportSuccess('')
                        setImportLaboratorio('')
                        setImportVeterinario('')
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      disabled={importLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleImportExcel}
                      disabled={importLoading || !importFile || !importLaboratorio || !importVeterinario || !canImportExcel}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      title={!importFile || !importLaboratorio || !importVeterinario ? 'Preencha todos os campos obrigatórios' : ''}
                    >
                      {importLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Importando...
                        </>
                      ) : (
                        'Importar'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
