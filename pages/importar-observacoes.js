import { useRouter } from 'next/router'
import ImportarObservacoesAnimais from '../components/ImportarObservacoesAnimais'

export default function ImportarObservacoesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>

          <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl p-6 shadow-xl">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              ðÅ¸â€œâ€¹ Importar ObservaÃ§Ãµes de Animais
            </h1>
            <p className="text-white/90 mt-2">
              Atualize as observaÃ§Ãµes dos animais importando dados do Excel
            </p>
          </div>
        </div>

        {/* Componente de ImportaÃ§Ã£o */}
        <ImportarObservacoesAnimais />

        {/* InformaÃ§Ãµes Adicionais */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
          <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">âÅ¡ ï¸� Importante:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
            <li>As observaÃ§Ãµes serÃ£o <strong>adicionadas</strong> Ã s observaÃ§Ãµes existentes</li>
            <li>Cada importaÃ§Ã£o adiciona uma data para controle</li>
            <li>Os animais devem estar cadastrados no sistema (SÃ©rie + RG)</li>
            <li>O formato deve ser: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">SÃ©rie [TAB] RG [TAB] ObservaÃ§Ã£o</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
