import React, { useState } from 'react'

;
import { XMarkIcon, PrinterIcon, DocumentTextIcon, ClipboardDocumentListIcon, TagIcon, TableCellsIcon } from './ui/Icons';

export default function PrintModal({ isOpen, onClose, animals, selectedAnimal = null }) {
  const [selectedFormat, setSelectedFormat] = useState('lista-simples');
  const [printOptions, setPrintOptions] = useState({
    incluirCustos: true,
    incluirProtocolos: true,
    incluirObservacoes: true,
    agruparPorRaca: false,
    agruparPorSituacao: false,
  });

  const formatos = [
    {
      id: 'lista-simples',
      nome: 'Lista Simples',
      descricao: 'Lista básica com informações principais',
      icon: DocumentTextIcon,
    },
    {
      id: 'lista-detalhada',
      nome: 'Lista Detalhada',
      descricao: 'Lista completa com todos os dados',
      icon: ClipboardDocumentListIcon,
    },
    {
      id: 'fichas',
      nome: 'Fichas Individuais',
      descricao: 'Uma ficha por animal (formato A4)',
      icon: TableCellsIcon,
    },
    {
      id: 'etiquetas',
      nome: 'Etiquetas',
      descricao: 'Etiquetas para identificação (10 por página)',
      icon: TagIcon,
    },
  ];

  const handlePrint = () => {
    const animaisParaImprimir = selectedAnimal ? [selectedAnimal] : animals;
    
    // Criar conteúdo HTML baseado no formato selecionado
    let conteudoHTML = '';
    
    switch (selectedFormat) {
      case 'lista-simples':
        conteudoHTML = gerarListaSimples(animaisParaImprimir);
        break;
      case 'lista-detalhada':
        conteudoHTML = gerarListaDetalhada(animaisParaImprimir);
        break;
      case 'fichas':
        conteudoHTML = gerarFichas(animaisParaImprimir);
        break;
      case 'etiquetas':
        conteudoHTML = gerarEtiquetas(animaisParaImprimir);
        break;
      default:
        conteudoHTML = gerarListaSimples(animaisParaImprimir);
    }

    // Abrir janela de impressão
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(conteudoHTML);
    janelaImpressao.document.close();
    
    // Aguardar carregar e imprimir
    janelaImpressao.onload = () => {
      janelaImpressao.focus();
      janelaImpressao.print();
    };

    onClose();
  };

  const gerarListaSimples = (animais) => {
    const linhas = animais.map(animal => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${animal.serie || ''} ${animal.rg || ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${animal.raca || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${animal.sexo === 'M' ? 'Macho' : animal.sexo === 'F' ? 'Fêmea' : animal.sexo}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${animal.meses || 0} meses</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${animal.situacao || 'Ativo'}</td>
        ${printOptions.incluirCustos ? `<td style="padding: 8px; border: 1px solid #ddd;">R$ ${(animal.custoTotal || 0).toFixed(2)}</td>` : ''}
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Lista de Animais - BeefSync</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              color: #333;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #2563eb;
              color: white;
              padding: 12px;
              text-align: left;
              border: 1px solid #ddd;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>🐄 BeefSync - Lista de Animais</h1>
          <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          <p><strong>Total de animais:</strong> ${animais.length}</p>
          
          <table>
            <thead>
              <tr>
                <th>Identificação</th>
                <th>Raça</th>
                <th>Sexo</th>
                <th>Idade</th>
                <th>Situação</th>
                ${printOptions.incluirCustos ? '<th>Custo Total</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${linhas}
            </tbody>
          </table>
          
          <div class="footer">
            <p>BeefSync - Sistema de Gestão Pecuária</p>
            <p>Impresso em ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </body>
      </html>
    `;
  };

  const gerarListaDetalhada = (animais) => {
    const linhas = animais.map(animal => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${animal.serie || ''} ${animal.rg || ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${animal.raca || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${animal.sexo === 'M' ? '♂ Macho' : animal.sexo === 'F' ? '♀ Fêmea' : animal.sexo}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${animal.data_nascimento ? new Date(animal.data_nascimento).toLocaleDateString('pt-BR') : 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${animal.meses || 0} meses</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${animal.peso || 0} kg</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${animal.situacao || 'Ativo'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">R$ ${(animal.custoTotal || 0).toFixed(2)}</td>
        ${printOptions.incluirObservacoes ? `<td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">${animal.observacoes || '-'}</td>` : ''}
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Lista Detalhada de Animais - BeefSync</title>
          <style>
            @page { size: landscape; }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              font-size: 12px;
            }
            h1 {
              color: #333;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #2563eb;
              color: white;
              padding: 10px;
              text-align: left;
              border: 1px solid #ddd;
              font-size: 11px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 11px;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>🐄 BeefSync - Lista Detalhada de Animais</h1>
          <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          <p><strong>Total de animais:</strong> ${animais.length}</p>
          
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Raça</th>
                <th>Sexo</th>
                <th>Nascimento</th>
                <th>Idade</th>
                <th>Peso</th>
                <th>Situação</th>
                <th>Custo</th>
                ${printOptions.incluirObservacoes ? '<th>Observações</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${linhas}
            </tbody>
          </table>
          
          <div class="footer">
            <p>BeefSync - Sistema de Gestão Pecuária</p>
            <p>Impresso em ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </body>
      </html>
    `;
  };

  const gerarFichas = (animais) => {
    const fichas = animais.map(animal => `
      <div class="ficha" style="page-break-after: always; padding: 40px; border: 2px solid #2563eb; margin-bottom: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🐄 BeefSync</h1>
          <h2 style="color: #333; margin: 10px 0;">Ficha Individual do Animal</h2>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2563eb; margin-top: 0;">Identificação</h3>
          <p><strong>Série/RG:</strong> ${animal.serie || ''} ${animal.rg || ''}</p>
          <p><strong>Brinco:</strong> ${animal.brinco || 'N/A'}</p>
          <p><strong>Nome:</strong> ${animal.nome || 'N/A'}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px;">
            <h4 style="color: #2563eb; margin-top: 0;">Dados Gerais</h4>
            <p><strong>Raça:</strong> ${animal.raca || 'N/A'}</p>
            <p><strong>Sexo:</strong> ${animal.sexo === 'M' ? '♂ Macho' : animal.sexo === 'F' ? '♀ Fêmea' : animal.sexo}</p>
            <p><strong>Data Nascimento:</strong> ${animal.data_nascimento ? new Date(animal.data_nascimento).toLocaleDateString('pt-BR') : 'N/A'}</p>
            <p><strong>Idade:</strong> ${animal.meses || 0} meses</p>
            <p><strong>Peso:</strong> ${animal.peso || 0} kg</p>
          </div>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px;">
            <h4 style="color: #2563eb; margin-top: 0;">Situação e Custos</h4>
            <p><strong>Situação:</strong> ${animal.situacao || 'Ativo'}</p>
            <p><strong>Custo Total:</strong> R$ ${(animal.custoTotal || 0).toFixed(2)}</p>
            <p><strong>Valor Resultado:</strong> R$ ${(animal.valorResultado || 0).toFixed(2)}</p>
          </div>
        </div>

        ${animal.pai || animal.mae ? `
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #2563eb; margin-top: 0;">Genealogia</h4>
          <p><strong>Pai:</strong> ${animal.pai || 'N/A'}</p>
          <p><strong>Mãe:</strong> ${animal.mae || 'N/A'}</p>
        </div>
        ` : ''}

        ${animal.observacoes ? `
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h4 style="color: #f59e0b; margin-top: 0;">📝 Observações</h4>
          <p style="margin: 0;">${animal.observacoes}</p>
        </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
          <p>Impresso em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Fichas Individuais - BeefSync</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 0;
              margin: 0;
            }
            h3, h4 {
              margin-bottom: 10px;
            }
            p {
              margin: 5px 0;
              line-height: 1.6;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${fichas}
        </body>
      </html>
    `;
  };

  const gerarEtiquetas = (animais) => {
    const etiquetas = animais.map(animal => `
      <div class="etiqueta">
        <div style="font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 5px;">
          ${animal.serie || ''} ${animal.rg || ''}
        </div>
        <div style="font-size: 14px; color: #666;">
          ${animal.raca || 'N/A'} • ${animal.sexo === 'M' ? '♂' : animal.sexo === 'F' ? '♀' : animal.sexo}
        </div>
        <div style="font-size: 12px; color: #999; margin-top: 5px;">
          ${animal.meses || 0} meses
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Etiquetas - BeefSync</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 10mm;
              margin: 0;
            }
            .etiqueta {
              width: 80mm;
              height: 40mm;
              border: 1px solid #ddd;
              padding: 10mm;
              margin: 5mm;
              float: left;
              box-sizing: border-box;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: center;
              page-break-inside: avoid;
            }
            .etiqueta:nth-child(10n) {
              page-break-after: always;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${etiquetas}
        </body>
      </html>
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PrinterIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Imprimir Animais
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedAnimal 
                    ? `1 animal selecionado: ${selectedAnimal.serie} ${selectedAnimal.rg}`
                    : animals.length > 0
                    ? `${animals.length} animais serão impressos`
                    : 'Nenhum animal selecionado para impressão'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Formatos de Impressão */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Escolha o Formato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formatos.map((formato) => {
                const Icon = formato.icon;
                return (
                  <button
                    key={formato.id}
                    onClick={() => setSelectedFormat(formato.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedFormat === formato.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-6 w-6 ${
                        selectedFormat === formato.id ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {formato.nome}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formato.descricao}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opções de Impressão */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Opções de Impressão
            </h3>
            <div className="space-y-3">
              {selectedFormat !== 'etiquetas' && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printOptions.incluirCustos}
                      onChange={(e) => setPrintOptions({ ...printOptions, incluirCustos: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Incluir informações de custos
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printOptions.incluirObservacoes}
                      onChange={(e) => setPrintOptions({ ...printOptions, incluirObservacoes: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Incluir observações
                    </span>
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePrint}
              className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <PrinterIcon className="h-5 w-5" />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

