import React, { useState, useEffect } from 'react'
import { TrashIcon } from '../ui/Icons'
import { formatCurrency, parseCurrencyValue, formatCurrencyInput } from './utils'

export default function ListaItens({ itens, removerItem, valorTotal, editarItem, valorTotalNF }) {
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null); // índice do bovino em edição

  useEffect(() => {
    if (expandedIndex !== null && (expandedIndex >= itens.length || itens[expandedIndex]?.tipoProduto !== 'bovino')) {
      setExpandedIndex(null);
    }
  }, [itens, expandedIndex]);
  const [bulkValues, setBulkValues] = useState({
    valorUnitario: '',
    era: '',
    local: ''
  });

  const getIconeTipo = (tipoProduto) => {
    switch (tipoProduto) {
      case 'bovino': return '🐄'
      case 'semen': return '🧬'
      case 'embriao': return '🧫'
      default: return '🐄'
    }
  }

  const getNomeTipo = (tipoProduto) => {
    switch (tipoProduto) {
      case 'bovino': return 'Bovino'
      case 'semen': return 'Sêmen'
      case 'embriao': return 'Embrião'
      default: return 'Item'
    }
  }

  const toggleSelectAll = () => {
    if (selectedIndices.length === itens.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(itens.map((_, idx) => idx));
    }
  };

  const toggleSelect = (index) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const applyBulkEdit = () => {
    selectedIndices.forEach(index => {
      if (bulkValues.valorUnitario) {
        editarItem(index, 'valorUnitario', bulkValues.valorUnitario);
      }
      if (bulkValues.era) {
        editarItem(index, 'era', bulkValues.era);
      }
      if (bulkValues.local) {
        editarItem(index, 'local', bulkValues.local);
      }
    });
    // alert('Valores aplicados aos itens selecionados!');
    setBulkValues({ valorUnitario: '', era: '', local: '' });
    setSelectedIndices([]);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 dark:text-white">
          📋 Itens Adicionados ({itens.length})
        </h4>
        <div className="text-lg font-bold text-green-600 dark:text-green-400">
          {formatCurrency(valorTotal)}
        </div>
      </div>

      {/* Resumo dos Bovinos - no topo */}
      {itens.filter(i => i.tipoProduto === 'bovino').length > 0 && (() => {
        const bovinos = itens.filter(i => i.tipoProduto === 'bovino');
        const machos = bovinos.filter(b => {
          const s = String(b.sexo || '').toLowerCase();
          return s.includes('macho') || s === 'm';
        }).length;
        const femeas = bovinos.filter(b => {
          const s = String(b.sexo || '').toLowerCase();
          return s.includes('femea') || s.includes('fêmea') || s === 'f';
        }).length;
        const porEra = {};
        bovinos.forEach(b => {
          const era = b.era || '-';
          porEra[era] = (porEra[era] || 0) + 1;
        });
        return (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/40">
            <h5 className="text-sm font-bold text-green-800 dark:text-green-300 mb-2 flex items-center">
              <span className="mr-2">🐄</span> Resumo dos Bovinos
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="block text-xs text-green-600 dark:text-green-400">Total</span>
                <span className="font-bold text-green-900 dark:text-green-200">{bovinos.length}</span>
              </div>
              <div>
                <span className="block text-xs text-green-600 dark:text-green-400">Machos</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">{machos}</span>
              </div>
              <div>
                <span className="block text-xs text-green-600 dark:text-green-400">Fêmeas</span>
                <span className="font-bold text-pink-700 dark:text-pink-300">{femeas}</span>
              </div>
              <div>
                <span className="block text-xs text-green-600 dark:text-green-400">Por Era</span>
                <div className="flex flex-wrap gap-x-2 font-medium text-gray-700 dark:text-gray-300">
                  {Object.entries(porEra)
                    .filter(([k]) => k && k !== '-')
                    .sort((a, b) => String(a[0]).localeCompare(b[0]))
                    .map(([era, qtd]) => (
                      <span key={era}>{era}: {qtd}</span>
                    ))
                  }
                  {(porEra['-'] || 0) > 0 && (
                    <span className="text-gray-500">Outros: {porEra['-']}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bulk Edit Toolbar */}
      {itens.length > 0 && (
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-wrap gap-4 items-end shadow-sm">
            <div className="flex items-center gap-2 mb-1.5 min-w-[120px]">
                <input 
                    type="checkbox" 
                    checked={selectedIndices.length === itens.length && itens.length > 0} 
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedIndices.length} selecionados
                </span>
            </div>
            
            <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Aplicar Valor (R$)</label>
                    <input 
                        type="text" 
                        value={bulkValues.valorUnitario}
                        onChange={e => setBulkValues({...bulkValues, valorUnitario: formatCurrencyInput(e.target.value)})}
                        placeholder="Ex: 5.000,00"
                        className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Aplicar Era</label>
                    <input 
                        type="text" 
                        value={bulkValues.era}
                        onChange={e => setBulkValues({...bulkValues, era: e.target.value})}
                        placeholder="Ex: Adulto"
                        className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Aplicar Local</label>
                    <select
                        value={bulkValues.local}
                        onChange={(e) => setBulkValues({...bulkValues, local: e.target.value})}
                        className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Selecione...</option>
                        <option value="Pardinho">Pardinho</option>
                        <option value="Rancharia">Rancharia</option>
                    </select>
                </div>
            </div>

            <button 
                onClick={applyBulkEdit}
                disabled={selectedIndices.length === 0}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed h-[34px] font-medium transition-colors"
            >
                Aplicar a Todos
            </button>
        </div>
      )}

      <div className="space-y-3">
        {itens.map((item, index) => (
          <div 
            key={index}
            className={`bg-white dark:bg-gray-800 p-4 rounded-lg border flex items-start justify-between transition-all ${selectedIndices.includes(index) ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}
          >
             <div className="mr-3 pt-1.5">
                <input 
                    type="checkbox" 
                    checked={selectedIndices.includes(index)} 
                    onChange={() => toggleSelect(index)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
             </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">{getIconeTipo(item.tipoProduto)}</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {getNomeTipo(item.tipoProduto)}
                </span>
              </div>

              {item.tipoProduto === 'bovino' && (
                <div className="text-sm">
                  {expandedIndex === index ? (
                    /* Formulário expandido para edição */
                    <div className="space-y-3">
                      {item.modoCadastro === 'categoria' ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Quantidade</label>
                              <input type="number" value={item.quantidade} onChange={(e) => editarItem(index, 'quantidade', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
                              <select value={item.tipoAnimal} onChange={(e) => editarItem(index, 'tipoAnimal', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white">
                                <option value="registrado">Registrado</option><option value="cria-recria">Cria/Recria</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sexo</label>
                              <select value={item.sexo} onChange={(e) => editarItem(index, 'sexo', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white">
                                <option value="">Selecione...</option><option value="macho">Macho</option><option value="femea">Fêmea</option>
                              </select>
                            </div>
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Era</label>
                              <input type="text" value={item.era} onChange={(e) => editarItem(index, 'era', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" placeholder="Ex: 12/24" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Raça</label>
                              <input type="text" value={item.raca || ''} onChange={(e) => editarItem(index, 'raca', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" placeholder="Ex: NELORE" />
                            </div>
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Local</label>
                              <select value={item.local || ''} onChange={(e) => editarItem(index, 'local', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white">
                                <option value="">Selecione...</option><option value="Pardinho">Pardinho</option><option value="Rancharia">Rancharia</option>
                              </select>
                            </div>
                          </div>
                          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor Unitário</label>
                            <input type="text" value={item.valorUnitario} onChange={(e) => editarItem(index, 'valorUnitario', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" placeholder="Ex: 5.000,00" />
                          </div>
                          <p className="text-green-600 dark:text-green-400 font-semibold text-xs">
                            Total: {formatCurrency((typeof item.valorUnitario === 'number' ? item.valorUnitario : parseCurrencyValue(item.valorUnitario)) * (parseInt(item.quantidade) || 1))}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tatuagem</label>
                              <input type="text" value={item.tatuagem ?? ''} onChange={(e) => editarItem(index, 'tatuagem', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sexo</label>
                              <select value={item.sexo} onChange={(e) => editarItem(index, 'sexo', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white">
                                <option value="">Selecione...</option><option value="macho">Macho</option><option value="femea">Fêmea</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Era</label>
                              <input type="text" value={item.era} onChange={(e) => editarItem(index, 'era', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" placeholder="Ex: 12/24" />
                            </div>
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Raça</label>
                              <input type="text" value={item.raca || ''} onChange={(e) => editarItem(index, 'raca', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" placeholder="Ex: NELORE" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Local</label>
                              <select value={item.local || ''} onChange={(e) => editarItem(index, 'local', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white">
                                <option value="">Selecione...</option><option value="Pardinho">Pardinho</option><option value="Rancharia">Rancharia</option>
                              </select>
                            </div>
                            <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Peso (kg)</label>
                              <input type="text" value={item.peso ?? ''} onChange={(e) => editarItem(index, 'peso', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" placeholder="Ex: 450" />
                            </div>
                          </div>
                          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor Unitário</label>
                            <input type="text" value={item.valorUnitario} onChange={(e) => editarItem(index, 'valorUnitario', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" placeholder="Ex: 5.000,00" />
                          </div>
                          <p className="text-green-600 dark:text-green-400 font-semibold text-xs">{formatCurrency(item.valorUnitario)}</p>
                        </>
                      )}
                      <button type="button" onClick={() => setExpandedIndex(null)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Fechar edição</button>
                    </div>
                  ) : (
                    /* Linha compacta: número/tatuagem + resumo + ações */
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-700 dark:text-gray-300">
                        <span className="font-medium">{item.tatuagem || item.quantidade ? (item.modoCadastro === 'categoria' ? `${item.quantidade} animais` : item.tatuagem) : `#${index + 1}`}</span>
                        {item.sexo && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600">{item.sexo}</span>}
                        {item.era && <span className="text-xs">{item.era}</span>}
                        {item.raca && <span className="text-xs text-gray-500 dark:text-gray-400">{item.raca}</span>}
                        <span className="text-green-600 dark:text-green-400 font-semibold">{formatCurrency(item.valorUnitario)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setExpandedIndex(index)} className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors" title="Editar">
                          Editar
                        </button>
                        <button type="button" onClick={() => removerItem(item.id)} className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Excluir">
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {item.tipoProduto === 'semen' && (
                <div className="text-sm space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Touro</label>
                      <input
                        type="text"
                        value={item.nomeTouro}
                        onChange={(e) => editarItem(index, 'nomeTouro', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">RG do Touro</label>
                      <input
                        type="text"
                        value={item.rgTouro || ''}
                        onChange={(e) => editarItem(index, 'rgTouro', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Raça</label>
                    <input
                      type="text"
                      value={item.raca || ''}
                      onChange={(e) => editarItem(index, 'raca', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade de Doses</label>
                      <input
                        type="number"
                        value={item.quantidadeDoses}
                        onChange={(e) => editarItem(index, 'quantidadeDoses', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valor/dose</label>
                      <input
                        type="text"
                        value={item.valorUnitario}
                        onChange={(e) => editarItem(index, 'valorUnitario', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Botijão</label>
                      <input
                        type="text"
                        value={item.botijao || ''}
                        onChange={(e) => editarItem(index, 'botijao', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Caneca</label>
                      <input
                        type="text"
                        value={item.caneca || ''}
                        onChange={(e) => editarItem(index, 'caneca', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <p className="text-purple-600 dark:text-purple-400 font-semibold pt-2 border-t border-gray-200 dark:border-gray-600">
                    Total: {formatCurrency(
                      Math.round(parseInt(item.quantidadeDoses || 0) * parseCurrencyValue(item.valorUnitario) * 100) / 100
                    )}
                  </p>
                </div>
              )}

              {item.tipoProduto === 'embriao' && (
                <div className="text-sm space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Doadora</label>
                      <input
                        type="text"
                        value={item.doadora}
                        onChange={(e) => editarItem(index, 'doadora', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Touro</label>
                      <input
                        type="text"
                        value={item.touro}
                        onChange={(e) => editarItem(index, 'touro', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Raça</label>
                    <input
                      type="text"
                      value={item.raca || ''}
                      onChange={(e) => editarItem(index, 'raca', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade</label>
                      <input
                        type="number"
                        value={item.quantidadeEmbrioes}
                        onChange={(e) => editarItem(index, 'quantidadeEmbrioes', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valor/unidade</label>
                      <input
                        type="text"
                        value={item.valorUnitario}
                        onChange={(e) => editarItem(index, 'valorUnitario', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <p className="text-indigo-600 dark:text-indigo-400 font-semibold pt-2 border-t border-gray-200 dark:border-gray-600">
                    Total: {formatCurrency(
                      Math.round(parseInt(item.quantidadeEmbrioes || 0) * parseCurrencyValue(item.valorUnitario) * 100) / 100
                    )}
                  </p>
                </div>
              )}
            </div>

            {!(item.tipoProduto === 'bovino' && expandedIndex !== index) && (
              <button
                type="button"
                onClick={() => removerItem(item.id)}
                className="ml-4 p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Comparação Valor Total NF vs Soma dos Itens */}
      {valorTotalNF && parseCurrencyValue(valorTotalNF) > 0 && (() => {
        const valorNF = parseCurrencyValue(valorTotalNF);
        const somaItens = typeof valorTotal === 'number' ? valorTotal : parseCurrencyValue(valorTotal);
        const diff = Math.abs(valorNF - somaItens);
        const bate = diff < 0.02; // tolerância de 2 centavos
        return (
          <div className={`mt-4 p-3 rounded-lg border ${bate ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40'}`}>
            <h5 className="text-sm font-bold mb-2 flex items-center">
              {bate ? '✅' : '⚠️'} Conferência de Valores
            </h5>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Soma dos itens:</span>
                <span className="ml-2 font-bold text-gray-900 dark:text-white">{formatCurrency(somaItens)}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Valor Total NF:</span>
                <span className="ml-2 font-bold text-gray-900 dark:text-white">{formatCurrency(valorNF)}</span>
              </div>
            </div>
            {!bate && (
              <p className="mt-2 text-amber-700 dark:text-amber-300 text-sm">
                Valores divergem em {formatCurrency(diff)}. Verifique os valores unitários dos itens.
              </p>
            )}
          </div>
        );
      })()}
    </div>
  )
}