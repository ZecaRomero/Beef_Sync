/**
 * Verifica animais que têm mae (nome) mas NÃO têm serie_mae e rg_mae.
 * Esses animais mostram "Não encontrada no cadastro (pode estar inativa)" na ficha.
 * 
 * Uso: node scripts/verificar-maes-sem-serie-rg.js
 */
const { query } = require('../lib/database')

async function main() {
  console.log('🔍 Verificando animais com mae mas sem serie_mae/rg_mae...\n')

  // 1. Animais com mae preenchida mas sem serie_mae ou rg_mae
  const r = await query(`
    SELECT id, serie, rg, nome, mae, serie_mae, rg_mae
    FROM animais
    WHERE (mae IS NOT NULL AND TRIM(mae) != '')
      AND (serie_mae IS NULL OR rg_mae IS NULL OR TRIM(serie_mae) = '' OR TRIM(rg_mae::text) = '')
    ORDER BY serie, rg::text
  `)

  console.log(`📊 Total: ${r.rows.length} animal(is) com mae mas sem serie_mae/rg_mae\n`)

  if (r.rows.length === 0) {
    console.log('✅ Nenhum animal encontrado nessa condição.')
    return
  }

  // Buscar MAPUA SANT ANNA especificamente
  const mapua = r.rows.find(a => 
    (a.mae || '').toUpperCase().includes('MAPUA') || 
    (a.mae || '').toUpperCase().includes('MARUA')
  )
  if (mapua) {
    console.log('🐄 MAPUA/MARUA SANT ANNA (filho):')
    console.log(`   Filho: ${mapua.serie} ${mapua.rg} | ${mapua.nome || '-'}`)
    console.log(`   Mãe: ${mapua.mae}`)
    console.log(`   serie_mae: ${mapua.serie_mae || 'NULL'}`)
    console.log(`   rg_mae: ${mapua.rg_mae ?? 'NULL'}\n`)
  }

  // Verificar se MAPUA SANT ANNA existe como animal (mãe cadastrada)
  const maeMapua = await query(`
    SELECT id, serie, rg, nome FROM animais 
    WHERE UPPER(TRIM(COALESCE(nome,''))) LIKE '%MAPUA%' OR UPPER(TRIM(COALESCE(nome,''))) LIKE '%MARUA%'
  `)
  if (maeMapua.rows.length > 0) {
    console.log('📋 MAPUA/MARUA encontrada(s) no cadastro de animais:')
    maeMapua.rows.forEach(a => console.log(`   ${a.serie} ${a.rg} | ${a.nome}`))
    console.log('')
  }

  // Listar todos (primeiros 50)
  console.log('📋 Lista (primeiros 50):')
  r.rows.slice(0, 50).forEach((a, i) => {
    console.log(`   ${i + 1}. ${a.serie} ${a.rg} | ${a.nome || '-'} | Mãe: ${a.mae}`)
  })
  if (r.rows.length > 50) {
    console.log(`   ... e mais ${r.rows.length - 50} animais`)
  }

  console.log('\n💡 Para corrigir: use a importação "Série e RG da Mãe" em Importações')
  console.log('   Formato Excel: Série | RG | Série Mãe | RG Mãe')
}

main().catch(e => {
  console.error('Erro:', e)
  process.exit(1)
}).finally(() => process.exit(0))
