import React, { useEffect, useState } from 'react'

export default function TestOcorrencias() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      console.log('Fazendo requisição para /api/animals...');
      const response = await fetch('/api/animals');
      console.log('Status da resposta:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Resultado completo:', result);
        
        const animalsData = result.data || result;
        console.log('Dados dos animais:', animalsData);
        
        setAnimals(Array.isArray(animalsData) ? animalsData : []);
      } else {
        setError(`Erro na API: ${response.status}`);
      }
    } catch (err) {
      console.error('Erro:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', backgroundColor: 'white', margin: '2rem' }}>
        <h1>Carregando...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', backgroundColor: 'white', margin: '2rem' }}>
        <h1>Erro: {error}</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', backgroundColor: 'white', margin: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Teste de Ocorrências</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Total de animais: {animals.length}</h2>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Selecionar Animal:
        </label>
        <select style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', width: '300px' }}>
          <option value="">Selecione um animal</option>
          {animals.map(animal => (
            <option key={animal.id} value={animal.id}>
              {animal.serie} - RG: {animal.rg} - Sexo: {animal.sexo}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Lista de Animais:</h3>
        <ul>
          {animals.slice(0, 5).map(animal => (
            <li key={animal.id} style={{ marginBottom: '0.5rem' }}>
              ID: {animal.id} - Série: {animal.serie} - RG: {animal.rg} - Sexo: {animal.sexo}
            </li>
          ))}
        </ul>
        {animals.length > 5 && <p>... e mais {animals.length - 5} animais</p>}
      </div>
    </div>
  );
}