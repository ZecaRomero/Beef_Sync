/**
 * Script para verificar e sincronizar exames andrológicos
 * Verifica se os dados estão no PostgreSQL ou apenas no localStorage
 */

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:jcromero85@localhost:5432/beef_sync'
})

async function verificarExamesAndrologicos() {
  console.log('🔍 VERIFICANDO EXAMES ANDROLÓGICOS\n')
  console.log('=' .repeat(80))
  
  try {
    // 1. Verificar se a tabela existe
    const tabelaExiste = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'exames_andrologicos'
      );
    `)
    
    if (!tabelaExiste.rows[0].exists) {
      console.log('❌ Tabela exames_andrologicos NÃO EXISTE no PostgreSQL!')
      console.log('\n📋 Estrutura esperada:')
      console.log(`
CREATE TABLE exames_andrologicos (
  id SERIAL PRIMARY KEY,
  animal_id INTEGER REFERENCES animais(id),
  touro VARCHAR(255),
  rg VARCHAR(50),
  data DATE NOT NULL,
  resultado VARCHAR(50),
  ce VARCHAR(100),
  defeitos TEXT,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
      `)
      return
    }
    
    console.log('✅ Tabela exames_andrologicos existe\n')
    
    // 2. Verificar estrutura da tabela
    const colunas = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'exames_andrologicos'
      ORDER BY ordinal_position;
    `)
    
    console.log('📊 ESTRUTURA DA TABELA:')
    console.log('-'.repeat(80))
    colunas.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })
    console.log()
    
    // 3. Contar exames no banco
    const count = await pool.query('SELECT COUNT(*) FROM exames_andrologicos')
    const totalExames = parseInt(count.rows[0].count)
    
    console.log('📈 ESTATÍSTICAS:')
    console.log('-'.repeat(80))
    console.log(`  Total de exames no PostgreSQL: ${totalExames}`)
    
    if (totalExames === 0) {
      console.log('\n⚠️  BANCO DE DADOS VAZIO!')
      console.log('   Os exames podem estar apenas no localStorage do navegador.')
      console.log('\n💡 SOLUÇÕES:')
      console.log('   1. Abra o navegador e vá para a página de Exames Andrológicos')
      console.log('   2. Abra o Console (F12)')
      console.log('   3. Execute: localStorage.getItem("examesAndrologicos")')
      console.log('   4. Copie o resultado e me envie para sincronizar')
      console.log('\n   OU')
      console.log('\n   1. Na página de Exames Andrológicos, clique em "Reprocessar Custos"')
      console.log('   2. Isso vai salvar todos os exames no PostgreSQL')
    } else {
      // 4. Mostrar últimos exames
      const ultimosExames = await pool.query(`
        SELECT *
        FROM exames_andrologicos
        ORDER BY data_exame DESC, created_at DESC
        LIMIT 10
      `)
      
      console.log(`\n📋 ÚLTIMOS ${ultimosExames.rows.length} EXAMES:`)
      console.log('-'.repeat(80))
      ultimosExames.rows.forEach((exame, idx) => {
        console.log(`\n${idx + 1}. ID: ${exame.id}`)
        console.log(`   Touro: ${exame.touro} ${exame.rg}`)
        console.log(`   Data: ${exame.data_exame ? new Date(exame.data_exame).toLocaleDateString('pt-BR') : 'N/A'}`)
        console.log(`   Resultado: ${exame.resultado || 'N/A'}`)
        console.log(`   CE: ${exame.ce || 'N/A'}`)
        console.log(`   Defeitos: ${exame.defeitos || 'Nenhum'}`)
        console.log(`   Cadastrado em: ${exame.created_at ? new Date(exame.created_at).toLocaleString('pt-BR') : 'N/A'}`)
      })
      
      // 5. Estatísticas por resultado
      const porResultado = await pool.query(`
        SELECT resultado, COUNT(*) as total
        FROM exames_andrologicos
        GROUP BY resultado
        ORDER BY total DESC
      `)
      
      console.log('\n📊 EXAMES POR RESULTADO:')
      console.log('-'.repeat(80))
      porResultado.rows.forEach(r => {
        console.log(`  ${(r.resultado || 'Não informado').padEnd(20)} : ${r.total}`)
      })
      
      // 6. Exames por mês
      const porMes = await pool.query(`
        SELECT 
          TO_CHAR(data_exame, 'MM/YYYY') as mes,
          COUNT(*) as total
        FROM exames_andrologicos
        WHERE data_exame IS NOT NULL
        GROUP BY TO_CHAR(data_exame, 'MM/YYYY'), TO_CHAR(data_exame, 'YYYY-MM')
        ORDER BY TO_CHAR(data_exame, 'YYYY-MM') DESC
        LIMIT 6
      `)
      
      console.log('\n📅 EXAMES POR MÊS (últimos 6 meses):')
      console.log('-'.repeat(80))
      porMes.rows.forEach(m => {
        console.log(`  ${m.mes} : ${m.total} exames`)
      })
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('✅ Verificação concluída!')
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error('\nDetalhes:', error)
  } finally {
    await pool.end()
  }
}

// Executar
verificarExamesAndrologicos()
