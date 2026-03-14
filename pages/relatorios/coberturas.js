import React from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import CoverageTypeCard from '../../components/reports/CoverageTypeCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'

export default function CoberturasPage() {
  return (
    <Layout>
      <Head>
        <title>Relatório de Coberturas - Beef Sync</title>
        <meta name="description" content="Análise de coberturas por tipo (IA/FIV) e período" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🧬 Relatório de Coberturas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Análise detalhada das coberturas por tipo e período
            </p>
          </div>
        </div>

        {/* Coverage Type Card */}
        <CoverageTypeCard />

        {/* Informações Adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📊 Sobre os Tipos de Cobertura
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      IA - Inseminação Artificial
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Técnica reprodutiva que utiliza sêmen coletado e processado para inseminar fêmeas em momento adequado do ciclo reprodutivo.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      FIV - Fertilização In Vitro
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Técnica avançada que envolve a coleta de óvulos, fertilização em laboratório e transferência de embriões para receptoras.
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
                      Reprodução natural onde o touro cobre a fêmea diretamente, sem intervenção tecnológica.
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📈 Métricas de Performance
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
                    Gestações Ativas
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    122
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Média Mensal
                  </span>
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    20.3
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Instruções de Uso */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              💡 Como Usar Este Relatório
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Filtros Disponíveis:
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• <strong>Período:</strong> Última semana, mês, trimestre ou ano</li>
                  <li>• <strong>Tipo:</strong> Todos, apenas IA ou apenas FIV</li>
                  <li>• <strong>Status:</strong> Ativas, nascidas ou todas</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Funcionalidades:
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Visualização em tempo real dos dados</li>
                  <li>• Gráfico de evolução temporal</li>
                  <li>• Lista de coberturas recentes</li>
                  <li>• Exportação para relatórios</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </Layout>
  )
}