const fs = require('fs');
const https = require('https');

const TOKEN = 'sbp_162f70483bd16eabaa8fe35fb7d7d276f83533e1';
const PROJECT_REF = 'bpsltnglmbwdpvumjeaf';
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
const SQL_FILE = 'backups/bck_inserts_clean.sql';
const DELAY_MS = 3000;
const RETRY_DELAY_MS = 60000;
const MAX_RETRIES = 5;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 429) reject(new Error('RATE_LIMITED'));
        else if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
        else resolve(data);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function executeSQLWithRetry(sql, label) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await executeSQL(sql);
      return result;
    } catch (err) {
      if (err.message === 'RATE_LIMITED') {
        const wait = RETRY_DELAY_MS * attempt;
        console.log(`  ⏳ Rate limited em "${label}" (tentativa ${attempt}/${MAX_RETRIES}). Aguardando ${wait/1000}s...`);
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }
  throw new Error(`Rate limit persistente após ${MAX_RETRIES} tentativas`);
}

function parseInsertsByTable(lines) {
  const tables = {};
  let currentTable = null;
  let currentInsert = [];

  for (const line of lines) {
    if (line.startsWith('--') || line.trim() === '') continue;

    const m = line.match(/^INSERT INTO public\.(\w+)/);
    if (m) {
      currentTable = m[1];
      if (!tables[currentTable]) tables[currentTable] = [];
      tables[currentTable].push(line);
    }
  }
  return tables;
}

async function migrate() {
  console.log('=== MIGRAÇÃO BEEF SYNC → SUPABASE ===\n');
  console.log('Aguardando 5 minutos para reset do rate limit...');
  await sleep(300000);

  console.log('Lendo arquivo SQL...');
  const content = fs.readFileSync(SQL_FILE, 'utf8');
  const lines = content.split('\n');
  console.log(`Total: ${lines.length} linhas\n`);

  // Separate into sections
  const schemaLines = [];
  const insertLines = [];
  const setvalLines = [];
  const postDataLines = [];
  let inPostData = false;

  let inFunction = false;
  for (const line of lines) {
    if (line.startsWith('--') && line.includes('Data for')) continue;

    if (line.match(/^INSERT INTO/i)) {
      insertLines.push(line);
      continue;
    }
    if (line.match(/^SELECT pg_catalog\.setval/i)) {
      setvalLines.push(line);
      continue;
    }
    if (line.match(/^ALTER TABLE .+ ADD CONSTRAINT/i) || line.match(/^CREATE INDEX/i) || line.match(/^CREATE UNIQUE INDEX/i) || line.match(/^CREATE TRIGGER/i)) {
      inPostData = true;
    }
    if (inPostData) {
      postDataLines.push(line);
    } else {
      schemaLines.push(line);
    }
  }

  console.log(`Schema: ${schemaLines.length} linhas`);
  console.log(`Inserts: ${insertLines.length} linhas`);
  console.log(`Setvals: ${setvalLines.length} linhas`);
  console.log(`Post-data: ${postDataLines.length} linhas\n`);

  // 1) Check if schema already exists
  console.log('=== VERIFICANDO ESTADO ATUAL ===');
  try {
    const r = await executeSQLWithRetry("SELECT count(*) as cnt FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';", 'check');
    const parsed = JSON.parse(r);
    const count = parsed[0]?.cnt || 0;
    console.log(`Tabelas existentes: ${count}`);
    if (count >= 50) {
      console.log('Schema já migrado. Pulando etapa 1.\n');
    } else {
      console.log('\n=== ETAPA 1/4: SCHEMA ===');
      const schemaSQL = schemaLines.join('\n');
      console.log(`Enviando schema (${(schemaSQL.length / 1024).toFixed(1)} KB)...`);
      await sleep(DELAY_MS);
      await executeSQLWithRetry(schemaSQL, 'schema');
      console.log('Schema criado!\n');
    }
  } catch (err) {
    console.error('Erro ao verificar/criar schema:', err.message);
    return;
  }

  // 2) Insert data grouped by table
  console.log('=== ETAPA 2/4: DADOS ===');
  const tableInserts = parseInsertsByTable(insertLines);
  const tableNames = Object.keys(tableInserts);
  console.log(`Tabelas com dados: ${tableNames.length}`);

  let totalSuccess = 0;
  let totalError = 0;

  for (let t = 0; t < tableNames.length; t++) {
    const table = tableNames[t];
    const inserts = tableInserts[table];

    // Split large tables into chunks of 1000 inserts
    const CHUNK = 1000;
    const chunks = [];
    for (let i = 0; i < inserts.length; i += CHUNK) {
      chunks.push(inserts.slice(i, i + CHUNK));
    }

    for (let c = 0; c < chunks.length; c++) {
      const chunk = chunks[c];
      const sql = `BEGIN;\n${chunk.join('\n')}\nCOMMIT;`;
      const sizeKB = (sql.length / 1024).toFixed(1);
      const label = `${table} [${c+1}/${chunks.length}]`;

      process.stdout.write(`  [${t+1}/${tableNames.length}] ${label} (${chunk.length} rows, ${sizeKB} KB)... `);

      await sleep(DELAY_MS);

      try {
        await executeSQLWithRetry(sql, label);
        totalSuccess += chunk.length;
        console.log('OK');
      } catch (err) {
        totalError += chunk.length;
        console.log(`ERRO: ${err.message.substring(0, 100)}`);
      }
    }
  }

  // 3) Setvals
  console.log(`\n=== ETAPA 3/4: SEQUENCES (${setvalLines.length}) ===`);
  if (setvalLines.length > 0) {
    await sleep(DELAY_MS);
    try {
      await executeSQLWithRetry(setvalLines.join('\n'), 'setvals');
      console.log('Sequences atualizadas!');
    } catch (err) {
      console.log('Erro:', err.message.substring(0, 200));
    }
  }

  // 4) Post-data (constraints, indexes, triggers)
  console.log(`\n=== ETAPA 4/4: CONSTRAINTS & INDEXES ===`);
  const postDataSQL = postDataLines.filter(l => l.trim() && !l.startsWith('--')).join('\n');
  if (postDataSQL.length > 0) {
    console.log(`Enviando post-data (${(postDataSQL.length / 1024).toFixed(1)} KB)...`);
    await sleep(DELAY_MS);
    try {
      await executeSQLWithRetry(postDataSQL, 'post-data');
      console.log('Constraints e indexes criados!');
    } catch (err) {
      console.log('Erro:', err.message.substring(0, 300));
    }
  }

  console.log('\n=== RESULTADO FINAL ===');
  console.log(`Inserts com sucesso: ${totalSuccess}`);
  console.log(`Inserts com erro: ${totalError}`);
  console.log(`Total: ${totalSuccess + totalError}/${insertLines.length}`);
  console.log('Migração concluída!');
}

migrate().catch(console.error);
