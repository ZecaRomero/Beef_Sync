const { query } = require('./lib/database')

async function excluirNaoInformados() {
  try {
    console.log('Buscando animais sem piquete (Não informado)...')
    
    // Buscar animais ativos sem piquete
    const result = await query(`
      SELECT a.id, a.serie, a.rg, a.nome, a.piquete_atual, a.pasto_atual
      FROM animais a
      LEFT JOIN localizacoes_animais l ON l.animal_id = a.id AND l.data_saida IS NULL
      WHERE a.situacao = 'Ativo'
        AND COALESCE(l.piquete, a.piquete_atual, a.pasto_atual) IS NULL
      ORDER BY a.serie, a.rg
      LIMIT 10
    `)
    
    console.log(`\nEncontrados ${result.rows.length} animais sem piquete:`)
    result.rows.forEach(r => {
      console.log(`  - ${r.serie || ''} ${r.rg || ''} (ID: ${r.id})`)
    })
    
    if (result.rows.length === 0) {
      console.log('\nNenhum animal encontrado para marcar como inativo.')
      return
    }
    
    // Marcar como inativos
    const ids = result.rows.map(r => r.id)
    const updateResult = await query(`
      UPDATE animais 
      SET situacao = 'Inativo', 
          updated_at = NOW()
      WHERE id = ANY($1::int[])
    `, [ids])
    
    console.log(`\n�œ“ ${updateResult.rowCount} animais marcados como INATIVOS com sucesso!`)
    
  } catch (error) {
    console.error('Erro:', error.message)
  } finally {
    process.exit()
  }
}

excluirNaoInformados()
