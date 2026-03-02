
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function run() {
    try {
        console.log('Testing import logic with CJCS 39...');
        
        const testRows = [
            { serie: 'CJCS', rg: '39', linha: 1 },
            { serie: 'CJCS', rg: '41', linha: 2 }
        ];
        
        await processarLinhas(testRows);
    } catch(e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

async function processarLinhas(rows) {
  const resultados = {
    animaisAtualizados: 0,
    naoEncontrados: [],
    ignoradosInativos: [],
    erros: [],
  };

  // Normalizar e filtrar linhas
  const dados = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    dados.push({
      linha: i + 1,
      serie: String(r.serie).trim(),
      rg: String(r.rg).trim(),
    });
  }

  if (dados.length === 0) return resultados;

  // Buscar todos os animais de uma vez (serie+rg) - 1 query em vez de N
  const pares = dados.map(d => [d.serie, d.rg]);
  const flatParams = pares.flat();
  
  console.log('Searching for pairs:', pares);

  const querySql = `SELECT id, serie, rg, situacao FROM animais a
     WHERE (UPPER(COALESCE(TRIM(a.serie), '')), TRIM(a.rg::text)) IN (
       ${pares.map((_, i) => `(UPPER($${i * 2 + 1}), $${i * 2 + 2})`).join(', ')}
     )`;
     
  console.log('Query SQL:', querySql);
  console.log('Params:', flatParams);

  const animaisRes = await pool.query(querySql, flatParams);

  console.log('Found animals count:', animaisRes.rows.length);
  if (animaisRes.rows.length > 0) {
      console.log('Sample found animal:', animaisRes.rows[0]);
  }

  const mapaAnimais = new Map();
  for (const a of animaisRes.rows) {
    const key = `${(a.serie || '').toUpperCase().trim()}|${String(a.rg).trim()}`;
    mapaAnimais.set(key, a);
  }
  
  console.log('Map keys:', Array.from(mapaAnimais.keys()));

  for (const d of dados) {
      const key = `${d.serie.toUpperCase().trim()}|${d.rg}`;
      const animal = mapaAnimais.get(key);
      if (!animal) {
        console.log(`Not found: ${key}. Input serie: "${d.serie}", rg: "${d.rg}"`);
      } else {
        console.log(`Found: ${key}. ID: ${animal.id}`);
      }
  }
}

run();
