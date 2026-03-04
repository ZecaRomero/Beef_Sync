const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'beef_sync', password: 'jcromero85', port: 5432 });
pool.query(`SELECT COUNT(*) as total FROM animais WHERE LOWER(fornecedor) LIKE '%marcelo%'`).then(r => { 
  console.log('Total de animais do Marcelo:', r.rows[0].total); 
  pool.end(); 
});
