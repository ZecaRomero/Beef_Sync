// Script para testar a busca da receptora 8251
console.log('🔍 Testando busca de receptora 8251...\n');

// Simular dados de receptoras (como viriam da API)
const receptoras = [
  {
    id: 1658,
    nome: "M8251 8251",
    serie: "M8251",
    rg: "8251",
    letra: "M",
    numero: "8251",
    tatuagem: "M8251",
    fornecedor: "MINEREMBRYO REPRODUCAO E PRODUCAO LTDA",
    nf_numero: "2141"
  },
  {
    id: 1659,
    nome: "M8252 8252",
    serie: "M8252",
    rg: "8252",
    letra: "M",
    numero: "8252",
    tatuagem: "M8252",
    fornecedor: "MINEREMBRYO REPRODUCAO E PRODUCAO LTDA",
    nf_numero: "2141"
  }
];

// Função de busca (mesma lógica da página)
function buscarReceptoras(receptoras, termoBusca) {
  if (!termoBusca.trim()) return receptoras;
  
  const termo = termoBusca.toLowerCase().trim();
  return receptoras.filter(r => {
    const letra = (r.letra || '').toLowerCase();
    const numero = (r.numero || '').toString().toLowerCase();
    const rg = (r.rg || '').toString().toLowerCase();
    const serie = (r.serie || '').toLowerCase();
    const nome = (r.nome || '').toLowerCase();
    const fornecedor = (r.fornecedor || '').toLowerCase();
    const nf = (r.nf_numero || r.origem || '').toString().toLowerCase();
    const tatuagem = (r.tatuagem || '').toLowerCase();
    
    return letra.includes(termo) || 
           numero.includes(termo) || 
           rg.includes(termo) ||
           serie.includes(termo) ||
           nome.includes(termo) ||
           fornecedor.includes(termo) ||
           nf.includes(termo) ||
           tatuagem.includes(termo);
  });
}

// Testes
const testes = [
  '8251',
  'M8251',
  'M 8251',
  '251',
  'minerembryo',
  '2141'
];

console.log('📋 Testando diferentes termos de busca:\n');

testes.forEach(termo => {
  const resultado = buscarReceptoras(receptoras, termo);
  const encontrou = resultado.length > 0;
  console.log(`${encontrou ? '✅' : '❌'} Busca por "${termo}": ${resultado.length} resultado(s)`);
  if (encontrou) {
    resultado.forEach(r => {
      console.log(`   → RG: ${r.rg}, Série: ${r.serie}, Nome: ${r.nome}`);
    });
  }
  console.log('');
});

console.log('✅ Teste concluído!');
