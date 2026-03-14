import React from 'react'
import { Card, CardHeader, CardBody } from '../ui/Card.js'
import Button from '../ui/Button.js'

export default function ReportsDashboard({ onCreateReport, onViewReport }) {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          ðÅ¸â€œÅ  Dashboard de RelatÃ³rios
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          VisÃ£o geral e acesso rÃ¡pido aos seus relatÃ³rios
        </p>
      </div>

      <Button onClick={onCreateReport}>
        Criar RelatÃ³rio
      </Button>
    </div>
  )
}

