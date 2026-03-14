/**
 * Componente para exibir informações técnicas da requisição
 */
export default function DetalhesInformacoesTecnicas({ dados }) {
  if (!dados) return null;

  return (
    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 p-4 rounded-lg border border-gray-500/30">
      <h4 className="font-bold text-gray-300 mb-3 flex items-center gap-2">
        🔧 INFORMAÇÕES TÉCNICAS DETALHADAS
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SecaoRequisicao dados={dados} />
        <SecaoTimestamp dados={dados} />
      </div>
    </div>
  );
}

function SecaoRequisicao({ dados }) {
  return (
    <div className="bg-gray-800/50 p-3 rounded">
      <h5 className="text-gray-200 font-semibold mb-2">🌐 Requisição</h5>
      {dados.method && (
        <div className="mb-1">
          <span className="text-gray-400">Método HTTP:</span>{' '}
          <span className="text-white font-mono bg-gray-700 px-2 py-1 rounded">{dados.method}</span>
        </div>
      )}
      {dados.url && (
        <div className="mb-1">
          <span className="text-gray-400">Endpoint:</span>{' '}
          <span className="text-white font-mono text-xs bg-gray-700 px-2 py-1 rounded break-all">
            {dados.url}
          </span>
        </div>
      )}
      {dados.ip_origem && (
        <div className="mb-1">
          <span className="text-gray-400">IP Origem:</span>{' '}
          <span className="text-white font-mono">{dados.ip_origem}</span>
        </div>
      )}
    </div>
  );
}

function SecaoTimestamp({ dados }) {
  return (
    <div className="bg-gray-800/50 p-3 rounded">
      <h5 className="text-gray-200 font-semibold mb-2">⏰ Timestamp</h5>
      {dados.timestamp && (
        <div className="space-y-1">
          <div>
            <span className="text-gray-400">Data/Hora:</span>{' '}
            <span className="text-white font-bold">
              {new Date(dados.timestamp).toLocaleString('pt-BR')}
            </span>
          </div>
          <div>
            <span className="text-gray-400">ISO:</span>{' '}
            <span className="text-white font-mono text-xs">{dados.timestamp}</span>
          </div>
        </div>
      )}
    </div>
  );
}

