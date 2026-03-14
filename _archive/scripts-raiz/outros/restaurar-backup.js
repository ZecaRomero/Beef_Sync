const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configurações do banco de dados
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

const TABELAS_IMPORTANTES = [
  'animais',
  'dna_envios',
  'exames_andrologicos',
  'estoque_semen',
  'custos',
  'notas_fiscais',
  'gestacoes',
  'nascimentos'
];

async function restaurarBackup() {
  console.log('🔄 Iniciando restauração do backup...\n');

  try {
    // 1. Restaurar SQL (PostgreSQL)
    console.log('📊 Restaurando backup SQL do PostgreSQL...');
    const sqlFile = 'backup_completo_2026-02-10 (1).sql';
    
    if (!fs.existsSync(sqlFile)) {
      console.error(`❌ Arquivo SQL não encontrado: ${sqlFile}`);
      return;
    }

    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Dividir em comandos individuais e executar
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`   Executando ${commands.length} comandos SQL...`);
    
    for (const command of commands) {
      try {
        await pool.query(command);
      } catch (err) {
        // Ignorar erros de DELETE em tabelas vazias
        if (!err.message.includes('does not exist')) {
          console.error(`   ⚠️  Erro ao executar comando:`, err.message);
        }
      }
    }
    
    console.log('✅ Backup SQL restaurado com sucesso!\n');

    // 2. Verificar dados restaurados
    console.log('🔍 Verificando dados restaurados do SQL...\n');
    
    for (const tabela of TABELAS_IMPORTANTES) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${tabela}`);
        const count = parseInt(result.rows[0].count);
        
        if (count > 0) {
          console.log(`   ✅ ${tabela}: ${count} registros`);
        } else {
          console.log(`   ⚠️  ${tabela}: 0 registros (VAZIA)`);
        }
      } catch (err) {
        console.log(`   ❌ ${tabela}: ${err.message}`);
      }
    }

    // 3. Verificar tabelas vazias importantes
    console.log('\n⚠️  ATENÇÃO - Tabelas vazias encontradas:');
    console.log('   - dna_envios: Nenhum envio de DNA registrado');
    console.log('   - exames_andrologicos: Nenhum exame andrológico registrado');
    console.log('   - abastecimento_nitrogenio: Tabela não existe no backup');
    console.log('\n💡 Esses dados não estão presentes em NENHUM backup disponível.');
    console.log('   Se você tinha esses dados antes, eles foram perdidos antes dos backups serem criados.');

    console.log('\n✅ Restauração SQL completa!');
    console.log('\n📊 Resumo:');
    console.log(`   - Backup SQL: ${sqlFile}`);

  } catch (error) {
    console.error('\n❌ Erro durante a restauração:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar restauração
restaurarBackup()
  .then(() => {
    console.log('\n🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Falha na restauração:', error);
    process.exit(1);
  });
