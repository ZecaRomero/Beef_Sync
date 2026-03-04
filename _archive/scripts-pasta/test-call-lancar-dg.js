const fetch = require('node-fetch');

async function call() {
  const url = 'http://localhost:3020/api/receptoras/lancar-dg-batch';
  const body = {
    dataDG: '2026-02-19',
    veterinario: 'MARINA',
    receptoras: [{
      animalId: null,
      letra: 'M',
      numero: '8251',
      resultadoDG: 'Vazia',
      observacoes: 'Teste automático',
      lote: 1,
      numeroNF: '2141'
    }]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (e) {
    console.error('Erro de chamada:', e.message);
  }
}

call();
