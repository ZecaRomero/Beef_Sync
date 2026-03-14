const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
});

async function syncNeloreirAnimals() {
  try {
    console.log('�Ÿ”� Sincronizando animais NELOREGIR das notas fiscais...');
    
    // Buscar todas as NFs que contêm animais com raça NELOREGIR
    const nfResult = await pool.query('SELECT id, numero_nf, fornecedor, data_compra, itens FROM notas_fiscais WHERE itens IS NOT NULL');
    
    const animalsToSync = [];
    
    nfResult.rows.forEach(row => {
      if (row.itens && Array.isArray(row.itens)) {
        row.itens.forEach(item => {
          if (item.raca === 'NELOREGIR') {
            animalsToSync.push({
              nf: row.numero_nf,
              fornecedor: row.fornecedor,
              data_compra: row.data_compra,
              ...item
            });
          }
        });
      }
    });
    
    console.log(`\n�Ÿ“„ Encontrados ${animalsToSync.length} animais NELOREGIR para sincronizar:`);
    
    for (const animal of animalsToSync) {
      console.log(`\n�Ÿ”� Processando: ${animal.tatuagem} (${animal.raca})`);
      
      // Verificar se já existe
      const existingAnimal = await pool.query(
        'SELECT id FROM animais WHERE CONCAT(serie, \'-\', rg) = $1', 
        [animal.tatuagem]
      );
      
      if (existingAnimal.rows.length > 0) {
        console.log(`  �œ… Animal ${animal.tatuagem} já existe na tabela animais`);
        continue;
      }
      
      // Extrair série e RG da tatuagem
      let serie, rg;
      if (animal.tatuagem.includes(' ')) {
        // Formato: "TOURO 001"
        const parts = animal.tatuagem.split(' ');
        serie = parts[0];
        rg = parts[1];
      } else if (animal.tatuagem.includes('-')) {
        // Formato: "SERIE-RG"
        const parts = animal.tatuagem.split('-');
        serie = parts[0];
        rg = parts[1];
      } else {
        console.log(`  �Œ Formato de tatuagem inválido: ${animal.tatuagem}`);
        continue;
      }
      
      // Calcular idade em meses baseado na era
      const idadeMeses = animal.era ? parseInt(animal.era) : 0;
      
      // Inserir animal na tabela animais
      const insertResult = await pool.query(`
        INSERT INTO animais (
          serie, rg, tatuagem, sexo, raca, peso, meses, situacao, 
          custo_total, data_nascimento, observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        serie,
        rg,
        animal.tatuagem,
        animal.sexo === 'macho' ? 'Macho' : (animal.sexo === 'femea' ? 'Fêmea' : 'Macho'),
        'Nelore', // Padronizar para Nelore
        animal.peso || 0,
        idadeMeses,
        'Ativo',
        animal.valorUnitario || 0,
        animal.data_compra || new Date().toISOString().split('T')[0],
        `Sincronizado da NF ${animal.nf} - Raça original: ${animal.raca}`
      ]);
      
      console.log(`  �œ… Animal ${animal.tatuagem} inserido com ID: ${insertResult.rows[0].id}`);
    }
    
    console.log('\n�œ… Sincronização concluída!');
    
    // Verificar resultado final
    const finalCheck = await pool.query('SELECT COUNT(*) as count FROM animais WHERE raca = \'Nelore\'');
    console.log(`�Ÿ“Š Total de animais Nelore na tabela: ${finalCheck.rows[0].count}`);
    
  } catch (error) {
    console.error('�Œ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

syncNeloreirAnimals();
