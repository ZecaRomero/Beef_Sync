import React from 'react'
import { MagnifyingGlassIcon, PlusIcon } from '../ui/Icons'
import { formatCurrencyInput, parseCurrencyValue, formatCurrency } from './utils'

export default function FormularioBovino({ 
  novoItem, 
  setNovoItem, 
  adicionarItem, 
  tipo,
  buscaAnimais,
  setBuscaAnimais,
  mostrarListaAnimais,
  setMostrarListaAnimais,
  animalSelecionado,
  filtrarAnimais,
  selecionarAnimal,
  manterSerieAutomaticamente,
  setManterSerieAutomaticamente,
  verificarLoteTE,
  ehReceptoras = false,
  itens = []
}) {
  const modoCadastro = novoItem.modoCadastro || 'individual'

  return (
    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-green-900 dark:text-green-100">
            🐄 Adicionar Bovino
          </h4>
          {setManterSerieAutomaticamente && (
            <label className="inline-flex items-center cursor-pointer ml-2">
              <input 
                type="checkbox" 
                checked={manterSerieAutomaticamente} 
                onChange={(e) => setManterSerieAutomaticamente(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
              <span className="ms-2 text-xs font-medium text-gray-700 dark:text-gray-300">Série Automática</span>
            </label>
          )}
        </div>
        {/* Toggle entre modos de cadastro */}
        {tipo === 'entrada' && (
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded ${modoCadastro === 'individual' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
              Individual
            </span>
            <button
              type="button"
              onClick={() => {
                const novoModo = modoCadastro === 'individual' ? 'categoria' : 'individual'
                setNovoItem(prev => ({ 
                  ...prev, 
                  modoCadastro: novoModo,
                  tatuagem: novoModo === 'categoria' ? '' : prev.tatuagem,
                  quantidade: novoModo === 'individual' ? '' : prev.quantidade
                }))
              }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                modoCadastro === 'categoria' ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  modoCadastro === 'categoria' ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`px-2 py-1 rounded ${modoCadastro === 'categoria' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
              Por Categoria
            </span>
          </div>
        )}
      </div>
      
      {modoCadastro === 'categoria' && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            📋 <strong>Modo Categoria:</strong> Cadastre animais agrupados por tipo, sexo e faixa etária, sem necessidade de tatuagem individual (como na NF).
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Campo de Tatuagem (modo individual) ou Quantidade (modo categoria) */}
        {modoCadastro === 'categoria' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantidade *
            </label>
          <input
            type="number"
            min="1"
            value={novoItem.quantidade ?? ''}
            onChange={(e) => setNovoItem(prev => ({ ...prev, quantidade: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ex: 301"
            />
          </div>
        ) : (
          !ehReceptoras && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tatuagem/Identificação *
                {tipo === 'saida' && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                    🔍 Buscar animal cadastrado
                  </span>
                )}
              </label>
            <div className="relative">
              <input
                type="text"
                value={tipo === 'saida' ? buscaAnimais : novoItem.tatuagem}
                onChange={(e) => {
                  const valor = e.target.value
                  if (tipo === 'saida') {
                    setBuscaAnimais(valor)
                    setMostrarListaAnimais(valor.length > 0)
                    // Permitir que o valor digitado seja usado como tatuagem mesmo sem selecionar da lista
                    setNovoItem(prev => ({ ...prev, tatuagem: valor }))
                  } else {
                    setNovoItem(prev => ({ ...prev, tatuagem: valor }))
                  }
                  if (verificarLoteTE) verificarLoteTE(valor)
                }}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                placeholder={tipo === 'saida' ? "Buscar animal ou digitar ID..." : "Ex: 001"}
              />
              {tipo === 'saida' && (
                <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              )}
              
              {/* Lista de animais encontrados */}
              {tipo === 'saida' && mostrarListaAnimais && filtrarAnimais().length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filtrarAnimais().map((animal) => (
                  <div
                    key={animal.id}
                    onClick={() => selecionarAnimal(animal)}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {animal.serie}{animal.rg}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {animal.raca} • {animal.sexo} • {animal.peso || 'N/A'}kg
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {animal.situacao}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Mensagem quando não encontrar animais */}
            {tipo === 'saida' && mostrarListaAnimais && buscaAnimais.length > 0 && filtrarAnimais().length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3">
                <div className="text-yellow-600 dark:text-yellow-400 text-sm">
                  ⚠️ Animal não encontrado
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  O animal será cadastrado automaticamente ao salvar a nota.
                </div>
              </div>
            )}
            
            {/* Indicador de animal selecionado */}
            {tipo === 'saida' && animalSelecionado && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="text-sm text-green-800 dark:text-green-200">
                  ✅ <strong>Animal selecionado:</strong> {animalSelecionado.serie}{animalSelecionado.rg}
                </div>
                <div className="text-xs text-green-600 dark:text-green-300 mt-1">
                  {animalSelecionado.raca} • {animalSelecionado.sexo} • {animalSelecionado.peso || 'N/A'}kg • {animalSelecionado.situacao}
                </div>
              </div>
              )}
            </div>
          </div>
          )
        )}
        
        {/* Tipo de Animal (apenas modo categoria) */}
        {modoCadastro === 'categoria' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo *
            </label>
            <select
              value={novoItem.tipoAnimal}
              onChange={(e) => setNovoItem(prev => ({ ...prev, tipoAnimal: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecione...</option>
              <option value="registrado">Registrado</option>
              <option value="cria-recria">Cria/Recria</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sexo *
            {ehReceptoras && (
              <span className="text-xs text-pink-600 dark:text-pink-400 ml-2">
                🤰 Auto-preenchido para Receptoras
              </span>
            )}
          </label>
          <select
            value={novoItem.sexo}
            onChange={(e) => setNovoItem(prev => ({ ...prev, sexo: e.target.value }))}
            disabled={ehReceptoras}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
              ehReceptoras ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-75' : ''
            }`}
          >
            <option value="">Selecione...</option>
            <option value="macho">Macho</option>
            <option value="femea">Fêmea</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Era *
            {ehReceptoras && itens.length > 0 && (
              <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                💡 Copiado do 1º (edite se mudar)
              </span>
            )}
          </label>
          <input
            type="text"
            value={novoItem.era ?? ''}
            onChange={(e) => {
              const valor = e.target.value;
              setNovoItem(prev => ({ ...prev, era: valor }));
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            placeholder="0/3 - 4/8 - 9/12 - 13/24 - 25/36 - +36"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Raça
            {ehReceptoras && (
              <span className="text-xs text-pink-600 dark:text-pink-400 ml-2">
                🤰 Auto-preenchido para Receptoras
              </span>
            )}
          </label>
          <input
            type="text"
            value={novoItem.raca ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              const updates = { raca: val };
              if (val.toLowerCase().includes('receptora')) {
                updates.sexo = 'femea';
              }
              setNovoItem(prev => ({ ...prev, ...updates }));
            }}
            disabled={ehReceptoras}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
              ehReceptoras ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-75' : ''
            }`}
            placeholder="Ex: Nelore"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Local (Boletim)
          </label>
          <select
            value={novoItem.local || ''}
            onChange={(e) => setNovoItem(prev => ({ ...prev, local: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Selecione...</option>
            <option value="Pardinho">Pardinho</option>
            <option value="Rancharia">Rancharia</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valor Unitário * (R$)
            {ehReceptoras && itens.length > 0 && (
              <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                💡 Copiado do 1º (edite se mudar)
              </span>
            )}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">R$</span>
            <input
              type="text"
              value={novoItem.valorUnitario ?? ''}
              onChange={(e) => {
                const formatted = formatCurrencyInput(e.target.value)
                setNovoItem(prev => ({ ...prev, valorUnitario: formatted }))
              }}
              onBlur={(e) => {
                // Ao sair do campo, formata o valor
                const numValue = parseCurrencyValue(e.target.value)
                if (numValue > 0) {
                  const formatted = numValue.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })
                  setNovoItem(prev => ({ ...prev, valorUnitario: formatted }))
                }
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="0,00"
            />
          </div>
          {novoItem.valorUnitario && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Valor formatado: {formatCurrency(parseCurrencyValue(novoItem.valorUnitario))}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={adicionarItem}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Adicionar Bovino</span>
        </button>
      </div>
    </div>
  )
}
