import React, { useState } from 'react';

export default function ImportarTextoInseminacoes({ isOpen, onClose, onImportComplete }) {
  const [texto, setTexto] = useState('');
  const [validando, setValidando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [validacao, setValidacao] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  if (!isOpen) return null;

  const handleValidar = async () => {
    if (!texto.trim()) {
      setErro('Cole o texto dos dados para validar');
      return;
    }

    setValidando(true);
    setErro(null);
    setValidacao(null);
    setResultado(null);

    try {
      const response = await fetch('/api/import/texto-simples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, modo: 'validar' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setValidacao(data);
      } else {
        setErro(data.error || 'Erro ao validar texto');
      }
    } catch (error) {
      console.error('Erro ao validar:', error);
      setErro('Erro ao processar texto. Verifique o formato.');
    } finally {
      setValidando(false);
    }
  };

  const handleImportar = async () => {
    if (!validacao || !validacao.valido) {
      setErro('Corrija os erros antes de importar');
      return;
    }

    setImportando(true);
    setErro(null);

    try {
      const response = await fetch('/api/import/texto-simples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, modo: 'importar' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResultado(data.resultados);
        
        if (onImportComplete) {
          onImportComplete(data.resultados);
        }
        
        // Fechar após 3 segundos
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        setErro(data.error || 'Erro ao importar dados');
      }
    } catch (error) {
      console.error('Erro ao importar:', error);
      setErro('Erro ao importar dados');
    } finally {
      setImportando(false);
    }
  };

  const handleClose = () => {
    setTexto('');
    setValidacao(null);
    setResultado(null);
    setErro(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            📝 Importar Inseminações via Texto
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={validando || importando}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Como usar:</h3>
            <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
              <li>Copie os dados do Excel (Ctrl+C)</li>
              <li>Cole aqui na caixa de texto (Ctrl+V)</li>
              <li>Clique em "Validar Dados"</li>
              <li>Se estiver tudo OK, clique em "Importar"</li>
            </ol>
            <p className="text-xs text-blue-700 mt-2">
              💡 Colunas aceitas: SÉRIE | RG | LOCAL | TOURO ou ACASALAMENTO | DATA IA ou DATA I.A | DATA DG ou PREVISAO DE PARTO | Result (LOCAL e Result são opcionais)
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cole os dados aqui:
              </label>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Cole aqui os dados copiados do Excel...&#10;&#10;Exemplo:&#10;CJCJ	15639	PIQUETE 1	JAMBU FIV	AGJZ	878	05/12/25	05/01/26	P"
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                disabled={validando || importando}
              />
              <p className="mt-1 text-xs text-gray-500">
                {texto.split('\n').filter(l => l.trim()).length} linhas
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleValidar}
                disabled={!texto.trim() || validando || importando}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                  !texto.trim() || validando || importando
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {validando ? '⏳ Validando...' : '🔍 Validar Dados'}
              </button>

              {validacao && validacao.valido && (
                <button
                  onClick={handleImportar}
                  disabled={importando}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                    importando
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {importando ? '⏳ Importando...' : '✅ Importar Agora'}
                </button>
              )}
            </div>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <p className="text-red-800 font-semibold">❌ Erro:</p>
              <p className="text-red-700 text-sm">{erro}</p>
            </div>
          )}

          {validacao && (
            <div className={`border rounded-lg p-4 mt-4 ${
              validacao.valido ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className={`font-semibold mb-3 ${
                validacao.valido ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {validacao.valido ? '✅ Validação OK!' : '⚠️ Erros Encontrados'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded p-3 border">
                  <p className="text-sm text-gray-600">Total de Linhas:</p>
                  <p className="text-2xl font-bold text-gray-800">{validacao.totalLinhas}</p>
                </div>
                
                <div className="bg-white rounded p-3 border">
                  <p className="text-sm text-gray-600">Erros:</p>
                  <p className={`text-2xl font-bold ${validacao.erros.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {validacao.erros.length}
                  </p>
                </div>
              </div>

              {validacao.erros.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-yellow-800 mb-2">
                    Erros de validação:
                  </p>
                  <div className="max-h-40 overflow-y-auto bg-white rounded border p-2">
                    {validacao.erros.map((erro, index) => (
                      <div key={index} className="text-xs text-red-700 mb-1">
                        Linha {erro.linha}: {erro.erro}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {resultado && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-green-900 mb-3">✅ Importação Concluída!</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded p-3 border border-green-200">
                  <p className="text-sm text-gray-600">Animais:</p>
                  <p className="text-2xl font-bold text-green-700">{resultado.animaisProcessados}</p>
                </div>
                
                <div className="bg-white rounded p-3 border border-green-200">
                  <p className="text-sm text-gray-600">Piquetes:</p>
                  <p className="text-2xl font-bold text-green-700">{resultado.piquetesProcessados}</p>
                </div>

                <div className="bg-white rounded p-3 border border-green-200">
                  <p className="text-sm text-gray-600">IAs:</p>
                  <p className="text-2xl font-bold text-green-700">{resultado.iasRegistradas}</p>
                </div>
              </div>

              <p className="text-sm text-green-700 mt-3 text-center">
                Fechando automaticamente...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
