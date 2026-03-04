import React from 'react'

export default function InfoRow({ label, value, action }) {
  if (value == null || value === '') return null
  return (
    <div className="px-6 py-3 flex justify-between items-center group border-t border-gray-100 dark:border-gray-700 first:border-t-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-white text-right">{value}</span>
        {action}
      </div>
    </div>
  )
}
