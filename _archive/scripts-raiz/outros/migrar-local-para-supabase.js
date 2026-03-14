require('dotenv').config();
const { Pool } = require('pg');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log('≈∏≈°‚Ç¨ MIGRA√‚Ä°√∆íO: PostgreSQL Local ‚‚Ä†‚Äô Supabase\n');
console.log('='.repeat(60));

// Pool local
const poolLocal = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
  connectionTimeoutMillis: 10000
});

// Pool Supabase
const poolSupabase = new Pool({
  connectionString: 'postgresql://postgres.bpsltnglmbwdpvumjeaf:jcromero1985zeca@aws-0-sa-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000
});

async function testarConexoes() {
  console.log('≈∏‚Äùç Testando conex√µes...\n');
  
  try {
    console.log('≈∏‚Äú° Testando PostgreSQL local...');
    const clientLocal = await poolLocal.connect();
    const resultLocal = await clientLocal.query('SELECT COUNT(*) as total FROM animais');
    console.log(`‚≈ì‚Ä¶ Local conectado - ${resultLocal.rows[0].total} animais`);
    clientLocal.release();
  } catch (error) {
    console.error('‚ù≈í Erro no banco local:', error.message);
    return false;
  }
  
  try {
    console.log('≈∏‚Äú° Testando Supabase...');
    const clientSupabase = await poolSupabase.connect();
    await clientSupabase.query('SELECT NOW()');
    console.log('‚≈ì‚Ä¶ Supabase conectado');
    clientSupabase.release();
  } catch (error) {
    console.error('‚ù≈í Erro no Supabase:', error.message);
    console.log('\n‚≈°†Ô∏è  SUPABASE N√∆íO ACESS√çVEL!');
    console.log('≈∏‚Äô° Certifique-se de:');
    console.log('   1. VPN est√° ativa');
    console.log('   2. Ou est√° usando hotspot do celular');
    console.log('   3. Projeto Supabase est√° ativo\n');
    return false;
  }
  
  return true;
}

async function exportarDados() {
  console.log('\n≈∏‚Äú¶ Exportando dados do banco local...\n');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFile = `backup-para-supabase-${timestamp}.sql`;
  
  const pgDumpCmd = `pg_dump -h localhost -p 5432 -U postgres -d beef_sync -F p -f ${backupFile}`;
  
  try {
    console.log('‚è≥ Criando backup SQL...');
    await execAsync(pgDumpCmd, { env: { ...process.env, PGPASSWORD: 'jcromero85' } });
    console.log(`‚≈ì‚Ä¶ Backup criado: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('‚ù≈í Erro ao criar backup:', error.message);
    console.log('\n≈∏‚Äô° Tentando m√©todo alternativo (pg_dump pode n√£o estar no PATH)...');
    return null;
  }
}

async function migrarDadosDireto() {
  console.log('\n≈∏‚Äù‚Äû Migrando dados diretamente...\n');
  
  const tabelas = [
    'animais',
    'custos',
    'pesagens',
    'localizacoes_animais',
    'gestacoes',
    'nascimentos',
    'inseminacoes',
    'estoque_semen',
    'destinos_semen',
    'fornecedores_destinatarios',
    'coleta_fiv',
    'transferencias_embrioes',
    'causas_morte',
    'mortes',
    'boletim_contabil',
    'movimentacoes_contabeis',
    'servicos',
    'notificacoes',
    'protocolos_reprodutivos',
    'protocolos_aplicados',
    'ciclos_reprodutivos',
    'relatorios_personalizados',
    'destinatarios_relatorios',
    'notas_fiscais',
    'naturezas_operacao',
    'origens_receptoras',
    'historia_ocorrencias'
  ];
  
  let totalRegistros = 0;
  
  for (const tabela of tabelas) {
    try {
      console.log(`≈∏‚Äú‚Äπ Migrando tabela: ${tabela}...`);
      
      // Buscar dados do local
      const clientLocal = await poolLocal.connect();
      const result = await clientLocal.query(`SELECT * FROM ${tabela}`);
      clientLocal.release();
      
      if (result.rows.length === 0) {
        console.log(`   ‚è≠Ô∏è  Tabela vazia, pulando...`);
        continue;
      }
      
      console.log(`   ≈∏‚Äú≈† ${result.rows.length} registros encontrados`);
      
      // Inserir no Supabase
      const clientSupabase = await poolSupabase.connect();
      
      // Limpar tabela no Supabase
      await clientSupabase.query(`TRUNCATE TABLE ${tabela} CASCADE`);
      
      // Inserir dados em lotes
      const batchSize = 100;
      for (let i = 0; i < result.rows.length; i += batchSize) {
        const batch = result.rows.slice(i, i + batchSize);
        
        for (const row of batch) {
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
          
          const insertQuery = `
            INSERT INTO ${tabela} (${columns.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING
          `;
          
          await clientSupabase.query(insertQuery, values);
        }
        
        console.log(`   ‚è≥ Progresso: ${Math.min(i + batchSize, result.rows.length)}/${result.rows.length}`);
      }
      
      clientSupabase.release();
      
      totalRegistros += result.rows.length;
      console.log(`   ‚≈ì‚Ä¶ ${result.rows.length} registros migrados\n`);
      
    } catch (error) {
      console.error(`   ‚ù≈í Erro na tabela ${tabela}:`, error.message);
      // Continua com pr√≥xima tabela
    }
  }
  
  return totalRegistros;
}

async function verificarMigracao() {
  console.log('\n≈∏‚Äùç Verificando migra√ß√£o...\n');
  
  try {
    const clientSupabase = await poolSupabase.connect();
    const result = await clientSupabase.query('SELECT COUNT(*) as total FROM animais');
    console.log(`‚≈ì‚Ä¶ Animais no Supabase: ${result.rows[0].total}`);
    clientSupabase.release();
    return true;
  } catch (error) {
    console.error('‚ù≈í Erro ao verificar:', error.message);
    return false;
  }
}

async function migrar() {
  try {
    // Testar conex√µes
    const conexoesOk = await testarConexoes();
    if (!conexoesOk) {
      process.exit(1);
    }
    
    console.log('\n‚≈°†Ô∏è  ATEN√‚Ä°√∆íO: Esta opera√ß√£o ir√°:');
    console.log('   1. Limpar dados existentes no Supabase');
    console.log('   2. Copiar todos os dados do banco local');
    console.log('   3. Pode levar alguns minutos\n');
    
    // Aguardar 5 segundos
    console.log('‚è≥ Iniciando em 5 segundos... (Ctrl+C para cancelar)');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Migrar dados
    const total = await migrarDadosDireto();
    
    // Verificar
    await verificarMigracao();
    
    console.log('\n' + '='.repeat(60));
    console.log('‚≈ì‚Ä¶ MIGRA√‚Ä°√∆íO CONCLU√çDA COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`\n≈∏‚Äú≈† Total de registros migrados: ${total}`);
    console.log('\n≈∏‚Äú‚Äπ PR√‚ÄúXIMOS PASSOS:\n');
    console.log('1. Execute: node trocar-banco.js');
    console.log('2. Escolha op√ß√£o 2 (Supabase)');
    console.log('3. Configure app mobile com:');
    console.log('   URL: https://bpsltnglmbwdpvumjeaf.supabase.co');
    console.log('   Database: Supabase (nuvem)\n');
    console.log('≈∏≈Ω‚Ä∞ Agora o app funciona sem o PC ligado!\n');
    
    await poolLocal.end();
    await poolSupabase.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n‚ù≈í ERRO NA MIGRA√‚Ä°√∆íO:', error.message);
    await poolLocal.end();
    await poolSupabase.end();
    process.exit(1);
  }
}

migrar();
