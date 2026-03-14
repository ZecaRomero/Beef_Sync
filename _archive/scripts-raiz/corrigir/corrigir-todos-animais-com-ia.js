require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false
})

async function corrigir() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    console.log('�Ÿ”� Corrigindo TODOS os animais com inseminações...\n')
    
    // 1. Buscar todos os animais que têm inseminações mas não têm resultado_dg
    console.log('�Ÿ“‹ 1. Buscando animais com inseminações sem resultado_dg...')
    const animaisSemDG = await client.query(`
      SELECT DISTINCT a.id, a.serie, a.rg, a.nome, a.resultado_dg, a.data_te
      FROM animais a
      INNER JOIN inseminacoes i ON i.animal_id = a.id
      WHERE a.resultado_dg IS NULL OR a.resultado_dg = ''
      ORDER BY a.serie, a.rg
    `)
    
    console.log(`   �Ÿ“Š Encontrados ${animaisSemDG.rows.length} animais`)
    
    if (animaisSemDG.rows.length === 0) {
      console.log('\n�œ… Todos os animais com IA já têm resultado_dg!')
      await client.query('COMMIT')
      return
    }
    
    // 2. Para cada animal, buscar a IA mais recente e atualizar
    console.log('\n�Ÿ“… 2. Atualizando resultado_dg e data_te...')
    let atualizados = 0
    let prenhas = 0
    let vazias = 0
    let pendentes = 0
    
    for (const animal of animaisSemDG.rows) {
      // Buscar a IA mais recente
      const ia = await client.query(`
        SELECT id, data_ia, touro_nome, status_gestacao
        FROM inseminacoes
        WHERE animal_id = $1
        ORDER BY data_ia DESC
        LIMIT 1
      `, [animal.id])
      
      if (ia.rows.length > 0) {
        const iaData = ia.rows[0]
        const status = iaData.status_gestacao || 'Pendente'
        const dataIA = iaData.data_ia
        
        // Atualizar animal
        await client.query(`
          UPDATE animais
          SET resultado_dg = $1,
              data_te = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [status, dataIA, animal.id])
        
        atualizados++
        
        if (status === 'Prenha') {
          prenhas++
          console.log(`   �œ… ${animal.serie}-${animal.rg}: Prenha (${new Date(dataIA).toLocaleDateString('pt-BR')})`)
        } else if (status === 'Vazia') {
          vazias++
          console.log(`   �š� ${animal.serie}-${animal.rg}: Vazia (${new Date(dataIA).toLocaleDateString('pt-BR')})`)
        } else {
          pendentes++
          console.log(`   ⏳ ${animal.serie}-${animal.rg}: Pendente (${new Date(dataIA).toLocaleDateString('pt-BR')})`)
        }
      }
    }
    
    console.log(`\n�Ÿ“Š RESUMO:`)
    console.log(`   Total atualizado: ${atualizados} animais`)
    console.log(`   Prenhas: ${prenhas}`)
    console.log(`   Vazias: ${vazias}`)
    console.log(`   Pendentes: ${pendentes}`)
    
    // 3. Verificar resultado final
    console.log('\n�Ÿ“Š 3. Verificando resultado final...')
    const verificacao = await client.query(`
      SELECT 
        COUNT(*) as total_animais_com_ia,
        COUNT(CASE WHEN a.resultado_dg IS NOT NULL AND a.resultado_dg != '' THEN 1 END) as com_resultado_dg,
        COUNT(CASE WHEN a.data_te IS NOT NULL THEN 1 END) as com_data_te
      FROM animais a
      INNER JOIN inseminacoes i ON i.animal_id = a.id
    `)
    
    const v = verificacao.rows[0]
    console.log(`   Total de animais com IA: ${v.total_animais_com_ia}`)
    console.log(`   Com resultado_dg: ${v.com_resultado_dg}`)
    console.log(`   Com data_te: ${v.com_data_te}`)
    
    await client.query('COMMIT')
    console.log('\n�œ… Correção concluída com sucesso!')
    console.log('\n�Ÿ’� Agora TODAS as fichas de animais com IA devem exibir as informações de reprodução!')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('\n�Œ Erro:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

corrigir()
