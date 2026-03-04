import React, { useState } from 'react'
import { PhotoIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

export default function AnimalPhotos({ animal }) {
  const fotos = animal?.fotos || []
  const fotoPrincipal = animal?.foto_principal || animal?.fotoPrincipal
  const nomeAnimal = animal?.nome || `${animal?.serie || ''} ${animal?.rg || ''}`.trim()
  const [isExpanded, setIsExpanded] = useState(true)

  // Combinar foto principal com lista de fotos
  const todasFotos = []
  if (fotoPrincipal) {
    todasFotos.push({ url: fotoPrincipal, destaque: true })
  }
  if (fotos && fotos.length > 0) {
    fotos.forEach(f => {
      // Evitar duplicar a foto principal se ela já estiver na lista
      if (f.url !== fotoPrincipal) {
        todasFotos.push(f)
      }
    })
  }

  if (todasFotos.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 border-b border-gray-200 dark:border-gray-700 text-left hover:from-sky-200 hover:to-blue-200 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhotoIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Galeria de Fotos</h2>
          </div>
          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {todasFotos.length} foto(s) disponível(is)
        </p>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {todasFotos.map((foto, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
              <img 
                src={foto.url} 
                alt={`Foto ${i + 1} - ${nomeAnimal}`} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {foto.destaque && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  Perfil
                </div>
              )}
              {foto.data && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">
                  {new Date(foto.data).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
