/**
 * Verifica se os campos data_nascimento, pasto_atual e situacao_abcz
 * estão sendo salvos corretamente no banco de dados.
 * Uso: node scripts/verificar-campos-animais.js
 */
const { query, initDatabase } = require('../lib/database')

async function verificar() {
  try {
    initDatabase()
    console.log('🔍 VERIFICANDO CAMPOS DOS ANIMAIS NO BANCO\n')

    // 1. Estrutura da tabela
    const cols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
      AND column_name IN ('data_nascimento', 'pasto_atual', 'piquete_atual', 'situacao_abcz')
      ORDER BY column_name
    `)
    console.log('📋 Colunas existentes na tabela animais:')
    cols.rows.forEach(r => console.log(`   - ${r.column_name} (${r.data_type})`))
    if (cols.rows.length === 0) console.log('   ⚠️ Nenhuma das colunas críticas encontrada!')

    // 2. Estatísticas por campo
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(data_nascimento) as com_data_nascimento,
        COUNT(pasto_atual) as com_pasto_atual,
        COUNT(piquete_atual) as com_piquete_atual,
        COUNT(situacao_abcz) as com_situacao_abcz
      FROM animais
    `)
    const s = stats.rows[0]
    console.log('\n📊 Estatísticas:')
    console.log(`   Total de animais: ${s.total}`)
    console.log(`   Com data_nascimento: ${s.com_data_nascimento} (${((s.com_data_nascimento/s.total)*100).toFixed(1)}%)`)
    console.log(`   Com pasto_atual: ${s.com_pasto_atual} (${((s.com_pasto_atual/s.total)*100).toFixed(1)}%)`)
    console.log(`   Com piquete_atual: ${s.com_piquete_atual} (${((s.com_piquete_atual/s.total)*100).toFixed(1)}%)`)
    console.log(`   Com situacao_abcz: ${s.com_situacao_abcz} (${((s.com_situacao_abcz/s.total)*100).toFixed(1)}%)`)

    // 3. Amostra do animal 2100 (CJCJ 16905)
    const amostra = await query(`
      SELECT id, serie, rg, data_nascimento, pasto_atual, piquete_atual, situacao_abcz, updated_at
      FROM animais WHERE id = 2100 OR (serie = 'CJCJ' AND rg = '16905')
      LIMIT 1
    `)
    if (amostra.rows.length > 0) {
      const a = amostra.rows[0]
      console.log('\n🐄 Amostra (CJCJ 16905):')
      console.log(`   data_nascimento: ${a.data_nascimento || '(vazio)'}`)
      console.log(`   pasto_atual: ${a.pasto_atual || '(vazio)'}`)
      console.log(`   piquete_atual: ${a.piquete_atual || '(vazio)'}`)
      console.log(`   situacao_abcz: ${a.situacao_abcz || '(vazio)'}`)
      console.log(`   updated_at: ${a.updated_at}`)
    }

    // 4. Últimos 5 animais atualizados
    const recentes = await query(`
      SELECT id, serie, rg, data_nascimento, pasto_atual, situacao_abcz, updated_at
      FROM animais ORDER BY updated_at DESC NULLS LAST LIMIT 5
    `)
    console.log('\n📅 Últimos 5 animais (por updated_at):')
    recentes.rows.forEach((r, i) => {
      console.log(`   ${i+1}. ${r.serie} ${r.rg} | data: ${r.data_nascimento || '-'} | piquete: ${r.pasto_atual || '-'} | ABCZ: ${r.situacao_abcz || '-'}`)
    })

    console.log('\n✅ Verificação concluída.')
  } catch (e) {
    console.error('❌ Erro:', e.message)
    process.exit(1)
  }
  process.exit(0)
}

verificar()
