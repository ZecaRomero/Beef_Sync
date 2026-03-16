import { Card, CardBody } from '../ui/Card'
import { ChartBarIcon, UserGroupIcon, CubeIcon, CalendarIcon } from '../ui/Icons'

export default function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      <Card>
        <CardBody className="flex flex-col items-center text-center p-3 md:p-4">
          <div className="p-2 md:p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 rounded-full mb-2">
            <UserGroupIcon className="h-5 w-5 md:h-8 md:w-8 text-blue-600 dark:text-blue-300" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAnimals}</h3>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col items-center text-center p-3 md:p-4">
          <div className="p-2 md:p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 rounded-full mb-2">
            <ChartBarIcon className="h-5 w-5 md:h-8 md:w-8 text-green-600 dark:text-green-300" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.activeAnimals}</h3>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Ativos</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col items-center text-center p-3 md:p-4">
          <div className="p-2 md:p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 rounded-full mb-2">
            <CubeIcon className="h-5 w-5 md:h-8 md:w-8 text-purple-600 dark:text-purple-300" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLocations}</h3>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Locais</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col items-center text-center p-3 md:p-4">
          <div className="p-2 md:p-3 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900 rounded-full mb-2">
            <CalendarIcon className="h-5 w-5 md:h-8 md:w-8 text-orange-600 dark:text-orange-300" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.todayEvents}</h3>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Hoje</p>
        </CardBody>
      </Card>
    </div>
  )
}

