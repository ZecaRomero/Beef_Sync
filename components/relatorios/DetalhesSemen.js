/**
 * Componente para exibir detalhes de Sêmen
 */
export default function DetalhesSemen({ body }) {
  if (!body.touro && !body.nome_touro && !body.nomeTouro && !body.quantidade_doses && !body.quantidadeDoses) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-900/30 to-indigo-800/20 p-4 rounded-lg border border-indigo-500/30">
      <h4 className="font-bold text-indigo-300 mb-3 flex items-center gap-2">
        🧬 INFORMAÇÕES DO SÊMEN
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SecaoTouro body={body} />
        <SecaoEstoque body={body} />
        <SecaoLocalizacao body={body} />
      </div>
    </div>
  );
}

function SecaoTouro({ body }) {
  return (
    <div className="bg-gray-800/50 p-3 rounded">
      <h5 className="text-indigo-200 font-semibold mb-2">🐂 Touro</h5>
      {(body.touro || body.nome_touro || body.nomeTouro) && (
        <div className="mb-1">
          <span className="text-gray-400">Nome:</span>{' '}
          <span className="text-white font-bold">{body.touro || body.nome_touro || body.nomeTouro}</span>
        </div>
      )}
      {(body.rg_touro || body.rgTouro) && (
        <div className="mb-1">
          <span className="text-gray-400">RG:</span>{' '}
          <span className="text-white">{body.rg_touro || body.rgTouro}</span>
        </div>
      )}
      {body.raca && (
        <div className="mb-1">
          <span className="text-gray-400">Raça:</span>{' '}
          <span className="text-white">{body.raca}</span>
        </div>
      )}
    </div>
  );
}

function SecaoEstoque({ body }) {
  return (
    <div className="bg-gray-800/50 p-3 rounded">
      <h5 className="text-indigo-200 font-semibold mb-2">📦 Estoque</h5>
      {(body.quantidade_doses || body.quantidadeDoses) && (
        <div className="mb-1">
          <span className="text-gray-400">Doses:</span>{' '}
          <span className="text-white font-bold">{body.quantidade_doses || body.quantidadeDoses}</span>
        </div>
      )}
      {(body.doses_disponiveis || body.dosesDisponiveis) && (
        <div className="mb-1">
          <span className="text-gray-400">Disponíveis:</span>{' '}
          <span className="text-white">{body.doses_disponiveis || body.dosesDisponiveis}</span>
        </div>
      )}
      {(body.valor_unitario || body.valorUnitario || body.valorCompra) && (
        <div className="mb-1">
          <span className="text-gray-400">Valor:</span>{' '}
          <span className="text-white">R$ {body.valor_unitario || body.valorUnitario || body.valorCompra}</span>
        </div>
      )}
    </div>
  );
}

function SecaoLocalizacao({ body }) {
  return (
    <div className="bg-gray-800/50 p-3 rounded">
      <h5 className="text-indigo-200 font-semibold mb-2">🏠 Localização</h5>
      {(body.localizacao || body.local) && (
        <div className="mb-1">
          <span className="text-gray-400">Local:</span>{' '}
          <span className="text-white">{body.localizacao || body.local}</span>
        </div>
      )}
      {(body.rack_touro || body.rackTouro) && (
        <div className="mb-1">
          <span className="text-gray-400">Rack:</span>{' '}
          <span className="text-white">{body.rack_touro || body.rackTouro}</span>
        </div>
      )}
      {body.botijao && (
        <div className="mb-1">
          <span className="text-gray-400">Botijão:</span>{' '}
          <span className="text-white font-bold">{body.botijao}</span>
        </div>
      )}
      {body.caneca && (
        <div className="mb-1">
          <span className="text-gray-400">Caneca:</span>{' '}
          <span className="text-white font-bold">{body.caneca}</span>
        </div>
      )}
      {body.certificado && (
        <div className="mb-1">
          <span className="text-gray-400">Certificado:</span>{' '}
          <span className="text-white">{body.certificado}</span>
        </div>
      )}
    </div>
  );
}

