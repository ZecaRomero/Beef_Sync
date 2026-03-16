import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'

export default function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">⚡</span>
          Ações Rápidas
        </h2>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          <Button
            onClick={() => (window.location.href = '/animals')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
          >
            <span className="text-lg md:text-xl">👥</span>
            <span>Animais</span>
          </Button>

          <Button
            onClick={() => (window.location.href = '/localizacao-animais')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
          >
            <span className="text-lg md:text-xl">📍</span>
            <span>Localização</span>
          </Button>

          <Button
            onClick={() => (window.location.href = '/protocolos')}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
          >
            <span className="text-lg md:text-xl">📋</span>
            <span>Protocolos</span>
          </Button>

          <Button
            onClick={() => (window.location.href = '/dados-teste')}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
          >
            <span className="text-lg md:text-xl">🧪</span>
            <span>Testes</span>
          </Button>

          <Button
            onClick={() => (window.location.href = '/relatorios-lotes')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
          >
            <span className="text-lg md:text-xl">📊</span>
            <span>Lançamentos</span>
          </Button>

          <Button
            onClick={() => (window.location.href = '/teste-lotes')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
          >
            <span className="text-lg md:text-xl">🔬</span>
            <span>Teste Lotes</span>
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

