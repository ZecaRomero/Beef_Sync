import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function MigrarDados() {
  const router = useRouter();
  const [dadosLocalStorage, setDadosLocalStorage] = useState(null);
  const [migrando, setMigrando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [etapaAtual, setEtapaAtual] = useState('');

  useEffect(() => {
    verificarDadosLocalStorage();
  }, []);

  const verificarDadosLocalStorage = () => {
    const nfsReceptoras = localStorage.getItem('nfsReceptoras');
    const naturezasOperacao = localStorage.getItem('naturezasOperacao');
    const origensReceptoras = localStorage.getItem('origensReceptoras');

    const dados = {
      nfsReceptoras: nfsReceptoras ? JSON.parse(nfsReceptoras) : [],
      naturezasOperacao: naturezasOperacao ? JSON.parse(naturezasOperacao) : [],
      origensReceptoras: origensReceptoras ? JSON.parse(origensReceptoras) : []
    };

    const total = dados.nfsReceptoras.length + 
                  dados.naturezasOperacao.length + 
                  dados.origensReceptoras.length;

    setDadosLocalStorage({
      ...dados,
      total,
      temDados: total > 0
    });
  };

  const migrarDados = async () => {
    setMigrando(true);
    setResultado(null);

    try {
      setEtapaAtual('Preparando dados para migração...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setEtapaAtual('Enviando dados para o banco de dados...');
      const response = await fetch('/api/migrate-localstorage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nfsReceptoras: dadosLocalStorage.nfsReceptoras,
          naturezasOperacao: dadosLocalStorage.naturezasOperacao,
          origensReceptoras: dadosLocalStorage.origensReceptoras
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na migração: ${response.statusText}`);
      }

      const data = await response.json();

      setEtapaAtual('Migração concluída!');
      setResultado({
        sucesso: true,
        ...data.results
      });

    } catch (error) {
      console.error('Erro ao migrar dados:', error);
      setResultado({
        sucesso: false,
        erro: error.message
      });
    } finally {
      setMigrando(false);
      setEtapaAtual('');
    }
  };

  const limparLocalStorage = () => {
    if (window.confirm(
      '⚠️ ATENÇÃO!\n\n' +
      'Isso vai APAGAR todos os dados do localStorage.\n' +
      'Certifique-se de que a migração foi concluída com sucesso!\n\n' +
      'Deseja continuar?'
    )) {
      localStorage.removeItem('nfsReceptoras');
      localStorage.removeItem('naturezasOperacao');
      localStorage.removeItem('origensReceptoras');
      
      alert('✅ LocalStorage limpo com sucesso!');
      verificarDadosLocalStorage();
      setResultado(null);
    }
  };

  const migrarELimpar = async () => {
    await migrarDados();
    
    // Aguardar um pouco para mostrar o resultado
    setTimeout(() => {
      if (resultado?.sucesso) {
        if (window.confirm(
          '✅ Migração concluída com sucesso!\n\n' +
          'Deseja limpar os dados do localStorage agora?'
        )) {
          limparLocalStorage();
          setTimeout(() => {
            router.push('/');
          }, 1500);
        }
      }
    }, 1000);
  };

  if (!dadosLocalStorage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">🔄 Migração de Dados</h1>
              <p className="text-blue-100 mt-2">
                Migre seus dados do localStorage para o PostgreSQL
              </p>
            </div>
            <DocumentArrowUpIcon className="h-16 w-16 opacity-50" />
          </div>
        </div>

        {/* Status dos Dados */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📊 Dados Encontrados no LocalStorage
          </h2>

          {!dadosLocalStorage.temDados ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ✅ Nenhum dado encontrado no localStorage!
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Você já está usando apenas o banco de dados PostgreSQL.
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voltar ao Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                      Atenção: Dados Antigos Encontrados
                    </h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                      Encontramos {dadosLocalStorage.total} item(ns) salvos no localStorage do navegador.
                      Migre-os para o banco de dados PostgreSQL para garantir a persistência.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Notas Fiscais</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dadosLocalStorage.nfsReceptoras.length}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Naturezas de Operação</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dadosLocalStorage.naturezasOperacao.length}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Origens de Receptoras</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dadosLocalStorage.origensReceptoras.length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        {dadosLocalStorage.temDados && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              ⚡ Ações Disponíveis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={migrarDados}
                disabled={migrando}
                className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {migrando ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Migrando...
                  </>
                ) : (
                  <>
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    Migrar Dados
                  </>
                )}
              </button>

              <button
                onClick={migrarELimpar}
                disabled={migrando}
                className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Migrar e Limpar
              </button>

              <button
                onClick={limparLocalStorage}
                disabled={migrando}
                className="flex items-center justify-center px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Apenas Limpar
              </button>

              <button
                onClick={verificarDadosLocalStorage}
                disabled={migrando}
                className="flex items-center justify-center px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Atualizar
              </button>
            </div>
          </div>
        )}

        {/* Progresso */}
        {migrando && etapaAtual && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
            <div className="flex items-center">
              <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin mr-3" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                  Processando...
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  {etapaAtual}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div className={`rounded-xl p-6 mb-6 ${
            resultado.sucesso 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start">
              {resultado.sucesso ? (
                <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
              ) : (
                <XCircleIcon className="h-8 w-8 text-red-600 mr-3 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold text-lg ${
                  resultado.sucesso 
                    ? 'text-green-900 dark:text-green-200' 
                    : 'text-red-900 dark:text-red-200'
                }`}>
                  {resultado.sucesso ? '✅ Migração Concluída com Sucesso!' : '❌ Erro na Migração'}
                </h3>
                
                {resultado.sucesso ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-green-800 dark:text-green-300">
                      📋 Notas Fiscais migradas: <strong>{resultado.nfsMigradas}</strong>
                    </p>
                    <p className="text-green-800 dark:text-green-300">
                      🏷️ Naturezas de Operação migradas: <strong>{resultado.naturezasMigradas}</strong>
                    </p>
                    <p className="text-green-800 dark:text-green-300">
                      📍 Origens de Receptoras migradas: <strong>{resultado.origensMigradas}</strong>
                    </p>
                    
                    {resultado.erros && resultado.erros.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                        <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                          ⚠️ {resultado.erros.length} item(ns) com erro:
                        </p>
                        <ul className="mt-2 text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                          {resultado.erros.map((erro, index) => (
                            <li key={index}>
                              • {erro.tipo}: {erro.nome || erro.nf} - {erro.erro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-800 dark:text-red-300 mt-2">
                    {resultado.erro}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            ℹ️ Informações Importantes
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <li>• <strong>Migrar Dados</strong>: Copia os dados do localStorage para o PostgreSQL</li>
            <li>• <strong>Migrar e Limpar</strong>: Migra os dados e remove do localStorage automaticamente</li>
            <li>• <strong>Apenas Limpar</strong>: Remove dados do localStorage (use após confirmar migração)</li>
            <li>• <strong>Recomendação</strong>: Use "Migrar e Limpar" para processo completo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

