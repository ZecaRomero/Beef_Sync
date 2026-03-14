import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon, PencilIcon } from './ui/Icons';

export default function NotaFiscalDetailsModal({ isOpen, onClose, nf, onEdit }) {
  const printRef = useRef();
  const router = useRouter();
  const [receptoras, setReceptoras] = useState([]);
  const [loadingReceptoras, setLoadingReceptoras] = useState(false);

  useEffect(() => {
    if (isOpen && nf && (nf.eh_receptoras || nf.ehReceptoras || (nf.itens || []).some(i => (i.tipoProduto || i.tipo_produto) === 'bovino'))) {
      const numero = nf.numero_nf || nf.numeroNF;
      if (numero) {
        setLoadingReceptoras(true);
        fetch(`/api/notas-fiscais/receptoras?numero=${numero}`)
          .then(r => r.ok ? r.json() : { receptoras: [] })
          .then(data => setReceptoras(data.receptoras || []))
          .catch(() => setReceptoras([]))
          .finally(() => setLoadingReceptoras(false));
      }
    } else {
      setReceptoras([]);
    }
  }, [isOpen, nf?.id, nf?.numero_nf, nf?.numeroNF]);

  if (!isOpen || !nf) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const valorTotal = useMemo(() => {
    const base = nf.valorTotal ?? nf.valor_total ?? 0;
    if (base && !Number.isNaN(base)) return base;
    const itens = nf.itens || [];
    if (!Array.isArray(itens) || itens.length === 0) return 0;
    let total = 0;
    for (const item of itens) {
      const data = getItemData(item);
      total += data.total || 0;
    }
    return Math.round(total * 100) / 100;
  }, [nf]);

  const resumoAnimais = useMemo(() => {
    const itens = nf.itens || [];
    const bovinos = itens.filter(i => {
      const t = (i.dados_item || i).tipoProduto || (i.dados_item || i).tipo_produto || i.tipo_produto;
      return t === 'bovino';
    });
    if (bovinos.length === 0) return null;
    const machos = bovinos.filter(b => {
      const s = String((b.dados_item || b).sexo || '').toLowerCase();
      return s.includes('macho') || s === 'm';
    }).length;
    const femeas = bovinos.filter(b => {
      const s = String((b.dados_item || b).sexo || '').toLowerCase();
      return s.includes('femea') || s.includes('fêmea') || s === 'f';
    }).length;
    const porEra = {};
    bovinos.forEach(b => {
      const era = (b.dados_item || b).era || '-';
      porEra[era] = (porEra[era] || 0) + 1;
    });
    return { total: bovinos.length, machos, femeas, porEra };
  }, [nf.itens]);

  const getItemData = (item) => {
    const data = item.dados_item || item;
    
    // Parse quantity
    let qtd = data.quantidade || data.quantidadeDoses || data.quantidadeEmbrioes || 1;
    if (typeof qtd === 'string') {
      qtd = parseFloat(qtd.replace(',', '.')) || 0;
      if (qtd === 0) qtd = 1; // Default to 1 if parsing fails or result is 0 (unless explicitly 0?)
    }
    
    // Parse unit value
    let valorUnit = data.valorUnitario || data.valor_unitario || 0;
    if (typeof valorUnit === 'string') {
      // Remove thousands separator (dot) and replace decimal separator (comma) with dot
      valorUnit = parseFloat(valorUnit.replace(/\./g, '').replace(',', '.')) || 0;
    }
    
    return {
      tipoProduto: data.tipoProduto || data.tipo_produto || item.tipo_produto,
      // User specific request: show "G 3008" which is in tatuagem
      brinco: data.brinco || data.tatuagem, 
      nomeTouro: data.nomeTouro,
      raca: data.raca,
      local: data.local,
      descricao: data.descricao,
      qtd,
      valorUnit,
      total: valorUnit * qtd
    };
  };

  const handlePrint = () => {
    const printContent = document.getElementById('nf-print-content');
    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nota Fiscal ${nf.numeroNF || nf.numero_nf || 'Detalhes'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { font-size: 24px; border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; }
            .header-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-group { margin-bottom: 10px; }
            .label { font-weight: bold; color: #666; font-size: 12px; display: block; margin-bottom: 4px; }
            .value { font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 14px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .status-entrada { background-color: #d1fae5; color: #065f46; }
            .status-saida { background-color: #dbeafe; color: #1e40af; }
          </style>
        </head>
        <body>
          <h1>Nota Fiscal #${nf.numeroNF || nf.numero_nf || 'N/A'}</h1>
          
          <div class="header-info">
            <div>
              <div class="info-group">
                <span class="label">TIPO DE OPERAÇÃO</span>
                <span class="value status-badge ${nf.tipo === 'entrada' ? 'status-entrada' : 'status-saida'}">
                  ${nf.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA'}
                </span>
              </div>
              <div class="info-group">
                <span class="label">DATA</span>
                <span class="value">${formatDate(nf.data || nf.data_compra)}</span>
              </div>
              <div class="info-group">
                <span class="label">NATUREZA DA OPERAÇÃO</span>
                <span class="value">${nf.naturezaOperacao || nf.natureza_operacao || '-'}</span>
              </div>
            </div>
            <div>
              <div class="info-group">
                <span class="label">${nf.tipo === 'entrada' ? 'FORNECEDOR' : 'DESTINATÁRIO'}</span>
                <span class="value">${nf.fornecedor || nf.destino || nf.destinatario || '-'}</span>
              </div>
              <div class="info-group">
                <span class="label">CPF/CNPJ</span>
                <span class="value">${nf.cnpjOrigemDestino || '-'}</span>
              </div>
              <div class="info-group">
                <span class="label">VALOR TOTAL</span>
                <span class="value" style="font-size: 18px; color: #059669;">${formatCurrency(nf.valorTotal || nf.valor_total)}</span>
              </div>
            </div>
          </div>

          <h3>Itens da Nota Fiscal</h3>
          <table>
            <thead>
              <tr>
                <th>Item / Descrição</th>
                <th>Quantidade</th>
                <th>Valor Unit.</th>
                <th>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${(nf.itens || []).map(item => {
                const { tipoProduto, brinco, nomeTouro, raca, local, descricao, qtd, valorUnit, total } = getItemData(item);
                return `
                <tr>
                  <td>
                    ${tipoProduto === 'bovino' ? '🐄 Bovino' : 
                      tipoProduto === 'semen' ? '🧬 Sêmen' : 
                      tipoProduto === 'embriao' ? '🧫 Embrião' : 
                      tipoProduto || 'Item'}
                    ${brinco ? ` - Ident: ${brinco}` : ''}
                    ${nomeTouro ? ` - Touro: ${nomeTouro}` : ''}
                    ${raca ? ` - Raça: ${raca}` : ''}
                    ${local ? ` - Local: ${local}` : ''}
                    ${descricao ? ` - ${descricao}` : ''}
                  </td>
                  <td>
                    ${qtd}
                  </td>
                  <td>${formatCurrency(valorUnit)}</td>
                  <td>${formatCurrency(total)}</td>
                </tr>
              `}).join('')}
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">Total Geral</td>
                <td>${formatCurrency(nf.valorTotal || nf.valor_total)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Emitido pelo Sistema Beef-Sync em ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-200 dark:border-gray-700">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${nf.tipo === 'entrada' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                {nf.tipo === 'entrada' ? <DocumentArrowDownIcon className="h-6 w-6" /> : <PrinterIcon className="h-6 w-6 transform rotate-180" />} 
              </div>
              <div>
                <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                  Nota Fiscal #{nf.numeroNF || nf.numero_nf || 'N/A'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {nf.tipo === 'entrada' ? 'Entrada de Mercadoria' : 'Saída de Mercadoria'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white dark:bg-gray-700 rounded-full p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6" id="nf-print-content">
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Data de Emissão</span>
                <span className="text-lg font-medium text-gray-900 dark:text-white">{formatDate(nf.data || nf.data_compra)}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Valor Total</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(valorTotal)}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 md:col-span-2">
                <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  {nf.tipo === 'entrada' ? 'Fornecedor' : 'Destinatário'}
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900 dark:text-white truncate pr-2">
                    {nf.fornecedor || nf.destino || nf.destinatario || '-'}
                  </span>
                  {nf.cnpjOrigemDestino && (
                    <span className="text-xs bg-white dark:bg-gray-600 px-2 py-1 rounded border border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-300">
                      {nf.cnpjOrigemDestino}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mb-8 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="block text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">Natureza da Operação</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200">{nf.naturezaOperacao || nf.natureza_operacao || '-'}</span>
                </div>
                {nf.observacoes && (
                  <div className="md:col-span-2">
                    <span className="block text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">Observações</span>
                    <span className="text-sm text-gray-800 dark:text-gray-200">{nf.observacoes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Receptoras desta NF - links para tela de detalhes de cada animal */}
            {receptoras.length > 0 && (
              <div className="mb-8 bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl border-2 border-pink-200 dark:border-pink-800/40">
                <h4 className="text-sm font-bold text-pink-800 dark:text-pink-300 mb-3 flex items-center">
                  <span className="mr-2">🤰</span>
                  Receptoras desta NF ({receptoras.length}) — Clique para ver detalhes
                </h4>
                {loadingReceptoras ? (
                  <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-pink-500 border-t-transparent"></div>
                    Carregando...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {receptoras.map((r, i) => (
                      r.link ? (
                        <button
                          key={i}
                          onClick={() => { router.push(r.link); onClose?.(); }}
                          className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-pink-300 dark:border-pink-700 rounded-lg text-sm font-medium text-pink-800 dark:text-pink-200 hover:bg-pink-100 dark:hover:bg-pink-900/40 hover:border-pink-500 transition-all"
                        >
                          {r.serie} →
                        </button>
                      ) : (
                        <span key={i} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm text-gray-500" title="Animal não cadastrado">
                          {r.tatuagem} ⚠️
                        </span>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Resumo dos Animais */}
            {resumoAnimais && (
              <div className="mb-8 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800/40">
                <h4 className="text-sm font-bold text-green-800 dark:text-green-300 mb-3 flex items-center">
                  <span className="mr-2">🐄</span> Resumo dos Animais
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="block text-xs text-green-700 dark:text-green-400">Total de Bovinos</span>
                    <span className="text-xl font-bold text-green-900 dark:text-green-200">{resumoAnimais.total}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-green-700 dark:text-green-400">Machos</span>
                    <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{resumoAnimais.machos}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-green-700 dark:text-green-400">Fêmeas</span>
                    <span className="text-xl font-bold text-pink-700 dark:text-pink-300">{resumoAnimais.femeas}</span>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="block text-xs text-green-700 dark:text-green-400">Por Era</span>
                    <div className="text-sm text-gray-700 dark:text-gray-300 flex flex-wrap gap-x-2">
                      {Object.entries(resumoAnimais.porEra)
                        .filter(([k]) => k && k !== '-')
                        .sort((a, b) => String(a[0]).localeCompare(b[0]))
                        .map(([era, qtd]) => (
                          <span key={era} className="font-medium">{era}: {qtd}</span>
                        ))
                      }
                      {(resumoAnimais.porEra['-'] || 0) > 0 && (
                        <span className="text-gray-500">Outros: {resumoAnimais.porEra['-']}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="bg-gray-200 dark:bg-gray-600 h-6 w-1 rounded-full mr-2"></span>
                Itens da Nota Fiscal
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item / Descrição</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qtd</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Unit.</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {(nf.itens && nf.itens.length > 0) ? (
                      nf.itens.map((item, idx) => {
                        const { tipoProduto, brinco, nomeTouro, raca, local, descricao, qtd, valorUnit, total } = getItemData(item);
                        
                        return (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {tipoProduto === 'bovino' ? '🐄 Bovino' : tipoProduto === 'semen' ? '🧬 Sêmen' : tipoProduto === 'embriao' ? '🧫 Embrião' : tipoProduto || 'Item'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {[
                                brinco && `Ident: ${brinco}`,
                                nomeTouro && `Touro: ${nomeTouro}`,
                                raca && `Raça: ${raca}`,
                                local && `Local: ${local}`,
                                descricao
                              ].filter(Boolean).join(' • ')}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                            {qtd}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(valorUnit)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(total)}
                          </td>
                        </tr>
                      )})
                    ) : (
                      <tr>
                        <td colspan="4" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                          Nenhum item detalhado encontrado nesta nota fiscal.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-800/50 font-bold">
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-right text-sm text-gray-900 dark:text-white">Total Geral</td>
                      <td className="px-6 py-4 text-right text-sm text-green-600 dark:text-green-400">{formatCurrency(valorTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-all"
              onClick={handlePrint}
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Imprimir / Download
            </button>
            {onEdit && (
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-xl border border-amber-500 shadow-sm px-4 py-2 bg-amber-500 text-base font-medium text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all"
                onClick={() => { onClose(); onEdit(nf); }}
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Editar (Data, Valor...)
              </button>
            )}
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
