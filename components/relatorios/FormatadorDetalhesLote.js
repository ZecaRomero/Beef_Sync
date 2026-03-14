/**
 * Componente principal para formatar detalhes de lotes
 * Centraliza a lógica de exibição usando subcomponentes especializados
 */
import DetalhesAnimal from './DetalhesAnimal';
import DetalhesNotaFiscal from './DetalhesNotaFiscal';
import DetalhesCusto from './DetalhesCusto';
import DetalhesSemen from './DetalhesSemen';
import DetalhesInformacoesTecnicas from './DetalhesInformacoesTecnicas';

export default function FormatadorDetalhesLote({ detalhes }) {
  if (!detalhes) return null;

  try {
    const dados = typeof detalhes === 'string' ? JSON.parse(detalhes) : detalhes;

    // Se tem request_body, processar componentes específicos
    if (dados.request_body) {
      const body = dados.request_body;

      return (
        <div className="space-y-3 text-sm">
          {/* Informações do Animal */}
          <DetalhesAnimal body={body} />

          {/* Informações de Nota Fiscal */}
          <DetalhesNotaFiscal body={body} />

          {/* Informações de Custo */}
          <DetalhesCusto body={body} />

          {/* Informações de Sêmen */}
          <DetalhesSemen body={body} />

          {/* Informações Técnicas */}
          <DetalhesInformacoesTecnicas dados={dados} />

          {/* Dados Brutos (se houver muitos campos não mapeados) */}
          {Object.keys(body).length > 20 && <DadosBrutos body={body} />}
        </div>
      );
    }

    // Fallback para outros tipos de dados
    return (
      <div className="bg-gray-700 p-3 rounded">
        <h4 className="font-semibold text-gray-300 mb-2">📋 Dados da Operação</h4>
        <pre className="text-xs text-gray-300 whitespace-pre-wrap">
          {JSON.stringify(dados, null, 2)}
        </pre>
      </div>
    );
  } catch (error) {
    return (
      <div className="bg-red-900/20 p-3 rounded border border-red-500">
        <span className="text-red-400">Erro ao processar detalhes: {error.message}</span>
      </div>
    );
  }
}

function DadosBrutos({ body }) {
  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600/30">
      <h4 className="font-bold text-gray-400 mb-3 flex items-center gap-2">
        📊 DADOS BRUTOS COMPLETOS
      </h4>
      <details className="cursor-pointer">
        <summary className="text-gray-300 hover:text-white">
          Clique para ver todos os dados (JSON)
        </summary>
        <pre className="text-xs text-gray-300 whitespace-pre-wrap mt-2 bg-gray-800 p-3 rounded overflow-auto max-h-64">
          {JSON.stringify(body, null, 2)}
        </pre>
      </details>
    </div>
  );
}

