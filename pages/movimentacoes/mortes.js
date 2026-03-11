
import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

import { ExclamationTriangleIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, PencilIcon, UserGroupIcon } from '../../components/ui/Icons'
import ImportProgressOverlay from '../../components/ImportProgressOverlay'

// Componentes simples inline para evitar problemas de importação
const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
)

const CardBody = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
)

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
  }
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

const Input = ({ label, className = '', error, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <input
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-500' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>
)

const Modal = ({ isOpen, onClose, title, children, className = '', size = 'md' }) => {
  if (!isOpen) return null
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[95vh] overflow-hidden flex flex-col ${className}`}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function Mortes() {
  const [mortes, setMortes] = useState([])
  const [animais, setAnimais] = useState([])
  const [causasMorte, setCausasMorte] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCausaModal, setShowCausaModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newCausa, setNewCausa] = useState('')
  const [editingMorte, setEditingMorte] = useState(null)
  const [deletingMorte, setDeletingMorte] = useState(null)
  const [newMorte, setNewMorte] = useState({
    animalId: '',
    dataMorte: '',
    causaMorte: '',
    observacoes: '',
    valorPerda: ''
  })
  const [animalSelecionado, setAnimalSelecionado] = useState(null)
  const [animaisSelecionados, setAnimaisSelecionados] = useState([])
  const [modoSelecaoMultipla, setModoSelecaoMultipla] = useState(false)
  const [numeroAnimal, setNumeroAnimal] = useState('')
  const [loadingAnimais, setLoadingAnimais] = useState(false)
  const [novaCausaInput, setNovaCausaInput] = useState('')
  const [mostrarInputNovaCausa, setMostrarInputNovaCausa] = useState(false)
  
  // Estados para importação
  const [importData, setImportData] = useState([])
  const [importStep, setImportStep] = useState('upload') // upload, preview, processing, result
  const [importSummary, setImportSummary] = useState(null)
  const [importErrors, setImportErrors] = useState([])
  const [importandoMortes, setImportandoMortes] = useState(false)
  const [importProgressMortes, setImportProgressMortes] = useState({ atual: 0, total: 0, etapa: '' })

  useEffect(() => {
    loadMortes()
    loadAnimais()
    loadCausasMorte()
  }, [])

  const loadMortes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/deaths')
      if (response.ok) {
        const data = await response.json()
        setMortes(data.data || [])
      } else {
        console.error('Erro ao carregar mortes')
        setMortes([])
      }
    } catch (error) {
      console.error('Erro ao carregar mortes:', error)
      setMortes([])
    } finally {
      setLoading(false)
    }
  }

  const loadAnimais = async () => {
    try {
      const response = await fetch('/api/animals')
      if (response.ok) {
        const data = await response.json()
        // Garantir que data seja sempre um array
        const animalsArray = Array.isArray(data) ? data : (data.data || [])
        // Filtrar apenas animais ativos
        const animaisAtivos = animalsArray.filter(animal => animal && animal.situacao === 'Ativo')
        setAnimais(animaisAtivos)
      } else {
        console.error('Erro ao carregar animais:', response.status)
        setAnimais([])
      }
    } catch (error) {
      console.error('Erro ao carregar animais:', error)
      setAnimais([])
    }
  }

  const loadCausasMorte = async () => {
    try {
      const response = await fetch('/api/death-causes')
      if (response.ok) {
        const data = await response.json()
        // Garantir que data seja sempre um array
        const causasArray = Array.isArray(data) ? data : (data.data || [])
        setCausasMorte(causasArray)
      } else {
        console.error('Erro ao carregar causas de morte:', response.status)
        setCausasMorte([])
      }
    } catch (error) {
      console.error('Erro ao carregar causas de morte:', error)
      setCausasMorte([])
    }
  }

  const adicionarCausaMorte = async () => {
    if (!newCausa.trim()) {
      alert('⚠️ Informe uma causa de morte')
      return
    }

    try {
      const response = await fetch('/api/death-causes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ causa: newCausa.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setCausasMorte(prev => [...prev, data.data])
        setNewCausa('')
        setShowCausaModal(false)
        alert('✅ Causa de morte adicionada com sucesso!')
      } else {
        const errorData = await response.json()
        alert(`❌ Erro: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Erro ao adicionar causa:', error)
      alert('❌ Erro ao adicionar causa de morte')
    }
  }

  const sincronizarComBoletim = async () => {
    if (!confirm('⚠️ Deseja sincronizar todas as mortes registradas com o boletim contábil?')) {
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/deaths/sync-boletim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ Sincronização concluída! ${data.sincronizadas} morte(s) registrada(s) no boletim contábil.`)
        loadMortes() // Recarregar a lista
      } else {
        const errorData = await response.json()
        alert(`❌ Erro na sincronização: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Erro na sincronização:', error)
      alert('❌ Erro ao sincronizar com o boletim contábil')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)

        if (data.length === 0) {
          alert('O arquivo está vazio')
          return
        }

        // Processar e normalizar dados
        const processedData = data.map((row, index) => {
          // Tentar identificar colunas com várias possibilidades (case insensitive)
          const getCol = (possibleNames) => {
            for (const name of possibleNames) {
              if (row[name] !== undefined) return row[name]
            }
            return ''
          }

          const serie = getCol(['Série', 'Serie', 'serie', 'SERIE', 'SERE', 'Sere'])
          const rg = getCol(['RG', 'Rg', 'rg', 'animal_rg'])
          const animalId = getCol(['ID', 'id', 'Animal ID', 'animal_id'])
          
          // Data
          let dataMorte = getCol(['Data', 'Data Morte', 'data_morte', 'DATA', 'DATA MORTE'])
          if (dataMorte && typeof dataMorte === 'number') {
            // Converter data do Excel (número serial para data JS)
            const date = new Date(Math.round((dataMorte - 25569) * 86400 * 1000))
            // Ajustar fuso horário para pegar a data correta
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
            dataMorte = date.toISOString().split('T')[0]
          } else if (dataMorte && typeof dataMorte === 'string') {
             // Tentar converter formato PT-BR (DD/MM/YYYY) para ISO
             if (dataMorte.includes('/')) {
               const parts = dataMorte.split('/')
               if (parts.length === 3) {
                 dataMorte = `${parts[2]}-${parts[1]}-${parts[0]}`
               }
             }
          }

          const causaMorte = getCol(['Causa', 'Causa Morte', 'causa_morte', 'CAUSA', 'CAUSA MORTE'])
          const observacoes = getCol(['Observações', 'Observacoes', 'observacoes', 'OBSERVACOES', 'OBSERVAÇÕES'])
          const valorPerda = getCol(['Valor', 'Valor Perda', 'valor_perda', 'VALOR', 'VALOR PERDA'])

          return {
            tempId: index,
            serie: serie ? String(serie).trim() : '',
            rg: rg ? String(rg).trim() : '',
            animalId,
            dataMorte,
            causaMorte,
            observacoes,
            valorPerda,
            isValid: ((serie && rg) || animalId) && dataMorte && causaMorte ? true : false
          }
        })

        setImportData(processedData)
        setImportStep('preview')
      } catch (error) {
        console.error('Erro ao ler arquivo:', error)
        alert('Erro ao processar o arquivo. Verifique o formato.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const processImport = async () => {
    const deathsToImport = importData.filter(d => d.isValid).map(d => ({
      serie: d.serie,
      rg: d.rg,
      animalId: d.animalId,
      dataMorte: d.dataMorte,
      causaMorte: d.causaMorte,
      observacoes: d.observacoes,
      valorPerda: d.valorPerda
    }))

    if (deathsToImport.length === 0) {
      alert('Nenhum registro válido para importar')
      return
    }

    setImportandoMortes(true)
    setImportProgressMortes({ atual: 0, total: deathsToImport.length, etapa: 'Importando óbitos...' })
    setLoading(true)
    try {
      const response = await fetch('/api/deaths/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deaths: deathsToImport })
      })

      const result = await response.json()

      if (response.ok) {
        setImportProgressMortes(prev => ({ ...prev, atual: deathsToImport.length, etapa: 'Importação concluída!' }))
        setImportSummary(result.data.summary)
        setImportErrors(result.data.errors || [])
        setImportStep('result')
        loadMortes() // Recarregar lista
        loadAnimais()
      } else {
        alert(`Erro na importação: ${result.message}`)
      }
    } catch (error) {
      console.error('Erro na importação:', error)
      alert('Erro interno ao processar importação')
    } finally {
      setLoading(false)
      setImportandoMortes(false)
      setImportProgressMortes({ atual: 0, total: 0, etapa: '' })
    }
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'Série': 'CJCJ',
        'RG': '1234',
        'Data Morte': '2024-01-01',
        'Causa Morte': 'Doença X',
        'Observações': 'Observação opcional',
        'Valor Perda': '1500.00'
      }
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Modelo")
    XLSX.writeFile(wb, "modelo_importacao_obitos.xlsx")
  }

  const handleAnimalChange = (animalId) => {
    const animal = animais.find(a => a.id === parseInt(animalId))
    setAnimalSelecionado(animal)
    setNewMorte(prev => ({
      ...prev,
      animalId: animalId,
      valorPerda: animal ? (animal.custo_total || 0) : ''
    }))
  }

  const toggleAnimalSelecao = (animal) => {
    setAnimaisSelecionados(prev => {
      const jaExiste = prev.find(a => a.id === animal.id)
      if (jaExiste) {
        return prev.filter(a => a.id !== animal.id)
      } else {
        return [...prev, animal]
      }
    })
  }

  const selecionarTodosAnimais = () => {
    const animaisAtivos = (animais || []).filter(animal => animal && animal.situacao === 'Ativo')
    setAnimaisSelecionados(animaisAtivos)
  }

  const limparSelecaoAnimais = () => {
    setAnimaisSelecionados([])
  }

  // Função para buscar animal por número (similar ao BatchOccurrenceForm)
  const buscarAnimalPorNumero = async (numero) => {
    let serie = ''
    let rg = ''
    
    // Tentar separar por hífen primeiro
    if (numero.includes('-')) {
      const partes = numero.split('-').map(s => s.trim())
      if (partes.length >= 2) {
        serie = partes[0].toUpperCase()
        rg = partes.slice(1).join('-').trim()
      }
    } else {
      // Tentar separar por espaço
      const partes = numero.trim().split(/\s+/).filter(Boolean)
      if (partes.length >= 2) {
        serie = partes[0].toUpperCase()
        rg = partes.slice(1).join(' ').trim()
      } else {
        // Tentar extrair série do início (2-5 letras) e o resto é RG
        const match = numero.match(/^([A-Z]{2,5})(\d+.*)$/i)
        if (match) {
          serie = match[1].toUpperCase()
          rg = match[2].trim()
        }
      }
    }

    if (!serie || !rg) {
      return null
    }

    // Tentar múltiplas estratégias de busca
    let animais = []
    
    // Estratégia 1: Busca exata com série e RG
    if (serie && rg) {
      const params1 = new URLSearchParams()
      params1.append('serie', serie)
      params1.append('rg', rg)
      
      try {
        const response1 = await fetch(`/api/animals?${params1.toString()}`)
        if (response1.ok) {
          const data1 = await response1.json()
          animais = data1.data || []
        }
      } catch (err) {
        console.error('Erro na busca exata:', err)
      }
    }
    
    // Estratégia 2: Se não encontrou, tentar só com série e filtrar por RG
    if (animais.length === 0 && serie) {
      const params2 = new URLSearchParams()
      params2.append('serie', serie)
      
      try {
        const response2 = await fetch(`/api/animals?${params2.toString()}`)
        if (response2.ok) {
          const data2 = await response2.json()
          const animaisPorSerie = data2.data || []
          
          if (rg) {
            animais = animaisPorSerie.filter(a => {
              const rgAnimal = a.rg?.toString().trim()
              const rgBuscado = rg.toString().trim()
              const rgAnimalNum = parseInt(rgAnimal)
              const rgBuscadoNum = parseInt(rgBuscado)
              
              return rgAnimal === rgBuscado || 
                     (rgAnimalNum === rgBuscadoNum && !isNaN(rgAnimalNum) && !isNaN(rgBuscadoNum)) ||
                     rgAnimal?.endsWith(rgBuscado) ||
                     rgBuscado?.endsWith(rgAnimal)
            })
          } else {
            animais = animaisPorSerie
          }
        }
      } catch (err) {
        console.error('Erro na busca por série:', err)
      }
    }
    
    // Estratégia 3: Se ainda não encontrou e tem RG, tentar só com RG
    if (animais.length === 0 && rg) {
      const params3 = new URLSearchParams()
      params3.append('rg', rg)
      
      try {
        const response3 = await fetch(`/api/animals?${params3.toString()}`)
        if (response3.ok) {
          const data3 = await response3.json()
          const animaisPorRG = data3.data || []
          
          if (serie) {
            animais = animaisPorRG.filter(a => 
              a.serie?.toUpperCase().trim() === serie.toUpperCase().trim()
            )
          } else {
            animais = animaisPorRG
          }
        }
      } catch (err) {
        console.error('Erro na busca por RG:', err)
      }
    }
    
    // Retornar o primeiro animal encontrado
    if (animais.length > 0) {
      return animais[0]
    }
    
    return null
  }

  const adicionarPorNumero = async () => {
    if (!numeroAnimal.trim()) return

    // Separar por vírgula, quebra de linha, ponto e vírgula ou múltiplos espaços
    const numeros = numeroAnimal
      .split(/[,\n;]+|\s{2,}/)
      .map(n => n.trim())
      .filter(n => n && n.length > 0)
    
    if (numeros.length === 0) {
      alert('⚠️ Digite pelo menos um número de animal')
      return
    }

    setLoadingAnimais(true)
    const novosAnimais = []
    const idsExistentes = new Set(animaisSelecionados.map(a => a.id))
    const naoEncontrados = []

    for (const numero of numeros) {
      try {
        const animal = await buscarAnimalPorNumero(numero)
        
        if (animal && animal.situacao === 'Ativo') {
          if (!idsExistentes.has(animal.id) && !novosAnimais.find(a => a.id === animal.id)) {
            novosAnimais.push(animal)
            idsExistentes.add(animal.id)
          }
        } else {
          naoEncontrados.push(numero)
        }
      } catch (err) {
        console.error('Erro ao buscar animal:', numero, err)
        naoEncontrados.push(numero)
      }
    }

    // Adicionar todos os novos animais de uma vez
    if (novosAnimais.length > 0) {
      setAnimaisSelecionados(prev => {
        const idsAtuais = new Set(prev.map(a => a.id))
        const semDuplicatas = novosAnimais.filter(a => !idsAtuais.has(a.id))
        return [...prev, ...semDuplicatas]
      })
    }

    setLoadingAnimais(false)
    setNumeroAnimal('')

    if (naoEncontrados.length > 0) {
      alert(`⚠️ Não encontrados: ${naoEncontrados.join(', ')}`)
    } else if (novosAnimais.length > 0) {
      alert(`✅ ${novosAnimais.length} animal(is) adicionado(s) com sucesso!`)
    }
  }

  const adicionarNovaCausaInline = async () => {
    if (!novaCausaInput.trim()) {
      alert('⚠️ Informe uma causa de morte')
      return
    }

    try {
      const response = await fetch('/api/death-causes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ causa: novaCausaInput.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setCausasMorte(prev => [...prev, data.data])
        setNewMorte(prev => ({ ...prev, causaMorte: data.data.causa }))
        setNovaCausaInput('')
        setMostrarInputNovaCausa(false)
        alert('✅ Causa de morte adicionada com sucesso!')
      } else {
        const errorData = await response.json()
        alert(`❌ Erro: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Erro ao adicionar causa:', error)
      alert('❌ Erro ao adicionar causa de morte')
    }
  }

  const registrarMorte = async () => {
    if (modoSelecaoMultipla) {
      return registrarMortesMultiplas()
    }

    if (!newMorte.animalId || !newMorte.dataMorte || !newMorte.causaMorte) {
      alert('⚠️ Preencha todos os campos obrigatórios')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/deaths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          animalId: parseInt(newMorte.animalId),
          dataMorte: newMorte.dataMorte,
          causaMorte: newMorte.causaMorte,
          observacoes: newMorte.observacoes,
          valorPerda: parseFloat(newMorte.valorPerda) || 0
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert('✅ Morte registrada com sucesso!')
        setNewMorte({
          animalId: '',
          dataMorte: '',
          causaMorte: '',
          observacoes: '',
          valorPerda: ''
        })
        setAnimalSelecionado(null)
        setShowAddModal(false)
        loadMortes()
        loadAnimais() // Recarregar animais para atualizar situação
      } else {
        const errorData = await response.json()
        alert(`❌ Erro: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Erro ao registrar morte:', error)
      alert('❌ Erro ao registrar morte')
    } finally {
      setLoading(false)
    }
  }

  const registrarMortesMultiplas = async () => {
    if (animaisSelecionados.length === 0 || !newMorte.dataMorte || !newMorte.causaMorte) {
      alert('⚠️ Selecione pelo menos um animal e preencha todos os campos obrigatórios')
      return
    }

    if (!confirm(`⚠️ Confirma o registro de morte para ${animaisSelecionados.length} animais?`)) {
      return
    }

    try {
      setLoading(true)
      let sucessos = 0
      let erros = 0
      const resultados = []

      for (const animal of animaisSelecionados) {
        try {
          const response = await fetch('/api/deaths', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              animalId: animal.id,
              dataMorte: newMorte.dataMorte,
              causaMorte: newMorte.causaMorte,
              observacoes: newMorte.observacoes,
              valorPerda: animal.custo_total || 0
            }),
          })

          if (response.ok) {
            sucessos++
            resultados.push({ animal: `${animal.serie} ${animal.rg}`, status: 'sucesso' })
          } else {
            erros++
            const errorData = await response.json()
            resultados.push({ animal: `${animal.serie} ${animal.rg}`, status: 'erro', erro: errorData.message })
          }
        } catch (error) {
          erros++
          resultados.push({ animal: `${animal.serie} ${animal.rg}`, status: 'erro', erro: error.message })
        }
      }

      // Mostrar resultado
      let mensagem = `✅ Processamento concluído:\n`
      mensagem += `• ${sucessos} mortes registradas com sucesso\n`
      if (erros > 0) {
        mensagem += `• ${erros} erros encontrados\n\n`
        mensagem += `Detalhes dos erros:\n`
        resultados.filter(r => r.status === 'erro').forEach(r => {
          mensagem += `- ${r.animal}: ${r.erro}\n`
        })
      }

      alert(mensagem)

      // Limpar formulário
      setNewMorte({
        animalId: '',
        dataMorte: '',
        causaMorte: '',
        observacoes: '',
        valorPerda: ''
      })
      setAnimaisSelecionados([])
      setModoSelecaoMultipla(false)
      setShowAddModal(false)
      loadMortes()
      loadAnimais()

    } catch (error) {
      console.error('Erro ao registrar mortes múltiplas:', error)
      alert('❌ Erro ao registrar mortes múltiplas')
    } finally {
      setLoading(false)
    }
  }

  const editarMorte = (morte) => {
    setEditingMorte(morte)
    setNewMorte({
      animalId: morte.animal_id?.toString() || '',
      dataMorte: morte.data_morte ? morte.data_morte.split('T')[0] : '',
      causaMorte: morte.causa_morte || '',
      observacoes: morte.observacoes || '',
      valorPerda: morte.valor_perda?.toString() || ''
    })
    setShowEditModal(true)
  }

  const salvarEdicaoMorte = async () => {
    if (!newMorte.dataMorte || !newMorte.causaMorte) {
      alert('⚠️ Preencha todos os campos obrigatórios')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/deaths/${editingMorte.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataMorte: newMorte.dataMorte,
          causaMorte: newMorte.causaMorte,
          observacoes: newMorte.observacoes,
          valorPerda: parseFloat(newMorte.valorPerda) || 0
        }),
      })

      if (response.ok) {
        alert('✅ Registro de morte atualizado com sucesso!')
        setNewMorte({
          animalId: '',
          dataMorte: '',
          causaMorte: '',
          observacoes: '',
          valorPerda: ''
        })
        setEditingMorte(null)
        setShowEditModal(false)
        loadMortes()
      } else {
        const errorData = await response.json()
        alert(`❌ Erro: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Erro ao atualizar morte:', error)
      alert('❌ Erro ao atualizar registro de morte')
    } finally {
      setLoading(false)
    }
  }

  const confirmarExclusao = (morte) => {
    setDeletingMorte(morte)
    setShowDeleteModal(true)
  }

  const excluirMorte = async () => {
    if (!deletingMorte) return

    try {
      setLoading(true)
      const response = await fetch(`/api/deaths/${deletingMorte.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('✅ Registro de morte excluído com sucesso!')
        setDeletingMorte(null)
        setShowDeleteModal(false)
        loadMortes()
        loadAnimais() // Recarregar animais para restaurar situação se necessário
      } else {
        const errorData = await response.json()
        alert(`❌ Erro: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Erro ao excluir morte:', error)
      alert('❌ Erro ao excluir registro de morte')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleExportExcel = () => {
    if (mortes.length === 0) {
      alert('⚠️ Não há dados para exportar')
      return
    }

    // 1. Aba Detalhada
    const detalhadoData = mortes.map(m => ({
      'Animal': `${m.serie} ${m.rg}`,
      'Sexo': m.sexo,
      'Raça': m.raca,
      'Data Morte': formatDate(m.data_morte),
      'Causa': m.causa_morte,
      'Valor Perda': m.valor_perda,
      'Observações': m.observacoes
    }))

    const wsDetalhado = XLSX.utils.json_to_sheet(detalhadoData)

    // 2. Aba Resumo
    // Agrupar por Causa
    const causasCount = {}
    mortes.forEach(m => {
      const causa = m.causa_morte || 'Não informada'
      causasCount[causa] = (causasCount[causa] || 0) + 1
    })

    const resumoCausas = Object.entries(causasCount)
      .map(([causa, qtd]) => ({
        'Causa': causa,
        'Quantidade': qtd,
        '% do Total': ((qtd / mortes.length) * 100).toFixed(2) + '%'
      }))
      .sort((a, b) => b.Quantidade - a.Quantidade)

    // Agrupar por Mês/Ano
    const periodoCount = {}
    mortes.forEach(m => {
      if (m.data_morte) {
        const date = new Date(m.data_morte)
        const mesAno = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
        periodoCount[mesAno] = (periodoCount[mesAno] || 0) + 1
      }
    })

    const resumoPeriodo = Object.entries(periodoCount)
      .map(([periodo, qtd]) => ({
        'Período': periodo,
        'Quantidade': qtd
      }))
      .sort((a, b) => {
        const [mesA, anoA] = a['Período'].split('/')
        const [mesB, anoB] = b['Período'].split('/')
        return new Date(anoB, mesB - 1) - new Date(anoA, mesA - 1)
      })

    // Criar planilha de resumo com múltiplas tabelas
    const wb = XLSX.utils.book_new()
    
    // Adicionar Detalhado
    XLSX.utils.book_append_sheet(wb, wsDetalhado, "Detalhado")

    // Adicionar Resumo (manualmente construindo para ter duas tabelas)
    const wsResumo = XLSX.utils.json_to_sheet([{ 'RESUMO POR CAUSA': '' }])
    XLSX.utils.sheet_add_json(wsResumo, resumoCausas, { origin: 'A2' })
    
    XLSX.utils.sheet_add_json(wsResumo, [{ 'RESUMO POR PERÍODO': '' }], { origin: 'E1' })
    XLSX.utils.sheet_add_json(wsResumo, resumoPeriodo, { origin: 'E2' })

    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo e Estatísticas")

    // Salvar
    XLSX.writeFile(wb, "Relatorio_Obitos_Completo.xlsx")
  }

  // Filtrar mortes pela busca
  const mortesFiltradas = (mortes || []).filter(morte => {
    if (!searchTerm) return true
    const termo = searchTerm.toLowerCase()
    return (
      morte.serie?.toLowerCase().includes(termo) ||
      morte.rg?.toLowerCase().includes(termo) ||
      morte.causa_morte?.toLowerCase().includes(termo) ||
      morte.observacoes?.toLowerCase().includes(termo)
    )
  })

  return (
    <div className="space-y-6">
      <ImportProgressOverlay importando={importandoMortes} progress={importProgressMortes} />
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <ExclamationTriangleIcon className="h-7 w-7 text-red-600 mr-2" />
              Óbitos (Mortes)
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Registre óbitos do rebanho com seleção de animais e causas específicas
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowCausaModal(true)}
            >
              Gerenciar Causas
            </Button>
            <Button
              variant="secondary"
              onClick={sincronizarComBoletim}
              disabled={loading}
            >
              Sincronizar Boletim
            </Button>
            <Button
              variant="secondary"
              onClick={handleExportExcel}
              disabled={loading}
            >
              Exportar Excel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setImportStep('upload')
                setImportData([])
                setImportSummary(null)
                setShowImportModal(true)
              }}
              disabled={loading}
            >
              Importar
            </Button>
            <Button
              variant="secondary"
              leftIcon={<UserGroupIcon className="h-4 w-4" />}
              onClick={() => {
                setModoSelecaoMultipla(true)
                setShowAddModal(true)
              }}
              disabled={loading}
            >
              Múltiplos Óbitos
            </Button>
            <Button
              variant="primary"
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => {
                setModoSelecaoMultipla(false)
                setShowAddModal(true)
              }}
              disabled={loading}
            >
              Registrar Óbito
            </Button>
          </div>
      </div>
      </div>

      {/* Busca */}
      <Card>
        <CardBody>
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por série, RG, causa ou observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
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
        </CardBody>
      </Card>

      {/* Lista de Mortes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Registros de Óbito ({mortesFiltradas.length})
          </h3>
            {loading && (
              <div className="text-sm text-gray-500">Carregando...</div>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {mortesFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'Nenhum óbito encontrado para a busca' : 'Nenhum óbito registrado'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Animal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Causa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor Perda</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Observações</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {mortesFiltradas.map((morte) => (
                    <tr key={morte.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium">{morte.serie} {morte.rg}</div>
                          <div className="text-gray-500 text-xs">{morte.sexo} - {morte.raca}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {formatDate(morte.data_morte)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          {morte.causa_morte}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {formatCurrency(morte.valor_perda)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {morte.observacoes || '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => editarMorte(morte)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                            title="Editar registro"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => confirmarExclusao(morte)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                            title="Excluir registro"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Registro de Óbito */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setModoSelecaoMultipla(false)
          setAnimaisSelecionados([])
          setNewMorte({
            animalId: '',
            dataMorte: '',
            causaMorte: '',
            observacoes: '',
            valorPerda: ''
          })
        }}
        title={modoSelecaoMultipla ? "Registrar Múltiplos Óbitos" : "Registrar Óbito"}
        size="xl"
      >
        <div className="space-y-4">
          {/* Toggle para modo de seleção múltipla */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Registrar múltiplos óbitos
            </span>
            <button
              type="button"
              onClick={() => {
                setModoSelecaoMultipla(!modoSelecaoMultipla)
                setAnimaisSelecionados([])
                setNewMorte(prev => ({ ...prev, animalId: '' }))
                setAnimalSelecionado(null)
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                modoSelecaoMultipla ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  modoSelecaoMultipla ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Seleção de Animal(is) */}
          {!modoSelecaoMultipla ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Animal *
              </label>
              <select
                value={newMorte.animalId}
                onChange={(e) => handleAnimalChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Selecione um animal</option>
                {(animais || []).filter(animal => animal && animal.situacao === 'Ativo').map(animal => (
                  <option key={animal.id} value={animal.id}>
                    {animal.serie} {animal.rg} - {animal.sexo} ({animal.raca})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Campo para digitar números de animais */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adicionar Animais por Número (Série-RG)
                </label>
                <div className="space-y-2">
                  <textarea
                    value={numeroAnimal}
                    onChange={(e) => setNumeroAnimal(e.target.value)}
                    placeholder="Digite os números dos animais, um por linha ou separados por vírgula:&#10;CJCJ-16942&#10;CJCJ-16926&#10;CJCJ-16970&#10;&#10;Ou: CJCJ-16942, CJCJ-16926, CJCJ-16970"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={adicionarPorNumero}
                    disabled={loadingAnimais || !numeroAnimal.trim()}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingAnimais ? 'Buscando...' : (() => {
                      const count = numeroAnimal.split(/[,\n;]+|\s{2,}/).filter(n => n.trim()).length
                      return count > 0 ? `Adicionar ${count} Animal(is)` : 'Adicionar'
                    })()}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 Você pode colar uma lista de números (um por linha) ou separados por vírgula
                  </p>
                </div>
              </div>

              {/* Seção de Animais Selecionados - DESTACADA */}
              {animaisSelecionados.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                        {animaisSelecionados.length}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Animais Selecionados
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={limparSelecaoAnimais}
                      className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900 dark:text-red-300 font-medium"
                    >
                      Limpar Todos
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {animaisSelecionados.map((animal, index) => {
                      // Calcular idade se tiver data de nascimento
                      let idadeTexto = 'Não informado'
                      if (animal.data_nascimento || animal.dataNascimento) {
                        const dataNasc = new Date(animal.data_nascimento || animal.dataNascimento)
                        const hoje = new Date()
                        const meses = (hoje.getFullYear() - dataNasc.getFullYear()) * 12 + (hoje.getMonth() - dataNasc.getMonth())
                        if (meses < 12) {
                          idadeTexto = `${meses} mês(es)`
                        } else {
                          const anos = Math.floor(meses / 12)
                          const mesesRestantes = meses % 12
                          idadeTexto = mesesRestantes > 0 ? `${anos} ano(s) e ${mesesRestantes} mês(es)` : `${anos} ano(s)`
                        }
                      }
                      
                      return (
                        <div
                          key={animal.id}
                          className="bg-white dark:bg-gray-800 border-2 border-green-400 dark:border-green-600 rounded-lg p-4 shadow-md hover:shadow-lg transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <span className="text-sm font-bold text-white bg-green-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                                    {animal.serie}-{animal.rg}
                                  </span>
                                  {animal.nome && (
                                    <span className="text-sm text-gray-600 dark:text-gray-400 italic">
                                      ({animal.nome})
                                    </span>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Sexo:</span>
                                    <span className="ml-1 font-medium text-gray-900 dark:text-white">{animal.sexo || 'Não informado'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Raça:</span>
                                    <span className="ml-1 font-medium text-gray-900 dark:text-white">{animal.raca || 'Não informado'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Idade:</span>
                                    <span className="ml-1 font-medium text-gray-900 dark:text-white">{idadeTexto}</span>
                                  </div>
                                  {(animal.data_nascimento || animal.dataNascimento) && (
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">Nascimento:</span>
                                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                        {new Date(animal.data_nascimento || animal.dataNascimento).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Valor da Perda:</span>
                                    <span className="text-lg font-bold text-green-700 dark:text-green-400">
                                      R$ {parseFloat(animal.custo_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleAnimalSelecao(animal)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded p-2 transition-colors flex-shrink-0 ml-2"
                              title="Remover da seleção"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Valor Total das Perdas:
                      </span>
                      <span className="text-lg font-bold text-green-700 dark:text-green-400">
                        R$ {
                          animaisSelecionados.reduce((total, animal) => total + (parseFloat(animal.custo_total) || 0), 0)
                            .toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Seção de Seleção de Animais */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {animaisSelecionados.length > 0 ? 'Adicionar Mais Animais' : 'Selecionar Animais da Lista'}
                  </label>
                  <button
                    type="button"
                    onClick={selecionarTodosAnimais}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
                  >
                    Selecionar Todos
                  </button>
                </div>
                
                <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800/50">
                  {(animais || []).filter(animal => animal && animal.situacao === 'Ativo').map(animal => {
                    const estaSelecionado = animaisSelecionados.find(a => a.id === animal.id)
                    return (
                      <div
                        key={animal.id}
                        className={`flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                          estaSelecionado ? 'bg-blue-100 dark:bg-blue-900/30 opacity-60' : ''
                        }`}
                        onClick={() => toggleAnimalSelecao(animal)}
                      >
                        <input
                          type="checkbox"
                          checked={!!estaSelecionado}
                          onChange={() => toggleAnimalSelecao(animal)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {animal.serie} {animal.rg}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {animal.sexo} - {animal.raca} - R$ {parseFloat(animal.custo_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        {estaSelecionado && (
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                            ✓
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
              label="Data do Óbito *"
            type="date"
              value={newMorte.dataMorte}
              onChange={(e) => setNewMorte(prev => ({ ...prev, dataMorte: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Causa da Morte *
              </label>
              {!mostrarInputNovaCausa ? (
                <div className="flex space-x-2">
                  <select
                    value={newMorte.causaMorte}
                    onChange={(e) => {
                      if (e.target.value === '__nova__') {
                        setMostrarInputNovaCausa(true)
                      } else {
                        setNewMorte(prev => ({ ...prev, causaMorte: e.target.value }))
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione uma causa</option>
                    {(causasMorte || []).map(causa => (
                      <option key={causa.id} value={causa.causa}>
                        {causa.causa}
                      </option>
                    ))}
                    <option value="__nova__" className="font-bold text-blue-600">
                      + Adicionar Nova Causa
                    </option>
                  </select>
                  <Button
                    variant="secondary"
                    onClick={() => setShowCausaModal(true)}
                    className="px-3"
                    title="Gerenciar causas"
                  >
                    ⚙️
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      value={novaCausaInput}
                      onChange={(e) => setNovaCausaInput(e.target.value)}
                      placeholder="Digite a nova causa de morte..."
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          adicionarNovaCausaInline()
                        }
                      }}
                    />
                    <Button
                      variant="primary"
                      onClick={adicionarNovaCausaInline}
                      disabled={!novaCausaInput.trim()}
                      className="px-4"
                    >
                      Adicionar
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setMostrarInputNovaCausa(false)
                        setNovaCausaInput('')
                      }}
                      className="px-3"
                    >
                      Cancelar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 A causa será salva automaticamente no banco de dados
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor da Perda (R$)
            </label>
            <div className="relative">
              <input
                type="text"
                value={animalSelecionado ? `R$ ${parseFloat(animalSelecionado.custo_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold text-lg"
              />
              {animalSelecionado && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-medium">Custo Total do Animal:</span> R$ {parseFloat(animalSelecionado.custo_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Este valor será usado automaticamente como perda
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
            value={newMorte.observacoes}
            onChange={(e) => setNewMorte(prev => ({ ...prev, observacoes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows="3"
              placeholder="Detalhes sobre a morte, sintomas, tratamento aplicado, etc."
          />
          </div>

          {/* Botões de Ação - Sempre visíveis no final */}
          <div className="bg-white dark:bg-gray-800 pt-4 mt-6 border-t-2 border-gray-200 dark:border-gray-700 -mx-6 -mb-6 px-6 pb-6">
            <div className="flex space-x-3">
              <Button 
                variant="primary" 
                className="flex-1 py-3 text-lg font-semibold" 
                onClick={registrarMorte}
                disabled={loading || (modoSelecaoMultipla && animaisSelecionados.length === 0) || (!modoSelecaoMultipla && !newMorte.animalId) || !newMorte.dataMorte || !newMorte.causaMorte}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Registrando...
                  </span>
                ) : (
                  modoSelecaoMultipla ? (
                    <span className="flex items-center justify-center gap-2">
                      💾 Registrar {animaisSelecionados.length} Óbito{animaisSelecionados.length !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      💾 Registrar Óbito
                    </span>
                  )
                )}
              </Button>
              <Button 
                variant="secondary" 
                className="px-6 py-3 text-lg" 
                onClick={() => {
                  setShowAddModal(false)
                  setModoSelecaoMultipla(false)
                  setAnimaisSelecionados([])
                  setNumeroAnimal('')
                  setNovaCausaInput('')
                  setMostrarInputNovaCausa(false)
                  setNewMorte({
                    animalId: '',
                    dataMorte: '',
                    causaMorte: '',
                    observacoes: '',
                    valorPerda: ''
                  })
                }}
              >
                Cancelar
              </Button>
            </div>
            {(modoSelecaoMultipla && animaisSelecionados.length === 0) && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
                ⚠️ Selecione pelo menos um animal
              </p>
            )}
            {(!newMorte.dataMorte || !newMorte.causaMorte) && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
                ⚠️ Preencha a data e a causa da morte
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de Gerenciar Causas */}
      <Modal
        isOpen={showCausaModal}
        onClose={() => setShowCausaModal(false)}
        title="Gerenciar Causas de Morte"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adicionar Nova Causa
            </label>
            <div className="flex space-x-2">
              <Input
                value={newCausa}
                onChange={(e) => setNewCausa(e.target.value)}
                placeholder="Ex: Doença, Acidente, Parto..."
                className="flex-1"
              />
              <Button
                variant="primary"
                onClick={adicionarCausaMorte}
                disabled={!newCausa.trim()}
              >
                Adicionar
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Causas Existentes ({causasMorte.length})
            </label>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {(causasMorte || []).map(causa => (
                <div key={causa.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm text-gray-900 dark:text-white">{causa.causa}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(causa.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowCausaModal(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Edição de Óbito */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingMorte(null)
          setNovaCausaInput('')
          setMostrarInputNovaCausa(false)
          setNewMorte({
            animalId: '',
            dataMorte: '',
            causaMorte: '',
            observacoes: '',
            valorPerda: ''
          })
        }}
        title="Editar Registro de Óbito"
        size="lg"
      >
        <div className="space-y-4">
          {editingMorte && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <span className="font-medium">Animal:</span> {editingMorte.serie} {editingMorte.rg} - {editingMorte.sexo} ({editingMorte.raca})
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data do Óbito *"
              type="date"
              value={newMorte.dataMorte}
              onChange={(e) => setNewMorte(prev => ({ ...prev, dataMorte: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Causa da Morte *
              </label>
              <select
                value={newMorte.causaMorte}
                onChange={(e) => {
                  if (e.target.value === '__nova__') {
                    setMostrarInputNovaCausa(true)
                  } else {
                    setNewMorte(prev => ({ ...prev, causaMorte: e.target.value }))
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Selecione uma causa</option>
                {(causasMorte || []).map(causa => (
                  <option key={causa.id} value={causa.causa}>
                    {causa.causa}
                  </option>
                ))}
                <option value="__nova__" className="font-bold text-blue-600">
                  + Adicionar Nova Causa
                </option>
              </select>
              {mostrarInputNovaCausa && (
                <div className="mt-2 space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      value={novaCausaInput}
                      onChange={(e) => setNovaCausaInput(e.target.value)}
                      placeholder="Digite a nova causa de morte..."
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          adicionarNovaCausaInline()
                        }
                      }}
                    />
                    <Button
                      variant="primary"
                      onClick={adicionarNovaCausaInline}
                      disabled={!novaCausaInput.trim()}
                      className="px-4"
                    >
                      Adicionar
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setMostrarInputNovaCausa(false)
                        setNovaCausaInput('')
                      }}
                      className="px-3"
                    >
                      Cancelar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 A causa será salva automaticamente no banco de dados
                  </p>
                </div>
              )}
            </div>
          </div>

          <Input
            label="Valor da Perda (R$)"
            type="number"
            step="0.01"
            value={newMorte.valorPerda}
            onChange={(e) => setNewMorte(prev => ({ ...prev, valorPerda: e.target.value }))}
            placeholder="0.00"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={newMorte.observacoes}
              onChange={(e) => setNewMorte(prev => ({ ...prev, observacoes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows="3"
              placeholder="Detalhes sobre a morte, sintomas, tratamento aplicado, etc."
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <Button 
              variant="primary" 
              className="flex-1" 
              onClick={salvarEdicaoMorte}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1" 
              onClick={() => {
                setShowEditModal(false)
                setEditingMorte(null)
                setNewMorte({
                  animalId: '',
                  dataMorte: '',
                  causaMorte: '',
                  observacoes: '',
                  valorPerda: ''
                })
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletingMorte(null)
        }}
        title="Confirmar Exclusão"
        size="md"
      >
        <div className="space-y-4">
          {deletingMorte && (
            <>
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Excluir Registro de Óbito
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Tem certeza que deseja excluir o registro de óbito do animal:
                </p>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {deletingMorte.serie} {deletingMorte.rg}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {deletingMorte.sexo} - {deletingMorte.raca}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Óbito em: {formatDate(deletingMorte.data_morte)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Causa: {deletingMorte.causa_morte}
                  </p>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-3">
                  ⚠️ Esta ação não pode ser desfeita e o animal voltará ao status "Ativo".
                </p>
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-2">
            <Button 
              variant="danger" 
              className="flex-1" 
              onClick={excluirMorte}
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Sim, Excluir'}
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1" 
              onClick={() => {
                setShowDeleteModal(false)
                setDeletingMorte(null)
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Importação */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false)
          setImportData([])
          setImportStep('upload')
          setImportSummary(null)
        }}
        title="Importar Óbitos em Lote"
        size="xl"
      >
        <div className="space-y-6">
          {importStep === 'upload' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Instruções</h4>
                <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>O arquivo deve ser Excel (.xlsx ou .xls)</li>
                  <li>Deve conter as colunas: <strong>Série, RG, Data Morte, Causa Morte</strong></li>
                  <li>Opcionais: Observações, Valor Perda</li>
                  <li>Use o modelo abaixo para garantir a formatação correta</li>
                </ul>
              </div>

              <div className="flex justify-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Clique para selecionar ou arraste o arquivo aqui
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={downloadTemplate}>
                  📥 Baixar Modelo
                </Button>
                <Button variant="secondary" onClick={() => setShowImportModal(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {importStep === 'preview' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Pré-visualização ({importData.length} registros)
                </h4>
                <div className="text-sm">
                  <span className="text-green-600 font-medium mr-3">
                    ✅ {importData.filter(d => d.isValid).length} Válidos
                  </span>
                  <span className="text-red-600 font-medium">
                    ❌ {importData.filter(d => !d.isValid).length} Inválidos
                  </span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Animal</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Causa</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {importData.map((row, idx) => (
                      <tr key={idx} className={!row.isValid ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {row.isValid ? (
                            <span className="text-green-600">✅</span>
                          ) : (
                            <span className="text-red-600" title="Dados incompletos">⚠️</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {row.serie} {row.rg} {row.animalId ? `(ID: ${row.animalId})` : ''}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {row.dataMorte}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {row.causaMorte}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setImportStep('upload')
                    setImportData([])
                  }}
                >
                  Voltar
                </Button>
                <Button
                  variant="primary"
                  onClick={processImport}
                  disabled={loading || importData.filter(d => d.isValid).length === 0}
                >
                  {loading ? 'Processando...' : `Importar ${importData.filter(d => d.isValid).length} Registros`}
                </Button>
              </div>
            </div>
          )}

          {importStep === 'result' && importSummary && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {importSummary.total}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Total Processado</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {importSummary.successful}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Sucessos</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {importSummary.failed}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">Falhas</div>
                </div>
              </div>

              {importErrors.length > 0 && (
                <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
                  <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2 border-b border-red-200 dark:border-red-800">
                    <h4 className="font-semibold text-red-800 dark:text-red-300">Erros Encontrados</h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-4 bg-white dark:bg-gray-800 space-y-2">
                    {importErrors.map((err, idx) => (
                      <div key={idx} className="text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {err.data.serie} {err.data.rg}:
                        </span>{' '}
                        <span className="text-red-600 dark:text-red-400">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowImportModal(false)
                    setImportStep('upload')
                    setImportData([])
                    setImportSummary(null)
                  }}
                >
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}