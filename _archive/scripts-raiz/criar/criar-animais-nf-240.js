const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function criarAnimaisNF240() {
  const client = await pool.connect();
  
  try {
    console.log('🐮 CRIANDO ANIMAIS DA NF 240 DO MARCELO\n');
    console.log('='.repeat(80));
    
    // Buscar NF 240
    const nfResult = await client.query(`
      SELECT id, numero_nf, fornecedor, data_compra, data_chegada_animais
      FROM notas_fiscais
      WHERE numero_nf = '240'
    `);
    
    if (nfResult.rows.length === 0) {
      console.log('❌ NF 240 não encontrada!');
      return;
    }
    
    const nf = nfResult.rows[0];
    console.log(`✅ NF 240 encontrada (ID: ${nf.id})`);
    
    // Buscar itens
    const itensResult = await client.query(`
      SELECT id, dados_item
      FROM notas_fiscais_itens
      WHERE nota_fiscal_id = $1
    `, [nf.id]);
    
    console.log(`📦 Total de itens: ${itensResult.rows.length}\n`);
    
    let criados = 0;
    let jaExistentes = 0;
    
    for (const item of itensResult.rows) {
      try {
        const dados = typeof item.dados_item === 'string' 
          ? JSON.parse(item.dados_item) 
          : item.dados_item;
        
        const tatuagem = dados.tatuagem || '';
        if (!tatuagem) continue;
        
        // Extrair letra e número
        const matchLetra = tatuagem.match(/^([A-Za-z]+)/);
        const matchNumero = tatuagem.match(/(\d+)/);
        
        const letra = matchLetra ? matchLetra[1].toUpperCase() : 'G';
        const numero = matchNumero ? matchNumero[1] : '';
        
        if (!numero) continue;
        
        // Verificar se já existe
        const existeResult = await client.query(`
          SELECT id FROM animais WHERE serie = $1 AND rg = $2
        `, [letra, numero]);
        
        if (existeResult.rows.length > 0) {
          jaExistentes++;
          console.log(`⏭️  ${letra} ${numero} - já existe`);
          continue;
        }
        
        // Criar animal
        const nome = `${letra} ${numero}`;
        const dataChegada = nf.data_chegada_animais || nf.data_compra;
        
        // Calcular data DG prevista
        let dataDGPrevista = null;
        if (dataChegada) {
          const dataChegadaDate = new Date(dataChegada);
          dataChegadaDate.setDate(dataChegadaDate.getDate() + 15);
          dataDGPrevista = dataChegadaDate.toISOString().split('T')[0];
        }
        
        await client.query(`
          INSERT INTO animais (
            serie, rg, nome, tatuagem, sexo, raca, situacao,
            data_compra, fornecedor, data_chegada, data_dg_prevista,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        `, [
          letra, numero, nome, tatuagem, 'Fêmea',
          dados.raca || 'Mestiça', 'Ativo',
          nf.data_compra, nf.fornecedor, dataChegada, dataDGPrevista
        ]);
        
        criados++;
        console.log(`✅ ${criados}. ${nome} criado`);
        
      } catch (error) {
        console.error(`❌ Erro:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 RESUMO:');
    console.log(`   Criados: ${criados}`);
    console.log(`   Já existentes: ${jaExistentes}`);
    console.log(`   Total esperado: 33`);
    
    // Contar total
    const totalResult = await client.query(`
      SELECT COUNT(*) as total
      FROM animais
      WHERE LOWER(fornecedor) LIKE '%marcelo%'
    `);
    
    console.log(`\n✅ Total de animais do Marcelo: ${totalResult.rows[0].total}`);
    console.log('\n💡 Atualize a tela de Animais (F5) para ver todos!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

criarAnimaisNF240();
