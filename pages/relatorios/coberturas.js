import React from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import CoverageTypeCard from '../../components/reports/CoverageTypeCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'

export default function CoberturasPage() {
  return (
    <Layout>
      <Head>
        <title>RelatÃ³rio de Coberturas - Beef Sync</title>
        <meta name="description" content="AnÃ¡lise de coberturas por tipo (IA/FIV) e perÃ­odo" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ðÅ¸§¬ RelatÃ³rio de Coberturas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AnÃ¡lise detalhada das coberturas por tipo e perÃ­odo
            </p>
          </div>
        </div>

        {/* Coverage Type Card */}
        <CoverageTypeCard />

        {/* InformaÃ§Ãµes Adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                ðÅ¸â€œÅ  Sobre os Tipos de Cobertura
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      IA - InseminaÃ§Ã£o Artificial
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      TÃ©cnica reprodutiva que utiliza sÃªmen coletado e processado para inseminar fÃªmeas em momento adequado do ciclo reprodutivo.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      FIV - FertilizaÃ§Ã£o In Vitro
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      TÃ©cnica avanÃ§ada que envolve a coleta de Ã³vulos, fertilizaÃ§Ã£o em laboratÃ³rio e transferÃªncia de embriÃµes para receptoras.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      MN - Monta Natural
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ReproduÃ§Ã£o natural onde o touro cobre a fÃªmea diretamente, sem intervenÃ§Ã£o tecnolÃ³gica.
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                ðÅ¸â€œË† MÃ©tricas de Performance
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Taxa de Sucesso IA
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    100%
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Taxa de Sucesso FIV
                  </span>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    N/A
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    GestaÃ§Ãµes Ativas
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    122
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    MÃ©dia Mensal
                  </span>
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    20.3
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* InstruÃ§Ãµes de Uso */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              ðÅ¸â€™¡ Como Usar Este RelatÃ³rio
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Filtros DisponÃ­veis:
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>ââ‚¬¢ <strong>PerÃ­odo:</strong> ÃÅ¡ltima semana, mÃªs, trimestre ou ano</li>
                  <li>ââ‚¬¢ <strong>Tipo:</strong> Todos, apenas IA ou apenas FIV</li>
                  <li>ââ‚¬¢ <strong>Status:</strong> Ativas, nascidas ou todas</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Funcionalidades:
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>ââ‚¬¢ VisualizaÃ§Ã£o em tempo real dos dados</li>
                  <li>ââ‚¬¢ GrÃ¡fico de evoluÃ§Ã£o temporal</li>
                  <li>ââ‚¬¢ Lista de coberturas recentes</li>
                  <li>ââ‚¬¢ ExportaÃ§Ã£o para relatÃ³rios</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </Layout>
  )
}