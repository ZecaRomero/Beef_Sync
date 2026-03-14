require('dotenv').config();
const db = require('./lib/database.js');

console.log('🔍 Testando conexão atual do sistema...\n');

async function testar() {
  try {
    const result = await db.testConnection();
    
    if (result.success) {
      console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!\n');
      console.log('📊 Informações da conexão:');
      console.log('  ⏰ Timestamp:', result.timestamp);
      console.log('  📦 Versão:', result.version);
      console.log('  🗄️  Database:', result.database);
      console.log('  👤 Usuário:', result.user);
      console.log('\n📈 Pool de conexões:');
      console.log('  🔗 Conectado:', result.poolInfo.connected);
      console.log('  📊 Total:', result.poolInfo.totalCount);
      console.log('  💤 Idle:', result.poolInfo.idleCount);
      console.log('  ⏳ Aguardando:', result.poolInfo.waitingCount);
      
      // Testar query
      console.log('\n🧪 Testando query...');
      const animais = await db.query('SELECT COUNT(*) as total FROM animais');
      console.log('  🐄 Total de animais:', animais.rows[0].total);
      
      console.log('\n✅ Sistema pronto para uso!');
      process.exit(0);
    } else {
      console.error('❌ Falha na conexão:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    process.exit(1);
  }
}

testar();
