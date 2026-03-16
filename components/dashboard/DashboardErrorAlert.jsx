export default function DashboardErrorAlert({ error }) {
  if (!error) return null

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-red-400">⚠️</span>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Erro no Dashboard</h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
        </div>
      </div>
    </div>
  )
}

