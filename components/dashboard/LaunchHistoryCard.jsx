import { Card, CardBody } from '../ui/Card'
import { ClockIcon } from '../ui/Icons'

export default function LaunchHistoryCard() {
  return (
    <div className="grid grid-cols-1">
      <Card
        className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-l-4 border-indigo-500 bg-gradient-to-r from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20"
        onClick={() => (window.location.href = '/relatorios-lotes')}
      >
        <CardBody className="flex items-center space-x-4 p-6">
          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full shadow-sm">
            <ClockIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Histórico de Lançamentos
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300">Acesso Rápido</span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Visualize e gerencie todas as operações em lote realizadas no sistema (cadastros, movimentações, etc.)
            </p>
          </div>
          <div className="hidden md:block">
            <span className="text-indigo-500 text-2xl">➔</span>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

