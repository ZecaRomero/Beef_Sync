import React, { useState, useEffect } from 'react'
import { 
  ShieldCheckIcon, 
  BeakerIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { CalendarDaysIcon } from '../ui/Icons'

const HealthMonitoring = () => {
  const [healthData, setHealthData] = useState({
    animalsInQuarantine: 0,
    pendingVaccinations: 0,
    recentExams: 0,
    healthAlerts: 0,
    mortalityRate: 0
  })

  const [vaccinations, setVaccinations] = useState([])
  const [healthAlerts, setHealthAlerts] = useState([])

  useEffect(() => {
    loadHealthData()
    loadVaccinations()
    loadHealthAlerts()
  }, [])

  const loadHealthData = async () => {
    try {
      setHealthData({
        animalsInQuarantine: 2,
        pendingVaccinations: 15,
        recentExams: 8,
        healthAlerts: 3,
        mortalityRate: 1.2
      })
    } catch (error) {
      console.error('Erro ao carregar dados sanitários:', error)
    }
  }

  const loadVaccinations = () => {
    setVaccinations([
      {
        id: 1,
        vaccine: 'Febre Aftosa',
        dueDate: '2025-01-25',
        animalsCount: 45,
        status: 'pending'
      },
      {
        id: 2,
        vaccine: 'Brucelose',
        dueDate: '2025-02-10',
        animalsCount: 12,
        status: 'scheduled'
      },
      {
        id: 3,
        vaccine: 'Raiva',
        dueDate: '2025-01-30',
        animalsCount: 78,
        status: 'pending'
      }
    ])
  }

  const loadHealthAlerts = () => {
    setHealthAlerts([
      {
        id: 1,
        type: 'critical',
        animal: 'Vaca 123',
        condition: 'Febre alta detectada',
        date: '2025-01-14'
      },
      {
        id: 2,
        type: 'warning',
        animal: 'Touro 456',
        condition: 'Claudicação observada',
        date: '2025-01-13'
      },
      {
        id: 3,
        type: 'info',
        animal: 'Bezerra 789',
        condition: 'Exame de rotina necessário',
        date: '2025-01-12'
      }
    ])
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '100')} dark:${color.replace('text-', 'bg-').replace('600', '900/20')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  )

  const VaccinationCard = ({ vaccination }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return 'bg-red-100 text-red-800 border-red-200'
        case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'completed': return 'bg-green-100 text-green-800 border-green-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return 'Pendente'
        case 'scheduled': return 'Agendada'
        case 'completed': return 'Concluída'
        default: return 'Desconhecido'
      }
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">{vaccination.vaccine}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(vaccination.status)}`}>
            {getStatusText(vaccination.status)}
          </span>
        </div>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            <span>Vencimento: {vaccination.dueDate}</span>
          </div>
          <div className="flex items-center">
            <ShieldCheckIcon className="h-4 w-4 mr-2" />
            <span>{vaccination.animalsCount} animais</span>
          </div>
        </div>
      </div>
    )
  }

  const AlertCard = ({ alert }) => {
    const getAlertColor = (type) => {
      switch (type) {
        case 'critical': return 'border-red-200 bg-red-50 text-red-800'
        case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800'
        case 'info': return 'border-blue-200 bg-blue-50 text-blue-800'
        default: return 'border-gray-200 bg-gray-50 text-gray-800'
      }
    }

    return (
      <div className={`p-4 rounded-lg border ${getAlertColor(alert.type)} dark:bg-gray-800 dark:border-gray-600`}>
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{alert.animal}</p>
            <p className="text-sm mt-1">{alert.condition}</p>
            <p className="text-xs mt-1 opacity-75">{alert.date}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-emerald-600 mr-3" />
            Monitoramento Sanitário
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Controle de saúde e bem-estar do rebanho
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Em Quarentena"
          value={healthData.animalsInQuarantine}
          icon={ExclamationTriangleIcon}
          color="text-red-600"
          subtitle="Animais isolados"
        />
        <StatCard
          title="Vacinações Pendentes"
          value={healthData.pendingVaccinations}
          icon={BeakerIcon}
          color="text-yellow-600"
          subtitle="Próximos 30 dias"
        />
        <StatCard
          title="Exames Recentes"
          value={healthData.recentExams}
          icon={DocumentTextIcon}
          color="text-blue-600"
          subtitle="Últimos 7 dias"
        />
        <StatCard
          title="Alertas de Saúde"
          value={healthData.healthAlerts}
          icon={ExclamationTriangleIcon}
          color="text-orange-600"
          subtitle="Requer atenção"
        />
        <StatCard
          title="Taxa de Mortalidade"
          value={`${healthData.mortalityRate}%`}
          icon={ChartBarIcon}
          color="text-purple-600"
          subtitle="Últimos 12 meses"
        />
      </div>

      {/* Vacinações Programadas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Vacinações Programadas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vaccinations.map(vaccination => (
            <VaccinationCard key={vaccination.id} vaccination={vaccination} />
          ))}
        </div>
      </div>

      {/* Alertas de Saúde */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Alertas de Saúde
        </h2>
        <div className="space-y-3">
          {healthAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-xl shadow-lg transition-colors">
          <ShieldCheckIcon className="h-8 w-8 mx-auto mb-3" />
          <h3 className="font-semibold">Nova Vacinação</h3>
          <p className="text-sm opacity-90 mt-1">Registrar vacina</p>
        </button>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl shadow-lg transition-colors">
          <BeakerIcon className="h-8 w-8 mx-auto mb-3" />
          <h3 className="font-semibold">Exame Laboratorial</h3>
          <p className="text-sm opacity-90 mt-1">Solicitar exame</p>
        </button>
        
        <button className="bg-yellow-600 hover:bg-yellow-700 text-white p-6 rounded-xl shadow-lg transition-colors">
          <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-3" />
          <h3 className="font-semibold">Quarentena</h3>
          <p className="text-sm opacity-90 mt-1">Isolar animal</p>
        </button>
        
        <button className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl shadow-lg transition-colors">
          <DocumentTextIcon className="h-8 w-8 mx-auto mb-3" />
          <h3 className="font-semibold">Relatório</h3>
          <p className="text-sm opacity-90 mt-1">Relatório sanitário</p>
        </button>
      </div>
    </div>
  )
}

export default HealthMonitoring