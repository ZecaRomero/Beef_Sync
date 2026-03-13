const fs = require('fs');
const https = require('https');

const TOKEN = 'sbp_162f70483bd16eabaa8fe35fb7d7d276f83533e1';
const PROJECT_REF = 'bpsltnglmbwdpvumjeaf';
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
const DELAY_MS = 3000;

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
        else if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 500)}`));
        else resolve(data);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function executeSQLWithRetry(sql, label, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await executeSQL(sql);
    } catch (err) {
      if (err.message === 'RATE_LIMITED') {
        const wait = 60000 * attempt;
        console.log(`  Rate limited em "${label}" (tentativa ${attempt}). Aguardando ${wait/1000}s...`);
        await sleep(wait);
      } else throw err;
    }
  }
  throw new Error(`Rate limit persistente`);
}

async function main() {
  console.log('=== FIX: Tabela animais ===\n');
  
  const content = fs.readFileSync('backups/animais_data.sql', 'utf8');
  const lines = content.split('\n');
  
  // Join multi-line INSERT statements
  const inserts = [];
  let current = null;
  
  for (const line of lines) {
    if (line.startsWith('INSERT INTO public.animais')) {
      if (current) inserts.push(current);
      current = line;
    } else if (current && !line.startsWith('--') && !line.startsWith('SET ') && !line.startsWith('SELECT ') && line.trim() !== '') {
      current += '\n' + line;
    } else {
      if (current) {
        inserts.push(current);
        current = null;
      }
    }
  }
  if (current) inserts.push(current);
  
  console.log(`Total INSERT statements (joined): ${inserts.length}`);
  
  // First, delete existing animais data (from the failed partial inserts)
  console.log('Limpando dados parciais de animais...');
  await executeSQLWithRetry('DELETE FROM public.animais;', 'delete animais');
  console.log('OK\n');
  
  // Send in batches of 500
  const CHUNK = 500;
  const totalBatches = Math.ceil(inserts.length / CHUNK);
  let success = 0;
  let errors = 0;
  
  for (let i = 0; i < inserts.length; i += CHUNK) {
    const batch = inserts.slice(i, i + CHUNK);
    const batchNum = Math.floor(i / CHUNK) + 1;
    const sql = `BEGIN;\n${batch.join('\n')}\nCOMMIT;`;
    const pct = ((i + batch.length) / inserts.length * 100).toFixed(1);
    
    process.stdout.write(`  Lote ${batchNum}/${totalBatches} (${pct}%, ${batch.length} rows)... `);
    await sleep(DELAY_MS);
    
    try {
      await executeSQLWithRetry(sql, `animais batch ${batchNum}`);
      success += batch.length;
      console.log('OK');
    } catch (err) {
      errors += batch.length;
      console.log(`ERRO: ${err.message.substring(0, 200)}`);
    }
  }
  
  console.log(`\nResultado: ${success} OK / ${errors} erros (total ${inserts.length})`);
  
  // Also fix post-data (constraints, indexes, triggers)
  console.log('\n=== FIX: Post-data (constraints, indexes, triggers) ===');
  const mainContent = fs.readFileSync('backups/bck_inserts_clean.sql', 'utf8');
  const mainLines = mainContent.split('\n');
  
  const postDataStatements = [];
  let inPostData = false;
  let currentStmt = [];
  
  for (const line of mainLines) {
    if (line.match(/^ALTER TABLE .+ ADD CONSTRAINT/i) || line.match(/^CREATE INDEX/i) || line.match(/^CREATE UNIQUE INDEX/i) || line.match(/^CREATE TRIGGER/i)) {
      inPostData = true;
    }
    if (inPostData) {
      if (line.startsWith('--') || line.trim() === '' || line.startsWith('\\')) continue;
      currentStmt.push(line);
      if (line.endsWith(';')) {
        postDataStatements.push(currentStmt.join('\n'));
        currentStmt = [];
      }
    }
  }
  
  console.log(`Post-data statements: ${postDataStatements.length}`);
  const postDataSQL = postDataStatements.join('\n');
  console.log(`Tamanho: ${(postDataSQL.length / 1024).toFixed(1)} KB`);
  
  await sleep(DELAY_MS);
  try {
    await executeSQLWithRetry(postDataSQL, 'post-data');
    console.log('Constraints e indexes criados!');
  } catch (err) {
    console.log(`Erro: ${err.message.substring(0, 300)}`);
  }
  
  console.log('\nConcluído!');
}

main().catch(console.error);
