import { useState } from 'react';
import { 
  PlayIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function TesteLotes() {
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState(null);
  const [logs, setLogs] = useState([]);

  const adicionarLog = (mensagem, tipo = 'info') => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setLogs(prev => [...prev, { timestamp, mensagem, tipo }]);
  };

  const testarCadastroReceptoras = async () => {
    setLoading(true);
    setResultados(null);
    setLogs([]);
    
    adicionarLog('�Ÿš€ Iniciando teste de cadastro em lote de receptoras...', 'info');

    try {
      // Dados de exemplo para teste
      const receptorasTeste = [
        {
          brinco: 'R001',
          raca: 'Nelore',
          idade: 24,
          peso: 450.5,
          condicao_corporal: 3,
          status: 'Disponível',
          proprietario: 'Fazenda Teste',
          localizacao: 'Pasto A'
        },
        {
          brinco: 'R002',
          raca: 'Angus',
          idade: 30,
          peso: 520.0,
          condicao_corporal: 4,
          status: 'Disponível',
          proprietario: 'Fazenda Teste',
          localizacao: 'Pasto B'
        },
        {
          brinco: 'R003',
          raca: 'Nelore',
          idade: 18,
          peso: 380.0,
          condicao_corporal: 2,
          status: 'Disponível',
          proprietario: 'Fazenda Teste',
          localizacao: 'Pasto A'
        }
      ];

      adicionarLog(`�Ÿ“‹ Preparando ${receptorasTeste.length} receptoras para cadastro...`, 'info');

      const response = await fetch('/api/receptoras/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receptoras: receptorasTeste,
          usuario: 'Teste Sistema'
        })
      });

      const data = await response.json();

      if (response.ok) {
        adicionarLog(`�œ… Lote ${data.lote} criado com sucesso!`, 'success');
        adicionarLog(`�Ÿ“Š Processados: ${data.resumo.total_processados} | Sucessos: ${data.resumo.total_sucessos} | Erros: ${data.resumo.total_erros}`, 'info');
        adicionarLog(`�Ÿ“ˆ Taxa de sucesso: ${data.resumo.taxa_sucesso}`, 'success');
        
        setResultados(data);
      } else {
        adicionarLog(`�Œ Erro na API: ${data.message || 'Erro desconhecido'}`, 'error');
      }

    } catch (error) {
      adicionarLog(`�Ÿ’� Erro no teste: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testarConsultaLotes = async () => {
    setLoading(true);
    adicionarLog('�Ÿ”� Consultando lotes recentes...', 'info');

    try {
      const response = await fetch('/api/lotes?limit=10');
      const data = await response.json();

      if (response.ok) {
        adicionarLog(`�Ÿ“‹ Encontrados ${data.lotes.length} lotes`, 'info');
        adicionarLog(`�Ÿ“Š Total de lotes no sistema: ${data.stats.total_lotes}`, 'info');
        adicionarLog(`�Ÿ��️ Módulos ativos: ${data.stats.total_modulos}`, 'info');
        adicionarLog(`�š™️ Tipos de operação: ${data.stats.total_tipos}`, 'info');
        adicionarLog(`�Ÿ“� Total de registros: ${data.stats.total_registros}`, 'info');
        
        // Mostrar últimos lotes
        data.lotes.slice(0, 3).forEach(lote => {
          adicionarLog(`�Ÿ“� Lote ${lote.numero_lote}: ${lote.descricao} (${lote.status})`, 'info');
        });
      } else {
        adicionarLog(`�Œ Erro ao consultar lotes: ${data.message}`, 'error');
      }
    } catch (error) {
      adicionarLog(`�Ÿ’� Erro na consulta: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const limparLogs = () => {
    setLogs([]);
    setResultados(null);
  };

  const getLogIcon = (tipo) => {
    switch (tipo) {
      case 'success': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'error': return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default: return <InformationCircleIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogColor = (tipo) => {
    switch (tipo) {
      case 'success': return 'text-green-700 bg-green-50';
      case 'error': return 'text-red-700 bg-red-50';
      default: return 'text-blue-700 bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <PlayIcon className="h-8 w-8 text-green-600" />
            Teste do Sistema de Lotes
          </h1>
          <p className="mt-2 text-gray-600">
            Demonstração prática do sistema de rastreamento de operações em lote
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Painel de Controles */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                Testes Disponíveis
              </h3>
              
              <div className="space-y-4">
                <button
                  onClick={testarCadastroReceptoras}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayIcon className="h-5 w-5" />
                  {loading ? 'Testando...' : 'Testar Cadastro de Receptoras'}
                </button>

                <button
                  onClick={testarConsultaLotes}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChartBarIcon className="h-5 w-5" />
                  {loading ? 'Consultando...' : 'Consultar Lotes Recentes'}
                </button>

                <button
                  onClick={limparLogs}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Limpar Logs
                </button>
              </div>
            </div>

            {/* Resultados */}
            {resultados && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Resultado do Teste
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Número do Lote:</span>
                    <span className="text-blue-600 font-bold">{resultados.lote}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Total Processados:</span>
                    <span>{resultados.resumo.total_processados}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Sucessos:</span>
                    <span className="text-green-600">{resultados.resumo.total_sucessos}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Erros:</span>
                    <span className="text-red-600">{resultados.resumo.total_erros}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Taxa de Sucesso:</span>
                    <span className="text-green-600 font-bold">{resultados.resumo.taxa_sucesso}</span>
                  </div>
                </div>

                {resultados.resultados.erros.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-600 mb-2">Erros Encontrados:</h4>
                    <div className="space-y-1">
                      {resultados.resultados.erros.map((erro, index) => (
                        <div key={index} className="text-sm text-red-600">
                          �€� {erro.brinco}: {erro.erro}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-600" />
              Log de Execução
            </h3>
            
            <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-400 text-center">Nenhum log ainda. Execute um teste para ver os logs.</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className={`flex items-start gap-2 p-2 rounded ${getLogColor(log.tipo)}`}>
                      {getLogIcon(log.tipo)}
                      <span className="text-xs font-mono text-gray-300">{log.timestamp}</span>
                      <span className="text-sm">{log.mensagem}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informações do Sistema */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Como Funciona o Sistema de Lotes
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. Captura Automática</h4>
              <p className="text-sm text-gray-600">
                O middleware captura automaticamente todas as operações que passam pelas APIs configuradas.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. Geração de Lotes</h4>
              <p className="text-sm text-gray-600">
                Cada operação gera um lote único com número sequencial e informações detalhadas.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">3. Rastreamento</h4>
              <p className="text-sm text-gray-600">
                Todos os lotes são armazenados com status, usuário, IP e detalhes da operação.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}