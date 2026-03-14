
import React, { useState } from 'react'

import { PencilIcon, CheckIcon, XMarkIcon } from './ui/Icons'

export default function EditablePriceCard({ 
  id, 
  name, 
  price: initialPrice, 
  change, 
  trend, 
  onPriceUpdate 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [price, setPrice] = useState(initialPrice)
  const [tempPrice, setTempPrice] = useState(initialPrice)

  const handleEdit = () => {
    setTempPrice(price)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (tempPrice && !isNaN(tempPrice) && tempPrice > 0) {
      setPrice(parseFloat(tempPrice))
      setIsEditing(false)
      
      if (onPriceUpdate) {
        onPriceUpdate(id, parseFloat(tempPrice))
      }
      
      // Salvar no localStorage
      const savedPrices = JSON.parse(localStorage.getItem('customPrices') || '{}')
      savedPrices[id] = parseFloat(tempPrice)
      localStorage.setItem('customPrices', JSON.stringify(savedPrices))
    } else {
      alert('Por favor, insira um preço válido')
    }
  }

  const handleCancel = () => {
    setTempPrice(price)
    setIsEditing(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div
      id={id}
      className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {name}
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
            title="Editar preço"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">R$</span>
            <input
              type="number"
              step="0.01"
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-2 py-1 text-center text-lg font-bold bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm transition-colors"
            >
              <CheckIcon className="h-4 w-4 mx-auto" />
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-sm transition-colors"
            >
              <XMarkIcon className="h-4 w-4 mx-auto" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            R$ {price.toFixed(0)}
          </div>
          <div className={`text-sm flex items-center justify-center mb-2 ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? '↗' : '↘'} {Math.abs(change).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Clique no lápis para editar
          </div>
        </>
      )}
    </div>
  )
}