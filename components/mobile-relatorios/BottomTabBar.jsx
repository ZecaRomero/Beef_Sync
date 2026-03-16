import { ChartBarIcon, HomeIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon as ChartBarIconSolid, HomeIcon as HomeIconSolid } from '@heroicons/react/24/solid'

export default function BottomTabBar({ currentTab, onTabChange }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-100 dark:border-gray-700/50 shadow-2xl shadow-gray-200/50 dark:shadow-black/40 rounded-2xl p-2 flex items-center justify-around z-50 ring-1 ring-black/5">
      <button
        onClick={() => onTabChange('home')}
        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-300 ${
          currentTab === 'home'
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium'
        }`}
      >
        {currentTab === 'home' ? (
          <HomeIconSolid className="h-6 w-6 transform scale-110 transition-transform" />
        ) : (
          <HomeIcon className="h-6 w-6" />
        )}
        <span className="text-[10px]">Início</span>
      </button>
      <button
        onClick={() => onTabChange('reports')}
        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-300 ${
          currentTab === 'reports'
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium'
        }`}
      >
        {currentTab === 'reports' ? (
          <ChartBarIconSolid className="h-6 w-6 transform scale-110 transition-transform" />
        ) : (
          <ChartBarIcon className="h-6 w-6" />
        )}
        <span className="text-[10px]">Relatórios</span>
      </button>
      <button
        onClick={() => onTabChange('settings')}
        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-300 ${
          currentTab === 'settings'
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium'
        }`}
      >
        <ListBulletIcon className={`h-6 w-6 ${currentTab === 'settings' ? 'transform scale-110 transition-transform' : ''}`} />
        <span className="text-[10px]">Menu</span>
      </button>
    </div>
  )
}
