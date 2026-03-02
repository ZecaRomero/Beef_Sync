import React, { useEffect, useState } from 'react'
import { useRouter } from "next/router";
import AnimalForm from "../components/AnimalForm";
import CostManager from "../components/CostManager";
import AnimalImporter from "../components/AnimalImporter";
import UniversalExcelImporter from "../components/UniversalExcelImporter";
import PrintModal from "../components/PrintModal";
import AnimalTimeline from "../components/AnimalTimeline";
import BatchReceptoraForm from "../components/BatchReceptoraForm";
import EmptyState from "../components/EmptyState";
import AnimalCard from "../components/animals/AnimalCard";
import AnimalFilters from "../components/animals/AnimalFilters";
import costManager from "../services/costManager";
import { generateAnimalFichaPDF } from "../utils/animalFichaPDF";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  UserGroupIcon,
  ClockIcon,
  XMarkIcon,
} from "../components/ui/Icons";

const situacoes = [
  "Ativo",
  "Vendido",
  "Morto",
  "Transferido",
  "Gestante",
  "Lactante",
  "Desmamado",
  "Em Observação",
];

export default function Animals() {
  const router = useRouter();
  const [animals, setAnimals] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCostManager, setShowCostManager] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showUniversalImporter, setShowUniversalImporter] = useState(false);
  const [showBatchReceptora, setShowBatchReceptora] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [animalToPrint, setAnimalToPrint] = useState(null);
  const [animalsToPrint, setAnimalsToPrint] = useState([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [animalForTimeline, setAnimalForTimeline] = useState(null);
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [animalToView, setAnimalToView] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' ou 'table'
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedAnimals, setSelectedAnimals] = useState([]); // Para seleção múltipla
  const [selectMode, setSelectMode] = useState(false); // Modo de seleção ativo
  const [showBulkSexModal, setShowBulkSexModal] = useState(false); // Modal para alteração de sexo em lote
  const [tooltipVenda, setTooltipVenda] = useState({ animalId: null, info: null, loading: false }); // Tooltip de venda
  
  useEffect(() => {
    const isMobileUA = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    if (isMobileUA || isSmallScreen) {
      router.replace('/a');
    }
  }, [router]);

  // Garantir que filtros sejam limpos ao montar o componente
  useEffect(() => {
    // Limpar qualquer filtro que possa estar no localStorage ou estado anterior
    setFilters({});
    setCurrentPage(1);
  }, []);

  // Carregar dados dos animais do banco de dados via API
  useEffect(() => {
    loadAnimals()
  }, [])

  const loadAnimals = async () => {
    try {
      setLoading(true)
      
      // Primeiro tentar carregar da API
      try {
        console.log('🔄 Fazendo requisição para /api/animals...')
        const response = await fetch('/api/animals?orderBy=created_at')
        console.log('📡 Status da resposta:', response.status, response.ok)
        
        if (response.ok) {
          const result = await response.json()
          console.log('🔍 Resposta completa da API:', result)
          console.log('🔍 Tipo da resposta:', typeof result)
          console.log('🔍 result.success:', result.success)
          console.log('🔍 result.data:', result.data)
          console.log('🔍 Array.isArray(result.data):', Array.isArray(result.data))
          
          // A API retorna { success: true, data: [...] }
          let animalsData = [];
          
          if (result.success && result.data) {
            animalsData = Array.isArray(result.data) ? result.data : []
          } else if (Array.isArray(result)) {
            // Fallback se a API retornar array diretamente
            animalsData = result
          } else if (Array.isArray(result.data)) {
            animalsData = result.data
          } else {
            console.log('⚠️ Estrutura de resposta inesperada:', result)
            animalsData = []
          }
          
          console.log('✅ Processando animais da API:', animalsData.length, 'animais')
          if (animalsData.length > 0) {
            console.log('🐄 Primeiro animal:', animalsData[0])
            console.log('🐄 Último animal:', animalsData[animalsData.length - 1])
          }
          
          setAnimals(animalsData)
          console.log('✅ Estado atualizado com', animalsData.length, 'animais')
          
          return
        } else {
          const errorText = await response.text()
          console.log('⚠️ API retornou erro HTTP:', response.status, response.statusText, errorText)
        }
      } catch (apiError) {
        console.error('❌ Erro ao conectar com API:', apiError)
      }
      
      // Fallback para localStorage
      const localStorageAnimals = JSON.parse(localStorage.getItem('animals') || '[]')
      console.log('🔍 Verificando localStorage:', localStorageAnimals.length, 'animais')
      
      if (localStorageAnimals.length > 0) {
        setAnimals(localStorageAnimals)
        console.log('✅ Animais carregados do localStorage:', localStorageAnimals.length)
        
        // Tentar sincronizar com API em background
        syncToAPI(localStorageAnimals)
      } else {
        setAnimals([])
        console.log('⚠️ Nenhum animal encontrado em nenhuma fonte')
      }
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar animais:', error)
      setAnimals([])
      alert('❌ Erro ao carregar animais do banco de dados. Verifique o console para mais detalhes.')
    } finally {
      setLoading(false)
      console.log('🏁 loadAnimals finalizado. Estado final dos animais:', animals.length)
    }
  }

  // Função para sincronizar dados do localStorage com API
  const syncToAPI = async (localStorageAnimals) => {
    try {
      console.log('🔄 Iniciando sincronização com API...')
      
      for (const animal of localStorageAnimals) {
        try {
          const response = await fetch('/api/animals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(animal)
          })
          
          if (response.ok) {
            console.log('✅ Animal sincronizado:', animal.serie, animal.rg)
          } else {
            console.log('⚠️ Erro ao sincronizar:', animal.serie, animal.rg, response.status)
          }
        } catch (error) {
          console.error('❌ Erro ao sincronizar animal:', animal.serie, animal.rg, error)
        }
      }
      
      console.log('✅ Sincronização concluída')
    } catch (error) {
      console.error('❌ Erro na sincronização:', error)
    }
  }

  // Função para filtrar animais
  const filteredAnimals = animals.filter(animal => {
    if (!animal) return false;
    
    // Filtro de busca - busca em série, RG, nome, raça
    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim();
      if (searchLower === '') return true;
      
      const matchesSearch = 
        (animal.serie && animal.serie.toLowerCase().includes(searchLower)) ||
        (animal.rg && String(animal.rg).toLowerCase().includes(searchLower)) ||
        (animal.nome && animal.nome.toLowerCase().includes(searchLower)) ||
        (animal.numero && String(animal.numero).toLowerCase().includes(searchLower)) ||
        (animal.raca && animal.raca.toLowerCase().includes(searchLower)) ||
        (animal.tatuagem && animal.tatuagem.toLowerCase().includes(searchLower)) ||
        (`${animal.serie || ''} ${animal.rg || ''}`.trim().toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Outros filtros
    if (filters.raca && animal.raca !== filters.raca) return false;
    if (filters.sexo && animal.sexo !== filters.sexo) return false;
    if (filters.situacao && animal.situacao !== filters.situacao) return false;
    if (filters.era && animal.era !== filters.era) return false;
    
    // Filtros de peso
    if (filters.pesoMin && animal.peso && parseFloat(animal.peso) < parseFloat(filters.pesoMin)) return false;
    if (filters.pesoMax && animal.peso && parseFloat(animal.peso) > parseFloat(filters.pesoMax)) return false;

    return true;
  })

  // Debug: Log dos animais e filtros
  console.log('🔍 Debug - Total de animais:', animals.length)
  console.log('🔍 Debug - Filtros ativos:', filters)
  console.log('🔍 Debug - Animais filtrados:', filteredAnimals.length)
  if (filteredAnimals.length > 0) {
    console.log('🔍 Debug - Primeiro animal filtrado:', filteredAnimals[0])
  }

  // Paginação
  const totalPages = Math.ceil(filteredAnimals.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAnimals = filteredAnimals.slice(startIndex, endIndex)

  // Função para mudar página
  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Função para calcular quais páginas mostrar (máximo 10)
  const getVisiblePages = () => {
    const maxVisible = 10;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Sempre mostrar os primeiros 10 números de página
    return Array.from({ length: Math.min(maxVisible, totalPages) }, (_, i) => i + 1);
  }

  // Função para carregar informações de venda do animal
  const carregarInfoVenda = async (animal) => {
    if (!animal) {
      setTooltipVenda({ animalId: null, info: null, loading: false })
      return
    }
    if (animal.situacao !== 'Vendido') return
    
    try {
      setTooltipVenda({ animalId: animal.id, info: null, loading: true })
      
      // Primeiro, tentar usar dados do próprio animal
      if (animal.valor_venda || animal.valorVenda) {
        setTooltipVenda({
          animalId: animal.id,
          info: {
            nfNumero: animal.nf_saida || animal.nfSaida || null,
            dataVenda: animal.data_venda || animal.dataVenda || null,
            valorVenda: animal.valor_venda || animal.valorVenda || 0,
            destino: animal.destino || animal.comprador || null
          },
          loading: false
        })
        return
      }
      
      // Se não tem valor_venda no animal, buscar nas notas fiscais
      const response = await fetch(`/api/notas-fiscais?tipo=saida`)
      
      if (response.ok) {
        const result = await response.json()
        const nfs = result.data || result || []
        
        // Procurar NF de saída que contenha este animal
        let nfVenda = null
        let itemVenda = null
        
        for (const nf of nfs) {
          try {
            // Buscar NF completa com itens
            const nfResponse = await fetch(`/api/notas-fiscais/${nf.id}`)
            if (nfResponse.ok) {
              const nfCompleta = await nfResponse.json()
              const itens = nfCompleta.itens || []
              
              // Verificar se algum item corresponde ao animal
              const itemEncontrado = itens.find(item => {
                const tatuagem = item.tatuagem || ''
                const animalId = item.animalId || item.animal_id
                
                return (
                  animalId === parseInt(animal.id) ||
                  tatuagem === `${animal.serie}-${animal.rg}` ||
                  tatuagem === `${animal.serie} ${animal.rg}` ||
                  tatuagem === `${animal.serie}${animal.rg}` ||
                  (animal.serie && animal.rg && 
                   tatuagem.toLowerCase().includes(animal.serie.toLowerCase()) && 
                   tatuagem.includes(String(animal.rg)))
                )
              })
              
              if (itemEncontrado) {
                nfVenda = nf
                itemVenda = itemEncontrado
                break
              }
            }
          } catch (err) {
            console.error('Erro ao buscar NF:', err)
          }
        }
        
        if (nfVenda && itemVenda) {
          setTooltipVenda({
            animalId: animal.id,
            info: {
              nfNumero: nfVenda.numero_nf || nfVenda.numeroNF || null,
              dataVenda: nfVenda.data || nfVenda.data_compra || null,
              valorVenda: parseFloat(itemVenda.valorUnitario || itemVenda.valor_unitario || 0),
              destino: nfVenda.destino || null
            },
            loading: false
          })
        } else {
          setTooltipVenda({ animalId: animal.id, info: null, loading: false })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar informações de venda:', error)
      setTooltipVenda({ animalId: animal.id, info: null, loading: false })
    }
  }

  // Função para exportar animais para Excel
  const handleExportAnimals = async () => {
    try {
      setLoading(true)
      
      // Se há animais selecionados, exportar apenas eles
      let animaisParaExportar = [];
      if (selectedAnimals.length > 0) {
        animaisParaExportar = animals.filter(a => selectedAnimals.includes(a.id));
        console.log(`📊 Exportando ${animaisParaExportar.length} animais selecionados`);
      } else {
        // Caso contrário, exportar todos os animais filtrados
        animaisParaExportar = filteredAnimals;
        console.log(`📊 Exportando todos os ${animaisParaExportar.length} animais filtrados`);
      }
      
      if (animaisParaExportar.length === 0) {
        alert('⚠️ Nenhum animal para exportar');
        setLoading(false);
        return;
      }
      
      // Se há animais selecionados, fazer exportação direta via Excel no cliente
      if (selectedAnimals.length > 0) {
        const XLSX = (await import('xlsx')).default;
        
        // Preparar dados para exportação
        const dadosParaExportar = animaisParaExportar.map(animal => ({
          'ID': animal.id,
          'Série': animal.serie,
          'RG': animal.rg,
          'Sexo': animal.sexo,
          'Raça': animal.raca,
          'Data de Nascimento': animal.dataNascimento || animal.data_nascimento || '',
          'Idade (meses)': animal.meses || 0,
          'Peso': animal.peso || '',
          'Situação': animal.situacao,
          'Valor de Venda': animal.valorVenda || animal.valor_venda || 0,
          'Pai': animal.pai || '',
          'Mãe': animal.mae || '',
          'Observações': animal.observacoes || ''
        }));
        
        // Criar workbook e worksheet
        const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Animais');
        
        // Gerar nome do arquivo
        const nomeArquivo = `Animais_Selecionados_${new Date().toISOString().slice(0, 10)}.xlsx`;
        
        // Download
        XLSX.writeFile(wb, nomeArquivo);
        
        alert(`✅ ${animaisParaExportar.length} animais exportados com sucesso!`);
        setLoading(false);
        return;
      }
      
      // Caso contrário, usar a API de exportação detalhada
      const response = await fetch(`/api/export/animals-detailed?v=${Date.now()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao gerar arquivo de exportação')
      }
      
      // Obter o blob do arquivo
      const blob = await response.blob()
      
      // Criar URL para download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Detalhes_dos_Animais_${new Date().toISOString().slice(0, 10)}.xlsx`
      
      // Adicionar ao DOM e clicar para download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Limpar URL
      window.URL.revokeObjectURL(url)
      
      alert('✅ Arquivo Excel exportado com sucesso!')
      
    } catch (error) {
      console.error('Erro ao exportar animais:', error)
      alert('❌ Erro ao exportar animais para Excel: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  // Detectar parâmetros na URL
  useEffect(() => {
    if (router.query.openImporter === 'true') {
      setShowImporter(true);
      router.replace('/animals', undefined, { shallow: true });
    }
    
    if (router.query.filter) {
      setFilters(prev => ({
        ...prev,
        situacao: router.query.filter
      }));
      router.replace('/animals', undefined, { shallow: true });
    }

    if (router.query.action === 'new') {
      setShowForm(true);
      router.replace('/animals', undefined, { shallow: true });
    }

    // Suporte para editar animal via URL
    if (router.query.edit && animals.length > 0) {
      const animalId = parseInt(router.query.edit);
      const animal = animals.find(a => a.id === animalId);
      if (animal) {
        setSelectedAnimal(animal);
        setShowForm(true);
      } else {
        console.warn('⚠️ Animal não encontrado para edição. ID:', animalId);
      }
      router.replace('/animals', undefined, { shallow: true });
    }
  }, [router.query, animals]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])


  const handleSaveAnimal = async (animalData) => {
    try {
      // Form já salvou via animalDataManager - atualizar estado e recarregar lista
      const savedId = animalData?.id ?? selectedAnimal?.id
      if (savedId) {
        const updatedAnimals = selectedAnimal
          ? animals.map(a => a.id === savedId ? { ...a, ...animalData, id: savedId } : a)
          : [...animals, { ...animalData, id: savedId }]
        setAnimals(updatedAnimals)
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('animals', JSON.stringify(updatedAnimals))
        }
        setSelectedAnimal(null)
        setShowForm(false)
        await loadAnimals()
        return
      }

      if (selectedAnimal) {
        // Editar animal existente - persistir na API PostgreSQL
        try {
          const response = await fetch(`/api/animals/${selectedAnimal.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(animalData),
          })
          if (!response.ok) {
            const err = await response.json()
            throw new Error(err.message || 'Erro ao atualizar animal')
          }
          const savedAnimal = await response.json()
          const data = savedAnimal.data || savedAnimal
          const updatedAnimals = animals.map(animal =>
            animal.id === selectedAnimal.id ? { ...animal, ...data } : animal
          )
          setAnimals(updatedAnimals)
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('animals', JSON.stringify(updatedAnimals))
          }
          alert('✅ Animal atualizado com sucesso!')
        } catch (apiError) {
          console.error('Erro ao atualizar na API:', apiError)
          // Fallback: atualizar só localmente
          const updatedAnimals = animals.map(animal =>
            animal.id === selectedAnimal.id ? { ...animal, ...animalData } : animal
          )
          setAnimals(updatedAnimals)
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('animals', JSON.stringify(updatedAnimals))
          }
          alert('⚠️ Animal atualizado localmente (API indisponível)')
        }
      } else {
        // Adicionar novo animal via API PostgreSQL
        try {
          const response = await fetch('/api/animals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(animalData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao cadastrar animal');
          }

          const savedAnimal = await response.json();
          const newAnimalData = savedAnimal.data || savedAnimal;
          console.log('✅ Animal cadastrado na API:', newAnimalData);
          
          // Atualizar lista local
          const updatedAnimals = [...animals, newAnimalData];
          setAnimals(updatedAnimals);
          localStorage.setItem('animals', JSON.stringify(updatedAnimals));
          
          alert('✅ Novo animal adicionado com sucesso!');
        } catch (apiError) {
          console.error('❌ Erro ao cadastrar na API:', apiError);
          
          // Fallback para localStorage
          const newAnimal = {
            ...animalData,
            id: Math.max(...animals.map(a => a.id), 0) + 1,
            custoTotal: 0,
            valorVenda: null,
            dataVenda: null,
            comprador: null,
          };
          const updatedAnimals = [...animals, newAnimal];
          setAnimals(updatedAnimals);
          localStorage.setItem('animals', JSON.stringify(updatedAnimals));
          
          alert('⚠️ Animal salvo localmente (API indisponível)');
        }
      }
      setSelectedAnimal(null);
      setShowForm(false);
      
      // Recarregar animais para garantir sincronização
      await loadAnimals()
    } catch (error) {
      console.error('Erro ao salvar animal:', error)
      alert('❌ Erro ao salvar animal: ' + error.message)
    }
  };

  const handleSaveCosts = (updatedAnimal) => {
    const updatedAnimals = animals.map(animal => 
      animal.id === updatedAnimal.id ? updatedAnimal : animal
    )
    setAnimals(updatedAnimals)
    setSelectedAnimal(null);
    setShowCostManager(false);
  };

  const handleDeleteAnimal = async (animal) => {
    const animalName = `${animal.serie} ${animal.rg}`;
    
    if (confirm(`⚠️ Tem certeza que deseja excluir o animal "${animalName}"?\n\nEsta ação não pode ser desfeita!`)) {
      try {
        // Tentar excluir da API primeiro
        try {
          const response = await fetch(`/api/animals/${animal.id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            console.log('✅ Animal excluído da API:', animalName);
          } else {
            console.log('⚠️ Erro ao excluir da API, continuando com localStorage');
          }
        } catch (apiError) {
          console.error('❌ Erro ao conectar com API:', apiError);
        }
        
        // Atualizar localStorage
        const updatedAnimals = animals.filter((a) => a.id !== animal.id);
        setAnimals(updatedAnimals);
        localStorage.setItem('animals', JSON.stringify(updatedAnimals));
        
        alert(`✅ Animal "${animalName}" excluído com sucesso!`);
        
        // Recarregar animais para garantir sincronização
        await loadAnimals();
        
      } catch (error) {
        console.error('Erro ao excluir animal:', error);
        alert('❌ Erro ao excluir animal: ' + error.message);
      }
    }
  };

  // Função genérica para atualização em lote
  const handleBulkUpdate = async (updates) => {
    if (selectedAnimals.length === 0) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/animals/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedAnimals,
          updates: updates
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
         const summary = result.data.summary;
         let msg = `✅ Processamento concluído!\n\n`;
         msg += `Sucessos: ${summary.successful}\n`;
         if (summary.failed > 0) msg += `Falhas: ${summary.failed}\n`;
         
         alert(msg);
         
         // Limpar seleção e recarregar
         setSelectedAnimals([]);
         setSelectMode(false);
         await loadAnimals();
      } else {
         alert('❌ Erro ao atualizar animais: ' + (result.message || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro na atualização em lote:', error);
      alert('❌ Erro ao conectar com o servidor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para abrir modal de alteração de sexo em lote
  const handleBulkSexChange = () => {
     if (selectedAnimals.length === 0) return;
     setShowBulkSexModal(true);
  };

  // Função para confirmar alteração de sexo em lote
  const confirmBulkSexChange = (newSex) => {
    if (!newSex) return;
    
    if (confirm(`⚠️ Tem certeza que deseja alterar o sexo de ${selectedAnimals.length} animais para "${newSex}"?\n\nEsta ação atualizará o banco de dados.`)) {
      handleBulkUpdate({ sexo: newSex });
      setShowBulkSexModal(false);
    }
  };

  // Função para excluir múltiplos animais
  const handleDeleteMultipleAnimals = async () => {
    if (selectedAnimals.length === 0) {
      alert('⚠️ Selecione pelo menos um animal para excluir');
      return;
    }

    const animalNames = selectedAnimals.map(id => {
      const animal = animals.find(a => a.id === id);
      return animal ? `${animal.serie} ${animal.rg}` : `ID: ${id}`;
    }).join(', ');

    if (confirm(`⚠️ Tem certeza que deseja excluir ${selectedAnimals.length} animal(is)?\n\nAnimais: ${animalNames}\n\nEsta ação não pode ser desfeita!`)) {
      try {
        setLoading(true);
        let successCount = 0;
        let errorCount = 0;

        // Excluir cada animal selecionado
        for (const animalId of selectedAnimals) {
          try {
            // Tentar excluir da API primeiro
            try {
              const response = await fetch(`/api/animals/${animalId}`, {
                method: 'DELETE'
              });
              
              if (response.ok) {
                console.log('✅ Animal excluído da API:', animalId);
              } else {
                console.log('⚠️ Erro ao excluir da API, continuando com localStorage');
              }
            } catch (apiError) {
              console.error('❌ Erro ao conectar com API:', apiError);
            }
            
            successCount++;
          } catch (error) {
            console.error('Erro ao excluir animal:', animalId, error);
            errorCount++;
          }
        }

        // Atualizar localStorage removendo todos os animais selecionados
        const updatedAnimals = animals.filter(animal => !selectedAnimals.includes(animal.id));
        setAnimals(updatedAnimals);
        localStorage.setItem('animals', JSON.stringify(updatedAnimals));

        // Limpar seleção e sair do modo de seleção
        setSelectedAnimals([]);
        setSelectMode(false);

        // Mostrar resultado
        if (errorCount === 0) {
          alert(`✅ ${successCount} animal(is) excluído(s) com sucesso!`);
        } else {
          alert(`⚠️ ${successCount} animal(is) excluído(s) com sucesso, ${errorCount} com erro.`);
        }

        // Recarregar animais para garantir sincronização
        await loadAnimals();

      } catch (error) {
        console.error('Erro ao excluir animais:', error);
        alert('❌ Erro ao excluir animais: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Função para alternar seleção de um animal
  const toggleAnimalSelection = (animalId) => {
    setSelectedAnimals(prev => {
      const newSelection = prev.includes(animalId)
        ? prev.filter(id => id !== animalId)
        : [...prev, animalId];
      console.log('🔄 Seleção atualizada:', {
        animalId,
        antes: prev,
        depois: newSelection,
        totalSelecionados: newSelection.length
      });
      return newSelection;
    });
  };

  // Função para selecionar todos os animais visíveis
  const selectAllAnimals = () => {
    const allCurrentIds = currentAnimals.map(animal => animal.id);
    setSelectedAnimals(allCurrentIds);
  };

  // Função para desselecionar todos os animais
  const deselectAllAnimals = () => {
    setSelectedAnimals([]);
  };

  // Função para alternar modo de seleção
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      setSelectedAnimals([]); // Limpar seleção ao sair do modo
    }
  };

  const handleViewAnimal = (animal) => {
    if (!animal || !animal.id) {
      console.error('Animal inválido:', animal);
      alert('Erro: Animal inválido para visualização');
      return;
    }
    try {
      setAnimalToView(animal);
      setShowAnimalModal(true);
    } catch (error) {
      console.error('Erro ao abrir modal de visualização:', error);
      alert('Erro ao abrir detalhes do animal');
    }
  };

  const handlePrint = (animal = null) => {
    if (animal) {
      // Imprimir um animal específico
      setAnimalToPrint(animal);
      setShowPrintModal(true);
    } else if (selectedAnimals.length > 0) {
      // Imprimir animais selecionados
      const animaisSelecionados = animals.filter(a => selectedAnimals.includes(a.id));
      setAnimalToPrint(null);
      setAnimalsToPrint(animaisSelecionados);
      setShowPrintModal(true);
    } else {
      // Imprimir todos os animais filtrados
      setAnimalToPrint(null);
      setAnimalsToPrint(filteredAnimals);
      setShowPrintModal(true);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setLoading(true)
      
      // Determinar quais animais gerar PDF
      let animaisParaPDF = []
      if (selectedAnimals.length > 0) {
        animaisParaPDF = animals.filter(a => selectedAnimals.includes(a.id))
      } else {
        animaisParaPDF = filteredAnimals
      }

      if (animaisParaPDF.length === 0) {
        alert('Selecione pelo menos um animal para gerar o PDF')
        return
      }

      // Carregar exames andrológicos e custos para todos os animais
      const examesPorRG = {}
      
      for (const animal of animaisParaPDF) {
        // Carregar exames andrológicos
        if (animal.rg) {
          try {
            const response = await fetch(`/api/reproducao/exames-andrologicos?rg=${animal.rg}`)
            if (response.ok) {
              const result = await response.json()
              const exames = Array.isArray(result) ? result : (result.data || result.exames || [])
              
              // Filtrar exames deste animal
              const examesDoAnimal = exames.filter(exame => {
                if (String(exame.rg).trim() !== String(animal.rg).trim()) return false
                if (exame.touro && animal.serie) {
                  const touroNormalizado = exame.touro.replace(/-+/g, '-').toUpperCase()
                  const animalIdentificacao = `${animal.serie || ''}-${animal.rg}`.replace(/-+/g, '-').toUpperCase()
                  return touroNormalizado.includes(animalIdentificacao) || 
                         touroNormalizado.replace(/-/g, '') === `${animal.serie || ''}${animal.rg}`.toUpperCase()
                }
                return true
              })
              
              examesPorRG[animal.rg] = examesDoAnimal.sort((a, b) => {
                const dataA = new Date(a.data_exame || a.data || 0)
                const dataB = new Date(b.data_exame || b.data || 0)
                return dataB - dataA
              })
            }
          } catch (error) {
            console.error(`Erro ao carregar exames do animal ${animal.rg}:`, error)
            examesPorRG[animal.rg] = []
          }
        }
        
        // Carregar custos do animal
        if (animal.id) {
          try {
            const custosResponse = await fetch(`/api/animals/${animal.id}/custos`)
            if (custosResponse.ok) {
              const custosResult = await custosResponse.json()
              const custosData = custosResult.success && custosResult.data ? custosResult.data : (custosResult.data || [])
              animal.custos = Array.isArray(custosData) ? custosData : []
            } else {
              // Tentar API geral de custos
              const custosResponse2 = await fetch(`/api/custos?animalId=${animal.id}`)
              if (custosResponse2.ok) {
                const custosResult2 = await custosResponse2.json()
                const custosData2 = custosResult2.success && custosResult2.data ? custosResult2.data : (custosResult2.data || [])
                animal.custos = Array.isArray(custosData2) ? custosData2 : []
              } else {
                animal.custos = []
              }
            }
          } catch (error) {
            console.error(`Erro ao carregar custos do animal ${animal.id}:`, error)
            animal.custos = animal.custos || []
          }
        }
      }

      // Gerar PDF
      const doc = await generateAnimalFichaPDF(animaisParaPDF, examesPorRG, {}, {})

      // Salvar PDF
      const filename = selectedAnimals.length > 0
        ? `Fichas_Animais_${selectedAnimals.length}_${new Date().toISOString().slice(0, 10)}.pdf`
        : `Fichas_Todos_Animais_${new Date().toISOString().slice(0, 10)}.pdf`
      
      doc.save(filename)
      
      alert(`✅ PDF gerado com sucesso! ${animaisParaPDF.length} animal(is) incluído(s).`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF das fichas')
    } finally {
      setLoading(false)
    }
  }

  const handleImportAnimals = async (importedAnimals) => {
    try {
      console.log('🔄 Iniciando importação de', importedAnimals.length, 'animais')
      console.log('🔍 Animais atuais antes da importação:', animals.length)
      console.log('🔍 Primeiro animal importado:', importedAnimals[0])
      
      // Mostrar feedback visual
      const loadingMessage = `Importando ${importedAnimals.length} animais... Por favor, aguarde.`;
      const loadingElement = document.createElement('div');
      loadingElement.id = 'import-loading';
      loadingElement.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]';
      loadingElement.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <div class="flex items-center space-x-3">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Importando Animais</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">${loadingMessage}</p>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(loadingElement);
      
      // Atualizar lista local
      const updatedAnimals = [...animals, ...importedAnimals]
      console.log('🔍 Total após importação:', updatedAnimals.length)
      
      // Salvar no localStorage imediatamente
      localStorage.setItem('animals', JSON.stringify(updatedAnimals))
      console.log('💾 Dados salvos no localStorage')
      
      // Atualizar estado local
      setAnimals(updatedAnimals)
      console.log('🔄 Estado local atualizado')
      
      // Preparar dados para API (garantir formato correto)
      const animaisParaAPI = importedAnimals.map((animal, index) => {
        // Remover campos que não devem ser enviados para a API
        const {
          id, // REMOVER id temporário - será gerado pelo banco
          ...animalSemId
        } = animal

        // Normalizar sexo para formato do banco
        let sexoNormalizado = animalSemId.sexo
        if (sexoNormalizado) {
          sexoNormalizado = sexoNormalizado.toString().trim()
          if (sexoNormalizado === 'M' || sexoNormalizado.toUpperCase() === 'MACHO') {
            sexoNormalizado = 'Macho'
          } else if (sexoNormalizado === 'F' || sexoNormalizado.toUpperCase() === 'FEMEA' || sexoNormalizado.toUpperCase() === 'FÊMEA') {
            sexoNormalizado = 'Fêmea'
          }
        }

        // Validar e sanitizar campo meses (INTEGER no PostgreSQL: -2147483648 a 2147483647)
        let mesesSanitizado = null
        if (animalSemId.meses !== null && animalSemId.meses !== undefined) {
          // Garantir que não é um timestamp ou valor muito grande
          const mesesValue = parseInt(animalSemId.meses, 10)
          // Validar se é um número válido e está dentro do range de INTEGER
          // Valores acima de 9999 são suspeitos (muito grande para idade em meses)
          if (!isNaN(mesesValue) && mesesValue >= 0 && mesesValue <= 9999) {
            mesesSanitizado = mesesValue
          } else {
            console.warn(`⚠️ Valor inválido para meses no animal ${index + 1} (${animalSemId.serie}-${animalSemId.rg}): ${animalSemId.meses}. Usando null.`)
            mesesSanitizado = null
          }
        }

        // Validar e sanitizar peso (DECIMAL)
        let pesoSanitizado = null
        if (animalSemId.peso !== null && animalSemId.peso !== undefined) {
          const pesoValue = parseFloat(animalSemId.peso)
          if (!isNaN(pesoValue) && pesoValue >= 0 && pesoValue <= 999999) {
            pesoSanitizado = pesoValue
          }
        }

        // Validar e sanitizar custoTotal (DECIMAL)
        let custoTotalSanitizado = 0
        if (animalSemId.custoTotal !== null && animalSemId.custoTotal !== undefined) {
          const custoValue = parseFloat(animalSemId.custoTotal)
          if (!isNaN(custoValue) && custoValue >= 0) {
            custoTotalSanitizado = custoValue
          }
        }

        // Verificar se é modo de atualização
        // Se sexo e raça não estão presentes mas há dados de pai/mãe/receptora, é modo de atualização
        const temDadosAtualizacao = (animalSemId.pai && animalSemId.pai.trim() !== '') || 
                                     (animalSemId.mae && animalSemId.mae.trim() !== '') || 
                                     (animalSemId.receptora && animalSemId.receptora.trim() !== '')
        const isModoAtualizacao = !animalSemId.sexo && !animalSemId.raca && temDadosAtualizacao

        // Criar objeto limpo apenas com campos válidos
        const animalLimpo = {
          serie: animalSemId.serie,
          rg: animalSemId.rg ? animalSemId.rg.toString() : null,
          // No modo de atualização, não enviar campos que não devem ser atualizados
          sexo: isModoAtualizacao ? undefined : (sexoNormalizado || 'Macho'), // Default se não especificado
          raca: isModoAtualizacao ? undefined : (animalSemId.raca || 'Nelore'), // Garantir que raça está presente
          nome: isModoAtualizacao ? undefined : (animalSemId.nome || null),
          tatuagem: isModoAtualizacao ? undefined : (animalSemId.tatuagem || null),
          dataNascimento: isModoAtualizacao ? undefined : (animalSemId.dataNascimento || null),
          meses: isModoAtualizacao ? undefined : mesesSanitizado,
          peso: isModoAtualizacao ? undefined : pesoSanitizado,
          situacao: isModoAtualizacao ? undefined : (animalSemId.situacao || 'Ativo'),
          // SEMPRE incluir campos de genealogia se estiverem presentes
          // Estes campos são críticos e devem ser atualizados sempre que fornecidos
          // Se o campo tem valor (não é null/undefined/string vazia), sempre incluir
          pai: (animalSemId.pai && String(animalSemId.pai).trim() !== '') ? animalSemId.pai : null,
          mae: (animalSemId.mae && String(animalSemId.mae).trim() !== '') ? animalSemId.mae : null,
          avoMaterno: (animalSemId.avoMaterno && String(animalSemId.avoMaterno).trim() !== '') ? animalSemId.avoMaterno : null,
          receptora: (animalSemId.receptora && String(animalSemId.receptora).trim() !== '') ? animalSemId.receptora : null,
          isFiv: isModoAtualizacao ? undefined : (animalSemId.isFiv || false),
          custoTotal: isModoAtualizacao ? undefined : custoTotalSanitizado,
          abczg: isModoAtualizacao ? undefined : (animalSemId.abczg || null),
          deca: isModoAtualizacao ? undefined : (animalSemId.deca || null),
          genetica_2: isModoAtualizacao ? undefined : (animalSemId.genetica_2 || null),
          decile_2: isModoAtualizacao ? undefined : (animalSemId.decile_2 || null),
          observacoes: isModoAtualizacao ? undefined : (animalSemId.observacoes || null),
          atualizarApenasVazios: animalSemId.atualizarApenasVazios || isModoAtualizacao // Garantir que a flag seja enviada
        }

        // Remover campos undefined para não enviá-los na requisição
        Object.keys(animalLimpo).forEach(key => {
          if (animalLimpo[key] === undefined) {
            delete animalLimpo[key]
          }
        })

        // Validar campos obrigatórios
        if (!animalLimpo.serie || !animalLimpo.rg) {
          console.error(`❌ Animal ${index + 1} inválido - faltam campos obrigatórios (Série e RG):`, animalLimpo)
        }

        // No modo de atualização, verificar se pelo menos um campo de atualização foi fornecido
        if (isModoAtualizacao) {
          const temPai = animalLimpo.pai && animalLimpo.pai.trim() !== ''
          const temMae = animalLimpo.mae && animalLimpo.mae.trim() !== ''
          const temReceptora = animalLimpo.receptora && animalLimpo.receptora.trim() !== ''
          
          if (!temPai && !temMae && !temReceptora) {
            console.warn(`⚠️ Animal ${index + 1} (${animalLimpo.serie}-${animalLimpo.rg}) não tem nenhum campo para atualizar (Pai, Mãe ou Receptora)`)
          }
        } else {
          // Modo normal: validar campos obrigatórios
          if (!animalLimpo.sexo || !animalLimpo.raca) {
            console.error(`❌ Animal ${index + 1} inválido - faltam campos obrigatórios:`, animalLimpo)
          }
        }

        return animalLimpo
      }).filter(animal => {
        // Filtrar animais que não têm campos obrigatórios
        if (animal.modoAtualizacao) {
          // Modo atualização: apenas Série e RG são obrigatórios
          return animal.serie && animal.rg
        } else {
          // Modo normal: Série, RG, Sexo e Raça são obrigatórios
          return animal.serie && animal.rg && animal.sexo && animal.raca
        }
      })

      // Tentar salvar na API usando batch import (mais eficiente)
      try {
        console.log('🌐 Iniciando sincronização em lote com API...')
        console.log(`📊 Total de animais para importar: ${animaisParaAPI.length}`)
        console.log('🔍 Primeiro animal preparado:', JSON.stringify(animaisParaAPI[0], null, 2))
        
        // Verificar se há algum valor suspeito antes de enviar
        animaisParaAPI.forEach((animal, idx) => {
          Object.keys(animal).forEach(key => {
            const value = animal[key]
            if (typeof value === 'number' && value > 2147483647) {
              console.error(`❌ ATENÇÃO: Animal ${idx + 1} tem valor muito grande no campo "${key}": ${value}`)
            }
          })
        })
        
        // Tentar usar batch API primeiro
        const batchResponse = await fetch('/api/animals/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ animais: animaisParaAPI })
        });
        
        if (batchResponse.ok) {
          const batchResult = await batchResponse.json();
          console.log('✅ Importação em lote concluída via API batch:', batchResult);
          
          if (batchResult.data && batchResult.data.resumo) {
            const resumo = batchResult.data.resumo
            console.log(`📊 Resumo da importação:`)
            console.log(`  - Sucessos: ${resumo.total_sucessos}`)
            console.log(`  - Erros: ${resumo.total_erros}`)
            console.log(`  - Total antes: ${resumo.total_antes || 'N/A'}`)
            console.log(`  - Total depois: ${resumo.total_depois || 'N/A'}`)
            console.log(`  - Diferença (adicionados): ${resumo.diferenca || 'N/A'}`)
            
            // VALIDAÇÃO CRÍTICA: Verificar se realmente foram salvos
            if (resumo.total_sucessos === 0) {
              throw new Error('Nenhum animal foi salvo. Todos falharam na importação.')
            }
            
            // Verificar se o total realmente aumentou
            if (resumo.total_antes !== undefined && resumo.total_depois !== undefined) {
              const diferenca = resumo.total_depois - resumo.total_antes
              if (diferenca === 0 && resumo.total_sucessos > 0) {
                console.error(`❌ ERRO CRÍTICO: ${resumo.total_sucessos} animais processados mas nenhum foi adicionado!`)
                throw new Error(`Importação falhou: ${resumo.total_sucessos} animais processados mas o total não aumentou (${resumo.total_antes} → ${resumo.total_depois})`)
              }
              
              if (diferenca < resumo.total_sucessos) {
                console.warn(`⚠️ ATENÇÃO: Apenas ${diferenca} de ${resumo.total_sucessos} animais foram realmente adicionados ao banco`)
              }
            }
            
            if (resumo.total_erros > 0) {
              console.warn('⚠️ Alguns animais tiveram erro na importação. Verifique os logs do servidor.')
              // Não lançar erro, apenas avisar - alguns animais foram salvos com sucesso
            }
          } else {
            console.warn('⚠️ Resposta da API não contém resumo. Pode haver problema.')
          }
        } else {
          const errorText = await batchResponse.text();
          console.error('❌ Erro na API batch:', errorText);
          
          // Tentar parsear a resposta JSON para ver se há informações úteis
          let errorMessage = `Erro ${batchResponse.status} na API batch`
          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson.message) {
              errorMessage = errorJson.message
            }
            
            // Se o erro menciona um valor muito grande, pode ser que alguns animais tenham sido salvos
            if (errorText.includes('fora do intervalo') || errorText.includes('out of range')) {
              console.warn('⚠️ Erro de validação detectado. Alguns animais podem ter sido salvos antes do erro.')
              // Não lançar erro fatal - continuar com o processo
              // Os animais válidos já foram salvos
            } else {
              throw new Error(`Batch API retornou erro: ${batchResponse.status} - ${errorMessage}`)
            }
          } catch (parseError) {
            // Se não conseguir parsear, pode ser erro crítico
            if (batchResponse.status >= 500) {
              throw new Error(`Erro do servidor: ${errorMessage}`)
            }
            // Para outros erros, continuar (pode ser que alguns animais foram salvos)
            console.warn('⚠️ Erro ao processar resposta da API, mas continuando...')
          }
        }
        
        console.log('🌐 Sincronização com API concluída')
      } catch (apiError) {
        console.error('❌ Erro ao sincronizar com API:', apiError)
        console.error('📋 Detalhes do erro:', apiError.message)
        // Não bloquear a importação, mas avisar o usuário
        alert(`⚠️ Importação concluída localmente, mas houve erro ao sincronizar com o banco de dados: ${apiError.message}\n\nVerifique o console para mais detalhes.`)
      }
      
      // Remover loading
      const loadingEl = document.getElementById('import-loading');
      if (loadingEl) loadingEl.remove();
      
      // Aguardar um pouco para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Recarregar animais do banco para garantir sincronização
      console.log('🔄 Recarregando animais do banco de dados...')
      await loadAnimals()
      
      // Aguardar um pouco mais para o estado ser atualizado
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Verificar se os animais foram realmente salvos fazendo uma nova requisição
      try {
        const verifyResponse = await fetch('/api/animals')
        if (verifyResponse.ok) {
          const verifyResult = await verifyResponse.json()
          const animaisAtuais = Array.isArray(verifyResult.data) ? verifyResult.data : (Array.isArray(verifyResult) ? verifyResult : [])
          console.log('✅ Animais recarregados. Total no banco:', animaisAtuais.length)
          
          if (animaisAtuais.length > 0) {
            // Verificar se foi modo de atualização
            const isModoAtualizacao = importedAnimals.some(a => !a.sexo && !a.raca && (a.pai || a.mae || a.receptora))
            const tipoOperacao = isModoAtualizacao ? 'atualizados' : 'importados'
            
            console.log(`✅ ${tipoOperacao === 'atualizados' ? 'Atualização' : 'Importação'} concluída! Total de animais no sistema: ${animaisAtuais.length}`)
            alert(`✅ ${importedAnimals.length} animais ${tipoOperacao} com sucesso!\n\nTotal de animais no sistema: ${animaisAtuais.length}`);
          } else {
            console.warn('⚠️ Nenhum animal encontrado após importação. Pode haver problema de sincronização.')
            alert(`⚠️ Importação concluída, mas nenhum animal foi encontrado ao recarregar.\n\nPor favor, recarregue a página manualmente.`);
          }
        }
      } catch (verifyError) {
        console.error('❌ Erro ao verificar animais:', verifyError)
        alert(`✅ ${importedAnimals.length} animais importados!\n\nA importação foi concluída. Por favor, recarregue a página para ver os animais.`);
      }
      
      setShowImporter(false);
    } catch (error) {
      console.error('❌ Erro ao importar animais:', error)
      
      // Remover loading em caso de erro
      const loadingEl = document.getElementById('import-loading');
      if (loadingEl) loadingEl.remove();
      
      alert(`❌ Erro ao importar animais: ${error.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`)
    }
  };

  const handleBatchReceptoras = async (savedReceptoras) => {
    try {
      // Atualizar lista local com as receptoras salvas
      const updatedAnimals = [...animals, ...savedReceptoras];
      setAnimals(updatedAnimals);
      
      // Aplicar custos se necessário
      for (const receptora of savedReceptoras) {
        const animalId = `RPT${receptora.rg}`;
        
        if (receptora.aplicarProtocolo) {
          costManager.aplicarProtocolo(animalId, {
            ...receptora,
            sexo: 'F'
          }, 'Protocolo aplicado automaticamente no cadastro em lote');
        }
      }
      
      setShowBatchReceptora(false);
      
      // Recarregar animais para garantir sincronização
      await loadAnimals();
    } catch (error) {
      console.error('Erro ao processar receptoras:', error);
      alert('❌ Erro ao processar receptoras: ' + error.message);
    }
  };


  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
    console.log('✅ Filtros limpos. Todos os animais serão exibidos.');
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              🐄 Gestão de Animais
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {animals.length} animais cadastrados • {filteredAnimals.length} exibidos
              {selectMode && selectedAnimals.length > 0 && (
                <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                  • {selectedAnimals.length} selecionado(s)
                </span>
              )}
              {filteredAnimals.length < animals.length && Object.keys(filters).some(key => filters[key]) && (
                <span className="ml-2 text-orange-600 dark:text-orange-400 font-medium">
                  ⚠️ Filtros ativos - <button onClick={clearFilters} className="underline hover:text-orange-700 dark:hover:text-orange-300">Limpar filtros</button>
                </span>
              )}
              {animals.length === 0 && !loading && (
                <span className="ml-2">
                  <button onClick={loadAnimals} className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300">
                    🔄 Recarregar animais
                  </button>
                </span>
              )}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
            {/* Controles de Seleção Múltipla */}
            {selectMode ? (
              <>
                <button
                  onClick={selectAllAnimals}
                  className="btn-secondary flex items-center text-sm"
                  disabled={selectedAnimals.length === currentAnimals.length}
                >
                  ✅ Selecionar Todos
                </button>
                <button
                  onClick={deselectAllAnimals}
                  className="btn-secondary flex items-center text-sm"
                  disabled={selectedAnimals.length === 0}
                >
                  ❌ Desselecionar Todos
                </button>
                <button
                  onClick={() => handlePrint(null)}
                  className="btn-secondary flex items-center text-sm"
                  disabled={selectedAnimals.length === 0}
                  title="Imprimir animais selecionados"
                >
                  <PrinterIcon className="h-4 w-4 mr-1" />
                  {selectedAnimals.length > 0 ? `📄 Imprimir (${selectedAnimals.length})` : '📄 Imprimir'}
                </button>
                <button
                  onClick={handleGeneratePDF}
                  className="btn-secondary flex items-center text-sm bg-red-600 hover:bg-red-700 text-white"
                  disabled={selectedAnimals.length === 0 || loading}
                  title="Gerar PDF das fichas dos animais selecionados"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                  {loading ? '⏳ Gerando PDF...' : selectedAnimals.length > 0 ? `📄 PDF (${selectedAnimals.length})` : '📄 Gerar PDF'}
                </button>
                <button
                  onClick={handleBulkSexChange}
                  className="btn-secondary flex items-center text-sm bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={selectedAnimals.length === 0 || loading}
                >
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  {loading ? '⏳ Alterando Sexo...' : `🔄 Alterar Sexo (${selectedAnimals.length})`}
                </button>
                <button
                  onClick={handleExportAnimals}
                  className="btn-secondary flex items-center text-sm"
                  disabled={selectedAnimals.length === 0 || loading}
                  title="Exportar animais selecionados para Excel"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                  {loading ? '⏳ Exportando...' : `📊 Exportar Excel ${selectedAnimals.length > 0 ? `(${selectedAnimals.length})` : ''}`}
                </button>
                <button
                  onClick={handleDeleteMultipleAnimals}
                  className="btn-danger flex items-center text-sm"
                  disabled={selectedAnimals.length === 0 || loading}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  {loading ? '⏳ Excluindo...' : `🗑️ Excluir ${selectedAnimals.length > 0 ? `(${selectedAnimals.length})` : ''}`}
                </button>
                <button
                  onClick={toggleSelectMode}
                  className="btn-secondary flex items-center text-sm"
                >
                  ❌ Cancelar Seleção
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleSelectMode}
                  className="btn-secondary flex items-center text-sm"
                  disabled={filteredAnimals.length === 0}
                >
                  ☑️ Seleção Múltipla
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
                  className="btn-secondary flex items-center"
                >
                  {viewMode === 'cards' ? '📋' : '🎴'} {viewMode === 'cards' ? 'Tabela' : 'Cards'}
                </button>
                <button
                  onClick={handleExportAnimals}
                  className="btn-secondary flex items-center"
                  disabled={loading}
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  {loading ? '⏳ Exportando...' : '📤 Exportar Excel'}
                </button>
                <button
                  onClick={() => setShowImporter(true)}
                  className="btn-secondary flex items-center"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  📥 Importar Animais
                </button>
                <button
                  onClick={() => setShowUniversalImporter(true)}
                  className="btn-primary flex items-center bg-green-600 hover:bg-green-700"
                >
                  <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                  🌐 Importação Universal
                </button>
                <button
                  onClick={() => handlePrint(null)}
                  className="btn-secondary flex items-center"
                  title="Imprimir animais filtrados"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir
                </button>
                <button
                  onClick={() => setShowBatchReceptora(true)}
                  className="btn-secondary flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  🐄 Receptoras em Lote
                </button>
                <button
                  onClick={() => {
                    setSelectedAnimal(null);
                    setShowForm(true);
                  }}
                  className="btn-primary flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Novo Animal
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filtros */}
        <AnimalFilters 
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={clearFilters}
          animals={animals}
        />

        {/* Conteúdo Principal */}
        {animals.length === 0 ? (
          <EmptyState
            title="Nenhum animal cadastrado"
            description="Comece adicionando seu primeiro animal para começar a gerenciar seu rebanho."
            icon="🐄"
            actionLabel="Cadastrar Primeiro Animal"
            onAction={() => {
              setSelectedAnimal(null);
              setShowForm(true);
            }}
          />
        ) : filteredAnimals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum animal encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Tente ajustar os filtros ou adicione um novo animal
            </p>
            <button
              onClick={clearFilters}
              className="btn-secondary"
            >
              Limpar Filtros
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentAnimals.map((animal) => (
                <AnimalCard
                  key={animal.id}
                  animal={animal}
                  selectMode={selectMode}
                  isSelected={selectedAnimals.includes(animal.id)}
                  onToggleSelect={toggleAnimalSelection}
                  onEdit={(animal) => {
                    setSelectedAnimal(animal);
                    setShowForm(true);
                  }}
                  onView={handleViewAnimal}
                  onTimeline={(animal) => {
                    setAnimalForTimeline(animal);
                    setShowTimeline(true);
                  }}
                  onDelete={handleDeleteAnimal}
                  tooltipVenda={tooltipVenda}
                  onLoadVendaInfo={carregarInfoVenda}
                />
              ))}
            </div>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Mostrando <span className="font-medium">{startIndex + 1}</span> até{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredAnimals.length)}</span> de{' '}
                      <span className="font-medium">{filteredAnimals.length}</span> animais
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginação">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Anterior</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Páginas */}
                      {getVisiblePages().map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      {totalPages > 10 && (
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400">
                          ...
                        </span>
                      )}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Próximo</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {selectMode && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedAnimals.length === currentAnimals.length && currentAnimals.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              selectAllAnimals();
                            } else {
                              deselectAllAnimals();
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Animal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Detalhes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Situação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Financeiro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentAnimals.map((animal) => (
                    <tr
                      key={animal.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectMode && selectedAnimals.includes(animal.id) 
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : ''
                      }`}
                      onClick={(e) => {
                        // Não fazer nada se clicar nos botões de ação ou no checkbox
                        if (e.target.closest('button') || e.target.closest('input[type="checkbox"]')) {
                          return;
                        }
                        // Se estiver no modo de seleção, alternar seleção
                        if (selectMode) {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleAnimalSelection(animal.id);
                        }
                      }}
                    >
                      {selectMode && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedAnimals.includes(animal.id)}
                            onChange={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleAnimalSelection(animal.id);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {animal.sexo === "Macho" ? "🐂" : "🐄"}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {animal.serie} {animal.rg}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {animal.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {animal.raca} - {animal.sexo}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {animal.meses} meses
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {animal.situacao === "Vendido" ? (
                          <div 
                            className="relative inline-block"
                            onMouseLeave={() => {
                              if (tooltipVenda.animalId === animal.id) {
                                setTooltipVenda({ animalId: null, info: null, loading: false })
                              }
                            }}
                          >
                            <span
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 cursor-help"
                              onMouseEnter={() => {
                                if (!tooltipVenda.info && !tooltipVenda.loading && tooltipVenda.animalId !== animal.id) {
                                  carregarInfoVenda(animal)
                                }
                              }}
                            >
                              {animal.situacao}
                            </span>
                            {(tooltipVenda.animalId === animal.id && (tooltipVenda.loading || tooltipVenda.info)) && (
                              <div className="absolute left-0 top-full mt-2 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-blue-200 dark:border-blue-700 p-4"
                                onMouseEnter={() => {
                                  // Manter tooltip visível quando mouse estiver sobre ele
                                }}
                              >
                                {tooltipVenda.loading ? (
                                  <div className="text-center py-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Carregando dados da venda...</p>
                                  </div>
                                ) : tooltipVenda.info ? (
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2">
                                      📋 Dados da Venda
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">NF:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                          {tooltipVenda.info.nfNumero || 'Não informado'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Data de Venda:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                          {tooltipVenda.info.dataVenda 
                                            ? new Date(tooltipVenda.info.dataVenda).toLocaleDateString('pt-BR') 
                                            : 'Não informado'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Vendido:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                          {tooltipVenda.info.destino || 'Não informado'}
                                        </span>
                                      </div>
                                      {tooltipVenda.info.valorVenda > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Valor:</span>
                                          <span className="font-semibold text-green-600 dark:text-green-400">
                                            {tooltipVenda.info.valorVenda.toLocaleString('pt-BR', { 
                                              style: 'currency', 
                                              currency: 'BRL' 
                                            })}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-3">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Dados de venda não encontrados</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              animal.situacao === "Ativo"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : animal.situacao === "Morto"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            }`}
                          >
                            {animal.situacao}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900 dark:text-white">
                          Custo: R${" "}
                          {(animal.custoTotal || 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        {animal.valorReal !== null && (
                          <div
                            className={
                              animal.valorReal >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }
                          >
                            Resultado: R${" "}
                            {(animal.valorReal || 0).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!selectMode ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  handleViewAnimal(animal);
                                } catch (error) {
                                  console.error('Erro ao visualizar:', error);
                                  alert('Erro ao visualizar animal');
                                }
                              }}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Visualizar"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  setSelectedAnimal(animal);
                                  setShowForm(true);
                                } catch (error) {
                                  console.error('Erro ao abrir edição:', error);
                                  alert('Erro ao abrir formulário de edição');
                                }
                              }}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              title="Editar"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  setSelectedAnimal(animal);
                                  setShowCostManager(true);
                                } catch (error) {
                                  console.error('Erro ao abrir gerenciador de custos:', error);
                                  alert('Erro ao abrir gerenciador de custos');
                                }
                              }}
                              className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                              title="Gerenciar Custos"
                            >
                              <CurrencyDollarIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  setAnimalForTimeline(animal);
                                  setShowTimeline(true);
                                } catch (error) {
                                  console.error('Erro ao abrir timeline:', error);
                                  alert('Erro ao abrir timeline do animal');
                                }
                              }}
                              className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                              title="Timeline do Animal"
                            >
                              <ClockIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  handlePrint(animal);
                                } catch (error) {
                                  console.error('Erro ao imprimir:', error);
                                  alert('Erro ao abrir impressão');
                                }
                              }}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Imprimir"
                            >
                              <PrinterIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  handleDeleteAnimal(animal);
                                } catch (error) {
                                  console.error('Erro ao excluir:', error);
                                  alert('Erro ao excluir animal');
                                }
                              }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Excluir"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="text-center cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleAnimalSelection(animal.id);
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleAnimalSelection(animal.id);
                              }}
                              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                selectedAnimals.includes(animal.id)
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800'
                              }`}
                            >
                              {selectedAnimals.includes(animal.id) ? '✅ Selecionado' : '☑️ Selecionar'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredAnimals.length === 0 && (animals || []).length > 0 && (
                    <tr>
                      <td colSpan={selectMode ? "6" : "5"} className="text-center py-12">
                        <div className="text-gray-500 dark:text-gray-400">
                          <UserGroupIcon className="mx-auto h-12 w-12 mb-4" />
                          <p className="text-lg font-medium">Nenhum animal encontrado</p>
                          <p className="text-sm">
                            Tente ajustar os filtros ou adicione um novo animal
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Paginação para tabela */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Mostrando <span className="font-medium">{startIndex + 1}</span> até{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredAnimals.length)}</span> de{' '}
                      <span className="font-medium">{filteredAnimals.length}</span> animais
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginação">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Anterior</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Páginas */}
                      {getVisiblePages().map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      {totalPages > 10 && (
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400">
                          ...
                        </span>
                      )}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Próximo</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modais */}
        <AnimalForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedAnimal(null);
          }}
          animal={selectedAnimal}
          onSave={handleSaveAnimal}
        />

        <CostManager
          isOpen={showCostManager}
          onClose={() => {
            setShowCostManager(false);
            setSelectedAnimal(null);
          }}
          animal={selectedAnimal}
          onSave={handleSaveCosts}
        />

        <AnimalImporter
          isOpen={showImporter}
          onClose={() => setShowImporter(false)}
          onImport={handleImportAnimals}
        />

        <UniversalExcelImporter
          isOpen={showUniversalImporter}
          onClose={() => setShowUniversalImporter(false)}
          onImportSuccess={() => {
            loadAnimals()
            setShowUniversalImporter(false)
          }}
        />

        <BatchReceptoraForm
          isOpen={showBatchReceptora}
          onClose={() => setShowBatchReceptora(false)}
          onSave={handleBatchReceptoras}
        />

        <PrintModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setAnimalToPrint(null);
            setAnimalsToPrint([]);
          }}
          animals={animalsToPrint.length > 0 ? animalsToPrint : filteredAnimals}
          selectedAnimal={animalToPrint}
        />

        <AnimalTimeline
          isOpen={showTimeline}
          onClose={() => {
            setShowTimeline(false);
            setAnimalForTimeline(null);
          }}
          animal={animalForTimeline}
        />

        {/* Modal de Alteração de Sexo em Lote */}
        {showBulkSexModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <UserGroupIcon className="h-6 w-6 mr-2 text-purple-600" />
                  Alterar Sexo em Lote
                </h3>
                <button 
                  onClick={() => setShowBulkSexModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Selecione o novo sexo para os <strong className="text-purple-600 dark:text-purple-400">{selectedAnimals.length} animais</strong> selecionados.
                <br/>
                <span className="text-sm text-red-500 mt-2 block">⚠️ Esta ação atualizará o banco de dados imediatamente.</span>
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => confirmBulkSexChange('Macho')}
                  className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-blue-100 hover:border-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:border-blue-400 transition-all group"
                >
                  <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">🐂</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">Macho</span>
                </button>

                <button
                  onClick={() => confirmBulkSexChange('Fêmea')}
                  className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-pink-100 hover:border-pink-500 bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/20 dark:border-pink-800 dark:hover:border-pink-400 transition-all group"
                >
                  <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">🐄</span>
                  <span className="font-bold text-pink-700 dark:text-pink-300">Fêmea</span>
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowBulkSexModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Visualização do Animal */}
        {showAnimalModal && animalToView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Detalhes do Animal - {animalToView.serie} {animalToView.rg}
                </h2>
                <button
                  onClick={() => {
                    setShowAnimalModal(false);
                    setAnimalToView(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Informações Gerais Unificadas */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Informações Gerais</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Linha 1 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Série/RG</label>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {animalToView.serie || ''} {animalToView.rg || ''}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sexo</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{animalToView.sexo || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Raça</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={animalToView.raca}>{animalToView.raca || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Idade</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{animalToView.meses || 0} meses</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Situação</label>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        animalToView.situacao === 'Ativo' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {animalToView.situacao || '-'}
                      </span>
                    </div>
                    
                    {/* Linha 2 (Nascimento e Peso misturados para densidade) */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nascimento</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {animalToView.dataNascimento || animalToView.data_nascimento 
                          ? new Date(animalToView.dataNascimento || animalToView.data_nascimento).toLocaleDateString('pt-BR')
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Peso Atual</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{animalToView.peso ? `${animalToView.peso} kg` : '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Peso Nascer</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{animalToView.peso_nascimento ? `${animalToView.peso_nascimento} kg` : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Informações Financeiras e Adicionais (Lado a Lado) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Financeiro */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Financeiro</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor Venda</label>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {animalToView.valorVenda || animalToView.valor_venda 
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(animalToView.valorVenda || animalToView.valor_venda)
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Custo Total</label>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                           {animalToView.custo_total 
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(animalToView.custo_total)
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Genealogia / Adicionais */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Genealogia</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pai</label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={animalToView.pai}>{animalToView.pai || '-'}</p>
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mãe</label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={animalToView.mae}>{animalToView.mae || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {animalToView.observacoes && (
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Observações</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{animalToView.observacoes}</p>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowAnimalModal(false);
                      setSelectedAnimal(animalToView);
                      setShowForm(true);
                      setAnimalToView(null);
                    }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setShowAnimalModal(false);
                      setAnimalToView(null);
                      router.push(`/consulta-animal/${animalToView.id}`);
                    }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Resumo (celular)
                  </button>
                  <button
                    onClick={() => {
                      setShowAnimalModal(false);
                      setAnimalToView(null);
                    }}
                    className="btn-primary"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
