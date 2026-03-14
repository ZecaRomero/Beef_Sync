import React from 'react'
import { Card, CardHeader, CardBody } from '../ui/Card.js'
import Button from '../ui/Button.js'

export default function ReportsDashboard({ onCreateReport, onViewReport }) {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          📊 Dashboard de Relatórios
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Visão geral e acesso rápido aos seus relatórios
        </p>
      </div>

      <Button onClick={onCreateReport}>
        Criar Relatório
      </Button>
    </div>
  )
}

