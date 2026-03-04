const fetch = require('node-fetch');

async function run() {
  const url = 'http://localhost:3020/api/receptoras/lista-dg?incluirComDG=true';
  const res = await fetch(url);
  const json = await res.json();
  const data = json.data || [];
  console.log('Status:', res.status, 'Total:', data.length);
  const r8251 = data.find(r => (r.rg === '8251' || r.numero === '8251') && (r.letra === 'M' || r.serie === 'M' || r.serie === 'M8251'));
  if (r8251) {
    console.log('8251:', {
      letra: r8251.letra,
      numero: r8251.numero,
      fornecedor: r8251.fornecedor,
      dataDG: r8251.dataDG,
      resultadoDG: r8251.resultadoDG,
      veterinario: r8251.veterinario
    });
  } else {
    console.log('8251 não encontrada');
  }
}

run();
