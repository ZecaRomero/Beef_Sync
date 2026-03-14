import React, { useState, useEffect } from 'react'
import { 
  CalendarDaysIcon, 
  TruckIcon, 
  ScaleIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const LivestockManagement = () => {
  const [managementData, setManagementData] = useState({
    scheduledActivities: 0,
    completedToday: 0,
    pendingWeighing: 0,
    animalMovements: 0,
    workersActive: 0
  })

  const [activities, setActivities] = useState([])
  const [movements, setMovements] = useState([])

  useEffect(() => {
    loadManagementData()
    loadActivities()
    loadMovements()
  }, [])

  const loadManagementData = async () => {
    try {
      setManagementData({
        scheduledActivities: 12,
        completedToday: 8,
        pendingWeighing: 25,
        animalMovements: 6,
        workersActive: 4
      })
    } catch (error) {
      console.error('Erro ao carregar dados de manejo:', error)
    }
  }

  const loadActivities = () => {
    setActivities([
      {
        id: 1,
        type: 'weighing',
        title: 'Pesagem Lote A',
        description: 'Pesagem mensal do lote A - 45 animais',
        scheduledTime: '08:00',
        status: 'pending',
        priority: 'high',
        location: 'Curral 1'
      },
      {
        id: 2,
        type: 'movement',
        title: 'TransferÃªncia para Pasto 3',
        description: 'Mover 20 novilhas para pastagem rotacionada',
        scheduledTime: '14:00',
        status: 'in_progress',
        priority: 'medium',
        location: 'Pasto 2 ââ€ â€™ Pasto 3'
      },
      {
        id: 3,
        type: 'feeding',
    title: 'DistribuiÃ§Ã£o de Insumos',
    description: 'DistribuiÃ§Ã£o de sal mineral nos cochos',
        scheduledTime: '16:00',
        status: 'completed',
        priority: 'medium',
        location: 'Todos os pastos'
      },
      {
        id: 4,
        type: 'inspection',
        title: 'InspeÃ§Ã£o SanitÃ¡ria',
        description: 'VerificaÃ§Ã£o visual do rebanho',
        scheduledTime: '07:00',
        status: 'completed',
        priority: 'high',
        location: 'Pasto 1'
      }
    ])
  }

  const loadMovements = () => {
    setMovements([
      {
        id: 1,
        animal: 'Lote 15',
        from: 'Pasto 2',
        to: 'Curral de Manejo',
        reason: 'VacinaÃ§Ã£o',
        time: '09:30',
        status: 'completed'
      },
      {
        id: 2,
        animal: 'Vaca 234',
        from: 'Enfermaria',
        to: 'Pasto 4',
        reason: 'RecuperaÃ§Ã£o completa',
        time: '11:15',
        status: 'completed'
      },
      {
        id: 3,
        animal: 'Lote 8',
        from: 'Pasto 1',
        to: 'Pasto 3',
        reason: 'RotaÃ§Ã£o de pastagem',
        time: '14:00',
        status: 'scheduled'
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

  const ActivityCard = ({ activity }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'completed': return 'bg-green-100 text-green-800 border-green-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return 'Pendente'
        case 'in_progress': return 'Em Andamento'
        case 'completed': return 'ConcluÃ­da'
        default: return 'Desconhecido'
      }
    }

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'high': return 'text-red-600'
        case 'medium': return 'text-yellow-600'
        case 'low': return 'text-green-600'
        default: return 'text-gray-600'
      }
    }

    const getTypeIcon = (type) => {
      switch (type) {
        case 'weighing': return ScaleIcon
        case 'movement': return TruckIcon
        case 'feeding': return ClipboardDocumentListIcon
        case 'inspection': return CheckCircleIcon
        default: return ClipboardDocumentListIcon
      }
    }

    const TypeIcon = getTypeIcon(activity.type)

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start">
            <TypeIcon className="h-5 w-5 text-gray-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{activity.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
            {getStatusText(activity.status)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{activity.scheduledTime}</span>
            </div>
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{activity.location}</span>
            </div>
          </div>
          <span className={`text-xs font-medium ${getPriorityColor(activity.priority)}`}>
            {activity.priority === 'high' ? 'Alta' : activity.priority === 'medium' ? 'MÃ©dia' : 'Baixa'}
          </span>
        </div>
      </div>
    )
  }

  const MovementCard = ({ movement }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'scheduled': return 'bg-yellow-100 text-yellow-800'
        case 'completed': return 'bg-green-100 text-green-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">{movement.animal}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(movement.status)}`}>
            {movement.status === 'completed' ? 'ConcluÃ­do' : 'Agendado'}
          </span>
        </div>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-2" />
            <span>{movement.from} ââ€ â€™ {movement.to}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Motivo: {movement.reason}</span>
            <span>{movement.time}</span>
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
            <CalendarDaysIcon className="h-8 w-8 text-blue-600 mr-3" />
            Manejo do Gado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Controle de atividades diÃ¡rias e movimentaÃ§Ã£o do rebanho
          </p>
        </div>
      </div>

      {/* EstatÃ­sticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Atividades Agendadas"
          value={managementData.scheduledActivities}
          icon={CalendarDaysIcon}
          color="text-blue-600"
          subtitle="Para hoje"
        />
        <StatCard
          title="ConcluÃ­das Hoje"
          value={managementData.completedToday}
          icon={CheckCircleIcon}
          color="text-green-600"
          subtitle="Atividades finalizadas"
        />
        <StatCard
          title="Pesagem Pendente"
          value={managementData.pendingWeighing}
          icon={ScaleIcon}
          color="text-yellow-600"
          subtitle="Animais"
        />
        <StatCard
          title="MovimentaÃ§Ãµes"
          value={managementData.animalMovements}
          icon={TruckIcon}
          color="text-purple-600"
          subtitle="Hoje"
        />
        <StatCard
          title="Trabalhadores Ativos"
          value={managementData.workersActive}
          icon={UserGroupIcon}
          color="text-indigo-600"
          subtitle="Em campo"
        />
      </div>

      {/* Atividades do Dia */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Atividades do Dia
        </h2>
        <div className="space-y-4">
          {activities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </div>

      {/* MovimentaÃ§Ãµes Recentes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          MovimentaÃ§Ãµes Recentes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {movements.map(movement => (
            <MovementCard key={movement.id} movement={movement} />
          ))}
        </div>
      </div>

      {/* AÃ§Ãµes RÃ¡pidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl shadow-lg transition-colors">
          <CalendarDaysIcon className="h-8 w-8 mx-auto mb-3" />
          <h3 className="font-semibold">Nova Atividade</h3>
          <p className="text-sm opacity-90 mt-1">Agendar tarefa</p>
        </button>
        
        <button className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-lg transition-colors">
          <ScaleIcon className="h-8 w-8 mx-auto mb-3" />
          <h3 className="font-semibold">Pesagem</h3>
          <p className="text-sm opacity-90 mt-1">Registrar peso</p>
        </button>
        
        <button className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl shadow-lg transition-colors">
          <TruckIcon className="h-8 w-8 mx-auto mb-3" />
          <h3 className="font-semibold">MovimentaÃ§Ã£o</h3>
          <p className="text-sm opacity-90 mt-1">Mover animais</p>
        </button>
        
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-xl shadow-lg transition-colors">
          <ClipboardDocumentListIcon className="h-8 w-8 mx-auto mb-3" />
          <h3 className="font-semibold">RelatÃ³rio</h3>
          <p className="text-sm opacity-90 mt-1">RelatÃ³rio de manejo</p>
        </button>
      </div>
    </div>
  )
}

export default LivestockManagement