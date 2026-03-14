import React, { useEffect, useState } from 'react'
import { 
  CalendarIcon, 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EnvelopeIcon,
  ClockIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useContabilidadeLembretes } from '../hooks/useContabilidadeLembretes';
import NotificacaoContabilidade from './NotificacaoContabilidade';

export default function ContabilidadeLembretes() {
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarNotificacao, setMostrarNotificacao] = useState(false);
  const [lembreteAtivo, setLembreteAtivo] = useState(null);
  
  const {
    configuracoes,
    lembretes,
    salvarConfiguracoes,
    marcarConcluido,
    gerarRelatorioNascimentos,
    calcularProximoVencimento
  } = useContabilidadeLembretes();

  // Somente para o desenvolvedor Zeca (localhost) ââ‚¬â€� nÃ£o exibir para usuÃ¡rios externos nem mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || window.innerWidth < 768;
    setIsDeveloper(isLocalhost && !isMobile);
  }, []);

  useEffect(() => {
    // Verificar se hÃ¡ lembretes pendentes para mostrar notificaÃ§Ã£o
    const lembretePendente = lembretes.find(l => 
      l.status === 'pendente' && 
      l.tipo === 'contabilidade'
    );
    
    // SÃ³ mostrar notificaÃ§Ã£o se houver lembrete pendente E nÃ£o estiver mostrando jÃ¡
    if (lembretePendente && !mostrarNotificacao && !lembreteAtivo) {
      setLembreteAtivo(lembretePendente);
      setMostrarNotificacao(true);
    } else if (!lembretePendente && mostrarNotificacao) {
      // Se nÃ£o hÃ¡ mais lembretes pendentes, fechar a notificaÃ§Ã£o
      setMostrarNotificacao(false);
      setLembreteAtivo(null);
    }
  }, [lembretes]);

  // FunÃ§Ã£o para lidar com aÃ§Ãµes da notificaÃ§Ã£o
  const handleAcaoNotificacao = (acao) => {
    switch (acao) {
      case 'gerar_relatorio':
        const resultado = gerarRelatorioNascimentos();
        if (resultado.sucesso) {
          alert(`âÅ“â€¦ RelatÃ³rio gerado com sucesso!\n${resultado.quantidade} nascimentos encontrados.`);
        } else {
          alert(`â�Å’ Erro ao gerar relatÃ³rio: ${resultado.erro}`);
        }
        break;
      case 'marcar_concluido':
        if (lembreteAtivo) {
          marcarConcluido(lembreteAtivo.id);
          setMostrarNotificacao(false);
          setLembreteAtivo(null);
        }
        break;
      case 'abrir_modal':
        setMostrarModal(true);
        setMostrarNotificacao(false);
        break;
    }
  };

  // Bloquear para nÃ£o-desenvolvedor (usuÃ¡rio externo ou mobile)
  if (!isDeveloper) return null;

  return (
    <>
      {/* NotificaÃ§Ã£o Toast */}
      {mostrarNotificacao && lembreteAtivo && (
        <NotificacaoContabilidade
          lembrete={lembreteAtivo}
          onFechar={() => {
            setMostrarNotificacao(false);
            setLembreteAtivo(null);
          }}
          onAcao={handleAcaoNotificacao}
        />
      )}

      {/* BotÃ£o flutuante de lembretes */}
      <div className="fixed top-20 left-6 z-40">
        <button
          onClick={() => setMostrarModal(true)}
          className={`relative p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
            lembretes.filter(l => l.status === 'pendente').length > 0
              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
          title="Lembretes da Contabilidade"
        >
          {lembretes.filter(l => l.status === 'pendente').length > 0 ? (
            <BellIcon className="h-6 w-6" />
          ) : (
            <CalendarIcon className="h-6 w-6" />
          )}
          {lembretes.filter(l => l.status === 'pendente').length > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
              {lembretes.filter(l => l.status === 'pendente').length}
            </span>
          )}
        </button>
      </div>

      {/* Modal de Lembretes */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
                Lembretes da Contabilidade
              </h2>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* ConteÃºdo */}
            <div className="p-6">
              {/* ConfiguraÃ§Ãµes */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
                  âÅ¡â„¢ï¸� ConfiguraÃ§Ãµes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Email da Contabilidade:
                    </label>
                    <input
                      type="email"
                      value={configuracoes.emailContabilidade}
                      onChange={(e) => salvarConfiguracoes({
                        ...configuracoes,
                        emailContabilidade: e.target.value
                      })}
                      placeholder="contabilidade@empresa.com"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Dias de AntecedÃªncia:
                    </label>
                    <select
                      value={configuracoes.diasAntecedencia}
                      onChange={(e) => salvarConfiguracoes({
                        ...configuracoes,
                        diasAntecedencia: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>1 dia antes</option>
                      <option value={2}>2 dias antes</option>
                      <option value={3}>3 dias antes</option>
                      <option value={5}>5 dias antes</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex items-center">
                  <input
                    type="checkbox"
                    id="ativarLembretes"
                    checked={configuracoes.ativo}
                    onChange={(e) => salvarConfiguracoes({
                      ...configuracoes,
                      ativo: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="ativarLembretes" className="ml-2 text-sm text-blue-700 dark:text-blue-300">
                    Ativar lembretes automÃ¡ticos
                  </label>
                </div>
              </div>

              {/* PrÃ³ximo Vencimento */}
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-600 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                  ðÅ¸â€œâ€¦ PrÃ³ximo Vencimento
                </h3>
                <ProximoVencimento calcularProximoVencimento={calcularProximoVencimento} />
              </div>

              {/* Lista de Lembretes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  ðÅ¸â€œâ€¹ Lembretes Recentes
                </h3>
                
                {lembretes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum lembrete ativo no momento</p>
                  </div>
                ) : (
                  lembretes.slice(0, 5).map(lembrete => (
                    <LembreteCard 
                      key={lembrete.id} 
                      lembrete={lembrete} 
                      onMarcarConcluido={marcarConcluido}
                      onGerarRelatorio={gerarRelatorioNascimentos}
                    />
                  ))
                )}
              </div>

              {/* AÃ§Ãµes RÃ¡pidas */}
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-600 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">
                  ðÅ¸Å¡â‚¬ AÃ§Ãµes RÃ¡pidas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={gerarRelatorioNascimentos}
                    className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Gerar RelatÃ³rio de Nascimentos
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open('/reports', '_blank');
                      }
                    }}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Acessar RelatÃ³rios Gerais
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Componente para mostrar prÃ³ximo vencimento
function ProximoVencimento({ calcularProximoVencimento }) {

  const proximoVencimento = calcularProximoVencimento();
  const diasRestantes = Math.ceil((proximoVencimento - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Data:</strong> {proximoVencimento.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          5Âº dia Ãºtil do mÃªs
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
          {diasRestantes > 0 ? `${diasRestantes} dias` : 'Hoje!'}
        </p>
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          {diasRestantes > 0 ? 'restantes' : 'Vencimento'}
        </p>
      </div>
    </div>
  );
}

// Componente para card de lembrete
function LembreteCard({ lembrete, onMarcarConcluido, onGerarRelatorio }) {
  const isVencido = new Date() > new Date(lembrete.dataVencimento);
  const isPendente = lembrete.status === 'pendente';

  return (
    <div className={`p-4 rounded-lg border-2 ${
      lembrete.status === 'concluido' 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-600'
        : isVencido
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-600'
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-600'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {lembrete.titulo}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {lembrete.descricao}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {lembrete.status === 'concluido' ? (
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          ) : isVencido ? (
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          ) : (
            <ClockIcon className="h-6 w-6 text-yellow-600" />
          )}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Itens para envio:
        </p>
        <ul className="space-y-1">
          {lembrete.itens.map((item, index) => (
            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <span className="mr-2">ââ‚¬¢</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {isPendente && (
        <div className="flex space-x-2">
          <button
            onClick={onGerarRelatorio}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            ðÅ¸â€œÅ  Gerar RelatÃ³rio
          </button>
          <button
            onClick={() => onMarcarConcluido(lembrete.id)}
            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
          >
            âÅ“â€¦ Marcar como Enviado
          </button>
        </div>
      )}

      {lembrete.status === 'concluido' && (
        <div className="text-sm text-green-600 dark:text-green-400">
          âÅ“â€¦ ConcluÃ­do em {new Date(lembrete.concluidoEm).toLocaleDateString('pt-BR')}
        </div>
      )}
    </div>
  );
}