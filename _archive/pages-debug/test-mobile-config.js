import { useEffect, useState } from 'react'

export default function TestMobileConfig() {
  const [config, setConfig] = useState(null)
  const [raw, setRaw] = useState(null)

  useEffect(() => {
    // Testar API mobile-reports
    fetch('/api/mobile-reports')
      .then(r => r.json())
      .then(d => {
        setRaw(JSON.stringify(d, null, 2))
        if (d.success && d.data) {
          setConfig(d.data)
        } else if (d.enabled && d.allTypes) {
          setConfig({ enabled: d.enabled, allTypes: d.allTypes })
        }
      })
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Configuração Mobile</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Resposta Raw da API:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {raw || 'Carregando...'}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Config Processada:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {config ? JSON.stringify(config, null, 2) : 'Nenhuma config'}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Relatórios Habilitados:</h2>
        <ul className="list-disc pl-6">
          {config?.enabled?.map(key => (
            <li key={key}>{key}</li>
          ))}
        </ul>
        {(!config?.enabled || config.enabled.length === 0) && (
          <p className="text-red-600">Nenhum relatório habilitado!</p>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Todos os Tipos Disponíveis:</h2>
        <ul className="list-disc pl-6">
          {config?.allTypes?.map(t => (
            <li key={t.key} className={config.enabled?.includes(t.key) ? 'text-green-600 font-bold' : ''}>
              {t.label} ({t.key}) - {t.category}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
