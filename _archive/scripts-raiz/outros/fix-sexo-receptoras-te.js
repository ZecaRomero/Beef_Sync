#!/usr/bin/env node

/**
 * Script para corrigir o sexo de animais que têm Transferências de Embriões como receptora
 * Se um animal tem TE como receptora, ele DEVE ser Fêmea
 */

const { query } = require('./lib/database')

async function fixSexoReceptorasTE() {
  console.log('�Ÿ”� Verificando animais com Transferências de Embriões como receptora...\n')

  try {
    // 1. Buscar animal CJCJ 16319 especificamente
    console.log('1. Verificando animal CJCJ 16319:')
    const cjcj16319 = await query(`
      SELECT id, serie, rg, nome, sexo
      FROM animais 
      WHERE serie = 'CJCJ' AND rg = '16319'
      ORDER BY id DESC
      LIMIT 1
    `)
    
    if (cjcj16319.rows.length === 0) {
      console.log('   �Œ Animal CJCJ 16319 não encontrado')
    } else {
      const animal = cjcj16319.rows[0]
      console.log(`   �œ… Animal encontrado:`)
      console.log(`   ID: ${animal.id}`)
      console.log(`   Identificação: ${animal.serie} ${animal.rg}`)
      console.log(`   Nome: ${animal.nome || 'Não informado'}`)
      console.log(`   Sexo atual: ${animal.sexo}`)
      
      // Verificar se tem TE como receptora
      const teReceptora = await query(`
        SELECT COUNT(*) as total
        FROM transferencias_embrioes 
        WHERE receptora_id = $1 OR receptora_nome ILIKE $2
      `, [animal.id, `%${animal.serie}%${animal.rg}%`])
      
      const totalTE = parseInt(teReceptora.rows[0].total)
      console.log(`   Transferências de Embriões como receptora: ${totalTE}`)
      
      if (totalTE > 0) {
        const isMacho = animal.sexo && (animal.sexo.toLowerCase().includes('macho') || animal.sexo === 'M')
        if (isMacho) {
          console.log(`   �š�️  PROBLEMA DETECTADO: Animal está como Macho mas tem ${totalTE} TE(s) como receptora!`)
          console.log(`   �Ÿ”� Corrigindo sexo para Fêmea...`)
          
          const updateResult = await query(`
            UPDATE animais 
            SET sexo = 'Fêmea', updated_at = NOW()
            WHERE id = $1
            RETURNING id, serie, rg, sexo
          `, [animal.id])
          
          if (updateResult.rows.length > 0) {
            console.log(`   �œ… Sexo corrigido com sucesso!`)
            console.log(`   Novo sexo: ${updateResult.rows[0].sexo}`)
          }
        } else {
          console.log(`   �œ… Sexo está correto (já é Fêmea)`)
        }
      } else {
        console.log(`   �„�️  Animal não tem TE como receptora`)
      }
    }

    // 2. Verificar se CJCJ 16319 é doadora
    let correcoesDoadora = 0
    if (cjcj16319.rows.length > 0) {
      const animal = cjcj16319.rows[0]
      console.log('\n2. Verificando se CJCJ 16319 é doadora:')
      const teComoDoadora = await query(`
        SELECT id, numero_te, data_te, doadora_nome, receptora_nome, touro
        FROM transferencias_embrioes 
        WHERE doadora_nome ILIKE '%CJCJ%16319%' 
           OR doadora_nome ILIKE '%CJCJ (RG: 16319)%'
           OR doadora_id = $1
        ORDER BY data_te DESC
      `, [animal.id])
      
      if (teComoDoadora.rows.length > 0) {
        const isMacho = animal.sexo && (animal.sexo.toLowerCase().includes('macho') || animal.sexo === 'M')
        if (isMacho) {
          console.log(`   �š�️  PROBLEMA DETECTADO: Animal está como Macho mas tem ${teComoDoadora.rows.length} TE(s) como DOADORA!`)
          console.log(`   �Ÿ”� Corrigindo sexo para Fêmea...`)
          
          const updateResult = await query(`
            UPDATE animais 
            SET sexo = 'Fêmea', updated_at = NOW()
            WHERE id = $1
            RETURNING id, serie, rg, sexo
          `, [animal.id])
          
          if (updateResult.rows.length > 0) {
            console.log(`   �œ… Sexo corrigido com sucesso!`)
            console.log(`   Novo sexo: ${updateResult.rows[0].sexo}`)
            correcoesDoadora++
          }
        } else {
          console.log(`   �œ… Sexo está correto (já é Fêmea)`)
        }
        
        console.log(`   Transferências encontradas:`)
        teComoDoadora.rows.forEach(te => {
          console.log(`      - TE ${te.numero_te} em ${te.data_te}: Doadora "${te.doadora_nome}", Receptora "${te.receptora_nome}"`)
        })
      } else {
        console.log(`   �„�️  Animal não tem TE como doadora`)
      }
    }

    // 3. Buscar TODOS os animais que têm TE como receptora mas estão cadastrados como Macho
    console.log('\n3. Verificando TODOS os animais com TE como receptora:')
    
    const animaisComTE = await query(`
      SELECT DISTINCT 
        a.id, 
        a.serie, 
        a.rg, 
        a.nome, 
        a.sexo,
        COUNT(te.id) as total_te
      FROM animais a
      INNER JOIN transferencias_embrioes te ON (
        te.receptora_id = a.id 
        OR te.receptora_nome ILIKE '%' || a.serie || '%' || a.rg || '%'
        OR te.receptora_nome ILIKE '%' || a.serie || ' ' || a.rg || '%'
      )
      WHERE a.sexo ILIKE '%macho%' OR a.sexo = 'M'
      GROUP BY a.id, a.serie, a.rg, a.nome, a.sexo
      ORDER BY a.serie, a.rg
    `)
    
    console.log(`   �œ… Encontrados ${animaisComTE.rows.length} animal(is) com problema:`)
    
    let correcoes = 0
    for (const animal of animaisComTE.rows) {
      console.log(`\n   �Ÿ“‹ ${animal.serie} ${animal.rg} - ${animal.nome || 'Sem nome'}`)
      console.log(`      Sexo atual: ${animal.sexo}`)
      console.log(`      Total de TE como receptora: ${animal.total_te}`)
      console.log(`      �Ÿ”� Corrigindo sexo para Fêmea...`)
      
      const updateResult = await query(`
        UPDATE animais 
        SET sexo = 'Fêmea', updated_at = NOW()
        WHERE id = $1
        RETURNING id, serie, rg, sexo
      `, [animal.id])
      
      if (updateResult.rows.length > 0) {
        console.log(`      �œ… Corrigido! Novo sexo: ${updateResult.rows[0].sexo}`)
        correcoes++
      }
    }

    // 4. Buscar TODOS os animais que têm TE como doadora mas estão cadastrados como Macho
    console.log('\n4. Verificando TODOS os animais com TE como doadora:')
    
    const animaisComTEDoadora = await query(`
      SELECT DISTINCT 
        a.id, 
        a.serie, 
        a.rg, 
        a.nome, 
        a.sexo,
        COUNT(te.id) as total_te
      FROM animais a
      INNER JOIN transferencias_embrioes te ON (
        te.doadora_id = a.id 
        OR te.doadora_nome ILIKE '%' || a.serie || '%' || a.rg || '%'
        OR te.doadora_nome ILIKE '%' || a.serie || ' ' || a.rg || '%'
        OR te.doadora_nome ILIKE '%' || a.serie || ' (RG: ' || a.rg || ')%'
      )
      WHERE a.sexo ILIKE '%macho%' OR a.sexo = 'M'
      GROUP BY a.id, a.serie, a.rg, a.nome, a.sexo
      ORDER BY a.serie, a.rg
    `)
    
    console.log(`   �œ… Encontrados ${animaisComTEDoadora.rows.length} animal(is) com problema:`)
    
    for (const animal of animaisComTEDoadora.rows) {
      console.log(`\n   �Ÿ“‹ ${animal.serie} ${animal.rg} - ${animal.nome || 'Sem nome'}`)
      console.log(`      Sexo atual: ${animal.sexo}`)
      console.log(`      Total de TE como doadora: ${animal.total_te}`)
      console.log(`      �Ÿ”� Corrigindo sexo para Fêmea...`)
      
      const updateResult = await query(`
        UPDATE animais 
        SET sexo = 'Fêmea', updated_at = NOW()
        WHERE id = $1
        RETURNING id, serie, rg, sexo
      `, [animal.id])
      
      if (updateResult.rows.length > 0) {
        console.log(`      �œ… Corrigido! Novo sexo: ${updateResult.rows[0].sexo}`)
        correcoesDoadora++
      }
    }

    // 5. Resumo final
    const totalCorrecoes = correcoes + correcoesDoadora
    console.log('\n' + '='.repeat(60))
    console.log('�Ÿ“Š RESUMO:')
    console.log(`   Animais verificados como receptora: ${animaisComTE.rows.length}`)
    console.log(`   Animais verificados como doadora: ${animaisComTEDoadora.rows.length}`)
    console.log(`   Total de correções realizadas: ${totalCorrecoes}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('�Œ Erro ao executar correção:', error)
    throw error
  }
}

// Executar o script
if (require.main === module) {
  fixSexoReceptorasTE()
    .then(() => {
      console.log('\n�œ… Script executado com sucesso!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n�Œ Erro ao executar script:', error)
      process.exit(1)
    })
}

module.exports = { fixSexoReceptorasTE }
