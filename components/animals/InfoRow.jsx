import React from 'react'

export default function InfoRow({ label, value, action }) {
  if (value == null || value === '') return null
  return (
    <div className={`px-4 py-2.5 flex justify-between items-center border-t border-gray-100/80 dark:border-gray-700/80 first:border-t-0 text-sm hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors ${action ? 'group' : ''}`}>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-white text-right">{value}</span>
        {action}
      </div>
    </div>
  )
}
