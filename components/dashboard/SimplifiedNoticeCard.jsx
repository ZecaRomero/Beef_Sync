import { Card, CardBody } from '../ui/Card'

export default function SimplifiedNoticeCard() {
  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardBody>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 p-6 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="text-3xl animate-bounce">ℹ️</div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 text-lg mb-2">Dashboard Simplificado</h3>
              <p className="text-blue-700 dark:text-blue-400 mb-3">
                Esta é uma versão simplificada do dashboard. Use os botões acima para acessar as funcionalidades principais do sistema.
              </p>
              <p className="text-blue-600 dark:text-blue-300 text-sm font-medium">
                💡 Dica: Clique em "Dashboard Interativo" no cabeçalho para ver gráficos avançados e análises detalhadas!
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

