import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import Button from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'

export default function Contabilidade() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-3xl shadow-2xl">
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl">
                    <DocumentTextIcon className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                      Relatórios Contábeis
                    </h1>
                    <p className="text-indigo-100 text-lg font-medium mt-1">
                      Gere e envie relatórios completos para sua equipe contábil
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Card */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Relatórios Disponíveis
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Button
                variant="primary"
                onClick={() => alert('Funcionalidade em desenvolvimento')}
                loading={loading}
              >
                Gerar Boletim de Gado
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}