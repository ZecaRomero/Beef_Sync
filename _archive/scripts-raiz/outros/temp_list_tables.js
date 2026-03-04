const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:jcromero85@localhost:5432/beef_sync' });

async function listTables() {
  try {
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(res.rows.map(r => r.table_name).join(', '));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

listTables();
