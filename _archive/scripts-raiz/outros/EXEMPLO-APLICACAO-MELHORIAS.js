// ============================================
// EXEMPLO DE APLICA√‚Ä°√∆íO DAS MELHORIAS INTERATIVAS
// Arquivo: pages/animals/[id].js
// ============================================

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// 1Ô∏è‚∆í£ IMPORTAR O CSS APRIMORADO
import '../../styles/animal-detail-enhanced.css'

// 2Ô∏è‚∆í£ IMPORTAR OS COMPONENTES INTERATIVOS
import { 
  AnimalNavigation,
  EditableField,
  useToast,
  Accordion,
  AnimatedStat,
  Chip,
  ProgressBar,
  Tooltip
} from '../../components/AnimalDetailEnhanced'

// Componentes existentes
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline'

export default function AnimalDetail() {
  const router = useRouter()
  const { id } = router.query
  
  // Estados existentes
  const [animal, setAnimal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [custos, setCustos] = useState([])
  
  // 3Ô∏è‚∆í£ NOVOS ESTADOS PARA NAVEGA√‚Ä°√∆íO
  const [allAnimalsIds, setAllAnimalsIds] = useState([])
  const [currentAnimalIndex, setCurrentAnimalIndex] = useState(-1)
  
  // 4Ô∏è‚∆í£ HOOK DE TOAST PARA NOTIFICA√‚Ä°√‚Ä¢ES
  const { showToast, ToastContainer } = useToast()

  // 5Ô∏è‚∆í£ CARREGAR LISTA DE IDs DOS ANIMAIS
  useEffect(() => {
    const loadAllAnimalsIds = async () => {
      try {
        const response = await fetch('/api/animals?fields=id')
        if (response.ok) {
          const result = await response.json()
          const ids = (result.data || result || []).map(a => a.id).filter(Boolean)
          setAllAnimalsIds(ids)
          
          if (id) {
            const index = ids.findIndex(animalId => String(animalId) === String(id))
            setCurrentAnimalIndex(index)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar IDs dos animais:', error)
      }
    }
    
    if (id) {
      loadAllAnimalsIds()
    }
  }, [id])

  // 6Ô∏è‚∆í£ FUN√‚Ä°√∆íO DE NAVEGA√‚Ä°√∆íO
  const handleNavigate = (newAnimalId) => {
    router.push(`/animals/${newAnimalId}`)
  }

  // 7Ô∏è‚∆í£ FUN√‚Ä°√‚Ä¢ES DE EDI√‚Ä°√∆íO INLINE
  const handleSaveCor = async (novaCor) => {
    try {
      const response = await fetch(`/api/animals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cor: novaCor })
      })
      
      if (response.ok) {
        const result = await response.json()
        setAnimal(prev => ({ ...prev, cor: novaCor }))
        showToast('Cor atualizada com sucesso!', 'success')
      } else {
        showToast('Erro ao atualizar cor', 'error')
      }
    } catch (error) {
      showToast('Erro de conex√£o', 'error')
    }
  }

  const handleSavePeso = async (novoPeso) => {
    try {
      const response = await fetch(`/api/animals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peso: parseFloat(novoPeso) })
      })
      
      if (response.ok) {
        setAnimal(prev => ({ ...prev, peso: parseFloat(novoPeso) }))
        showToast('Peso atualizado com sucesso!', 'success')
      } else {
        showToast('Erro ao atualizar peso', 'error')
      }
    } catch (error) {
      showToast('Erro de conex√£o', 'error')
    }
  }

  const handleSaveObservacoes = async (novasObservacoes) => {
    try {
      const response = await fetch(`/api/animals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacoes: novasObservacoes })
      })
      
      if (response.ok) {
        setAnimal(prev => ({ ...prev, observacoes: novasObservacoes }))
        showToast('Observa√ß√µes atualizadas!', 'success')
      } else {
        showToast('Erro ao atualizar observa√ß√µes', 'error')
      }
    } catch (error) {
      showToast('Erro de conex√£o', 'error')
    }
  }

  // Carregar dados do animal (fun√ß√£o existente)
  useEffect(() => {
    if (id) {
      loadAnimal()
      loadCustos()
    }
  }, [id])

  const loadAnimal = async () => {
    // ... c√≥digo existente de carregamento
  }

  const loadCustos = async () => {
    // ... c√≥digo existente de carregamento
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!animal) {
    return <div>Animal n√£o encontrado</div>
  }

  // Calcular estat√≠sticas
  const totalCustos = custos.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0)
  const lucro = (animal.valor_venda || 0) - totalCustos

  return (
    <>
      <Head>
        <title>{animal.serie} {animal.rg} - Beef Sync</title>
      </Head>

      <div className="container mx-auto px-4 py-6">
        
        {/* 8Ô∏è‚∆í£ NAVEGA√‚Ä°√∆íO ENTRE ANIMAIS */}
        <AnimalNavigation
          currentIndex={currentAnimalIndex}
          totalAnimals={allAnimalsIds.length}
          onNavigate={handleNavigate}
          animalIds={allAnimalsIds}
        />

        {/* 9Ô∏è‚∆í£ CABE√‚Ä°ALHO APRIMORADO */}
        <div className="animal-header-enhanced">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="animal-name">
                {animal.serie} {animal.rg}
              </h1>
              <p className="animal-id">
                ID: {animal.id} ‚‚Ç¨¢ {animal.raca || 'Ra√ßa n√£o informada'}
              </p>
            </div>
            
            {/* Badge de Status Animado */}
            <div className={`status-badge-enhanced badge-${animal.situacao?.toLowerCase() || 'ativo'}`}>
              {animal.situacao || 'Ativo'}
            </div>
          </div>

          {/* ≈∏‚Äù≈∏ BOT√‚Ä¢ES DE A√‚Ä°√∆íO COM GRADIENTES */}
          <div className="action-buttons-grid">
            <button 
              className="action-btn-enhanced action-btn-primary"
              onClick={() => router.push(`/animals?edit=${id}`)}
            >
              <PencilIcon />
              <span>Editar</span>
            </button>

            <button 
              className="action-btn-enhanced action-btn-success"
              onClick={handleGeneratePDF}
            >
              <DocumentArrowUpIcon />
              <span>Gerar PDF</span>
            </button>

            <button 
              className="action-btn-enhanced action-btn-danger"
              onClick={handleDelete}
            >
              <TrashIcon />
              <span>Excluir</span>
            </button>

            <button 
              className="action-btn-enhanced action-btn-info"
              onClick={() => router.push('/animals')}
            >
              <ArrowLeftIcon />
              <span>Voltar</span>
            </button>
          </div>
        </div>

        {/* 1Ô∏è‚∆í£1Ô∏è‚∆í£ ESTAT√çSTICAS ANIMADAS */}
        <div className="stats-grid mt-6">
          <AnimatedStat
            value={animal.peso || 0}
            label="Peso Atual"
            suffix=" kg"
            icon="‚≈°‚ÄìÔ∏è"
          />
          
          <AnimatedStat
            value={totalCustos}
            label="Custos Totais"
            prefix="R$ "
            icon="≈∏‚Äô∞"
          />
          
          <AnimatedStat
            value={animal.meses || 0}
            label="Idade"
            suffix=" meses"
            icon="≈∏‚Äú‚Ä¶"
          />

          <AnimatedStat
            value={lucro}
            label={lucro >= 0 ? 'Lucro' : 'Preju√≠zo'}
            prefix="R$ "
            icon={lucro >= 0 ? '≈∏‚ÄúÀÜ' : '≈∏‚Äú‚Ä∞'}
          />
        </div>

        {/* 1Ô∏è‚∆í£2Ô∏è‚∆í£ CHIPS DE INFORMA√‚Ä°√∆íO */}
        <div className="chip-container mt-6">
          <Chip 
            label={animal.sexo || 'N√£o informado'} 
            variant={animal.sexo === 'Macho' ? 'info' : 'warning'}
            icon="≈∏ê‚Äû"
          />
          <Chip 
            label={animal.raca || 'Sem ra√ßa'} 
            variant="default"
            icon="≈∏ß¨"
          />
          <Chip 
            label={`${animal.tipo_nascimento || 'Natural'}`}
            variant="success"
            icon="≈∏çº"
          />
        </div>

        {/* 1Ô∏è‚∆í£3Ô∏è‚∆í£ ACCORDION - INFORMA√‚Ä°√‚Ä¢ES B√ÅSICAS */}
        <div className="mt-6">
          <Accordion title="≈∏‚Äú‚Äπ Informa√ß√µes B√°sicas" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor
                  <Tooltip text="Clique para editar">
                    <span className="ml-1 text-gray-400">‚‚ÄûπÔ∏è</span>
                  </Tooltip>
                </label>
                <EditableField
                  value={animal.cor}
                  onSave={handleSaveCor}
                  placeholder="Clique para adicionar cor"
                  className="text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (kg)
                  <Tooltip text="Clique para editar">
                    <span className="ml-1 text-gray-400">‚‚ÄûπÔ∏è</span>
                  </Tooltip>
                </label>
                <EditableField
                  value={animal.peso}
                  onSave={handleSavePeso}
                  type="number"
                  placeholder="Clique para adicionar peso"
                  className="text-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Nascimento
                </label>
                <p className="text-lg">
                  {animal.data_nascimento 
                    ? new Date(animal.data_nascimento).toLocaleDateString('pt-BR')
                    : 'N√£o informado'}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observa√ß√µes
                  <Tooltip text="Clique para editar">
                    <span className="ml-1 text-gray-400">‚‚ÄûπÔ∏è</span>
                  </Tooltip>
                </label>
                <EditableField
                  value={animal.observacoes}
                  onSave={handleSaveObservacoes}
                  type="textarea"
                  placeholder="Clique para adicionar observa√ß√µes"
                  className="text-base"
                />
              </div>
            </div>
          </Accordion>

          {/* 1Ô∏è‚∆í£4Ô∏è‚∆í£ ACCORDION - GENEALOGIA */}
          <Accordion title="≈∏ß¨ Informa√ß√µes Geneal√≥gicas">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong className="text-gray-700">Pai:</strong>
                <p className="text-lg mt-1">{animal.pai || 'N√£o informado'}</p>
              </div>
              <div>
                <strong className="text-gray-700">M√£e:</strong>
                <p className="text-lg mt-1">{animal.mae || 'N√£o informado'}</p>
              </div>
              <div>
                <strong className="text-gray-700">Av√¥ Materno:</strong>
                <p className="text-lg mt-1">{animal.avo_materno || 'N√£o informado'}</p>
              </div>
            </div>
          </Accordion>

          {/* 1Ô∏è‚∆í£5Ô∏è‚∆í£ ACCORDION - CUSTOS */}
          <Accordion title="≈∏‚Äô∞ Custos e Despesas">
            {custos.length > 0 ? (
              <>
                <ProgressBar
                  value={totalCustos}
                  max={animal.valor_venda || totalCustos}
                  label="Custos vs Valor de Venda"
                  showPercentage={true}
                />
                
                <table className="table-enhanced mt-4">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Subtipo</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {custos.map((custo, index) => (
                      <tr key={index}>
                        <td>
                          {custo.data 
                            ? new Date(custo.data).toLocaleDateString('pt-BR')
                            : 'N/A'}
                        </td>
                        <td>{custo.tipo || 'N/A'}</td>
                        <td>{custo.subtipo || 'N/A'}</td>
                        <td className="font-bold text-green-600">
                          R$ {parseFloat(custo.valor || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-purple-50">
                      <td colSpan="3" className="font-bold text-right">Total:</td>
                      <td className="font-bold text-purple-600">
                        R$ {totalCustos.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nenhum custo registrado para este animal
              </p>
            )}
          </Accordion>

          {/* 1Ô∏è‚∆í£6Ô∏è‚∆í£ ACCORDION - REPRODU√‚Ä°√∆íO (se aplic√°vel) */}
          {animal.sexo === 'Macho' && (
            <Accordion title="≈∏ê‚Äö Informa√ß√µes Reprodutivas">
              <div className="space-y-4">
                <p className="text-gray-600">
                  Informa√ß√µes sobre exames androl√≥gicos, insemina√ß√µes e descendentes.
                </p>
                {/* Adicionar conte√∫do espec√≠fico aqui */}
              </div>
            </Accordion>
          )}
        </div>

        {/* 1Ô∏è‚∆í£7Ô∏è‚∆í£ CONTAINER DE TOASTS */}
        <ToastContainer />
      </div>
    </>
  )
}

// ============================================
// RESUMO DAS MELHORIAS APLICADAS:
// ============================================
// ‚≈ì‚Ä¶ Navega√ß√£o entre animais com atalhos de teclado
// ‚≈ì‚Ä¶ Cabe√ßalho com gradiente animado
// ‚≈ì‚Ä¶ Bot√µes de a√ß√£o com efeitos hover
// ‚≈ì‚Ä¶ Estat√≠sticas animadas com contagem
// ‚≈ì‚Ä¶ Chips informativos com cores
// ‚≈ì‚Ä¶ Campos edit√°veis inline
// ‚≈ì‚Ä¶ Accordions para organizar informa√ß√µes
// ‚≈ì‚Ä¶ Barra de progresso para custos
// ‚≈ì‚Ä¶ Tabela estilizada
// ‚≈ì‚Ä¶ Tooltips informativos
// ‚≈ì‚Ä¶ Sistema de notifica√ß√µes toast
// ‚≈ì‚Ä¶ Totalmente responsivo
// ‚≈ì‚Ä¶ Suporte a dark mode
// ============================================
