require('dotenv').config();
const { Pool } = require('pg');

console.log('≈∏‚Äùç Testando conex√£o com Supabase...\n');

// Testar com porta 6543 (pooler)
const pool6543 = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000
});

async function testarConexao() {
  console.log('≈∏‚Äú° Tentando conectar na porta 6543 (pooler)...');
  console.log('URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
  
  try {
    const client = await pool6543.connect();
    const result = await client.query('SELECT NOW(), version(), current_database()');
    
    console.log('‚≈ì‚Ä¶ CONEX√∆íO ESTABELECIDA COM SUCESSO!\n');
    console.log('‚è∞ Timestamp:', result.rows[0].now);
    console.log('≈∏‚Äî‚ÄûÔ∏è  Database:', result.rows[0].current_database);
    console.log('≈∏‚Äú¶ Vers√£o:', result.rows[0].version.split(' ').slice(0, 2).join(' '));
    
    // Testar query simples
    const testQuery = await client.query('SELECT COUNT(*) as total FROM animais');
    console.log('≈∏ê‚Äû Total de animais:', testQuery.rows[0].total);
    
    client.release();
    await pool6543.end();
    
    console.log('\n‚≈ì‚Ä¶ Teste conclu√≠do com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('‚ù≈í ERRO DE CONEX√∆íO:\n');
    console.error('C√≥digo:', error.code);
    console.error('Mensagem:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\n≈∏‚Äô° SOLU√‚Ä°√‚Ä¢ES POSS√çVEIS:');
      console.log('1. Verifique se o projeto Supabase est√° ativo (n√£o pausado)');
      console.log('2. Verifique seu firewall/antiv√≠rus');
      console.log('3. Tente usar uma VPN ou outra rede');
      console.log('4. Verifique se a porta 6543 n√£o est√° bloqueada');
    }
    
    await pool6543.end();
    process.exit(1);
  }
}

testarConexao();
