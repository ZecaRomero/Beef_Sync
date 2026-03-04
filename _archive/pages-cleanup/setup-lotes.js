import { useState } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  DocumentTextIcon,
  CogIcon
} from '@heroicons/react/24/outline';

export default function SetupLotes() {
  const [step, setStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: 'Problema Identificado',
      description: 'A tabela de lotes não existe no banco de dados',
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      id: 2,
      title: 'Solução',
      description: 'Execute o script SQL para criar a tabela',
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 3,
      title: 'Verificação',
      description: 'Teste o sistema de lotes',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CogIcon className="h-8 w-8 text-blue-600" />
            Setup do Sistema de Lotes
          </h1>
          <p className="mt-2 text-gray-600">
            Resolva o erro e configure o sistema de lotes
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((stepItem) => (
            <div key={stepItem.id} className={`rounded-lg p-6 ${stepItem.bgColor}`}>
              <div className="flex items-center gap-4">
                <stepItem.icon className={`h-8 w-8 ${stepItem.color}`} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {stepItem.title}
                  </h3>
                  <p className="text-gray-600">{stepItem.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instruções Detalhadas */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📋 Instruções para Resolver o Problema
          </h2>

          <div className="space-y-6">
            {/* Passo 1 */}
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                1. Execute o Script SQL
              </h3>
              <p className="text-gray-600 mb-3">
                O arquivo <code className="bg-gray-100 px-2 py-1 rounded">CREATE_LOTES_TABLE.sql</code> foi criado na raiz do projeto.
              </p>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                <div>-- Execute este script no seu banco PostgreSQL</div>
                <div>psql -U postgres -d beef_sync -f CREATE_LOTES_TABLE.sql</div>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                2. Verificar Conexão
              </h3>
              <p className="text-gray-600 mb-3">
                Certifique-se de que as variáveis de ambiente estão configuradas:
              </p>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                <div>DB_USER=postgres</div>
                <div>DB_HOST=localhost</div>
                <div>DB_NAME=beef_sync</div>
                <div>DB_PASSWORD=sua_senha</div>
                <div>DB_PORT=5432</div>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                3. Testar o Sistema
              </h3>
              <p className="text-gray-600 mb-3">
                Após executar o script, teste o sistema:
              </p>
              <div className="space-y-2">
                <a 
                  href="/relatorios-lotes" 
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  📊 Acessar Lançamento no APP
                </a>
                <a 
                  href="/teste-lotes" 
                  className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 ml-2"
                >
                  🔬 Testar Sistema de Lotes
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            💡 Informações Importantes
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li>• O script criará a tabela <code>lotes_operacoes</code> automaticamente</li>
            <li>• Serão inseridos 5 registros de exemplo para demonstração</li>
            <li>• Índices serão criados para melhor performance</li>
            <li>• A função <code>gerar_proximo_lote()</code> será criada</li>
          </ul>
        </div>

        {/* Status */}
        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            ⚠️ Status Atual
          </h3>
          <p className="text-yellow-800">
            O sistema de lotes está implementado, mas precisa da tabela no banco de dados para funcionar.
            Execute o script SQL acima para resolver o problema.
          </p>
        </div>
      </div>
    </div>
  );
}
