import { useState } from 'react'

export default function TestSimple() {
  const [showModal, setShowModal] = useState(false)
  const [count, setCount] = useState(0)

  console.log('TestSimple renderizado, showModal:', showModal, 'count:', count)

  const handleClick = () => {
    console.log('Botão clicado!')
    setShowModal(true)
  }

  const handleIncrement = () => {
    console.log('Incrementando contador')
    setCount(count + 1)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Teste Simples de Botões</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleClick}
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
          Abrir Modal
        </button>

        <button 
          onClick={handleIncrement}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Contador: {count}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p>Estado atual:</p>
        <ul>
          <li>Modal aberto: {showModal ? 'Sim' : 'Não'}</li>
          <li>Contador: {count}</li>
        </ul>
      </div>

      {showModal && (
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
            <h2>Modal de Teste</h2>
            <p>Se você está vendo isso, o React está funcionando corretamente!</p>
            <button 
              onClick={() => setShowModal(false)}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '6px' 
      }}>
        <h3>Instruções de Teste:</h3>
        <ol>
          <li>Acesse: <code>localhost:3020/test-simple</code></li>
          <li>Abra o console do navegador (F12)</li>
          <li>Clique nos botões e veja se funcionam</li>
          <li>Verifique se há mensagens no console</li>
        </ol>
      </div>
    </div>
  )
}