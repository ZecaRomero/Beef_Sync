const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugFrontendData() {
  try {
    console.log('🔍 Debug - Verificando dados que chegam no frontend...');
    
    const response = await fetch('http://localhost:3020/api/semen');
    const data = await response.json();
    
    console.log('\n📊 Dados retornados pela API:');
    console.log(`Total de registros: ${data.data.length}`);
    
    data.data.forEach((item, index) => {
      console.log(`\n${index + 1}. ID: ${item.id}`);
      console.log(`   Nome Touro: ${item.nome_touro}`);
      console.log(`   Tipo Operação: "${item.tipo_operacao}"`);
      console.log(`   Quantidade Doses: ${item.quantidade_doses}`);
      console.log(`   Destino: ${item.destino || 'N/A'}`);
      console.log(`   Created At: ${item.created_at}`);
    });
    
    // Filtrar manualmente como o frontend faz
    const entradas = data.data.filter(item => item.tipo_operacao === 'entrada');
    const saidas = data.data.filter(item => item.tipo_operacao === 'saida');
    
    console.log(`\n📥 Entradas encontradas: ${entradas.length}`);
    console.log(`📤 Saídas encontradas: ${saidas.length}`);
    
    if (saidas.length > 0) {
      console.log('\n🔍 Detalhes das saídas:');
      saidas.forEach(saida => {
        console.log(`   - ID ${saida.id}: ${saida.nome_touro} → ${saida.destino} (${saida.quantidade_doses} doses)`);
      });
    }
    
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

debugFrontendData();