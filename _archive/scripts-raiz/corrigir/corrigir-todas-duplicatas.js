/**
 * Script para encontrar e corrigir TODAS as duplicatas de receptoras.
 * Padrão: M 3238 (Receptora) vs M3238 3238 (Mestiça) - mesma série+RG no nome
 * Mantém: Receptora com série "M"
 * Remove: Mestiça com série "M" + número (ex: M3238)
 */
require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'beef_sync',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: parseInt(process.env.DB_PORT) || 5432,
})

async function encontrarDuplicatas() {
  const result = await pool.query(`
    SELECT rg, COUNT(*) as qtd
    FROM animais
    WHERE rg IS NOT NULL AND TRIM(rg) != ''
    GROUP BY rg
    HAVING COUNT(*) > 1
    ORDER BY rg
  `)
  return result.rows
}

async function getAnimaisPorRG(rg) {
  const result = await pool.query(`
    SELECT id, nome, serie, rg, raca, situacao, data_dg, veterinario_dg, resultado_dg, observacoes_dg
    FROM animais
    WHERE rg = $1
    ORDER BY id
  `, [rg])
  return result.rows
}

function identificarCorretoEDuplicatas(animais) {
  // Manter: Receptora com série "M" (ou letra curta)
  // Remover: Mestiça com série = "M" + número (ex: M3238, M8251)
  const correto = animais.find(a => 
    a.raca === 'Receptora' && 
    (a.serie === 'M' || (a.serie && a.serie.length <= 2))
  )
  if (!correto) return { correto: null, duplicatas: [] }

  // Duplicatas = Mestiça com série incorreta (M3238) OU qualquer outro com série contendo RG
  const duplicatas = animais.filter(a => 
    a.id !== correto.id && (
      (a.raca === 'Mestiça' && a.serie && a.serie.replace(/[^0-9]/g, '') === String(a.rg || '').trim()) ||
      (a.serie && a.serie.length > 2 && a.serie.toUpperCase().includes(String(a.rg || '')))
    )
  )
  
  return { correto, duplicatas }
}

async function corrigirTodas() {
  try {
    console.log('�Ÿ”� Buscando todas as duplicatas (RG com múltiplos registros)...\n')
    
    const rgsDuplicados = await encontrarDuplicatas()
    console.log(`�Ÿ“Š Encontrados ${rgsDuplicados.length} RGs com duplicatas:\n`)
    
    if (rgsDuplicados.length === 0) {
      console.log('�œ… Nenhuma duplicata encontrada!')
      return
    }

    const corrigidos = []
    const semCorrecao = []

    for (const { rg } of rgsDuplicados) {
      let animais = await getAnimaisPorRG(rg)
      let totalRemovidos = 0

      // Pode haver múltiplas duplicatas, processar até sobrar só 1
      while (animais.length > 1) {
        const { correto, duplicatas } = identificarCorretoEDuplicatas(animais)

        if (!correto || duplicatas.length === 0) {
          semCorrecao.push({ rg, animais })
          break
        }

        for (const duplicata of duplicatas) {
          // Copiar DG da duplicata para o correto se necessário
          if (duplicata.data_dg && !correto.data_dg) {
            await pool.query(`
              UPDATE animais SET data_dg = $1, veterinario_dg = $2, resultado_dg = $3, observacoes_dg = COALESCE(observacoes_dg, $4), updated_at = CURRENT_TIMESTAMP
              WHERE id = $5
            `, [duplicata.data_dg, duplicata.veterinario_dg, duplicata.resultado_dg, duplicata.observacoes_dg, correto.id])
          }

          await pool.query(`DELETE FROM animais WHERE id = $1`, [duplicata.id])
          corrigidos.push({ rg, mantido: correto.id, removido: duplicata.id })
          console.log(`�œ… ${rg}: mantido ID ${correto.id} (${correto.nome}), removido ID ${duplicata.id} (${duplicata.nome})`)
          totalRemovidos++
        }

        animais = await getAnimaisPorRG(rg)
        if (animais.length <= 1) break
      }
    }

    console.log('\n' + '�”€'.repeat(60))
    console.log(`\n�Ÿ“‹ Resumo: ${corrigidos.length} duplicatas corrigidas`)
    
    if (semCorrecao.length > 0) {
      console.log(`\n�š�️ ${semCorrecao.length} RGs com duplicatas que precisam de análise manual:`)
      semCorrecao.forEach(({ rg, animais }) => {
        console.log(`\n   RG ${rg}:`)
        animais.forEach(a => console.log(`      - ID ${a.id}: ${a.nome} (${a.serie}) - ${a.raca}`))
      })
    }

    console.log('\n�œ… Correção concluída!')
  } catch (error) {
    console.error('�Œ Erro:', error.message)
    console.error(error.stack)
  } finally {
    await pool.end()
  }
}

corrigirTodas()
