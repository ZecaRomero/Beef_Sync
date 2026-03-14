const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'beef_sync', password: 'jcromero85', port: 5432 });
pool.query("SELECT fornecedor FROM animais WHERE serie='G' AND rg='363'").then(r => { 
  console.log('G 363 fornecedor:', r.rows[0]?.fornecedor || 'NÃO ENCONTRADO'); 
  pool.end(); 
});
