import React, { useState } from 'react'

export default function TestButtons() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')

  const handleClick = () => {
    setCount(count + 1)
    setMessage(`Botão clicado ${count + 1} vezes!`)
    console.log('Botão funcionando!', count + 1)
  }

  const handleAlert = () => {
    alert('JavaScript e React estão funcionando!')
  }

  const handleLocalStorage = () => {
    try {
      localStorage.setItem('teste-react', new Date().toISOString())
      const saved = localStorage.getItem('teste-react')
      setMessage(`LocalStorage funcionando: ${saved}`)
    } catch (error) {
      setMessage(`Erro no LocalStorage: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          🧪 Teste de Botões React
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={handleClick}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contador: {count}
          </button>

          <button
            onClick={handleAlert}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Teste Alert
          </button>

          <button
            onClick={handleLocalStorage}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Teste LocalStorage
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Recarregar Página
          </button>
        </div>

        {message && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">{message}</p>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Instruções:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Se os botões funcionarem, o React está OK</li>
            <li>Se não funcionarem, há problema no JavaScript</li>
            <li>Verifique o console do navegador (F12)</li>
            <li>Acesse: <code>localhost:3020/test-buttons</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}