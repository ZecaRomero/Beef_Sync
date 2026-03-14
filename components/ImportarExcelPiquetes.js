import React, { useState } from 'react';
import ImportProgressOverlay from './ImportProgressOverlay';

export default function ImportarExcelPiquetes({ onImportComplete }) {
  const [arquivo, setArquivo] = useState(null);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar extensÃ£o
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        setErro('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
        setArquivo(null);
        return;
      }
      setArquivo(file);
      setErro(null);
      setResultado(null);
    }
  };

  const handleImport = async () => {
    if (!arquivo) {
      setErro('Selecione um arquivo Excel');
      return;
    }

    setImportando(true);
    setErro(null);
    setResultado(null);

    try {
      const formData = new FormData();
      formData.append('file', arquivo);

      const response = await fetch('/api/import/excel-piquetes', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResultado(data.resultados);
        setArquivo(null);
        // Resetar input
        document.getElementById('file-input').value = '';
        
        // Notificar componente pai
        if (onImportComplete) {
          onImportComplete(data.resultados);
        }
      } else {
        setErro(data.error || 'Erro ao importar arquivo');
      }
    } catch (error) {
      console.error('Erro ao importar:', error);
      setErro('Erro ao processar arquivo. Verifique o formato e tente novamente.');
    } finally {
      setImportando(false);
    }
  };

  return (
    <>
      <ImportProgressOverlay importando={importando} progress={{ etapa: 'Importando piquetes e animais...' }} />
      <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        ðÅ¸â€œÅ  Importar Excel - Piquetes e Animais
      </h2>

      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900 mb-2">ðÅ¸â€œâ€¹ Formato do Excel:</h3>
          <p className="text-sm text-blue-800 mb-2">
            O arquivo deve conter as seguintes colunas (nesta ordem):
          </p>
          <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
            <li>SÃâ€°RIE (ex: M, G, CJCJ)</li>
            <li>RG (nÃºmero do animal)</li>
            <li>LOCAL (nome do piquete)</li>
            <li>TOURO_1Âª I.A (nome do touro usado na IA)</li>
            <li>SÃâ€°RIE (pai) - sÃ©rie do touro</li>
            <li>RG (pai) - RG do touro</li>
            <li>DATA I.A (data da inseminaÃ§Ã£o)</li>
            <li>DATA DG 1Âª I.A (data do diagnÃ³stico de gestaÃ§Ã£o)</li>
            <li>Result (resultado: Prenha, Vazia, Pendente, etc.)</li>
          </ol>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar arquivo Excel:
            </label>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
              disabled={importando}
            />
            {arquivo && (
              <p className="mt-2 text-sm text-green-600">
                âÅ“â€œ Arquivo selecionado: {arquivo.name}
              </p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={!arquivo || importando}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
              !arquivo || importando
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {importando ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importando...
              </span>
            ) : (
              'ðÅ¸â€œ¤ Importar Dados'
            )}
          </button>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-semibold">â�Å’ Erro:</p>
          <p className="text-red-700 text-sm">{erro}</p>
        </div>
      )}

      {resultado && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-3">âÅ“â€¦ ImportaÃ§Ã£o ConcluÃ­da!</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded p-3 border border-green-200">
              <p className="text-sm text-gray-600">Piquetes Processados:</p>
              <p className="text-2xl font-bold text-green-700">{resultado.piquetesProcessados}</p>
              <p className="text-xs text-gray-500">({resultado.piquetesCriados} novos)</p>
            </div>
            
            <div className="bg-white rounded p-3 border border-green-200">
              <p className="text-sm text-gray-600">Animais Processados:</p>
              <p className="text-2xl font-bold text-green-700">{resultado.animaisProcessados}</p>
              <p className="text-xs text-gray-500">
                {resultado.animaisCriados} novos, {resultado.animaisAtualizados} atualizados
              </p>
            </div>
          </div>

          {resultado.erros && resultado.erros.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-orange-800 mb-2">
                âÅ¡ ï¸� Erros encontrados ({resultado.erros.length}):
              </p>
              <div className="max-h-40 overflow-y-auto bg-white rounded border border-orange-200 p-2">
                {resultado.erros.map((erro, index) => (
                  <div key={index} className="text-xs text-orange-700 mb-1">
                    Linha {erro.linha}: {erro.serie} {erro.rg} - {erro.erro}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
