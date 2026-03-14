import React, { useState, useEffect } from 'react'

export default function Diagnostico() {
  const [diagnostics, setDiagnostics] = useState({})
  const [isClient, setIsClient] = useState(false)
  const [testState, setTestState] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const runDiagnostics = () => {
      const results = {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
        reactVersion: (typeof React !== 'undefined' && React.version) ? React.version : 'N/A',
        nextVersion: 'N/A',
        windowDefined: typeof window !== 'undefined',
        documentDefined: typeof document !== 'undefined',
        localStorageAvailable: false,
        consoleAvailable: typeof console !== 'undefined',
        eventListenersWorking: false,
        reactHydrated: false,
        errors: []
      }

      // Teste localStorage
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('test', 'test')
          window.localStorage.removeItem('test')
          results.localStorageAvailable = true
        }
      } catch (error) {
        results.errors.push(`localStorage: ${error.message}`)
      }

      // Teste event listeners
      try {
        if (typeof document !== 'undefined') {
          const testElement = document.createElement('button')
          let eventFired = false
          testElement.addEventListener('click', () => { eventFired = true })
          testElement.click()
          results.eventListenersWorking = eventFired
        }
      } catch (error) {
        results.errors.push(`Event listeners: ${error.message}`)
      }

      // Verificar se React hidratou
      try {
        if (typeof document !== 'undefined') {
          const reactRoot = document.getElementById('__next')
          results.reactHydrated = reactRoot && reactRoot.children.length > 0
        }
      } catch (error) {
        results.errors.push(`React hydration: ${error.message}`)
      }

      setDiagnostics(results)
    }

    runDiagnostics()
  }, [])

  const handleTestClick = () => {
    console.log('Teste de clique executado!')
    setTestState(testState + 1)
    alert('Botão funcionando!')
  }

  const handleModalTest = () => {
    console.log('Teste de modal executado!')
    setModalOpen(true)
  }

  if (!isClient) {
    return <div>Carregando diagnóstico...</div>
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px' }}>
      <h1>🔍 Diagnóstico do Sistema</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Testes Interativos</h2>
        <button 
          onClick={handleTestClick}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Teste Clique (Estado: {testState})
        </button>

        <button 
          onClick={handleModalTest}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Teste Modal
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Resultados do Diagnóstico</h2>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {Object.entries(diagnostics).map(([key, value]) => (
              <tr key={key} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>{key}</td>
                <td style={{ padding: '8px' }}>
                  {typeof value === 'boolean' ? (
                    <span style={{ color: value ? 'green' : 'red' }}>
                      {value ? '✅ Sim' : '❌ Não'}
                    </span>
                  ) : Array.isArray(value) ? (
                    value.length > 0 ? (
                      <ul>
                        {value.map((item, index) => (
                          <li key={index} style={{ color: 'red' }}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ color: 'green' }}>✅ Nenhum erro</span>
                    )
                  ) : (
                    String(value)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Informações do Console</h2>
        <p>Abra o console do navegador (F12) para ver mensagens de debug.</p>
        <button 
          onClick={() => console.log('Teste de console executado em:', new Date())}
          style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Enviar Mensagem para Console
        </button>
      </div>

      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3>✅ Modal Funcionando!</h3>
            <p>Se você está vendo isso, o React e os event handlers estão funcionando corretamente.</p>
            <button 
              onClick={() => setModalOpen(false)}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Fechar Modal
            </button>
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f9fafb', 
        border: '1px solid #d1d5db',
        borderRadius: '6px' 
      }}>
        <h3>Como usar este diagnóstico:</h3>
        <ol>
          <li>Acesse: <code>localhost:3020/diagnostico</code></li>
          <li>Verifique se todos os itens estão marcados como ✅</li>
          <li>Teste os botões interativos</li>
          <li>Se algum botão não funcionar, há problema no JavaScript/React</li>
          <li>Verifique o console do navegador para erros</li>
        </ol>
      </div>
    </div>
  )
}
