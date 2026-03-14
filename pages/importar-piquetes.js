import React, { useState } from 'react';
import Layout from '../components/Layout';
import ImportarExcelPiquetes from '../components/ImportarExcelPiquetes';
import ImportarTextoPiquetes from '../components/ImportarTextoPiquetes';

export default function ImportarPiquetes() {
  const [ultimaImportacao, setUltimaImportacao] = useState(null);
  const [modoAtivo, setModoAtivo] = useState('texto'); // 'texto' ou 'excel'

  const handleImportComplete = (resultados) => {
    setUltimaImportacao({
      data: new Date().toLocaleString('pt-BR'),
      ...resultados
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Importar Dados de Piquetes
          </h1>
          <p className="text-gray-600">
            Importe dados de animais e piquetes a partir de texto ou planilhas Excel
          </p>
        </div>

        {/* Seletor de Modo */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setModoAtivo('texto')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              modoAtivo === 'texto'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ðÅ¸â€œ� Importar via Texto (Recomendado)
          </button>
          <button
            onClick={() => setModoAtivo('excel')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              modoAtivo === 'excel'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ðÅ¸â€œÅ  Importar via Excel
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {modoAtivo === 'texto' ? (
              <ImportarTextoPiquetes onImportComplete={handleImportComplete} />
            ) : (
              <ImportarExcelPiquetes onImportComplete={handleImportComplete} />
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-800 mb-3">ââ€ž¹ï¸� InformaÃ§Ãµes</h3>
              <div className="space-y-2 text-sm text-gray-600">
                {modoAtivo === 'texto' ? (
                  <>
                    <p>
                      <strong>Modo Texto:</strong> Copie e cole diretamente do Excel
                    </p>
                    <p>
                      <strong>ValidaÃ§Ã£o:</strong> Verifica os dados antes de importar
                    </p>
                    <p>
                      <strong>Formato:</strong> MantÃ©m automaticamente ao copiar do Excel
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Piquetes:</strong> SerÃ£o criados automaticamente se nÃ£o existirem
                    </p>
                    <p>
                      <strong>Animais:</strong> Novos animais serÃ£o cadastrados, existentes serÃ£o atualizados
                    </p>
                    <p>
                      <strong>InseminaÃ§Ãµes:</strong> Dados de IA e DG serÃ£o registrados automaticamente
                    </p>
                  </>
                )}
                <p className="text-green-600 font-semibold mt-2">
                  âÅ“â€¦ Todos os animais sÃ£o cadastrados como FÃÅ MEA
                </p>
              </div>
            </div>

            {ultimaImportacao && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-800 mb-3">ðÅ¸â€œÅ  ÃÅ¡ltima ImportaÃ§Ã£o</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    <strong>Data:</strong> {ultimaImportacao.data}
                  </p>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-gray-700">
                      <strong>Piquetes:</strong> {ultimaImportacao.piquetesProcessados}
                      <span className="text-green-600 ml-1">
                        (+{ultimaImportacao.piquetesCriados} novos)
                      </span>
                    </p>
                    <p className="text-gray-700">
                      <strong>Animais:</strong> {ultimaImportacao.animaisProcessados}
                      <span className="text-green-600 ml-1">
                        (+{ultimaImportacao.animaisCriados} novos)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">âÅ¡ ï¸� AtenÃ§Ã£o</h3>
              <p className="text-sm text-yellow-800">
                Certifique-se de que o arquivo Excel estÃ¡ no formato correto antes de importar.
                Dados incorretos podem causar problemas no sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
