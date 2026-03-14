/**
 * Componente para exibir detalhes de Nota Fiscal
 */
export default function DetalhesNotaFiscal({ body }) {
  if (!body.numeroNF && !body.numero && !body.notaFiscal && !body.fornecedor) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-900/30 to-green-800/20 p-4 rounded-lg border border-green-500/30">
      <h4 className="font-bold text-green-300 mb-3 flex items-center gap-2">
        📄 NOTA FISCAL COMPLETA
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SecaoIdentificacaoNF body={body} />
        <SecaoFornecedor body={body} />
      </div>
    </div>
  );
}

function SecaoIdentificacaoNF({ body }) {
  return (
    <div className="bg-gray-800/50 p-3 rounded">
      <h5 className="text-green-200 font-semibold mb-2">📋 Identificação</h5>
      {(body.numeroNF || body.numero || body.notaFiscal) && (
        <div className="mb-2">
          <span className="text-gray-400">Número NF:</span>
          <span className="text-white font-bold ml-1 text-lg">
            {body.numeroNF || body.numero || body.notaFiscal}
          </span>
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
      {body.naturezaOperacao && (
        <div className="mb-1">
          <span className="text-gray-400">Natureza:</span>{' '}
          <span className="text-white">{body.naturezaOperacao}</span>
        </div>
      )}
    </div>
  );
}

function SecaoFornecedor({ body }) {
  return (
    <div className="bg-gray-800/50 p-3 rounded">
      <h5 className="text-green-200 font-semibold mb-2">🏢 Fornecedor</h5>
      {body.fornecedor && (
        <div className="mb-1">
          <span className="text-gray-400">Nome:</span>{' '}
          <span className="text-white font-bold">{body.fornecedor}</span>
        </div>
      )}
      {(body.valorTotal || body.valorCompra) && (
        <div className="mt-2 p-2 bg-green-900/30 rounded">
          <span className="text-green-200">Valor Total: </span>
          <span className="text-green-100 font-bold text-lg">
            R$ {parseFloat(body.valorTotal || body.valorCompra).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}

