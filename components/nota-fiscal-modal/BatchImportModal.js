import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '../ui/Icons';
import { formatCurrencyInput } from './utils';

export default function BatchImportModal({ isOpen, onClose, onImport, batchData, batchInfo, existingAnimals = [] }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [commonValues, setCommonValues] = useState({
    valorUnitario: '0,00',
    era: 'Adulto',
    sexo: 'femea',
    raca: 'Receptora'
  });

  // Helper to check if item exists in system
  const isItemExisting = (item) => {
    return existingAnimals.some(a => 
      (a.serie + a.rg) === item.receptora_nome || 
      a.nome === item.receptora_nome
    );
  };

  // Sort batch data by receptora_nome
  const sortedBatchData = React.useMemo(() => {
    if (!batchData) return [];
    return [...batchData].sort((a, b) => {
      const nomeA = a.receptora_nome || '';
      const nomeB = b.receptora_nome || '';
      return nomeA.localeCompare(nomeB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [batchData]);

  // Initialize selection with ONLY non-existing items (helper for splitting batches)
  useEffect(() => {
    if (sortedBatchData && isOpen) {
      const nonExistingIds = sortedBatchData
        .filter(item => !isItemExisting(item))
        .map(item => item.id || item.receptora_nome);
      
      // If we have new items, select them. If ALL are existing (e.g. linking mode), select NONE (user must explicitly select).
      // Let's stick to "Select New Only" as default.
      setSelectedIds(nonExistingIds);
    }
  }, [sortedBatchData, isOpen]);

  const toggleSelectAll = () => {
    // If all NON-EXISTING are selected, deselect all. Otherwise select all NON-EXISTING.
    const nonExistingItems = sortedBatchData.filter(item => !isItemExisting(item));
    const allNonExistingSelected = nonExistingItems.every(item => 
      selectedIds.includes(item.id || item.receptora_nome)
    );

    if (allNonExistingSelected && selectedIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(nonExistingItems.map(item => item.id || item.receptora_nome));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleImport = () => {
    const selectedItems = sortedBatchData.filter(item => 
      selectedIds.includes(item.id || item.receptora_nome)
    ).map(item => ({
      ...item,
      valorUnitario: commonValues.valorUnitario,
      era: commonValues.era,
      sexo: commonValues.sexo,
      raca: commonValues.raca
    }));
    
    onImport(selectedItems);
    onClose();
  };

  if (!isOpen) return null;

  const totalItems = sortedBatchData ? sortedBatchData.length : 0;
  const existingCount = sortedBatchData ? sortedBatchData.filter(isItemExisting).length : 0;
  const availableCount = totalItems - existingCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl p-6 shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Importar Lote de TE</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {batchInfo?.central} - {new Date(batchInfo?.data_te).toLocaleDateString()}
                </p>
                {existingCount > 0 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    ⚠️ {existingCount} animais já constam no sistema (marcados em cinza)
                  </p>
                )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-6 w-6" />
            </button>
        </div>
        
        <div className="mb-4 grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Unitário (R$)</label>
                <input 
                    type="text"
                    value={commonValues.valorUnitario}
                    onChange={e => setCommonValues({...commonValues, valorUnitario: formatCurrencyInput(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0,00"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Era</label>
                <input 
                    type="text"
                    value={commonValues.era}
                    onChange={e => setCommonValues({...commonValues, era: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: Adulto"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 text-gray-700 dark:text-gray-200">
                    <tr>
                        <th className="p-3 w-10">
                            <input 
                                type="checkbox" 
                                checked={availableCount > 0 && selectedIds.length === availableCount} 
                                onChange={toggleSelectAll}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                disabled={availableCount === 0}
                            />
                        </th>
                        <th className="p-3">Animal / Receptora</th>
                        <th className="p-3">Central</th>
                        <th className="p-3 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedBatchData && sortedBatchData.map((item, idx) => {
                        const id = item.id || item.receptora_nome;
                        const isSelected = selectedIds.includes(id);
                        const exists = isItemExisting(item);
                        
                        return (
                            <tr key={idx} className={`
                                ${exists ? 'bg-gray-50 dark:bg-gray-800 opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} 
                                ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                            `}>
                                <td className="p-3">
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected} 
                                        onChange={() => toggleSelect(id)} 
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                        disabled={exists}
                                    />
                                </td>
                                <td className="p-3 font-medium text-gray-900 dark:text-white">
                                    {item.receptora_nome}
                                </td>
                                <td className="p-3 text-gray-500 dark:text-gray-400">{item.central}</td>
                                <td className="p-3 text-right">
                                    {exists ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            Já Cadastrado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                            Novo
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedIds.length} selecionados de {availableCount} disponíveis
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={onClose} 
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleImport} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={selectedIds.length === 0}
                >
                    Importar Selecionados
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
