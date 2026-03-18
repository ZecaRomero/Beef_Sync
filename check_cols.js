const db = require('./lib/database');

async function check() {
  try {
    const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'animais'");
    const cols = res.rows.map(r => r.column_name);
    console.log("pub_ cols:", cols.filter(c => c.startsWith('pub_')));
    console.log("carc_ cols:", cols.filter(c => c.startsWith('carc_')));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
