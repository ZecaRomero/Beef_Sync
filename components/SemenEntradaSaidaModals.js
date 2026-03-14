import React, { useState, useEffect, useRef } from 'react'

// DestinoSelector extraído para fora do modal - evita recriação a cada digitação (input travando)
function DestinoSelector({ value, onChange, destinos, setDestinos, error }) {
  const [busca, setBusca] = useState(value || '')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [mostrarCriar, setMostrarCriar] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)
  const isInteractingRef = useRef(false)

  useEffect(() => {
    setBusca(value || '')
  }, [value])

  const destinosFiltrados = (destinos || []).filter(d =>
    (d.nome || '').toLowerCase().includes((busca || '').toLowerCase())
  )

  const handleSelect = (destino) => {
    onChange(destino)
    setBusca(destino)
    setMostrarDropdown(false)
  }

  const handleCreate = async () => {
    if (!novoNome.trim()) {
      alert('⚠️ Digite o nome do destino')
      return
    }
    try {
      const response = await fetch('/api/semen/destinos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome.trim() })
      })
      if (response.ok) {
        const result = await response.json()
        setDestinos(prev => [...(prev || []), result.data].sort((a, b) => (a.nome || '').localeCompare(b.nome || '')))
        onChange(result.data.nome)
        setNovoNome('')
        setMostrarCriar(false)
        setMostrarDropdown(false)
        alert(`✅ Destino "${result.data.nome}" criado!`)
      } else {
        const errorData = await response.json()
        alert(`❌ Erro: ${errorData.message || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao criar destino:', error)
      alert('❌ Erro ao criar destino. Tente novamente.')
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={busca}
        onChange={(e) => {
          const v = e.target.value
          setBusca(v)
          onChange(v)
          setMostrarDropdown(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && busca?.trim()) {
            const existe = (destinos || []).some(d => (d.nome || '').toLowerCase() === busca.trim().toLowerCase())
            if (!existe) {
              e.preventDefault()
              setMostrarCriar(true)
              setNovoNome(busca.trim())
            }
          }
        }}
        onFocus={() => setMostrarDropdown(true)}
        onBlur={() => {
          setTimeout(() => {
            if (!isInteractingRef.current) setMostrarDropdown(false)
          }, 200)
        }}
        ref={inputRef}
        placeholder="Digite ou selecione o destino..."
        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
          error ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
        }`}
      />
      {mostrarDropdown && (
        <div
          ref={dropdownRef}
          className="dropdown-destinos absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
          onMouseDown={(e) => { e.preventDefault(); isInteractingRef.current = true }}
          onMouseEnter={() => { isInteractingRef.current = true }}
          onMouseLeave={() => { setTimeout(() => { isInteractingRef.current = false }, 200) }}
        >
          {!mostrarCriar ? (
            <>
              {destinosFiltrados.length > 0 ? (
                destinosFiltrados.map(d => (
                  <div
                    key={d.id}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(d.nome) }}
                    className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{d.nome}</div>
                    {d.observacoes && <div className="text-xs text-gray-500 dark:text-gray-400">{d.observacoes}</div>}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">Nenhum destino encontrado</div>
              )}
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setMostrarCriar(true); setNovoNome(busca || '') }}
                className="w-full text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer border-t border-gray-300 dark:border-gray-600 font-medium text-blue-600 dark:text-blue-400 sticky bottom-0"
              >
                ➕ Criar novo destino {busca && `"${busca}"`}
              </button>
            </>
          ) : (
            <div className="p-3 border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do novo destino:</label>
              <input
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setMostrarCriar(false); setNovoNome('') } }}
                placeholder="Ex: ZEBUEMBRYO, Fazenda ABC..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={handleCreate} disabled={!novoNome.trim()} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded text-sm font-medium">
                  ✓ Criar
                </button>
                <button type="button" onClick={() => { setMostrarCriar(false); setNovoNome('') }} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-medium">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AddEntradaModal({ showModal, setShowModal, handleAddSemen, newSemen, setNewSemen }) {
  const [savedTemplates, setSavedTemplates] = useState([])
  const [useLastData, setUseLastData] = useState(false)
  const [fornecedores, setFornecedores] = useState([])
  const [autocomplete, setAutocomplete] = useState({})

  // Carregar templates salvos, último cadastro, fornecedores e sugestões do banco
  useEffect(() => {
    if (showModal) {
      // Carregar templates salvos
      const templates = JSON.parse(localStorage.getItem('semenTemplates') || '[]')
      setSavedTemplates(templates)

      // Buscar sugestões de autocomplete do estoque (valores já cadastrados)
      const fetchAutocomplete = async () => {
        try {
          const res = await fetch('/api/autocomplete?tabela=estoque_semen&todos=1')
          if (res.ok) {
            const result = await res.json()
            setAutocomplete(result.data || {})
          }
        } catch (e) {
          console.error('Erro ao buscar sugestões:', e)
        }
      }
      fetchAutocomplete()

      // Buscar fornecedores do banco de dados
      const fetchFornecedores = async () => {
        try {
          const response = await fetch('/api/fornecedores?tipo=fornecedor')
          if (response.ok) {
            const result = await response.json()
            setFornecedores(result.data || [])
          } else {
            console.error('Erro ao buscar fornecedores:', response.status, response.statusText)
            setFornecedores([])
          }
        } catch (error) {
          console.error('Erro ao buscar fornecedores:', error)
          setFornecedores([])
        }
      }

      fetchFornecedores()

      // Carregar dados do último cadastro
      const lastData = JSON.parse(localStorage.getItem('lastSemenEntry') || '{}')
      
      console.log('🔄 Modal de entrada aberto - carregando dados...')
      
      if (useLastData && lastData.fornecedor) {
        // Usar dados do último cadastro, mas limpar campos específicos do touro
        setNewSemen(prev => ({
          ...prev,
          nomeTouro: '',
          rgTouro: '',
          raca: '',
          // Manter dados da entrada anterior
          localizacao: lastData.localizacao || '',
          rackTouro: lastData.rackTouro || '',
          botijao: lastData.botijao || '',
          caneca: lastData.caneca || '',
          fornecedor: lastData.fornecedor || '',
          numeroNF: '',
          valorCompra: lastData.valorCompra || '',
          quantidadeDoses: '',
          observacoes: '',
          certificado: lastData.certificado || '',
          dataValidade: '',
          origem: lastData.origem || '',
          linhagem: '',
          tipoOperacao: 'entrada',
          dataCompra: new Date().toISOString().split('T')[0]
        }))
      } else {
        // Reset completo
        setNewSemen(prev => ({
          ...prev,
          nomeTouro: '',
          rgTouro: '',
          raca: '',
          localizacao: '',
          rackTouro: '',
          botijao: '',
          caneca: '',
          fornecedor: '',
          numeroNF: '',
          valorCompra: '',
          quantidadeDoses: '',
          observacoes: '',
          certificado: '',
          dataValidade: '',
          origem: '',
          linhagem: '',
          tipoOperacao: 'entrada',
          dataCompra: new Date().toISOString().split('T')[0]
        }))
      }
    }
  }, [showModal, useLastData, setNewSemen])

  // Salvar template
  const saveAsTemplate = () => {
    const templateName = prompt('Nome para este template de fornecedor:')
    if (templateName && templateName.trim()) {
      const template = {
        id: Date.now(),
        name: templateName.trim(),
        localizacao: newSemen.localizacao,
        rackTouro: newSemen.rackTouro,
        botijao: newSemen.botijao,
        caneca: newSemen.caneca,
        fornecedor: newSemen.fornecedor,
        valorCompra: newSemen.valorCompra,
        certificado: newSemen.certificado,
        origem: newSemen.origem
      }
      
      const updatedTemplates = [...savedTemplates, template]
      setSavedTemplates(updatedTemplates)
      localStorage.setItem('semenTemplates', JSON.stringify(updatedTemplates))
      alert(`✅ Template "${templateName}" salvo com sucesso!`)
    }
  }

  // Carregar template
  const loadTemplate = (template) => {
    setNewSemen(prev => ({
      ...prev,
      localizacao: template.localizacao || '',
      rackTouro: template.rackTouro || '',
      botijao: template.botijao || '',
      caneca: template.caneca || '',
      fornecedor: template.fornecedor || '',
      valorCompra: template.valorCompra || '',
      certificado: template.certificado || '',
      origem: template.origem || ''
    }))
    alert(`✅ Template "${template.name}" carregado!`)
  }

  // Deletar template
  const deleteTemplate = (templateId) => {
    if (confirm('Deseja excluir este template?')) {
      const updatedTemplates = savedTemplates.filter(t => t.id !== templateId)
      setSavedTemplates(updatedTemplates)
      localStorage.setItem('semenTemplates', JSON.stringify(updatedTemplates))
      alert('✅ Template excluído!')
    }
  }

  // Componente de seleção de fornecedor
  const FornecedorSelector = ({ value, onChange, error }) => {
    const [busca, setBusca] = useState(value || '')
    const [mostrarDropdown, setMostrarDropdown] = useState(false)
    const [mostrarCriar, setMostrarCriar] = useState(false)
    const [novoNome, setNovoNome] = useState('')
    const isUserTypingRef = useRef(false)
    const dropdownRef = useRef(null)
    const inputRef = useRef(null)
    const isInteractingRef = useRef(false)

    // Sincronizar busca com value quando value muda externamente
    useEffect(() => {
      if (!isUserTypingRef.current) {
        setBusca(value || '')
      }
    }, [value])

    const fornecedoresFiltrados = fornecedores.filter(f => 
      f.nome.toLowerCase().includes(busca.toLowerCase())
    )

    const handleSelect = (fornecedorNome) => {
      isUserTypingRef.current = false
      onChange(fornecedorNome)
      setBusca(fornecedorNome)
      setMostrarDropdown(false)
    }

    const handleCreate = async () => {
      if (!novoNome.trim()) {
        alert('⚠️ Digite o nome do fornecedor')
        return
      }

      try {
        const response = await fetch('/api/fornecedores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            nome: novoNome.trim(),
            tipo: 'fornecedor'
          })
        })

        if (response.ok) {
          const result = await response.json()
          // Atualizar a lista de fornecedores
          setFornecedores(prev => [...prev, result.data].sort((a, b) => a.nome.localeCompare(b.nome)))
          onChange(result.data.nome)
          setNovoNome('')
          setMostrarCriar(false)
          setMostrarDropdown(false)
          alert(`✅ Fornecedor "${result.data.nome}" criado!`)
        } else {
          const errorData = await response.json()
          alert(`❌ Erro: ${errorData.message || 'Erro desconhecido'}`)
        }
      } catch (error) {
        console.error('Erro ao criar fornecedor:', error)
        alert('❌ Erro ao criar fornecedor. Tente novamente.')
      }
    }

    return (
      <div className="relative">
        <div className="flex gap-1">
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              const novoValor = e.target.value
              isUserTypingRef.current = true
              setBusca(novoValor)
              onChange(novoValor)
              if (novoValor.length > 0) {
                setMostrarDropdown(true)
              }
              setTimeout(() => {
                isUserTypingRef.current = false
              }, 100)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && busca && busca.trim()) {
                const existeExato = fornecedores.some(f => f.nome.toLowerCase() === busca.trim().toLowerCase())
                if (!existeExato) {
                  e.preventDefault()
                  e.stopPropagation()
                  setMostrarCriar(true)
                  setNovoNome(busca.trim())
                }
              }
            }}
            onFocus={() => {
              setMostrarDropdown(true)
            }}
            onBlur={(e) => {
              if (isInteractingRef.current) {
                return
              }
              
              const relatedTarget = e.relatedTarget || document.activeElement
              const dropdown = dropdownRef.current
              
              if (dropdown && dropdown.contains(relatedTarget)) {
                return
              }
              
              setTimeout(() => {
                if (!isInteractingRef.current) {
                  const activeElement = document.activeElement
                  if (!activeElement || !dropdown?.contains(activeElement)) {
                    setMostrarDropdown(false)
                  }
                }
              }, 300)
            }}
            ref={inputRef}
            placeholder="Digite ou selecione o fornecedor..."
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              error ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
            } ${!value?.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-green-300 focus:border-green-500 focus:ring-green-500'}`}
          />
        </div>
        {mostrarDropdown && (
          <div 
            ref={dropdownRef}
            className="dropdown-fornecedores absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              isInteractingRef.current = true
            }}
            onMouseUp={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onFocus={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onMouseEnter={() => {
              isInteractingRef.current = true
            }}
            onMouseLeave={() => {
              setTimeout(() => {
                isInteractingRef.current = false
              }, 200)
            }}
          >
            {!mostrarCriar ? (
              <>
                {fornecedoresFiltrados.length > 0 ? (
                  fornecedoresFiltrados.map(fornecedor => (
                    <div
                      key={fornecedor.id}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleSelect(fornecedor.nome)
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{fornecedor.nome}</div>
                      {fornecedor.cnpj_cpf && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">CNPJ/CPF: {fornecedor.cnpj_cpf}</div>
                      )}
                      {fornecedor.municipio && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{fornecedor.municipio}{fornecedor.estado ? ` - ${fornecedor.estado}` : ''}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                    Nenhum fornecedor encontrado
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    isInteractingRef.current = true
                    setMostrarCriar(true)
                    setNovoNome(busca || '')
                    setTimeout(() => {
                      isInteractingRef.current = false
                    }, 100)
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    isInteractingRef.current = true
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  className="w-full text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer border-t border-gray-300 dark:border-gray-600 font-medium text-blue-600 dark:text-blue-400 sticky bottom-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  ➕ Criar novo fornecedor {busca && `"${busca}"`}
                </button>
              </>
            ) : (
              <div className="p-3 border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome do novo fornecedor:
                  </label>
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setNovoNome(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.stopPropagation()
                        handleCreate()
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        e.stopPropagation()
                        setMostrarCriar(false)
                        setNovoNome('')
                      }
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    placeholder="Ex: BERRANTE GENETICA, Fazenda ABC..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleCreate()
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    disabled={!novoNome.trim()}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
                  >
                    ✓ Criar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setMostrarCriar(false)
                      setNovoNome('')
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            📥 Entrada de Sêmen no Estoque
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Registre a entrada de material genético no estoque
          </p>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Controles de Template */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ⚡ Agilizar Cadastro
            </h3>
            
            <div className="flex flex-wrap gap-3 mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useLastData}
                  onChange={(e) => setUseLastData(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  🔄 Usar dados do último cadastro
                </span>
              </label>
              
              <button
                onClick={saveAsTemplate}
                className="btn-secondary text-xs"
                disabled={!newSemen.fornecedor}
              >
                💾 Salvar como Template
              </button>
              
              <button
                onClick={() => {
                  setNewSemen(prev => ({
                    ...prev,
                    nomeTouro: '',
                    rgTouro: '',
                    raca: '',
                    localizacao: '',
                    rackTouro: '',
                    botijao: '',
                    caneca: '',
                    fornecedor: '',
                    numeroNF: '',
                    valorCompra: '',
                    quantidadeDoses: '',
                    observacoes: '',
                    certificado: '',
                    dataValidade: '',
                    origem: '',
                    linhagem: ''
                  }))
                }}
                className="btn-secondary text-xs text-red-600"
              >
                🗑️ Limpar Tudo
              </button>
            </div>

            {savedTemplates.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📋 Templates Salvos:
                </p>
                <div className="flex flex-wrap gap-2">
                  {savedTemplates.map(template => (
                    <div key={template.id} className="flex items-center bg-white dark:bg-gray-700 rounded-lg px-3 py-1 border">
                      <button
                        onClick={() => loadTemplate(template)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mr-2"
                      >
                        {template.name}
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Informações do Touro */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🐂 Informações do Touro
            </h3>
            <datalist id="datalist-nome-touro">
              {(autocomplete.nome_touro || []).map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="datalist-rg-touro">
              {(autocomplete.rg_touro || []).map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="datalist-raca">
              {(autocomplete.raca || []).map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Touro *
                </label>
                <input
                  type="text"
                  list="datalist-nome-touro"
                  placeholder="Digite o nome do touro..."
                  value={newSemen.nomeTouro}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, nomeTouro: e.target.value }))}
                  className={`input-field ${!newSemen.nomeTouro?.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-green-300 focus:border-green-500 focus:ring-green-500'}`}
                  required
                />
                {!newSemen.nomeTouro?.trim() && (
                  <p className="text-xs text-red-600 mt-1">⚠️ Campo obrigatório</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RG do Touro
                </label>
                <input
                  type="text"
                  list="datalist-rg-touro"
                  placeholder="Digite aqui..."
                  value={newSemen.rgTouro}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, rgTouro: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Raça
                </label>
                <input
                  type="text"
                  list="datalist-raca"
                  placeholder="Ex: Nelore, Angus..."
                  value={newSemen.raca}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, raca: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Localização Física */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📍 Localização Física
            </h3>
            <datalist id="datalist-localizacao">
              {(autocomplete.localizacao || []).map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="datalist-rack">
              {(autocomplete.rack_touro || []).map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="datalist-botijao">
              {(autocomplete.botijao || []).map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="datalist-caneca">
              {(autocomplete.caneca || []).map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Localização *
                </label>
                <input
                  type="text"
                  list="datalist-localizacao"
                  placeholder="Ex: Tanque A, Sala A, Freezer 1..."
                  value={newSemen.localizacao}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, localizacao: e.target.value }))}
                  className={`input-field ${!newSemen.localizacao?.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-green-300 focus:border-green-500 focus:ring-green-500'}`}
                  required
                />
                {!newSemen.localizacao?.trim() && (
                  <p className="text-xs text-red-600 mt-1">⚠️ Campo obrigatório</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rack do Touro
                </label>
                <input
                  type="text"
                  list="datalist-rack"
                  placeholder="Ex: Rack 5"
                  value={newSemen.rackTouro}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, rackTouro: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Botijão
                </label>
                <input
                  type="text"
                  list="datalist-botijao"
                  placeholder="Ex: Botijão 3"
                  value={newSemen.botijao}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, botijao: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Caneca
                </label>
                <input
                  type="text"
                  list="datalist-caneca"
                  placeholder="Ex: Caneca 12"
                  value={newSemen.caneca}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, caneca: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Dados da Entrada */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📦 Dados da Entrada
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setNewSemen(prev => ({
                      ...prev,
                      localizacao: 'Tanque A',
                      fornecedor: 'Central de Sêmen',
                      valorCompra: '150.00'
                    }))
                  }}
                  className="text-xs btn-secondary"
                >
                  🏢 Central Padrão
                </button>
                <button
                  onClick={() => {
                    setNewSemen(prev => ({
                      ...prev,
                      localizacao: 'Freezer 1',
                      fornecedor: 'Fazenda Parceira',
                      valorCompra: '200.00'
                    }))
                  }}
                  className="text-xs btn-secondary"
                >
                  🚜 Fazenda Parceira
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fornecedor *
                  {useLastData && newSemen.fornecedor && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                      🔄 Reutilizado
                    </span>
                  )}
                </label>
                <FornecedorSelector
                  value={newSemen.fornecedor}
                  onChange={(value) => setNewSemen(prev => ({ ...prev, fornecedor: value }))}
                  error={!newSemen.fornecedor?.trim()}
                />
                {!newSemen.fornecedor?.trim() && (
                  <p className="text-xs text-red-600 mt-1">⚠️ Campo obrigatório</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número da NF
                </label>
                <input
                  type="text"
                  placeholder="Ex: 12345"
                  value={newSemen.numeroNF}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, numeroNF: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data da Compra *
                </label>
                <input
                  type="date"
                  value={newSemen.dataCompra}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, dataCompra: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor da Compra (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={newSemen.valorCompra}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, valorCompra: e.target.value }))}
                  className={`input-field ${!newSemen.valorCompra || parseFloat(newSemen.valorCompra) <= 0 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-green-300 focus:border-green-500 focus:ring-green-500'}`}
                  required
                />
                {(!newSemen.valorCompra || parseFloat(newSemen.valorCompra) <= 0) && (
                  <p className="text-xs text-red-600 mt-1">⚠️ Campo obrigatório - valor deve ser maior que zero</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantidade de Doses *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={newSemen.quantidadeDoses}
                  onChange={(e) => setNewSemen(prev => ({ 
                    ...prev, 
                    quantidadeDoses: e.target.value,
                    dosesDisponiveis: e.target.value 
                  }))}
                  className={`input-field ${!newSemen.quantidadeDoses || parseInt(newSemen.quantidadeDoses) <= 0 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-green-300 focus:border-green-500 focus:ring-green-500'}`}
                  required
                />
                {(!newSemen.quantidadeDoses || parseInt(newSemen.quantidadeDoses) <= 0) && (
                  <p className="text-xs text-red-600 mt-1">⚠️ Campo obrigatório - quantidade deve ser maior que zero</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Validade
                </label>
                <input
                  type="date"
                  value={newSemen.dataValidade}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, dataValidade: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📝 Informações Adicionais
            </h3>
            <datalist id="datalist-certificado">
              {(autocomplete.certificado || []).map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="datalist-origem">
              {(autocomplete.origem || []).map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="datalist-linhagem">
              {(autocomplete.linhagem || []).map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Certificado
                </label>
                <input
                  type="text"
                  list="datalist-certificado"
                  placeholder="Número do certificado"
                  value={newSemen.certificado}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, certificado: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Origem
                </label>
                <input
                  type="text"
                  list="datalist-origem"
                  placeholder="Local de origem"
                  value={newSemen.origem}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, origem: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Linhagem
                </label>
                <input
                  type="text"
                  list="datalist-linhagem"
                  placeholder="Linhagem genética"
                  value={newSemen.linhagem}
                  onChange={(e) => setNewSemen(prev => ({ ...prev, linhagem: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observações
              </label>
              <textarea
                placeholder="Observações adicionais..."
                value={newSemen.observacoes}
                onChange={(e) => setNewSemen(prev => ({ ...prev, observacoes: e.target.value }))}
                className="input-field h-24 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            * Campos obrigatórios
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                // Validação no lado do cliente antes de enviar
                const camposObrigatorios = []
                
                if (!newSemen.nomeTouro || newSemen.nomeTouro.trim() === '') {
                  camposObrigatorios.push('Nome do Touro')
                }
                if (!newSemen.localizacao || newSemen.localizacao.trim() === '') {
                  camposObrigatorios.push('Localização')
                }
                if (!newSemen.quantidadeDoses || parseInt(newSemen.quantidadeDoses) <= 0) {
                  camposObrigatorios.push('Quantidade de Doses')
                }
                if (!newSemen.fornecedor || newSemen.fornecedor.trim() === '') {
                  camposObrigatorios.push('Fornecedor')
                }
                if (!newSemen.valorCompra || parseFloat(newSemen.valorCompra) <= 0) {
                  camposObrigatorios.push('Valor da Compra')
                }
                
                if (camposObrigatorios.length > 0) {
                  alert(`⚠️ Preencha os campos obrigatórios:\n\n• ${camposObrigatorios.join('\n• ')}\n\nVerifique se todos os campos marcados com (*) estão preenchidos corretamente.`)
                  return
                }
                
                // Salvar dados do último cadastro para reutilização
                const lastEntryData = {
                  localizacao: newSemen.localizacao,
                  rackTouro: newSemen.rackTouro,
                  botijao: newSemen.botijao,
                  caneca: newSemen.caneca,
                  fornecedor: newSemen.fornecedor,
                  valorCompra: newSemen.valorCompra,
                  certificado: newSemen.certificado,
                  origem: newSemen.origem,
                  dataUltimoCadastro: new Date().toISOString()
                }
                localStorage.setItem('lastSemenEntry', JSON.stringify(lastEntryData))
                
                console.log('✅ Validação passou - enviando dados:', newSemen)
                console.log('💾 Dados salvos para próximo cadastro:', lastEntryData)
                handleAddSemen()
              }}
              className="btn-primary"
            >
              Adicionar ao Estoque
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const unidadeLabel = (tipo) => tipo === 'embriao' ? 'embriões' : 'doses'

export function AddSaidaModal({ showModal, setShowModal, handleAddSemen, newSemen, setNewSemen, semenStock, tipoMaterial = 'semen' }) {
  const [availableStock, setAvailableStock] = useState([])
  const unidade = unidadeLabel(tipoMaterial)
  const [saidasItems, setSaidasItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [common, setCommon] = useState({ destino: '', dataOperacao: new Date().toISOString().split('T')[0], observacoes: '', numeroNF: '' })
  const [destinos, setDestinos] = useState([])

  useEffect(() => {
    if (showModal) {
      const fetchEntradasDisponiveis = async () => {
        try {
          const tipo = tipoMaterial === 'embriao' ? 'embriao' : tipoMaterial === 'semen' ? 'semen' : '';
          const url = tipo ? `/api/semen/entradas-disponiveis?tipo=${tipo}` : '/api/semen/entradas-disponiveis';
          const response = await fetch(url);
          if (response.ok) {
            const result = await response.json();
            const raw = result.data || [];
            // Filtrar itens com doses <= 0 (evitar negativos ou zerados)
            const filtrado = raw.filter(s => (parseInt(s.doses_disponiveis ?? s.dosesDisponiveis) || 0) > 0);
            setAvailableStock(filtrado);
          } else {
            console.error('Erro ao buscar entradas disponíveis');
            setAvailableStock([]);
          }
        } catch (error) {
          console.error('Erro ao buscar entradas disponíveis:', error);
          setAvailableStock([]);
        }
      };

      const fetchDestinos = async () => {
        try {
          const response = await fetch('/api/semen/destinos?apenas_ativos=true');
          if (response.ok) {
            const result = await response.json();
            setDestinos(result.data || []);
          } else {
            console.error('Erro ao buscar destinos:', response.status, response.statusText);
            // Mesmo com erro, permite digitação livre
            setDestinos([]);
          }
        } catch (error) {
          console.error('Erro ao buscar destinos:', error);
          // Mesmo com erro, permite digitação livre
          setDestinos([]);
        }
      };

      fetchEntradasDisponiveis();
      fetchDestinos();
      // Inicializar com um item vazio
      setSaidasItems([{
        id: Date.now(),
        entradaId: null,
        nomeTouro: '',
        rgTouro: '',
        raca: '',
        maxDoses: 0,
        quantidadeDoses: '',
        destino: '',
        dataOperacao: new Date().toISOString().split('T')[0],
        usarDataComum: true,
        observacoes: '',
        errors: {}
      }]);
    }
  }, [showModal, tipoMaterial])

  const adicionarItem = () => {
    setSaidasItems(prev => [...prev, {
      id: Date.now(),
      entradaId: null,
      nomeTouro: '',
      rgTouro: '',
      raca: '',
      maxDoses: 0,
      quantidadeDoses: '',
      destino: common.destino || '',
      dataOperacao: common.dataOperacao || new Date().toISOString().split('T')[0],
      usarDataComum: true,
      observacoes: common.observacoes || '',
      numeroNF: common.numeroNF || '',
      errors: {}
    }]);
  }

  const duplicarItem = (itemId) => {
    const source = saidasItems.find(i => i.id === itemId)
    if (!source) return
    setSaidasItems(prev => [...prev, {
      ...source,
      id: Date.now()
    }])
  }

  const removerItem = (itemId) => {
    if (saidasItems.length > 1) {
      setSaidasItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      alert('⚠️ É necessário ter pelo menos um item na lista');
    }
  }

  const atualizarItem = (itemId, field, value) => {
    setSaidasItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        
        // Se selecionou um sêmen, atualizar dados do touro
        if (field === 'entradaId') {
          const selectedSemen = availableStock.find(s => s.id === parseInt(value));
          if (selectedSemen) {
            updated.nomeTouro = selectedSemen.nomeTouro || selectedSemen.nome_touro;
            updated.rgTouro = selectedSemen.rgTouro || selectedSemen.rg_touro;
            updated.raca = selectedSemen.raca;
            updated.maxDoses = parseInt(selectedSemen.doses_disponiveis || selectedSemen.dosesDisponiveis || 0);
          }
        }
        
        if (field === 'usarDataComum') {
          const usar = !!value
          updated.usarDataComum = usar
          if (usar) {
            updated.dataOperacao = common.dataOperacao
          }
        }

        // Validar quantidade quando muda
        if (field === 'quantidadeDoses') {
          const qtd = parseInt(value) || 0;
          if (qtd > updated.maxDoses) {
            updated.errors = { ...updated.errors, quantidadeDoses: `Máximo: ${updated.maxDoses} ${unidade}` };
          } else {
            updated.errors = { ...updated.errors, quantidadeDoses: null };
          }
        }
        
        return updated;
      }
      return item;
    }));
  }

  const validarItens = () => {
    let todosValidos = true;
    
    setSaidasItems(prev => prev.map(item => {
      const errors = {};
      
      if (!item.entradaId) {
        errors.entradaId = tipoMaterial === 'embriao' ? 'Selecione um acasalamento' : 'Selecione um sêmen';
        todosValidos = false;
      }
      
      if (!item.quantidadeDoses || parseInt(item.quantidadeDoses) <= 0) {
        errors.quantidadeDoses = 'Quantidade deve ser maior que zero';
        todosValidos = false;
      }
      
      if (parseInt(item.quantidadeDoses) > item.maxDoses) {
        errors.quantidadeDoses = `Máximo: ${item.maxDoses} ${unidade} disponíveis`;
        todosValidos = false;
      }
      
      return { ...item, errors };
    }));
    
    return todosValidos;
  }

  const handleRegistrarSaidas = async () => {
    // Validar campos comuns obrigatórios
    if (!common.destino || common.destino.trim() === '') {
      alert('⚠️ Informe o Destino da saída');
      return;
    }

    if (!validarItens()) {
      alert('⚠️ Corrija os erros nos itens antes de continuar');
      return;
    }

    // Preparar dados: agrupar por entradaId para evitar falhas por duplicatas
    const porEntrada = {};
    saidasItems
      .filter(item => item.entradaId && parseInt(item.quantidadeDoses) > 0)
      .forEach(item => {
        const id = parseInt(item.entradaId);
        if (!porEntrada[id]) porEntrada[id] = { ...item, quantidadeDoses: 0 };
        porEntrada[id].quantidadeDoses += parseInt(item.quantidadeDoses) || 0;
      });

    const saidas = Object.values(porEntrada);
    for (const item of saidas) {
      if (item.quantidadeDoses > (item.maxDoses || 0)) {
        alert(`⚠️ ${item.nomeTouro || 'Item'}: quantidade total (${item.quantidadeDoses}) excede o disponível (${item.maxDoses} ${unidade})`);
        return;
      }
    }

    const saidasPayload = saidas.map(item => ({
      entradaId: parseInt(item.entradaId),
      destino: common.destino.trim(),
      quantidadeDoses: item.quantidadeDoses,
      dataOperacao: common.dataOperacao || new Date().toISOString().split('T')[0],
      observacoes: common.observacoes || null,
      numeroNF: (common.numeroNF || '').trim() || null
    }));

    if (saidasPayload.length === 0) {
      alert('⚠️ Adicione pelo menos um item de saída');
      return;
    }

    const preview = saidasPayload.map((s, i) => {
      const item = saidasItems.find(it => it.entradaId == s.entradaId);
      return `${i + 1}. ${item?.nomeTouro || 'N/A'} - ${s.quantidadeDoses} doses → ${common.destino}`;
    }).join('\n');

    if (!confirm(`📦 Registrar ${saidasPayload.length} saída(s):\n\n${preview}\n\nConfirma?`)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/semen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoOperacao: 'saida',
          saidas: saidasPayload
        })
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        const data = result.data || {};
        const count = data.count ?? 0;
        const errors = data.errors || [];
        const resultados = data.resultados || [];

        if (errors.length === 0) {
          alert(`✅ ${count} saída(s) registrada(s) com sucesso!`);
          setShowModal(false);
          setSaidasItems([]);
          await new Promise(resolve => setTimeout(resolve, 500));
          window.location.reload();
        } else {
          const mapaNome = Object.fromEntries(saidas.map(it => [String(it.entradaId), it.nomeTouro || 'N/A']));
          const detalhes = errors.map(e => {
            const nome = mapaNome[String(e.entradaId)] || `Entrada #${e.entradaId}`;
            return `• ${nome}: ${e.error || 'Erro desconhecido'}`;
          }).join('\n');
          alert(`⚠️ ${result.message || 'Resultado parcial'}\n\nFalhas:\n${detalhes}\n\nAs ${count} saída(s) bem-sucedida(s) já foram registradas.`);
          window.location.reload();
        }
      } else {
        const msg = result.message || result.error || 'Erro desconhecido';
        const errors = result.errors || [];
        const detalhes = Array.isArray(errors) && errors.length > 0
          ? '\n\n' + errors.map(e => typeof e === 'object' ? (e.error || e.message) : e).join('\n')
          : '';
        alert(`❌ Erro ao registrar saídas: ${msg}${detalhes}`);
      }
    } catch (error) {
      console.error('Erro ao registrar saídas:', error);
      alert('❌ Erro ao registrar saídas. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {tipoMaterial === 'embriao' ? '🧬 Saída de Embriões do Estoque' : '📤 Saída de Sêmen do Estoque'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {tipoMaterial === 'embriao' ? 'Registre a saída de embriões do estoque' : 'Registre a saída de material genético do estoque'}
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Campos comuns - Dados da Saída */}
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Dados da Saída (Comum a todos os itens)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número da NF</label>
                <input
                  type="text"
                  placeholder="Ex: 12345"
                  value={common.numeroNF}
                  onChange={(e) => setCommon(prev => ({ ...prev, numeroNF: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destino *</label>
                <DestinoSelector
                  value={common.destino}
                  onChange={(value) => setCommon(prev => ({ ...prev, destino: value }))}
                  destinos={destinos}
                  setDestinos={setDestinos}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data da Saída *</label>
                <input
                  type="date"
                  value={common.dataOperacao}
                  onChange={(e) => setCommon(prev => ({ ...prev, dataOperacao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                <input
                  type="text"
                  placeholder="Observações da saída..."
                  value={common.observacoes}
                  onChange={(e) => setCommon(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
          {/* Header com botão de adicionar */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📤 Itens de Saída
            </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Adicione múltiplos itens. Cada item pode ter destino diferente
              </p>
            </div>
            <button
              onClick={adicionarItem}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              ➕ Adicionar Item
            </button>
          </div>

            {availableStock.length === 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                  ⚠️ Não há sêmen disponível para saída no estoque
                </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Adicione entradas primeiro para poder registrar saídas
                </p>
              </div>
            ) : (
            <div className="space-y-4">
              {saidasItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Item {index + 1}
                    </h4>
                    {saidasItems.length > 1 && (
                      <button
                        onClick={() => removerItem(item.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                      >
                        🗑️ Remover
                      </button>
                    )}
                    <button
                      onClick={() => duplicarItem(item.id)}
                      className="ml-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      ⎘ Duplicar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 relative">
                    {/* Seleção de Sêmen */}
                    <div className="md:col-span-9">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {tipoMaterial === 'embriao' ? 'Acasalamento' : 'Sêmen'} * {item.errors?.entradaId && <span className="text-red-500 text-xs">({item.errors.entradaId})</span>}
                      </label>
                      <select
                        value={item.entradaId || ''}
                        onChange={(e) => atualizarItem(item.id, 'entradaId', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          item.errors?.entradaId ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <option value="">{tipoMaterial === 'embriao' ? 'Selecione um acasalamento...' : 'Selecione um sêmen...'}</option>
                        {availableStock.map(semen => (
                          <option key={semen.id} value={semen.id}>
                            {semen.nomeTouro || semen.nome_touro}
                            {semen.rgTouro || semen.rg_touro ? ` (${semen.rgTouro || semen.rg_touro})` : ''}
                            {' - '}
                            {semen.doses_disponiveis || semen.dosesDisponiveis} {unidade} disponíveis
                          </option>
                        ))}
                      </select>
                      {item.entradaId && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.nomeTouro} - {item.raca} - Máx: {item.maxDoses} {unidade}
                        </p>
                      )}
                    </div>

                    {/* Quantidade */}
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantidade * {item.errors?.quantidadeDoses && <span className="text-red-500 text-xs">({item.errors.quantidadeDoses})</span>}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={item.maxDoses}
                        placeholder="0"
                        value={item.quantidadeDoses}
                        onChange={(e) => atualizarItem(item.id, 'quantidadeDoses', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          item.errors?.quantidadeDoses ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {item.maxDoses > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Máx: {item.maxDoses} {unidade}
                        </p>
                      )}
                    </div>
                    
                    {/* Botão de Remover (se houver mais de um item) */}
                    {saidasItems.length > 1 && (
                      <div className="absolute top-2 right-2">
                         <button
                            onClick={() => removerItem(item.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Remover item"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
                </div>
          )}

          {/* Resumo */}
          {saidasItems.length > 0 && saidasItems.some(item => item.entradaId) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                📊 Resumo
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <p>
                  • <strong>{saidasItems.filter(item => item.entradaId).length}</strong> item(s) selecionado(s)
                </p>
                <p>
                  • <strong>{saidasItems.reduce((sum, item) => sum + (parseInt(item.quantidadeDoses) || 0), 0)}</strong> {unidade} no total
                </p>

              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            * Campos obrigatórios | Você pode registrar múltiplas saídas de uma vez
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowModal(false);
                setSaidasItems([]);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleRegistrarSaidas}
              disabled={loading || saidasItems.filter(item => item.entradaId).length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Registrar {saidasItems.filter(item => item.entradaId).length} Saída(s)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}