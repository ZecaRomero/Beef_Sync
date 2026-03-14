/**
 * Componente para exibir detalhes de Custo
 */
export default function DetalhesCusto({ body }) {
  if (!body.tipo || !body.valor) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 p-4 rounded-lg border border-yellow-500/30">
      <h4 className="font-bold text-yellow-300 mb-3 flex items-center gap-2">
        💰 DETALHES DO CUSTO
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SecaoClassificacao body={body} />
        <SecaoValor body={body} />
      </div>
    </div>
  );
}

function SecaoClassificacao({ body }) {
  return (
    <div className="bg-gray-800/50 p-3 rounded">
      <h5 className="text-yellow-200 font-semibold mb-2">📊 Classificação</h5>
      {body.tipo && (
        <div className="mb-1">
          <span className="text-gray-400">Tipo:</span>{' '}
          <span className="text-white font-bold">{body.tipo}</span>
        </div>
      )}
      {body.subtipo && (
        <div className="mb-1">
          <span className="text-gray-400">Subtipo:</span>{' '}
          <span className="text-white">{body.subtipo}</span>
        </div>
      )}
      {body.data && (
        <div className="mb-1">
          <span className="text-gray-400">Data:</span>{' '}
          <span className="text-white">
            {new Date(body.data).toLocaleDateString('pt-BR')}
          </span>
        </div>
      )}
    </div>
  );
}

function SecaoValor({ body }) {
  return (
    <div className="bg-gray-800/50 p-3 rounded">
      <h5 className="text-yellow-200 font-semibold mb-2">💵 Valor</h5>
      {body.valor && (
        <div className="p-3 bg-yellow-900/30 rounded text-center">
          <span className="text-yellow-100 font-bold text-xl">
            R$ {parseFloat(body.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}

