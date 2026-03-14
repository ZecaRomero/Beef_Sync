import { formatCurrency, formatDate } from '../../utils/formatters'
import { ClockIcon } from '../../components/ui/Icons'

const AnimalCard = ({ animal, onEdit, onView, onDelete, onTimeline, selectMode, isSelected, onToggleSelect, tooltipVenda, onLoadVendaInfo }) => {
  const getStatusColor = (situacao) => {
    switch (situacao) {
      case 'Ativo':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'Morto':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'Vendido':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getAnimalIcon = (sexo) => {
    return sexo === 'Macho' ? '🐂' : '🐄'
  }

  const calculateAge = (birthDate) => {
    const birth = new Date(birthDate)
    const now = new Date()
    const ageInMonths = Math.floor((now - birth) / (1000 * 60 * 60 * 24 * 30))
    
    if (ageInMonths < 12) {
      return `${ageInMonths} meses`
    } else {
      const years = Math.floor(ageInMonths / 12)
      const months = ageInMonths % 12
      return months > 0 ? `${years}a ${months}m` : `${years} anos`
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all duration-200 ${
      selectMode && isSelected 
        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="p-3">
        {/* Header Ultra Compacto */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {selectMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleSelect(animal.id);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer flex-shrink-0"
              />
            )}
            <div className="text-lg flex-shrink-0">{getAnimalIcon(animal.sexo)}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {animal.serie} {animal.rg}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {animal.raca}
              </p>
            </div>
          </div>
          {animal.situacao === 'Vendido' ? (
            <div 
              className="relative inline-block"
              onMouseLeave={() => {
                if (tooltipVenda?.animalId === animal.id && onLoadVendaInfo) {
                  setTimeout(() => {
                    onLoadVendaInfo(null)
                  }, 200)
                }
              }}
            >
              <span 
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(animal.situacao)} cursor-help`}
                onMouseEnter={() => {
                  if (onLoadVendaInfo && (!tooltipVenda?.info && !tooltipVenda?.loading && tooltipVenda?.animalId !== animal.id)) {
                    onLoadVendaInfo(animal)
                  }
                }}
              >
                {animal.situacao}
              </span>
              {(tooltipVenda?.animalId === animal.id && (tooltipVenda?.loading || tooltipVenda?.info)) && (
                <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-blue-200 dark:border-blue-700 p-4"
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
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(animal.situacao)}`}>
              {animal.situacao}
            </span>
          )}
        </div>

        {/* Informações Essenciais - Inline */}
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            {animal.meses}m • {formatCurrency(animal.custoTotal || 0)}
          </span>
        </div>

        {/* Ações Ultra Compactas - Apenas Ícones */}
        {!selectMode && (
          <div className="flex gap-1 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  if (onView) onView(animal);
                } catch (error) {
                  console.error('Erro ao visualizar:', error);
                  alert('Erro ao visualizar animal');
                }
              }}
              className="flex-1 px-2 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors flex items-center justify-center"
              title="Ver Detalhes"
            >
              👁️
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  if (onTimeline) onTimeline(animal);
                } catch (error) {
                  console.error('Erro ao abrir timeline:', error);
                  alert('Erro ao abrir timeline');
                }
              }}
              className="flex-1 px-2 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors flex items-center justify-center"
              title="Timeline"
            >
              ⏱️
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  if (onEdit) onEdit(animal);
                } catch (error) {
                  console.error('Erro ao editar:', error);
                  alert('Erro ao editar animal');
                }
              }}
              className="flex-1 px-2 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors flex items-center justify-center"
              title="Editar"
            >
              ✏️
            </button>
          </div>
        )}
        
        {/* Modo de Seleção - Compacto */}
        {selectMode && (
          <div 
            className="pt-2 border-t border-gray-200 dark:border-gray-700 cursor-pointer"
            onClick={(e) => {
              if (e.target.closest('input[type="checkbox"]')) {
                return;
              }
              e.preventDefault();
              e.stopPropagation();
              onToggleSelect(animal.id);
            }}
          >
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              {isSelected ? '✅' : '☑️'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnimalCard