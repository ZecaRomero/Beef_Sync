/**
 * Página SIMPLES para limpar dados mock
 */
export default function LimparDados() {
  
  const limparDados = () => {
    if (typeof window !== 'undefined') {
      // Limpar dados específicos
      localStorage.removeItem('animals');
      localStorage.removeItem('birthData');
      localStorage.removeItem('costs');
      localStorage.removeItem('semenStock');
      localStorage.removeItem('notasFiscais');
      
      // Limpar tudo
      localStorage.clear();
      sessionStorage.clear();
      
      alert('✅ DADOS MOCK REMOVIDOS!\n\nAgora recarregue a página para ver o sistema limpo.');
      
      // Recarregar automaticamente
      window.location.href = '/';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1f2937',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#374151',
        padding: '2rem',
        borderRadius: '8px',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <h1 style={{ marginBottom: '1rem', color: '#ef4444' }}>
          🧹 LIMPAR DADOS MOCK
        </h1>
        
        <p style={{ marginBottom: '2rem', color: '#d1d5db' }}>
          Clique no botão abaixo para remover TODOS os dados fictícios do sistema.
        </p>
        
        <button
          onClick={limparDados}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '1rem 2rem',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🗑️ EXCLUIR DADOS MOCK
        </button>
        
        <div style={{
          marginTop: '2rem',
          fontSize: '0.9rem',
          color: '#9ca3af'
        }}>
          <p>Dados que serão removidos:</p>
          <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
            <li>• 3 animais fictícios</li>
            <li>• Custos fictícios (R$ 365,00)</li>
            <li>• Vendas fictícias (R$ 2.800,00)</li>
            <li>• Nascimentos fictícios</li>
            <li>• Estoque de sêmen fictício</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
