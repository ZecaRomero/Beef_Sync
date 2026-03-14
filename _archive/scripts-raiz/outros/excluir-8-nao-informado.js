const {query} = require('./lib/database')

async function excluir() {
  // Buscar os 8 animais sem piquete que aparecem no relatório mobile
  const result = await query(`
    SELECT a.id, a.serie, a.rg, a.sexo
    FROM animais a
    LEFT JOIN LATERAL (
      SELECT l2.piquete FROM localizacoes_animais l2
      WHERE l2.animal_id = a.id AND l2.data_saida IS NULL
      ORDER BY l2.data_entrada DESC LIMIT 1
    ) l ON TRUE
    WHERE a.situacao = 'Ativo'
      AND (
        COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) IS NULL
        OR TRIM(COALESCE(l.piquete, a.piquete_atual, a.pasto_atual)) = ''
      )
    LIMIT 8
  `)
  
  console.log(`�Ÿ“Š Encontrados ${result.rows.length} animais para excluir:`)
  result.rows.forEach((a, idx) => {
    console.log(`${idx + 1}. ${a.serie} ${a.rg} - Sexo: ${a.sexo} - ID: ${a.id}`)
  })
  
  if (result.rows.length === 0) {
    console.log('\n�œ… Nenhum animal para excluir')
    process.exit(0)
  }
  
  // Confirmar exclusão
  console.log('\n�š�️ Esses animais serão marcados como INATIVOS (não serão deletados)')
  console.log('Pressione Ctrl+C para cancelar ou aguarde 3 segundos...')
  
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Marcar como inativos ao invés de deletar
  const ids = result.rows.map(r => r.id)
  await query(
    `UPDATE animais SET situacao = 'Inativo' WHERE id = ANY($1::int[])`,
    [ids]
  )
  
  console.log(`\n�œ… ${result.rows.length} animais marcados como INATIVOS`)
  console.log('Eles não aparecerão mais nos relatórios')
  
  process.exit(0)
}

excluir()
