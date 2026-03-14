const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function verificarTabelaMortes() {
  console.log('🔍 VERIFICANDO TABELA DE MORTES\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar estrutura da tabela mortes
    console.log('\n📊 1. Estrutura da tabela mortes...');
    const estrutura = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'mortes'
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Colunas da tabela:');
    estrutura.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // 2. Contar registros
    console.log('\n📊 2. Total de registros...');
    const count = await pool.query(`SELECT COUNT(*) as total FROM mortes`);
    console.log(`✅ Total: ${count.rows[0].total}`);

    // 3. Buscar todos os registros
    if (count.rows[0].total > 0) {
      console.log('\n📊 3. Registros encontrados:');
      const mortes = await pool.query(`
        SELECT * FROM mortes 
        ORDER BY created_at DESC
      `);
      
      mortes.rows.forEach((m, i) => {
        console.log(`\n   ${i + 1}. Morte ID: ${m.id}`);
        console.log(`      Animal ID: ${m.animal_id || 'N/A'}`);
        console.log(`      Série-RG: ${m.serie || 'N/A'}-${m.rg || 'N/A'}`);
        console.log(`      Data: ${m.data_morte || m.data || 'N/A'}`);
        console.log(`      Causa: ${m.causa || m.causa_morte || 'N/A'}`);
        console.log(`      Observações: ${m.observacoes || 'N/A'}`);
        console.log(`      Cadastrado em: ${m.created_at || 'N/A'}`);
      });

      // 4. Verificar se os animais dessas mortes têm situação "Morto"
      console.log('\n📊 4. Verificando situação dos animais...');
      for (const morte of mortes.rows) {
        if (morte.animal_id) {
          const animal = await pool.query(`
            SELECT id, serie, rg, situacao 
            FROM animais 
            WHERE id = $1
          `, [morte.animal_id]);
          
          if (animal.rows.length > 0) {
            const a = animal.rows[0];
            console.log(`   - Animal ${a.serie}-${a.rg}: situação = "${a.situacao}"`);
            
            if (a.situacao !== 'Morto') {
              console.log(`     ⚠️ ATENÇÃO: Animal deveria estar como "Morto" mas está como "${a.situacao}"`);
            }
          } else {
            console.log(`   - Animal ID ${morte.animal_id}: NÃO ENCONTRADO na tabela animais`);
          }
        }
      }
    } else {
      console.log('⚠️ Nenhum registro de morte encontrado na tabela');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Verificação concluída!');

  } catch (error) {
    console.error('\n❌ Erro durante verificação:', error);
    console.error('Detalhes:', error.message);
  } finally {
    await pool.end();
  }
}

verificarTabelaMortes();
