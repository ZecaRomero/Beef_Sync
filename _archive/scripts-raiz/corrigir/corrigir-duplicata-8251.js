const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
})

async function corrigirDuplicata() {
  try {
    console.log('�Ÿ”� Corrigindo duplicata 8251...\n')

    // Buscar todas as 8251 para identificar qual manter
    const todos = await pool.query(`
      SELECT id, nome, serie, rg, raca, data_dg, veterinario_dg, resultado_dg
      FROM animais WHERE rg = '8251' ORDER BY id
    `)

    if (todos.rows.length < 2) {
      console.log('�œ… Não há duplicatas. Total de animais 8251:', todos.rows.length)
      return
    }

    // Manter: M 8251 (Receptora) - o que tem DG
    // Remover: M8251 (Mestiça) - duplicata sem DG
    const correto = todos.rows.find(a => a.serie === 'M' && a.raca === 'Receptora')
    const duplicata = todos.rows.find(a => a.serie === 'M8251' || (a.raca === 'Mestiça' && a.rg === '8251'))

    if (!correto) {
      console.log('�š�️ Receptora M 8251 não encontrada. Verifique manualmente.')
      todos.rows.forEach(a => console.log(`   ID ${a.id}: ${a.nome} (${a.raca})`))
      return
    }

    if (!duplicata) {
      console.log('�š�️ Duplicata não identificada. Animais encontrados:')
      todos.rows.forEach(a => console.log(`   ID ${a.id}: ${a.nome} (${a.raca})`))
      return
    }

    console.log('�Ÿ“‹ Manter (correto):')
    console.log(`   ID ${correto.id}: ${correto.nome} - ${correto.raca}`)
    console.log(`   DG: ${correto.data_dg ? new Date(correto.data_dg).toLocaleDateString('pt-BR') + ' - ' + correto.resultado_dg : 'Não tem'}`)
    console.log('')
    console.log('�Ÿ“‹ Remover (duplicata):')
    console.log(`   ID ${duplicata.id}: ${duplicata.nome} - ${duplicata.raca}`)
    console.log('')

    // Se a duplicata tiver DG e a correta não, copiar antes de deletar
    if (duplicata.data_dg && !correto.data_dg) {
      console.log('�š�️ Duplicata tem DG, copiando para o registro correto...')
      await pool.query(`
        UPDATE animais SET data_dg = $1, veterinario_dg = $2, resultado_dg = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [duplicata.data_dg, duplicata.veterinario_dg, duplicata.resultado_dg, correto.id])
      console.log('�œ… DG copiado!\n')
    }

    // Deletar a duplicata
    console.log(`�Ÿ—‘️ Deletando duplicata ID ${duplicata.id}...`)
    await pool.query(`DELETE FROM animais WHERE id = $1`, [duplicata.id])
    
    console.log('�œ… Duplicata deletada!\n')

    // Verificar resultado final
    const final = await pool.query(`
      SELECT id, nome, serie, rg, fornecedor, data_dg, resultado_dg
      FROM animais 
      WHERE rg = '8251'
    `)

    console.log('�Ÿ“Š Resultado final:')
    console.log(`   Total de animais 8251: ${final.rows.length}`)
    if (final.rows.length > 0) {
      final.rows.forEach(a => {
        console.log(`   - ID ${a.id}: ${a.nome} (${a.fornecedor || 'Sem fornecedor'})`)
        console.log(`     DG: ${a.data_dg ? new Date(a.data_dg).toLocaleDateString('pt-BR') + ' - ' + a.resultado_dg : 'Não tem'}`)
      })
    }

    console.log('\n�œ… Correção concluída!')
    console.log('Agora a tela de DG deve funcionar corretamente.')

  } catch (error) {
    console.error('�Œ Erro:', error.message)
    console.error(error.stack)
  } finally {
    await pool.end()
  }
}

corrigirDuplicata()
