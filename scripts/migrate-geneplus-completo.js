/**
 * Script para adicionar todas as colunas do GENEPLUS na tabela animais
 * Execute: node scripts/migrate-geneplus-completo.js
 */

const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function migrate() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Iniciando migração: Adicionando colunas GENEPLUS completas...')
    
    // Baseado no Excel GENEPLUS com 38 colunas
    const columns = [
      // Já existem: iqg (IQGg Básico), pt_iqg (Pt IQGg Básico)
      // Novas colunas:
      'gp_pn_kg',           // PN (Kg) - coluna C
      'gp_pn_acc',          // Acc - coluna D
      'gp_pn_pt',           // Pt - coluna E
      'gp_p120_kg_em',      // P120 (Kg) EM - coluna F
      'gp_p120_acc',        // Acc - coluna G
      'gp_p120_pt',         // Pt - coluna H
      'gp_p2_kg',           // P2 (Kg) - coluna I
      'gp_p2_acc',          // Acc - coluna J
      'gp_p2_pt',           // Pt - coluna K
      'gp_p5_kg',           // P5 (Kg) - coluna L
      'gp_p5_acc',          // Acc - coluna M
      'gp_p5_pt',           // Pt - coluna N
      'gp_hp_stay_pct',     // HP/STAY (%) - coluna O
      'gp_hp_stay_acc',     // Acc - coluna P
      'gp_hp_stay_pt',      // Pt - coluna Q
      'gp_ipp_01em',        // IPP (0,1 em) - coluna R
      'gp_ipp_acc',         // Acc - coluna S
      'gp_ipp_pt',          // Pt - coluna T
      'gp_ipp_dias',        // IPP (dias) - coluna U
      'gp_ipp_dias_acc',    // Acc - coluna V
      'gp_ipp_dias_pt',     // Pt - coluna W
      'gp_pfp30_pct',       // PFP30 (%) - coluna X
      'gp_pfp30_acc',       // Acc - coluna Y
      'gp_pfp30_pt',        // Pt - coluna Z
      'gp_rd_pct',          // RD (%) - coluna AA
      'gp_rd_acc',          // Acc - coluna AB
      'gp_rd_pt',           // Pt - coluna AC
      'gp_aol_cm2',         // AOL (cm²) - coluna AD
      'gp_aol_acc',         // Acc - coluna AE
      'gp_aol_pt',          // Pt - coluna AF
      'gp_egs_01mm',        // EGS (0,1 mm) - coluna AG
      'gp_egs_acc',         // Acc - coluna AH
      'gp_egs_pt',          // Pt - coluna AI
      'gp_mar_pct',         // MAR (%) - coluna AJ
      'gp_mar_acc',         // Acc - coluna AK
      'gp_mar_pt',          // Pt - coluna AL
    ]
    
    for (const col of columns) {
      console.log(`  ➕ Adicionando coluna: ${col}`)
      await client.query(`
        ALTER TABLE animais 
        ADD COLUMN IF NOT EXISTS ${col} DECIMAL(10,3)
      `)
    }
    
    console.log('\n✅ Migração concluída com sucesso!')
    console.log('\n📊 Verificando colunas criadas:')
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
        AND column_name LIKE 'gp_%'
      ORDER BY column_name
    `)
    
    console.table(result.rows)
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
  .then(() => {
    console.log('\n✨ Pronto! Agora você pode reimportar os dados do GENEPLUS.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Falha na migração:', err)
    process.exit(1)
  })
