const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function verificarFemeas() {
  try {
    console.log('�Ÿ”� Verificando fêmeas inseminadas...\n');

    // Lista de RGs visíveis na imagem
    const rgsParaVerificar = [
      '5', '19599', '19788', '19770', '19748', '19714', '19627', '19595'
    ];

    console.log('�Ÿ“‹ RGs para verificar:', rgsParaVerificar.join(', '));
    console.log('�”€'.repeat(100));

    for (const rg of rgsParaVerificar) {
      // Buscar animal
      const animal = await pool.query(`
        SELECT id, serie, rg, nome, sexo, raca, situacao, created_at
        FROM animais
        WHERE rg = $1
        ORDER BY id DESC
        LIMIT 1
      `, [rg]);

      if (animal.rows.length > 0) {
        const a = animal.rows[0];
        console.log(`\n�œ… RG ${rg} - ENCONTRADO`);
        console.log(`   ID: ${a.id}`);
        console.log(`   Série: ${a.serie}`);
        console.log(`   Nome: ${a.nome || '(sem nome)'}`);
        console.log(`   Sexo: ${a.sexo}`);
        console.log(`   Raça: ${a.raca || 'N/A'}`);
        console.log(`   Situação: ${a.situacao}`);
        console.log(`   Cadastrado em: ${a.created_at}`);

        // Buscar inseminações deste animal
        const ias = await pool.query(`
          SELECT id, data_ia, touro_nome, status_gestacao, created_at
          FROM inseminacoes
          WHERE animal_id = $1
          ORDER BY created_at DESC
        `, [a.id]);

        if (ias.rows.length > 0) {
          console.log(`   �Ÿ“Š Inseminações registradas: ${ias.rows.length}`);
          ias.rows.forEach((ia, idx) => {
            const dataIA = ia.data_ia;
            console.log(`      ${idx + 1}. Data: ${dataIA ? new Date(dataIA).toLocaleDateString('pt-BR') : 'N/A'} | Touro: ${ia.touro_nome || 'N/A'} | Status: ${ia.status_gestacao || 'N/A'}`);
          });
        } else {
          console.log(`   �š�️ Nenhuma inseminação registrada`);
        }
      } else {
        console.log(`\n�Œ RG ${rg} - N�ƒO ENCONTRADO no banco de dados`);
      }
    }

    console.log('\n' + '�”€'.repeat(100));
    console.log('\n�Ÿ“Š RESUMO GERAL:\n');

    // Contar total de animais fêmeas
    const totalFemeas = await pool.query(`
      SELECT COUNT(*) as total
      FROM animais
      WHERE sexo LIKE 'F%'
    `);

    // Contar total de inseminações
    const totalIAs = await pool.query(`
      SELECT COUNT(*) as total
      FROM inseminacoes
    `);

    // Contar fêmeas com série CJC
    const femeasCJC = await pool.query(`
      SELECT COUNT(*) as total
      FROM animais
      WHERE sexo LIKE 'F%' AND serie = 'CJC'
    `);

    console.log(`Total de fêmeas no sistema: ${totalFemeas.rows[0].total}`);
    console.log(`Total de fêmeas CJC: ${femeasCJC.rows[0].total}`);
    console.log(`Total de inseminações registradas: ${totalIAs.rows[0].total}`);

    // Listar últimas 10 inseminações
    console.log('\n�Ÿ“… �šltimas 10 inseminações registradas:');
    const ultimasIAs = await pool.query(`
      SELECT i.id, i.data_ia, i.touro_nome, i.status_gestacao,
             a.serie, a.rg, a.nome as animal_nome, i.created_at
      FROM inseminacoes i
      LEFT JOIN animais a ON i.animal_id = a.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `);

    ultimasIAs.rows.forEach((ia, idx) => {
      const dataIA = ia.data_ia;
      console.log(`${idx + 1}. ${ia.serie || '?'} ${ia.rg || '?'} | Data IA: ${dataIA ? new Date(dataIA).toLocaleDateString('pt-BR') : 'N/A'} | Touro: ${ia.touro_nome || 'N/A'} | Registrado: ${new Date(ia.created_at).toLocaleString('pt-BR')}`);
    });

  } catch (error) {
    console.error('�Œ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarFemeas();
