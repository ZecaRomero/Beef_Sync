require('dotenv').config()
const { Pool } = require('pg')

const SUPABASE_URL = 'https://bpsltnglmbwdpvumjeaf.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkRemoteSchema() {
  try {
    console.log('🔍 Verificando via REST API (Supabase)...')
    const res = await fetch(`${SUPABASE_URL}/rest/v1/animais?serie=eq.CJCJ&rg=eq.16141&select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    })
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    }

    const data = await res.json()
    if (data.length > 0) {
      const animal = data[0]
      console.log('✅ Animal encontrado no Supabase (REST API):')
      console.log(`- iqg: ${animal.iqg}`)
      console.log(`- pt_iqg: ${animal.pt_iqg}`)
      console.log(`- pmgz_pn_dep: ${animal.pmgz_pn_dep}`)
      console.log(`- pub_classe: ${animal.pub_classe}`)
      console.log(`- carc_aol: ${animal.carc_aol}`)
      
      // Listar todas as chaves que começam com pmgz, gp, ancp, pub, carc
      console.log('\n📊 Colunas de avaliação presentes no JSON:')
      Object.keys(animal).forEach(k => {
        if (k.startsWith('pmgz_') || k.startsWith('gp_') || k.startsWith('ancp_') || k.startsWith('pub_') || k.startsWith('carc_')) {
           console.log(`  ${k}: ${animal[k]}`)
        }
      })
    } else {
      console.log('❌ Animal CJCJ 16141 não encontrado no Supabase!')
    }

  } catch (err) {
    console.error('❌ Erro:', err.message)
  }
}

checkRemoteSchema()
