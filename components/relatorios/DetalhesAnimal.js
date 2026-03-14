import { useState, useEffect } from 'react';

/**
 * Componente para exibir detalhes completos de um animal
 */
export default function DetalhesAnimal({ body }) {
  const [localizacaoAtual, setLocalizacaoAtual] = useState(null);
  const [carregandoLocalizacao, setCarregandoLocalizacao] = useState(false);
  
  if (!body.serie && !body.rg) return null;

  // Buscar localizaÃ§Ã£o mais recente do animal
  useEffect(() => {
    async function buscarLocalizacao() {
      if (!body.serie || !body.rg) return;
      
      setCarregandoLocalizacao(true);
      try {
        // Primeiro, buscar o ID do animal pela sÃ©rie e RG
        const responseAnimal = await fetch(`/api/animals?serie=${body.serie}&rg=${body.rg}`);
        
        if (!responseAnimal.ok) {
          console.warn('Animal nÃ£o encontrado para buscar localizaÃ§Ã£o');
          return;
        }
        
        const dataAnimal = await responseAnimal.json();
        const animais = dataAnimal.data || dataAnimal.animais || [];
        
        if (animais.length === 0) {
          console.warn('Nenhum animal encontrado com sÃ©rie e RG fornecidos');
          return;
        }
        
        const animalId = animais[0].id;
        
        // Buscar localizaÃ§Ã£o do animal
        const responseLocalizacao = await fetch(`/api/animais/${animalId}/localizacoes`);
        
        if (!responseLocalizacao.ok) {
          console.warn('NÃ£o foi possÃ­vel buscar localizaÃ§Ã£o do animal');
          return;
        }
        
        const dataLocalizacao = await responseLocalizacao.json();
        
        if (dataLocalizacao.success && dataLocalizacao.localizacao_atual) {
          setLocalizacaoAtual(dataLocalizacao.localizacao_atual);
        }
      } catch (error) {
        console.error('Erro ao buscar localizaÃ§Ã£o do animal:', error);
      } finally {
        setCarregandoLocalizacao(false);
      }
    }
    
    buscarLocalizacao();
  }, [body.serie, body.rg]);

  return (
    <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 p-4 rounded-lg border border-blue-500/30">
      <h4 className="font-bold text-blue-300 mb-3 flex items-center gap-2">
        ðÅ¸�â€ž DADOS COMPLETOS DO ANIMAL
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* IdentificaÃ§Ã£o */}
        <SecaoIdentificacao body={body} />
        
        {/* CaracterÃ­sticas FÃ­sicas */}
        <SecaoCaracteristicas body={body} />
        
        {/* Status e SituaÃ§Ã£o */}
        <SecaoStatus body={body} />
      </div>

      {/* LocalizaÃ§Ã£o Atual */}
      <SecaoLocalizacao 
        localizacao={localizacaoAtual} 
        carregando={carregandoLocalizacao} 
      />

      {/* Genealogia */}
      {(body.pai || body.mae || body.receptora) && <SecaoGenealogia body={body} />}

      {/* InformaÃ§Ãµes de Nascimento */}
      {(body.tipo_nascimento || body.dificuldade_parto || body.veterinario) && (
        <SecaoNascimento body={body} />
      )}

      {/* InformaÃ§Ãµes Financeiras */}
      {(body.custo_total || body.valor_venda || body.valor_real || body.valorCompra) && (
        <SecaoFinanceira body={body} />
      )}

      {/* ObservaÃ§Ãµes */}
      {body.observacoes && <SecaoObservacoes observacoes={body.observacoes} />}
    </div>
  );
}

// Subcomponentes

function SecaoIdentificacao({ body }) {
  return (
    <div className="bg-gray-800/50 p-3 rounded">
      <h5 className="text-blue-200 font-semibold mb-2">ðÅ¸â€œâ€¹ IdentificaÃ§Ã£o</h5>
      {body.serie && (
        <div className="mb-1">
          <span className="text-gray-400">SÃ©rie:</span>{' '}
          <span className="text-white font-bold">{body.serie}</span>
        </div>
      )}
      {body.rg && (
        <div className="mb-1">
          <span className="text-gray-400">RG:</span>{' '}
          <span className="text-white font-bold">{body.rg}</span>
        </div>
      )}
      {body.tatuagem && (
        <div className="mb-1">
          <span className="text-gray-400">Tatuagem:</span>{' '}
          <span className="text-white">{body.tatuagem}</span>
        </div>
      )}
      {body.serie && body.rg && (
        <div className="mt-2 p-2 bg-blue-900/30 rounded">
          <span className="text-blue-200 font-semibold">
            Brinco: {body.serie}-{body.rg}
          </span>
        </div>
      )}
    </div>
  );
}

function SecaoCaracteristicas({ body }) {
  return (
    <div className="bg-gray-800/50 p-3 rounded">
      <h5 className="text-green-200 font-semibold mb-2">ðÅ¸Å½¯ CaracterÃ­sticas</h5>
      {body.sexo && (
        <div className="mb-1">
          <span className="text-gray-400">Sexo:</span>{' '}
          <span className="text-white font-bold">{body.sexo}</span>
        </div>
      )}
      {body.raca && (
        <div className="mb-1">
          <span className="text-gray-400">RaÃ§a:</span>{' '}
          <span className="text-white font-bold">{body.raca}</span>
        </div>
      )}
      {body.peso && (
        <div className="mb-1">
          <span className="text-gray-400">Peso:</span>{' '}
          <span className="text-white font-bold">{body.peso} kg</span>
        </div>
      )}
      {body.cor && (
        <div className="mb-1">
          <span className="text-gray-400">Cor:</span>{' '}
          <span className="text-white">{body.cor}</span>
        </div>
      )}
      {body.meses && (
        <div className="mb-1">
          <span className="text-gray-400">Idade:</span>{' '}
          <span className="text-white">{body.meses} meses</span>
        </div>
      )}
    </div>
  );
}

function SecaoStatus({ body }) {
  return (
    <div className="bg-gray-800/50 p-3 rounded">
      <h5 className="text-yellow-200 font-semibold mb-2">ðÅ¸â€œÅ  Status</h5>
      {body.situacao && (
        <div className="mb-2">
          <span className="text-gray-400">SituaÃ§Ã£o:</span>
          <span
            className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
              body.situacao === 'Ativo'
                ? 'bg-green-600 text-white'
                : body.situacao === 'Vendido'
                ? 'bg-blue-600 text-white'
                : body.situacao === 'Morto'
                ? 'bg-red-600 text-white'
                : 'bg-gray-600 text-white'
            }`}
          >
            {body.situacao}
          </span>
        </div>
      )}
      {(body.dataNascimento || body.data_nascimento) && (
        <div className="mb-1">
          <span className="text-gray-400">Nascimento:</span>
          <span className="text-white font-bold ml-1">
            {new Date(body.dataNascimento || body.data_nascimento).toLocaleDateString('pt-BR')}
          </span>
        </div>
      )}
      {body.horaNascimento && (
        <div className="mb-1">
          <span className="text-gray-400">Hora:</span>{' '}
          <span className="text-white">{body.horaNascimento}</span>
        </div>
      )}
    </div>
  );
}

function SecaoGenealogia({ body }) {
  return (
    <div className="mt-3 bg-purple-900/20 p-3 rounded border border-purple-500/30">
      <h5 className="text-purple-200 font-semibold mb-2">ðÅ¸â€˜¨ââ‚¬�ðÅ¸â€˜©ââ‚¬�ðÅ¸â€˜§ââ‚¬�ðÅ¸â€˜¦ Genealogia</h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {body.pai && (
          <div>
            <span className="text-gray-400">Pai:</span>{' '}
            <span className="text-white font-bold">{body.pai}</span>
          </div>
        )}
        {body.mae && (
          <div>
            <span className="text-gray-400">MÃ£e:</span>{' '}
            <span className="text-white font-bold">{body.mae}</span>
          </div>
        )}
        {body.receptora && (
          <div>
            <span className="text-gray-400">Receptora:</span>{' '}
            <span className="text-white font-bold">{body.receptora}</span>
          </div>
        )}
      </div>
      {body.is_fiv && (
        <div className="mt-2 p-2 bg-purple-800/30 rounded">
          <span className="text-purple-200">ðÅ¸§¬ Animal FIV (FertilizaÃ§Ã£o in Vitro)</span>
        </div>
      )}
    </div>
  );
}

function SecaoNascimento({ body }) {
  return (
    <div className="mt-3 bg-pink-900/20 p-3 rounded border border-pink-500/30">
      <h5 className="text-pink-200 font-semibold mb-2">ðÅ¸�¥ InformaÃ§Ãµes do Nascimento</h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {body.tipo_nascimento && (
          <div>
            <span className="text-gray-400">Tipo:</span>{' '}
            <span className="text-white">{body.tipo_nascimento}</span>
          </div>
        )}
        {body.dificuldade_parto && (
          <div>
            <span className="text-gray-400">Dificuldade:</span>{' '}
            <span className="text-white">{body.dificuldade_parto}</span>
          </div>
        )}
        {body.veterinario && (
          <div>
            <span className="text-gray-400">VeterinÃ¡rio:</span>{' '}
            <span className="text-white">{body.veterinario}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SecaoFinanceira({ body }) {
  return (
    <div className="mt-3 bg-green-900/20 p-3 rounded border border-green-500/30">
      <h5 className="text-green-200 font-semibold mb-2">ðÅ¸â€™° InformaÃ§Ãµes Financeiras</h5>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {body.custo_total && (
          <div>
            <span className="text-gray-400">Custo Total:</span>{' '}
            <span className="text-green-300 font-bold">R$ {body.custo_total}</span>
          </div>
        )}
        {body.valor_venda && (
          <div>
            <span className="text-gray-400">Valor Venda:</span>{' '}
            <span className="text-green-300 font-bold">R$ {body.valor_venda}</span>
          </div>
        )}
        {body.valor_real && (
          <div>
            <span className="text-gray-400">Valor Real:</span>{' '}
            <span className="text-green-300 font-bold">R$ {body.valor_real}</span>
          </div>
        )}
        {body.valorCompra && (
          <div>
            <span className="text-gray-400">Valor Compra:</span>{' '}
            <span className="text-green-300 font-bold">R$ {body.valorCompra}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SecaoObservacoes({ observacoes }) {
  return (
    <div className="mt-3 bg-gray-800/50 p-3 rounded border border-gray-500/30">
      <h5 className="text-gray-200 font-semibold mb-2">ðÅ¸â€œ� ObservaÃ§Ãµes</h5>
      <p className="text-white bg-gray-700/50 p-2 rounded italic">"{observacoes}"</p>
    </div>
  );
}

function SecaoLocalizacao({ localizacao, carregando }) {
  if (carregando) {
    return (
      <div className="mt-3 bg-orange-900/20 p-3 rounded border border-orange-500/30">
        <h5 className="text-orange-200 font-semibold mb-2">ðÅ¸â€œ� LocalizaÃ§Ã£o Atual</h5>
        <div className="text-gray-300 text-sm italic">Carregando localizaÃ§Ã£o...</div>
      </div>
    );
  }
  
  if (!localizacao) {
    return null;
  }

  const formatarData = (data) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <div className="mt-3 bg-orange-900/20 p-3 rounded border border-orange-500/30">
      <h5 className="text-orange-200 font-semibold mb-2 flex items-center gap-2">
        ðÅ¸â€œ� LocalizaÃ§Ã£o Atual
        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Mais Recente</span>
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <span className="text-gray-400">Piquete:</span>{' '}
          <span className="text-white font-bold text-lg">{localizacao.piquete}</span>
        </div>
        <div>
          <span className="text-gray-400">Data de Entrada:</span>{' '}
          <span className="text-white font-bold">{formatarData(localizacao.data_entrada)}</span>
        </div>
        {localizacao.motivo_movimentacao && (
          <div>
            <span className="text-gray-400">Motivo:</span>{' '}
            <span className="text-white">{localizacao.motivo_movimentacao}</span>
          </div>
        )}
      </div>
      {localizacao.observacoes && (
        <div className="mt-2 p-2 bg-orange-800/20 rounded">
          <span className="text-gray-400 text-sm">Obs:</span>{' '}
          <span className="text-white text-sm">{localizacao.observacoes}</span>
        </div>
      )}
      {localizacao.usuario_responsavel && (
        <div className="mt-2 text-sm text-gray-400">
          ResponsÃ¡vel: <span className="text-white">{localizacao.usuario_responsavel}</span>
        </div>
      )}
    </div>
  );
}

