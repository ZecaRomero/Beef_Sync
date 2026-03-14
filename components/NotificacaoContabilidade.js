import React, { useEffect, useState } from 'react'

;
import { 
  ExclamationTriangleIcon, 
  XMarkIcon, 
  CalendarIcon,
  DocumentTextIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function NotificacaoContabilidade({ lembrete, onFechar, onAcao }) {
  const [mostrar, setMostrar] = useState(true);
  const [tempoRestante, setTempoRestante] = useState('');

  useEffect(() => {
    if (!lembrete) return;

    const calcularTempoRestante = () => {
      const agora = new Date();
      const vencimento = new Date(lembrete.dataVencimento);
      const diferenca = vencimento - agora;

      if (diferenca <= 0) {
        setTempoRestante('Vencido!');
        return;
      }

      const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (dias > 0) {
        setTempoRestante(`${dias} dia${dias > 1 ? 's' : ''} restante${dias > 1 ? 's' : ''}`);
      } else if (horas > 0) {
        setTempoRestante(`${horas} hora${horas > 1 ? 's' : ''} restante${horas > 1 ? 's' : ''}`);
      } else {
        setTempoRestante('Menos de 1 hora!');
      }
    };

    calcularTempoRestante();
    const interval = setInterval(calcularTempoRestante, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, [lembrete]);

  const fechar = () => {
    setMostrar(false);
    setTimeout(() => onFechar && onFechar(), 300);
  };

  if (!lembrete || !mostrar) return null;

  const isVencido = new Date() > new Date(lembrete.dataVencimento);
  const isUrgente = new Date() > new Date(new Date(lembrete.dataVencimento) - 24 * 60 * 60 * 1000); // 1 dia antes

  return (
    <div className={`fixed bottom-20 right-4 z-[50] transform transition-all duration-300 ${
      mostrar ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`max-w-md w-full rounded-lg shadow-lg border-2 p-4 ${
        isVencido 
          ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600'
          : isUrgente
          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            {isVencido ? (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
            ) : (
              <CalendarIcon className="h-6 w-6 text-yellow-600 mr-2" />
            )}
            <h3 className={`font-bold text-sm ${
              isVencido 
                ? 'text-red-800 dark:text-red-300'
                : 'text-yellow-800 dark:text-yellow-300'
            }`}>
              {isVencido ? '🚨 PRAZO VENCIDO!' : '⏰ Lembrete Contabilidade'}
            </h3>
          </div>
          <button
            onClick={fechar}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="mb-4">
          <p className={`text-sm font-medium mb-2 ${
            isVencido 
              ? 'text-red-700 dark:text-red-300'
              : 'text-yellow-700 dark:text-yellow-300'
          }`}>
            {lembrete.titulo}
          </p>
          <p className={`text-xs mb-2 ${
            isVencido 
              ? 'text-red-600 dark:text-red-400'
              : 'text-yellow-600 dark:text-yellow-400'
          }`}>
            Vencimento: {new Date(lembrete.dataVencimento).toLocaleDateString('pt-BR')}
          </p>
          <p className={`text-xs font-bold ${
            isVencido 
              ? 'text-red-800 dark:text-red-200'
              : isUrgente
              ? 'text-orange-800 dark:text-orange-200'
              : 'text-yellow-800 dark:text-yellow-200'
          }`}>
            {tempoRestante}
          </p>
        </div>

        {/* Lista de itens */}
        <div className="mb-4">
          <p className={`text-xs font-medium mb-2 ${
            isVencido 
              ? 'text-red-700 dark:text-red-300'
              : 'text-yellow-700 dark:text-yellow-300'
          }`}>
            Documentos para envio:
          </p>
          <ul className="space-y-1">
            {lembrete.itens.slice(0, 3).map((item, index) => (
              <li key={index} className={`text-xs flex items-center ${
                isVencido 
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                <span className="mr-2">•</span>
                {item}
              </li>
            ))}
            {lembrete.itens.length > 3 && (
              <li className={`text-xs ${
                isVencido 
                  ? 'text-red-500 dark:text-red-500'
                  : 'text-yellow-500 dark:text-yellow-500'
              }`}>
                ... e mais {lembrete.itens.length - 3} itens
              </li>
            )}
          </ul>
        </div>

        {/* Ações */}
        <div className="flex space-x-2">
          <button
            onClick={() => onAcao && onAcao('gerar_relatorio')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              isVencido
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <DocumentTextIcon className="h-4 w-4 inline mr-1" />
            Gerar Relatório
          </button>
          <button
            onClick={() => onAcao && onAcao('marcar_concluido')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              isVencido
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            ✅ Concluído
          </button>
        </div>

        {/* Botão para abrir modal completo */}
        <button
          onClick={() => onAcao && onAcao('abrir_modal')}
          className={`w-full mt-2 px-3 py-2 text-xs font-medium rounded-lg border-2 border-dashed transition-colors ${
            isVencido
              ? 'border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30'
              : 'border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/30'
          }`}
        >
          Ver Detalhes Completos
        </button>
      </div>
    </div>
  );
}