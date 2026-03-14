import React, { useState, useEffect } from 'react'
import { 
  MapPinIcon, 
  GlobeAltIcon, 
  SignalIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const LocationTracking = () => {
  const [locationData, setLocationData] = useState({
    totalAnimals: 0,
    trackedAnimals: 0,
    activePastures: 0,
    alertsCount: 0,
    lastUpdate: ''
  })

  const [animalLocations, setAnimalLocations] = useState([])
  const [pastureStatus, setPastureStatus] = useState([])
  const [locationAlerts, setLocationAlerts] = useState([])

  useEffect(() => {
    loadLocationData()
    loadAnimalLocations()
    loadPastureStatus()
    loadLocationAlerts()
  }, [])

  const loadLocationData = async () => {
    try {
      setLocationData({
        totalAnimals: 245,
        trackedAnimals: 198,
        activePastures: 8,
        alertsCount: 3,
        lastUpdate: '14/01/2025 15:30'
      })
    } catch (error) {
      console.error('Erro ao carregar dados de localização:', error)
    }
  }

  const loadAnimalLocations = () => {
    setAnimalLocations([
      {
        id: 1,
        animal: 'Vaca 123',
        location: 'Pasto 1 - Setor A',
        coordinates: '-15.7942, -47.8822',
        lastSeen: '15:25',
        status: 'active',
        batteryLevel: 85
      },
      {
        id: 2,
        animal: 'Touro 456',
        location: 'Pasto 3 - Setor B',
        coordinates: '-15.7955, -47.8835',
        lastSeen: '15:20',
        status: 'active',
        batteryLevel: 92
      },
      {
        id: 3,
        animal: 'Bezerra 789',
        location: 'Curral de Manejo',
        coordinates: '-15.7938, -47.8818',
        lastSeen: '14:45',
        status: 'inactive',
        batteryLevel: 23
      },
      {
        id: 4,
        animal: 'Novilha 321',
        location: 'Pasto 2 - Setor C',
        coordinates: '-15.7948, -47.8828',
        lastSeen: '15:28',
        status: 'active',
        batteryLevel: 67
      }
    ])
  }

  const loadPastureStatus = () => {
    setPastureStatus([
      {
        id: 1,
        name: 'Pasto 1',
        sector: 'Setor A',
        animalsCount: 45,
        capacity: 60,
        area: '15.2 ha',
        status: 'optimal',
        lastRotation: '10/01/2025'
      },
      {
        id: 2,
        name: 'Pasto 2',
        sector: 'Setor B',
        animalsCount: 38,
        capacity: 50,
        area: '12.8 ha',
        status: 'good',
        lastRotation: '08/01/2025'
      },
      {
        id: 3,
        name: 'Pasto 3',
        sector: 'Setor C',
        animalsCount: 52,
        capacity: 55,
        area: '18.5 ha',
        status: 'crowded',
        lastRotation: '05/01/2025'
      },
      {
        id: 4,
        name: 'Pasto 4',
        sector: 'Setor D',
        animalsCount: 0,
        capacity: 40,
        area: '10.3 ha',
        status: 'resting',
        lastRotation: '12/01/2025'
      }
    ])
  }

  const loadLocationAlerts = () => {
    setLocationAlerts([
      {
        id: 1,
        type: 'fence_breach',
        animal: 'Vaca 234',
        message: 'Animal detectado fora dos limites do Pasto 2',
        time: '14:15',
        severity: 'high'
      },
      {
        id: 2,
        type: 'low_battery',
        animal: 'Bezerra 789',
        message: 'Bateria do dispositivo de rastreamento baixa (23%)',
        time: '13:45',
        severity: 'medium'
      },
      {
        id: 3,
        type: 'no_signal',
        animal: 'Touro 567',
        message: 'Sem sinal do dispositivo há mais de 2 horas',
        time: '12:30',
        severity: 'high'
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

  const AnimalLocationCard = ({ animal }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-800 border-green-200'
        case 'inactive': return 'bg-red-100 text-red-800 border-red-200'
        case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    const getBatteryColor = (level) => {
      if (level > 50) return 'text-green-600'
      if (level > 25) return 'text-yellow-600'
      return 'text-red-600'
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">{animal.animal}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(animal.status)}`}>
            {animal.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-2" />
            <span>{animal.location}</span>
          </div>
          <div className="flex items-center">
            <GlobeAltIcon className="h-4 w-4 mr-2" />
            <span>{animal.coordinates}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-2" />
              <span>Última atualização: {animal.lastSeen}</span>
            </div>
            <div className={`flex items-center ${getBatteryColor(animal.batteryLevel)}`}>
              <SignalIcon className="h-4 w-4 mr-1" />
              <span>{animal.batteryLevel}%</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const PastureCard = ({ pasture }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'optimal': return 'bg-green-100 text-green-800 border-green-200'
        case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'crowded': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'resting': return 'bg-gray-100 text-gray-800 border-gray-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    const getStatusText = (status) => {
      switch (status) {
        case 'optimal': return 'Ótimo'
        case 'good': return 'Bom'
        case 'crowded': return 'Lotado'
        case 'resting': return 'Descanso'
        default: return 'Desconhecido'
      }
    }

    const occupancyPercentage = (pasture.animalsCount / pasture.capacity) * 100

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{pasture.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{pasture.sector}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(pasture.status)}`}>
            {getStatusText(pasture.status)}
          </span>
        </div>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <span>Animais: {pasture.animalsCount}/{pasture.capacity}</span>
            <span>Área: {pasture.area}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                occupancyPercentage > 90 ? 'bg-red-500' : 
                occupancyPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex items-center">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            <span>Última rotação: {pasture.lastRotation}</span>
          </div>
        </div>
      </div>
    )
  }

  const AlertCard = ({ alert }) => {
    const getSeverityColor = (severity) => {
      switch (severity) {
        case 'high': return 'border-red-200 bg-red-50 text-red-800'
        case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800'
        case 'low': return 'border-blue-200 bg-blue-50 text-blue-800'
        default: return 'border-gray-200 bg-gray-50 text-gray-800'
      }
    }

    const getAlertIcon = (type) => {
      switch (type) {
        case 'fence_breach': return ExclamationTriangleIcon
        case 'low_battery': return SignalIcon
        case 'no_signal': return ExclamationTriangleIcon
        default: return ExclamationTriangleIcon
      }
    }

    const AlertIcon = getAlertIcon(alert.type)

    return (
      <div className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} dark:bg-gray-800 dark:border-gray-600`}>
        <div className="flex items-start">
          <AlertIcon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{alert.animal}</p>
            <p className="text-sm mt-1">{alert.message}</p>
            <p className="text-xs mt-1 opacity-75">{alert.time}</p>
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
            <MapPinIcon className="h-8 w-8 text-blue-600 mr-3" />
            Rastreamento e Localização
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitoramento em tempo real da localização do rebanho
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Última atualização</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{locationData.lastUpdate}</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Animais"
          value={locationData.totalAnimals}
          icon={EyeIcon}
          color="text-blue-600"
          subtitle="No rebanho"
        />
        <StatCard
          title="Animais Rastreados"
          value={`${locationData.trackedAnimals}/${locationData.totalAnimals}`}
          icon={SignalIcon}
          color="text-green-600"
          subtitle="Com dispositivos ativos"
        />
        <StatCard
          title="Pastos Ativos"
          value={locationData.activePastures}
          icon={MapPinIcon}
          color="text-purple-600"
          subtitle="Em uso"
        />
        <StatCard
          title="Alertas"
          value={locationData.alertsCount}
          icon={ExclamationTriangleIcon}
          color="text-red-600"
          subtitle="Requer atenção"
        />
      </div>

      {/* Localização dos Animais */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Localização dos Animais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {animalLocations.map(animal => (
            <AnimalLocationCard key={animal.id} animal={animal} />
          ))}
        </div>
      </div>

      {/* Status dos Pastos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Status dos Pastos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pastureStatus.map(pasture => (
            <PastureCard key={pasture.id} pasture={pasture} />
          ))}
        </div>
      </div>

      {/* Alertas de Localização */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Alertas de Localização
        </h2>
        <div className="space-y-3">
          {locationAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl shadow-lg transition-colors">
          <MapPinIcon className="h-8 w-8 mx-auto mb-3" />
          <h3 className="font-semibold">Visualizar Mapa</h3>
          <p className="text-sm opacity-90 mt-1">Mapa em tempo real</p>
        </button>
        
        <button className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-lg transition-colors">
          <SignalIcon className="h-8 w-8 mx-auto mb-3" />
          <h3 className="font-semibold">Configurar Dispositivo</h3>
          <p className="text-sm opacity-90 mt-1">Gerenciar rastreadores</p>
        </button>
        
        <button className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl shadow-lg transition-colors">
          <ArrowPathIcon className="h-8 w-8 mx-auto mb-3" />
          <h3 className="font-semibold">Rotação de Pastos</h3>
          <p className="text-sm opacity-90 mt-1">Planejar movimentação</p>
        </button>
        
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-xl shadow-lg transition-colors">
          <EyeIcon className="h-8 w-8 mx-auto mb-3" />
          <h3 className="font-semibold">Relatório</h3>
          <p className="text-sm opacity-90 mt-1">Histórico de localização</p>
        </button>
      </div>
    </div>
  )
}

export default LocationTracking