import React, { useState } from 'react';

export default function ImportarTextoPiquetes({ onImportComplete }) {
  const [texto, setTexto] = useState('');
  const [validando, setValidando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [validacao, setValidacao] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

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
      const response = await fetch('/api/import/texto-piquetes', {
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
      const response = await fetch('/api/import/texto-piquetes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, modo: 'importar' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResultado(data.resultados);
        setTexto('');
        setValidacao(null);
        
        if (onImportComplete) {
          onImportComplete(data.resultados);
        }
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

  const limpar = () => {
    setTexto('');
    setValidacao(null);
    setResultado(null);
    setErro(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        📝 Importar via Texto - Piquetes e Animais
      </h2>

      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Como usar:</h3>
          <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
            <li>Copie os dados do Excel (Ctrl+C)</li>
            <li>Cole aqui na caixa de texto (Ctrl+V)</li>
            <li>Clique em "Validar Dados"</li>
            <li>Se estiver tudo OK, clique em "Importar"</li>
          </ol>
          <p className="text-xs text-blue-700 mt-2">
            💡 As colunas devem estar separadas por TAB (copiar do Excel mantém isso automaticamente)
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
              placeholder="Cole aqui os dados copiados do Excel...&#10;&#10;Exemplo:&#10;CJCJ	15639	PIQUETE 1	JAMBU FIV DA GAROUPA	AGJZ	878	05/12/25	05/01/26	P&#10;CJCJ	16235	PIQUETE 13	JAMBU FIV DA GAROUPA	AGJZ	878	13/11/25	16/12/25	P"
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

            <button
              onClick={limpar}
              disabled={validando || importando}
              className="px-4 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              🗑️ Limpar
            </button>
          </div>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-semibold">❌ Erro:</p>
          <p className="text-red-700 text-sm">{erro}</p>
        </div>
      )}

      {validacao && (
        <div className={`border rounded-lg p-4 mb-4 ${
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

          {validacao.preview && validacao.preview.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Preview (primeiros 10):
              </p>
              <div className="max-h-60 overflow-auto bg-white rounded border">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">Linha</th>
                      <th className="px-2 py-1 text-left">Série</th>
                      <th className="px-2 py-1 text-left">RG</th>
                      <th className="px-2 py-1 text-left">Local</th>
                      <th className="px-2 py-1 text-left">Data IA</th>
                      <th className="px-2 py-1 text-left">Data DG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validacao.preview.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-2 py-1">{item.linha}</td>
                        <td className="px-2 py-1">{item.serie}</td>
                        <td className="px-2 py-1">{item.rg}</td>
                        <td className="px-2 py-1">{item.local}</td>
                        <td className="px-2 py-1">{item.dataIA || '-'}</td>
                        <td className="px-2 py-1">{item.dataDG || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {resultado && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-3">✅ Importação Concluída!</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded p-3 border border-green-200">
              <p className="text-sm text-gray-600">Piquetes:</p>
              <p className="text-2xl font-bold text-green-700">{resultado.piquetesProcessados}</p>
              <p className="text-xs text-gray-500">({resultado.piquetesCriados} novos)</p>
            </div>
            
            <div className="bg-white rounded p-3 border border-green-200">
              <p className="text-sm text-gray-600">Animais:</p>
              <p className="text-2xl font-bold text-green-700">{resultado.animaisProcessados}</p>
              <p className="text-xs text-gray-500">
                {resultado.animaisCriados} novos, {resultado.animaisAtualizados} atualizados
              </p>
            </div>
          </div>

          <div className="bg-white rounded p-3 border border-green-200">
            <p className="text-sm text-gray-600">IAs Registradas:</p>
            <p className="text-xl font-bold text-green-700">{resultado.iasRegistradas}</p>
          </div>

          {resultado.erros && resultado.erros.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-orange-800 mb-2">
                ⚠️ Erros durante importação ({resultado.erros.length}):
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
  );
}
