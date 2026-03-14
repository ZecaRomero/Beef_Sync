require('dotenv').config();
const { Pool } = require('pg');

console.log('≈∏‚Äùç Testando conex√£o DIRETA com Supabase (sem pooler)...\n');

// Extrair informa√ß√µes da URL
const dbUrl = process.env.DATABASE_URL;
const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

if (!match) {
  console.error('‚ù≈í URL do banco inv√°lida');
  process.exit(1);
}

const [, user, password, host, port, database] = match;
const hostDireto = host.replace('.pooler.', '.').replace('pooler.', '');

console.log('≈∏‚Äú° Tentando conex√£o direta (porta 5432)...');
console.log('Host:', hostDireto);

const poolDireto = new Pool({
  host: hostDireto,
  port: 5432,
  database: database,
  user: user,
  password: password,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000
});

async function testarConexao() {
  try {
    const client = await poolDireto.connect();
    const result = await client.query('SELECT NOW(), version(), current_database()');
    
    console.log('‚≈ì‚Ä¶ CONEX√∆íO DIRETA ESTABELECIDA COM SUCESSO!\n');
    console.log('‚è∞ Timestamp:', result.rows[0].now);
    console.log('≈∏‚Äî‚ÄûÔ∏è  Database:', result.rows[0].current_database);
    console.log('≈∏‚Äú¶ Vers√£o:', result.rows[0].version.split(' ').slice(0, 2).join(' '));
    
    // Testar query simples
    const testQuery = await client.query('SELECT COUNT(*) as total FROM animais');
    console.log('≈∏ê‚Äû Total de animais:', testQuery.rows[0].total);
    
    client.release();
    await poolDireto.end();
    
    console.log('\n‚≈ì‚Ä¶ Conex√£o direta funcionando!');
    console.log('\n≈∏‚Äô° Use esta URL no .env:');
    console.log(`DATABASE_URL=postgresql://${user}:${password}@${hostDireto}:5432/${database}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('‚ù≈í ERRO NA CONEX√∆íO DIRETA:\n');
    console.error('C√≥digo:', error.code);
    console.error('Mensagem:', error.message);
    
    console.log('\n≈∏‚Äù‚Äû Tentando com porta 6543...');
    
    const pool6543 = new Pool({
      host: hostDireto,
      port: 6543,
      database: database,
      user: user,
      password: password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 60000
    });
    
    try {
      const client = await pool6543.connect();
      const result = await client.query('SELECT NOW()');
      
      console.log('‚≈ì‚Ä¶ CONEX√∆íO NA PORTA 6543 FUNCIONOU!\n');
      console.log('≈∏‚Äô° Use esta URL no .env:');
      console.log(`DATABASE_URL=postgresql://${user}:${password}@${hostDireto}:6543/${database}`);
      
      client.release();
      await pool6543.end();
      process.exit(0);
      
    } catch (error2) {
      console.error('‚ù≈í Porta 6543 tamb√©m falhou:', error2.message);
      
      console.log('\n‚≈°†Ô∏è  PROBLEMA DE REDE DETECTADO');
      console.log('\n≈∏‚Äô° POSS√çVEIS CAUSAS:');
      console.log('1. ≈∏‚Äù• Firewall bloqueando conex√µes PostgreSQL');
      console.log('2. ≈∏‚Ä∫°Ô∏è  Antiv√≠rus bloqueando a porta 5432/6543');
      console.log('3. ≈∏≈íê Rede corporativa/escola bloqueando');
      console.log('4. ‚è∏Ô∏è  Projeto Supabase pausado (inatividade)');
      console.log('5. ≈∏‚Äú° Problema de DNS/roteamento');
      
      console.log('\n≈∏‚Äùß SOLU√‚Ä°√‚Ä¢ES:');
      console.log('1. Acesse https://supabase.com/dashboard e verifique se o projeto est√° ativo');
      console.log('2. Desative temporariamente o firewall/antiv√≠rus para testar');
      console.log('3. Tente usar outra rede (celular, VPN)');
      console.log('4. Adicione exce√ß√£o no firewall para Node.js');
      
      await pool6543.end();
      process.exit(1);
    }
  }
}

testarConexao();
