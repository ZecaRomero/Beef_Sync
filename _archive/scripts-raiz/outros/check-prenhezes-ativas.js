#!/usr/bin/env node

/**
 * Script para verificar prenhezes ativas de todos os animais
 */

const { query } = require('./lib/database')

async function checkPrenhezes() {
  console.log('�Ÿ”� Verificando prenhezes ativas de todos os animais...\n')

  try {
    // 1. Buscar animal CJCA6 especificamente
    console.log('1. Verificando animal CJCA6:')
    const cjca6 = await query(`
      SELECT id, serie, rg, nome, sexo
      FROM animais 
      WHERE serie = 'CJCA' AND rg = '6'
      ORDER BY id DESC
      LIMIT 1
    `)
    
    if (cjca6.rows.length === 0) {
      console.log('   �Œ Animal CJCA6 não encontrado')
      return
    }

    const animal = cjca6.rows[0]
    console.log(`   �œ… Animal encontrado:`)
    console.log(`   ID: ${animal.id}`)
    console.log(`   Identificação: ${animal.serie} ${animal.rg}`)
    console.log(`   Nome: ${animal.nome || 'Não informado'}`)
    console.log(`   Sexo: ${animal.sexo}`)

    // 2. Verificar transferências de embriões relacionadas ao CJCA6
    console.log('\n2. Buscando transferências de embriões para CJCA6:')
    
    // Buscar como doadora (se for fêmea)
    const isFemea = animal.sexo && (animal.sexo.toLowerCase().includes('fêmea') || animal.sexo.toLowerCase().includes('femea') || animal.sexo === 'F')
    const isMacho = animal.sexo && (animal.sexo.toLowerCase().includes('macho') || animal.sexo === 'M')
    
    console.log(`   Sexo identificado: ${isFemea ? 'Fêmea' : isMacho ? 'Macho' : 'Indefinido'}`)

    if (isFemea) {
      // Buscar como doadora
      const transferenciasDoadora = await query(`
        SELECT * FROM transferencias_embrioes 
        WHERE doadora_nome ILIKE '%CJCA%6%' 
           OR doadora_nome ILIKE '%${animal.rg}%'
        ORDER BY data_te DESC
      `)
      
      console.log(`   �Ÿ“Š Transferências como doadora: ${transferenciasDoadora.rows.length}`)
      
      if (transferenciasDoadora.rows.length > 0) {
        transferenciasDoadora.rows.forEach((te, index) => {
          console.log(`   ${index + 1}. Data TE: ${te.data_te}`)
          console.log(`      Doadora: ${te.doadora_nome}`)
          console.log(`      Receptora: ${te.receptora_nome}`)
          console.log(`      Status: ${te.status}`)
          console.log(`      Sexo Prenhez: ${te.sexo_prenhez || 'Não informado'}`)
          
          // Calcular previsão de parto
          const teDate = new Date(te.data_te)
          const dueDate = new Date(teDate)
          dueDate.setDate(dueDate.getDate() + 276) // 283 dias - 7 dias do embrião
          
          const today = new Date()
          const diffTime = dueDate - today
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          console.log(`      Previsão Parto: ${dueDate.toLocaleDateString('pt-BR')}`)
          console.log(`      Dias Restantes: ${diffDays}`)
          
          // Verificar se é prenhez ativa
          const status = (te.status || '').toLowerCase()
          const isFinished = ['nascido', 'parida', 'concluída', 'concluida', 'falha', 'negativo', 'aborto'].some(s => status.includes(s))
          console.log(`      Prenhez Ativa: ${!isFinished ? '�œ… SIM' : '�Œ N�ƒO'}`)
          console.log('')
        })
      } else {
        console.log('   �Œ Nenhuma transferência encontrada como doadora')
      }
    }

    if (isMacho) {
      // Buscar como touro
      const transferenciasTouro = await query(`
        SELECT * FROM transferencias_embrioes 
        WHERE touro ILIKE '%CJCA%6%' 
           OR touro ILIKE '%${animal.rg}%'
        ORDER BY data_te DESC
      `)
      
      console.log(`   �Ÿ“Š Transferências como touro: ${transferenciasTouro.rows.length}`)
      
      if (transferenciasTouro.rows.length > 0) {
        transferenciasTouro.rows.forEach((te, index) => {
          console.log(`   ${index + 1}. Data TE: ${te.data_te}`)
          console.log(`      Touro: ${te.touro}`)
          console.log(`      Doadora: ${te.doadora_nome}`)
          console.log(`      Receptora: ${te.receptora_nome}`)
          console.log(`      Status: ${te.status}`)
          
          // Verificar se é prenhez ativa
          const status = (te.status || '').toLowerCase()
          const isFinished = ['nascido', 'parida', 'concluída', 'concluida', 'falha', 'negativo', 'aborto'].some(s => status.includes(s))
          console.log(`      Prenhez Ativa: ${!isFinished ? '�œ… SIM' : '�Œ N�ƒO'}`)
          console.log('')
        })
      } else {
        console.log('   �Œ Nenhuma transferência encontrada como touro')
      }
    }

    // 3. Buscar por ID do animal (mais preciso)
    console.log('3. Buscando por ID do animal:')
    const transferenciasById = await query(`
      SELECT * FROM transferencias_embrioes 
      WHERE doadora_id = $1 OR touro_id = $1 OR receptora_id = $1
      ORDER BY data_te DESC
    `, [animal.id])
    
    console.log(`   �Ÿ“Š Transferências por ID: ${transferenciasById.rows.length}`)
    
    if (transferenciasById.rows.length > 0) {
      transferenciasById.rows.forEach((te, index) => {
        console.log(`   ${index + 1}. Data TE: ${te.data_te}`)
        console.log(`      Doadora ID: ${te.doadora_id} (${te.doadora_nome})`)
        console.log(`      Touro ID: ${te.touro_id} (${te.touro})`)
        console.log(`      Receptora ID: ${te.receptora_id} (${te.receptora_nome})`)
        console.log(`      Status: ${te.status}`)
        
        // Verificar se é prenhez ativa
        const status = (te.status || '').toLowerCase()
        const isFinished = ['nascido', 'parida', 'concluída', 'concluida', 'falha', 'negativo', 'aborto'].some(s => status.includes(s))
        console.log(`      Prenhez Ativa: ${!isFinished ? '�œ… SIM' : '�Œ N�ƒO'}`)
        console.log('')
      })
    } else {
      console.log('   �Œ Nenhuma transferência encontrada por ID')
    }

    // 4. Verificar estrutura da tabela de transferências
    console.log('4. Verificando estrutura da tabela transferencias_embrioes:')
    const tableStructure = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'transferencias_embrioes'
      ORDER BY ordinal_position
    `)
    
    console.log(`   �Ÿ“Š Colunas da tabela (${tableStructure.rows.length}):`)
    tableStructure.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })

    // 5. Verificar todas as transferências ativas no sistema
    console.log('\n5. Verificando todas as prenhezes ativas no sistema:')
    const allActivePregnancies = await query(`
      SELECT 
        id, data_te, doadora_nome, touro, receptora_nome, status, sexo_prenhez,
        (data_te + INTERVAL '276 days') as previsao_parto,
        (data_te + INTERVAL '276 days' - CURRENT_DATE) as dias_restantes
      FROM transferencias_embrioes 
      WHERE LOWER(status) NOT IN ('nascido', 'parida', 'concluída', 'concluida', 'falha', 'negativo', 'aborto')
         OR status IS NULL
      ORDER BY data_te DESC
    `)
    
    console.log(`   �Ÿ“Š Total de prenhezes ativas: ${allActivePregnancies.rows.length}`)
    
    if (allActivePregnancies.rows.length > 0) {
      console.log('\n   Prenhezes ativas encontradas:')
      allActivePregnancies.rows.forEach((preg, index) => {
        console.log(`   ${index + 1}. TE: ${preg.data_te}`)
        console.log(`      Doadora: ${preg.doadora_nome}`)
        console.log(`      Touro: ${preg.touro}`)
        console.log(`      Status: ${preg.status || 'Não informado'}`)
        console.log(`      Previsão: ${preg.previsao_parto ? new Date(preg.previsao_parto).toLocaleDateString('pt-BR') : 'N/A'}`)
        console.log(`      Dias restantes: ${preg.dias_restantes || 'N/A'}`)
        console.log('')
      })
    } else {
      console.log('   �Œ Nenhuma prenhez ativa encontrada no sistema')
    }

    console.log('\n�œ… Verificação concluída!')

  } catch (error) {
    console.error('�Œ Erro durante verificação:', error)
  }
}

// Executar
checkPrenhezes()
  .then(() => {
    console.log('\n�ŸŽ� DIAGN�“STICO COMPLETO REALIZADO')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })