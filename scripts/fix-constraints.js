const fs = require('fs');
const https = require('https');

const TOKEN = 'sbp_162f70483bd16eabaa8fe35fb7d7d276f83533e1';
const PROJECT_REF = 'bpsltnglmbwdpvumjeaf';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const url = new URL(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`);
    const options = {
      hostname: url.hostname, path: url.pathname, method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        if (res.statusCode === 429) reject(new Error('RATE_LIMITED'));
        else if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 500)}`));
        else resolve(data);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function retrySQL(sql, label, maxRetries = 3) {
  for (let i = 1; i <= maxRetries; i++) {
    try { return await executeSQL(sql); }
    catch(e) {
      if (e.message === 'RATE_LIMITED') { console.log(`  Rate limited, waiting ${60*i}s...`); await sleep(60000 * i); }
      else throw e;
    }
  }
}

async function main() {
  // Step 0: Get list of tables that have 'id' column
  console.log('=== STEP 0: Getting tables ===');
  const tablesResult = await retrySQL(
    `SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'id' ORDER BY table_name;`,
    'tables'
  );
  const tables = JSON.parse(tablesResult).map(r => r.table_name);
  console.log(`Tables with id column: ${tables.length}`);

  // Step 1: Remove duplicates from ALL tables (keep lowest ctid for each id)
  console.log('\n=== STEP 1: Removing duplicates ===');
  for (const table of tables) {
    await sleep(2000);
    try {
      const result = await retrySQL(
        `DELETE FROM public.${table} a USING public.${table} b WHERE a.ctid > b.ctid AND a.id = b.id;`,
        `dedup ${table}`
      );
      const parsed = JSON.parse(result);
      process.stdout.write(`  ${table}: deduped`);

      await sleep(1000);
      const countResult = await retrySQL(`SELECT count(*) as cnt FROM public.${table};`, `count ${table}`);
      const count = JSON.parse(countResult)[0].cnt;
      console.log(` (${count} rows)`);
    } catch(e) {
      console.log(`  ${table}: ERROR - ${e.message.substring(0, 100)}`);
    }
  }

  // Also fix system_settings (uses 'key' as PK, not 'id')
  await sleep(2000);
  try {
    await retrySQL(
      `DELETE FROM public.system_settings a USING public.system_settings b WHERE a.ctid > b.ctid AND a.key = b.key;`,
      'dedup system_settings'
    );
    console.log('  system_settings: deduped');
  } catch(e) { console.log(`  system_settings fix: ${e.message.substring(0, 100)}`); }

  // Also fix boletim_campo_users duplicates on nome
  await sleep(2000);
  try {
    await retrySQL(
      `DELETE FROM public.boletim_campo_users a USING public.boletim_campo_users b WHERE a.ctid > b.ctid AND a.nome = b.nome;`,
      'dedup boletim_campo_users nome'
    );
    console.log('  boletim_campo_users (by nome): deduped');
  } catch(e) { /* already handled */ }

  // Step 2: Parse constraints from SQL file
  console.log('\n=== STEP 2: Parsing constraints ===');
  const lines = fs.readFileSync('backups/bck_inserts_clean.sql', 'utf8').split('\n');
  
  const constraints = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^ALTER TABLE ONLY public\.\w+/)) {
      let stmt = lines[i];
      for (let j = i + 1; j < lines.length; j++) {
        stmt += '\n' + lines[j];
        i = j;
        if (lines[j].trimEnd().endsWith(';')) break;
      }
      constraints.push(stmt);
    }
  }

  const pks = constraints.filter(s => s.includes('PRIMARY KEY'));
  const uniques = constraints.filter(s => s.includes('UNIQUE') && !s.includes('PRIMARY KEY'));
  const fks = constraints.filter(s => s.includes('FOREIGN KEY'));

  console.log(`PKs: ${pks.length} | UNIQUEs: ${uniques.length} | FKs: ${fks.length}`);

  // Step 3: Create PKs one by one (so one failure doesn't block others)
  console.log('\n=== STEP 3: Creating PKs ===');
  let pkOk = 0, pkFail = 0;
  for (const pk of pks) {
    await sleep(1500);
    try {
      await retrySQL(pk, 'pk');
      pkOk++;
    } catch(e) {
      pkFail++;
      const table = pk.match(/public\.(\w+)/)?.[1] || 'unknown';
      console.log(`  FAIL ${table}: ${e.message.substring(0, 120)}`);
    }
  }
  console.log(`PKs: ${pkOk} OK, ${pkFail} failed`);

  // Step 4: Create UNIQUEs one by one
  console.log('\n=== STEP 4: Creating UNIQUEs ===');
  let uniqOk = 0, uniqFail = 0;
  for (const u of uniques) {
    await sleep(1500);
    try {
      await retrySQL(u, 'unique');
      uniqOk++;
    } catch(e) {
      uniqFail++;
      const name = u.match(/CONSTRAINT (\w+)/)?.[1] || 'unknown';
      console.log(`  FAIL ${name}: ${e.message.substring(0, 120)}`);
    }
  }
  console.log(`UNIQUEs: ${uniqOk} OK, ${uniqFail} failed`);

  // Step 5: Create FKs all at once (they all depend on PKs existing)
  console.log('\n=== STEP 5: Creating FKs ===');
  await sleep(2000);
  const fkSQL = fks.join('\n');
  try {
    await retrySQL(fkSQL, 'fks');
    console.log(`FKs: ${fks.length} OK!`);
  } catch(e) {
    console.log(`FKs batch error: ${e.message.substring(0, 200)}`);
    console.log('Trying FKs one by one...');
    let fkOk = 0, fkFail = 0;
    for (const fk of fks) {
      await sleep(1500);
      try { await retrySQL(fk, 'fk'); fkOk++; } catch(e2) {
        fkFail++;
        const name = fk.match(/CONSTRAINT (\w+)/)?.[1] || 'unknown';
        console.log(`  FAIL ${name}: ${e2.message.substring(0, 120)}`);
      }
    }
    console.log(`FKs: ${fkOk} OK, ${fkFail} failed`);
  }

  console.log('\nAll done!');
}

main().catch(console.error);
