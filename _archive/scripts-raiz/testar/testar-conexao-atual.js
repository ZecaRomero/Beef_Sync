require('dotenv').config();
const db = require('./lib/database.js');

console.log('ğÅ¸â€ Testando conexÃ£o atual do sistema...\n');

async function testar() {
  try {
    const result = await db.testConnection();
    
    if (result.success) {
      console.log('âÅ“â€¦ CONEXÃÆ’O ESTABELECIDA COM SUCESSO!\n');
      console.log('ğÅ¸â€œÅ  InformaÃ§Ãµes da conexÃ£o:');
      console.log('  â° Timestamp:', result.timestamp);
      console.log('  ğÅ¸â€œ¦ VersÃ£o:', result.version);
      console.log('  ğÅ¸â€”â€ï¸  Database:', result.database);
      console.log('  ğÅ¸â€˜¤ UsuÃ¡rio:', result.user);
      console.log('\nğÅ¸â€œË† Pool de conexÃµes:');
      console.log('  ğÅ¸â€â€” Conectado:', result.poolInfo.connected);
      console.log('  ğÅ¸â€œÅ  Total:', result.poolInfo.totalCount);
      console.log('  ğÅ¸â€™¤ Idle:', result.poolInfo.idleCount);
      console.log('  â³ Aguardando:', result.poolInfo.waitingCount);
      
      // Testar query
      console.log('\nğÅ¸§ª Testando query...');
      const animais = await db.query('SELECT COUNT(*) as total FROM animais');
      console.log('  ğÅ¸â€ Total de animais:', animais.rows[0].total);
      
      console.log('\nâÅ“â€¦ Sistema pronto para uso!');
      process.exit(0);
    } else {
      console.error('âÅ’ Falha na conexÃ£o:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('âÅ’ ERRO:', error.message);
    process.exit(1);
  }
}

testar();
