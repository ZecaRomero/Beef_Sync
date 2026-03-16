import { Card, CardBody } from '../ui/Card'
import { SparklesIcon, LightBulbIcon } from '../ui/Icons'

export default function InsightsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6">
      <Card className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-none shadow-lg">
        <CardBody className="p-4 md:p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-3">
              <span className="bg-white/20 p-1.5 rounded-lg">
                <SparklesIcon className="h-5 w-5 text-yellow-300" />
              </span>
              <h3 className="font-bold text-lg">Beef IA Insights</h3>
            </div>

            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-md border border-white/10">
              <p className="text-sm flex items-start gap-2">
                <span className="text-lg">💡</span>
                <span className="leading-relaxed">
                  Taxa de prenhez "Matrizes A" aumentou <span className="text-green-300 font-bold">5%</span> este mês.
                </span>
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white border-none shadow-lg">
        <CardBody className="p-4 md:p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-3">
              <span className="bg-white/20 p-1.5 rounded-lg">
                <LightBulbIcon className="h-5 w-5 text-yellow-300" />
              </span>
              <h3 className="font-bold text-lg">Dica de Manejo</h3>
            </div>

            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-md border border-white/10">
              <p className="text-sm flex items-start gap-2">
                <span className="text-lg">🌡️</span>
                <span className="leading-relaxed">Alta temperatura amanhã. Antecipe o manejo para a manhã.</span>
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

