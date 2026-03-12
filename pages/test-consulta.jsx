import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function TestConsulta() {
  const router = useRouter()
  const [apiTest, setApiTest] = useState(null)
  const [animalTest, setAnimalTest] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const testAPI = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/test-animal')
      const data = await res.json()
      setApiTest(data)
    } catch (error) {
      setApiTest({ error: error.message })
    }
    setLoading(false)
  }
  
  const testAnimalAPI = async (id) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/animals/${id}?history=true`)
      const data = await res.json()
      setAnimalTest(data)
    } catch (error) {
      setAnimalTest({ error: error.message })
    }
    setLoading(false)
  }
  
  useEffect(() => {
    testAPI()
  }, [])
  
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>Diagnóstico do Sistema</h1>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>✅ Informações Básicas</h2>
        <p><strong>Router pathname:</strong> {router.pathname}</p>
        <p><strong>Router query:</strong> {JSON.stringify(router.query)}</p>
        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
        <h2>🔧 Teste de API</h2>
        {loading && <p>Carregando...</p>}
        {apiTest && (
          <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(apiTest, null, 2)}
          </pre>
        )}
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
        <h2>🐄 Teste de Animal API</h2>
        <div style={{ marginBottom: '10px' }}>
          <input 
            type="text" 
            placeholder="ID do animal" 
            id="animalId"
            style={{ padding: '8px', marginRight: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button 
            onClick={() => {
              const id = document.getElementById('animalId').value
              if (id) testAnimalAPI(id)
            }}
            style={{ padding: '8px 16px', cursor: 'pointer', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Testar
          </button>
        </div>
        {animalTest && (
          <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '400px' }}>
            {JSON.stringify(animalTest, null, 2)}
          </pre>
        )}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>🔗 Links de Teste</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => router.push('/consulta-animal/1')}
            style={{ padding: '10px 20px', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Consulta Animal ID 1
          </button>
          <button 
            onClick={() => router.push('/a?buscar=1')}
            style={{ padding: '10px 20px', cursor: 'pointer', background: '#FF9800', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Página de Busca (/a)
          </button>
          <button 
            onClick={() => {
              console.log('Teste de console.log')
              console.error('Teste de console.error')
              console.warn('Teste de console.warn')
              alert('Console testado! Verifique o console do navegador (F12)')
            }}
            style={{ padding: '10px 20px', cursor: 'pointer', background: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Testar Console
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#ffebee', borderRadius: '8px' }}>
        <h2>📋 Instruções</h2>
        <ol>
          <li>Verifique se a API está respondendo (seção "Teste de API")</li>
          <li>Teste buscar um animal específico inserindo o ID</li>
          <li>Abra o console do navegador (F12) para ver logs detalhados</li>
          <li>Tente acessar a página de consulta usando os botões acima</li>
        </ol>
      </div>
    </div>
  )
}
