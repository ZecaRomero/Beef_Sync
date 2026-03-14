const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue,
  color = 'blue',
  className = '',
  onClick,
  loading = false,
  ...props 
}) => {
  const colorVariants = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800'
    },
    green: {
      bg: 'from-green-500 to-emerald-600',
      text: 'text-green-600',
      lightBg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      text: 'text-purple-600',
      lightBg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800'
    },
    orange: {
      bg: 'from-orange-500 to-amber-600',
      text: 'text-orange-600',
      lightBg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800'
    },
    red: {
      bg: 'from-red-500 to-pink-600',
      text: 'text-red-600',
      lightBg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800'
    }
  }

  const colors = colorVariants[color] || colorVariants.blue
  const isClickable = onClick !== undefined

  return (
    <div 
      className={`
        relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl 
        rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50
        transition-all duration-500 hover:shadow-2xl
        ${isClickable ? 'cursor-pointer hover:scale-[1.02] hover:-translate-y-1' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-current to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              {icon && (
                <div className={`
                  p-3 rounded-2xl bg-gradient-to-br ${colors.bg} text-white 
                  shadow-lg transform transition-transform duration-300 hover:scale-110
                `}>
                  {icon}
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ) : (
                <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
                </div>
              )}
              
              {trend && trendValue && (
                <div className="flex items-center space-x-2">
                  <div className={`
                    flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
                    ${trend === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                      trend === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}
                  `}>
                    <span>{trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️'}</span>
                    <span>{trendValue}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {isClickable && (
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  )
}

export default StatsCard