import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { XMarkIcon } from '../ui/Icons';

// Modal de Importação Excel
export default function ImportModal({ isOpen, onClose, onSave, naturezasOperacao, setNaturezasOperacao }) {
  const [importData, setImportData] = useState({
    tipoOperacao: 'entrada',
    arquivo: null,
    preview: null,
    erro: null
  });
  const [novaNatureza, setNovaNatureza] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportData(prev => ({ ...prev, arquivo: file, erro: null }));

    // Ler o arquivo Excel
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Validar e processar dados
        const processedData = processExcelData(jsonData, importData.tipoOperacao);
        setImportData(prev => ({ ...prev, preview: processedData }));
      } catch (error) {
        setImportData(prev => ({
          ...prev,
          erro: 'Erro ao processar arquivo: ' + error.message
        }));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processExcelData = (data, tipoOperacao) => {
    if (data.length < 2) {
      throw new Error('Arquivo deve ter pelo menos 2 linhas (cabeçalho + dados)');
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Validar cabeçalhos baseado no tipo de operação
    const requiredHeaders = getRequiredHeaders(tipoOperacao);
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`Colunas obrigatórias ausentes: ${missingHeaders.join(', ')}`);
    }

    return rows.map((row, index) => {
      const item = {};
      headers.forEach((header, colIndex) => {
        item[header] = row[colIndex] || '';
      });
      item._rowIndex = index + 2; // +2 porque começamos da linha 2 (pula cabeçalho)
      return item;
    });
  };

  const getRequiredHeaders = (tipoOperacao) => {
    if (tipoOperacao === 'entrada') {
      return ['NumeroNF', 'DataCompra', 'Origem', 'Fornecedor', 'ValorTotal', 'QuantidadeAnimais'];
    } else {
      return ['NumeroNF', 'DataSaida', 'Destino', 'NaturezaOperacao', 'ValorTotal', 'QuantidadeAnimais'];
    }
  };

  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (!importData.preview || importData.preview.length === 0) {
      setImportData(prev => ({ ...prev, erro: 'Nenhum dado para importar' }));
      return;
    }

    try {
      setIsImporting(true);
      const nfs = importData.preview.map(item => ({
        id: Date.now() + Math.random(),
        numeroNF: item.NumeroNF,
        dataCompra: item.DataCompra || item.DataSaida,
        origem: item.Origem || item.Destino,
        fornecedor: item.Fornecedor || '',
        valorTotal: parseFloat(item.ValorTotal) || 0,
        quantidadeReceptoras: parseInt(item.QuantidadeAnimais) || 1,
        valorPorReceptora: parseFloat(item.ValorTotal) / (parseInt(item.QuantidadeAnimais) || 1),
        observacoes: item.Observacoes || '',
        tipoOperacao: importData.tipoOperacao,
        naturezaOperacao: item.NaturezaOperacao || '',
        dataCadastro: new Date().toISOString().split('T')[0]
      }));

      // Importar sequencialmente para evitar sobrecarga e garantir ordem
      for (const nf of nfs) {
        await onSave(nf);
      }

      alert('Importação concluída com sucesso!');
      onClose();

      // Limpar dados
      setImportData({
        tipoOperacao: 'entrada',
        arquivo: null,
        preview: null,
        erro: null
      });
    } catch (error) {
      console.error('Erro na importação:', error);
      setImportData(prev => ({ ...prev, erro: 'Erro na importação: ' + error.message }));
    } finally {
      setIsImporting(false);
    }
  };

  const addNatureza = async () => {
    if (!novaNatureza.trim()) return;
    
    try {
      const response = await fetch('/api/nf/naturezas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: novaNatureza.trim(),
          tipo: importData.tipoOperacao
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar nova natureza no banco');
      }

      const novaSalva = await response.json();
      setNaturezasOperacao(prev => [...prev, novaSalva]);
      setNovaNatureza('');
      console.log('Nova natureza salva no banco de dados');
    } catch (error) {
      console.error('Erro ao adicionar natureza:', error);
      alert('Erro ao salvar natureza: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[900px] max-w-full m-4">
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📊 Importar Dados via Excel
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Tipo de Operação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Operação
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="entrada"
                  checked={importData.tipoOperacao === 'entrada'}
                  onChange={(e) => setImportData(prev => ({
                    ...prev,
                    tipoOperacao: e.target.value,
                    preview: null,
                    arquivo: null
                  }))}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Entrada (Compra/Recebimento)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="saida"
                  checked={importData.tipoOperacao === 'saida'}
                  onChange={(e) => setImportData(prev => ({
                    ...prev,
                    tipoOperacao: e.target.value,
                    preview: null,
                    arquivo: null
                  }))}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Saída (Venda/Transferência)</span>
              </label>
            </div>
          </div>

          {/* Upload de Arquivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Arquivo Excel (.xlsx, .xls)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="input-field w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              📋 Colunas Obrigatórias:
            </h4>
            {importData.tipoOperacao === 'entrada' ? (
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• <strong>NumeroNF</strong> - Número da Nota Fiscal</li>
                <li>• <strong>DataCompra</strong> - Data da compra (DD/MM/AAAA)</li>
                <li>• <strong>Origem</strong> - Nome da fazenda/origem</li>
                <li>• <strong>Fornecedor</strong> - Nome do fornecedor</li>
                <li>• <strong>ValorTotal</strong> - Valor total da NF</li>
                <li>• <strong>QuantidadeAnimais</strong> - Quantidade de animais</li>
                <li>• <strong>Observacoes</strong> - Observações (opcional)</li>
              </ul>
            ) : (
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• <strong>NumeroNF</strong> - Número da Nota Fiscal</li>
                <li>• <strong>DataSaida</strong> - Data da saída (DD/MM/AAAA)</li>
                <li>• <strong>Destino</strong> - Destino da saída</li>
                <li>• <strong>NaturezaOperacao</strong> - Natureza da operação</li>
                <li>• <strong>ValorTotal</strong> - Valor total da NF</li>
                <li>• <strong>QuantidadeAnimais</strong> - Quantidade de animais</li>
                <li>• <strong>Observacoes</strong> - Observações (opcional)</li>
              </ul>
            )}
          </div>

          {/* Gerenciar Naturezas de Operação (apenas para saída) */}
          {importData.tipoOperacao === 'saida' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gerenciar Naturezas de Operação
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={novaNatureza}
                  onChange={(e) => setNovaNatureza(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Ex: Venda, Transferência, Doação..."
                />
                <button
                  type="button"
                  onClick={addNatureza}
                  className="btn-secondary"
                >
                  + Adicionar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {naturezasOperacao.filter(n => n.tipo === 'saida').map(natureza => (
                  <span
                    key={natureza.id}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm"
                  >
                    {natureza.nome}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Erro */}
          {importData.erro && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <p className="text-red-800 dark:text-red-200 text-sm">{importData.erro}</p>
            </div>
          )}

          {/* Preview dos Dados */}
          {importData.preview && (
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg max-h-60">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {Object.keys(importData.preview[0]).filter(k => !k.startsWith('_')).map(header => (
                      <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {importData.preview.map((row, idx) => (
                    <tr key={idx}>
                      {Object.keys(row).filter(k => !k.startsWith('_')).map(key => (
                        <td key={key} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {row[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!importData.preview || isImporting}
            className={`btn-primary flex items-center ${(!importData.preview || isImporting) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isImporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importando...
              </>
            ) : (
              <>📥 Importar {importData.preview?.length || 0} Itens</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
