import { query } from '../../../lib/database'
import { RACAS_POR_SERIE as racasPorSerie } from '../../../utils/constants'
import databaseService from '../../../services/databaseService'

// Função para corrigir raça baseada na série (igual ao boletim)
function corrigirRacaPorSerie(animal) {
  if (animal.serie && racasPorSerie[animal.serie]) {
    const racaCorreta = racasPorSerie[animal.serie]
    if (animal.raca !== racaCorreta) {
      return { ...animal, raca: racaCorreta }
    }
  }
  return animal
}

// GET /api/contabilidade/resumo-boletins?period=startDate,endDate
// Retorna resumo de animais por sexo e era para cada boletim
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period } = req.query
    
    if (!period) {
      return res.status(400).json({ message: 'Período é obrigatório' })
    }

    const [startDate, endDate] = period.split(',')
    
    // Normalizar datas
    const toPgDate = (value) => {
      if (!value) return null
      if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          const [d, m, y] = value.split('/')
          return `${y}-${m}-${d}`
        }
      }
      const d = new Date(value)
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
    }

    const pgStart = toPgDate(startDate)
    const pgEnd = toPgDate(endDate)
    
    if (!pgStart || !pgEnd) {
      return res.status(400).json({ message: 'Formato de data inválido' })
    }

    const [santAnna, pardinho] = await Promise.all([
      getResumoSantAnna(pgStart, pgEnd),
      getResumoPardinho(pgStart, pgEnd)
    ])

    const resumos = {
      santAnna,
      pardinho
    }

    console.log('📊 Resumos gerados:', {
      santAnna: { total: santAnna.total, machos: santAnna.porSexo?.machos, femeas: santAnna.porSexo?.femeas },
      pardinho: { total: pardinho.total, machos: pardinho.porSexo?.machos, femeas: pardinho.porSexo?.femeas }
    })

    return res.status(200).json(resumos)
  } catch (error) {
    console.error('Erro ao gerar resumo dos boletins:', error)
    return res.status(500).json({ 
      message: 'Erro ao gerar resumo',
      error: error.message 
    })
  }
}

async function getResumoSantAnna(pgStart, pgEnd) {
  try {
    // Buscar TODOS os animais usando o mesmo método do boletim
    // O boletim SANT ANNA usa databaseService.buscarAnimais({})
    console.log('🔍 Buscando animais para resumo Sant Anna (usando databaseService.buscarAnimais)...')
    
    let animais = []
    try {
      // Usar o mesmo método do boletim
      animais = await databaseService.buscarAnimais({})
      console.log(`✅ ${animais.length} animais encontrados via databaseService`)
    } catch (dbError) {
      console.error('❌ Erro ao buscar animais via databaseService:', dbError)
      // Fallback para query direta
      const animaisResult = await query(`
        SELECT 
          a.sexo,
          a.raca,
          a.meses,
          a.data_nascimento,
          a.era,
          a.serie,
          a.situacao
        FROM animais a
        ORDER BY a.raca, a.sexo, a.meses
      `)
      animais = animaisResult.rows || []
      console.log(`⚠️ Usando fallback: ${animais.length} animais encontrados`)
    }
    
    // Converter formato do banco para formato esperado (igual ao boletim)
    animais = animais.map(animal => {
      const animalFormatado = {
        ...animal,
        dataNascimento: animal.data_nascimento || animal.dataNascimento,
        situacao: animal.situacao || 'Ativo'
      }
      // Corrigir raça baseada na série (igual ao boletim)
      return corrigirRacaPorSerie(animalFormatado)
    })
    
    // Filtrar apenas animais ativos (igual ao boletim)
    animais = animais.filter(animal => animal.situacao === 'Ativo')
    console.log(`📊 Total de animais ativos após filtro: ${animais.length}`)
    
    // IMPORTANTE: Buscar também animais das notas fiscais com incricao = 'SANT ANNA'
    // Isso inclui a NF 243 (15 cabeças) que entrou na SANT ANNA
    // Buscar a NF 243 explicitamente, independente do campo incricao
    console.log('🔍 Buscando animais de notas fiscais SANT ANNA...')
    try {
      const nfsSantAnna = await query(`
        SELECT 
          nf.id,
          nf.numero_nf,
          nf.data_compra,
          nf.data,
          nf.itens,
          nf.incricao
        FROM notas_fiscais nf
        WHERE nf.tipo = 'entrada'
          AND (
            -- NF 243 sempre incluída (entrou na SANT ANNA)
            CAST(nf.numero_nf AS TEXT) = '243'
            -- OU NFs com incricao = 'SANT ANNA' no período
            OR (
              UPPER(COALESCE(nf.incricao, '')) = 'SANT ANNA'
              AND (
                (nf.data_compra BETWEEN $1 AND $2)
                OR (nf.data BETWEEN $1 AND $2)
              )
            )
          )
      `, [pgStart, pgEnd])
      
      console.log(`📋 NFs SANT ANNA encontradas: ${nfsSantAnna.rows.length}`)
      if (nfsSantAnna.rows.length > 0) {
        console.log(`📋 NFs encontradas:`, nfsSantAnna.rows.map(nf => `NF ${nf.numero_nf} (incricao: ${nf.incricao || 'N/A'})`).join(', '))
      }
      
      // Verificar se a NF 243 foi encontrada
      const nf243Encontrada = nfsSantAnna.rows.find(nf => nf.numero_nf === '243' || nf.numero_nf === 243 || String(nf.numero_nf) === '243')
      if (nf243Encontrada) {
        console.log(`\n🎯 NF 243 ENCONTRADA para SANT ANNA! ID: ${nf243Encontrada.id}, incricao: ${nf243Encontrada.incricao || 'N/A'}`)
      } else {
        console.log(`\n⚠️ NF 243 NÃO ENCONTRADA na busca de NFs SANT ANNA!`)
      }
      
      let totalAnimaisAdicionadosNFs = 0
      
      // Processar itens das NFs SANT ANNA
      for (const nf of nfsSantAnna.rows || []) {
        const isNF243 = nf.numero_nf === '243' || nf.numero_nf === 243 || String(nf.numero_nf) === '243'
        console.log(`\n🔍 Processando NF ${nf.numero_nf} SANT ANNA${isNF243 ? ' ⭐ NF 243 ⭐' : ''} (incricao: ${nf.incricao || 'N/A'})`)
        
        let itens = []
        
        // Buscar do campo JSONB
        if (nf.itens) {
          try {
            if (typeof nf.itens === 'string') {
              itens = JSON.parse(nf.itens)
            } else if (Array.isArray(nf.itens)) {
              itens = nf.itens
            }
          } catch (e) {
            console.log(`  ⚠️ Erro ao parsear itens do JSONB:`, e.message)
          }
        }
        
        // Buscar da tabela separada (mais confiável)
        if (nf.id) {
          try {
            const itensTabela = await query(`
              SELECT dados_item FROM notas_fiscais_itens
              WHERE nota_fiscal_id = $1
            `, [nf.id])
            
            if (itensTabela.rows?.length > 0) {
              if (itens.length === 0 || itensTabela.rows.length > itens.length) {
                itens = itensTabela.rows.map(row => {
                  let dadosItem = row.dados_item
                  if (typeof dadosItem === 'string') {
                    try {
                      dadosItem = JSON.parse(dadosItem)
                    } catch (e) {
                      dadosItem = {}
                    }
                  }
                  return dadosItem
                })
              }
            }
          } catch (e) {
            console.log(`  ❌ Erro ao buscar itens da tabela:`, e.message)
          }
        }
        
        if (!itens || itens.length === 0) {
          console.log(`  ⚠️ NF ${nf.numero_nf} não tem itens para processar`)
          continue
        }
        
        // Converter itens em animais (processar quantidade)
        for (const item of itens || []) {
          const quantidade = parseInt(item.quantidade) || 1
          const sexoItem = item.sexo || item.sexo_animal || item.sexoAnimal || item.Sexo || ''
          
          let sexoNormalizado = String(sexoItem).toLowerCase().trim()
          if (sexoNormalizado === 'fêmea' || sexoNormalizado === 'femea' || sexoNormalizado === 'f') {
            sexoNormalizado = 'femea'
          } else if (sexoNormalizado === 'macho' || sexoNormalizado === 'm') {
            sexoNormalizado = 'macho'
          }
          
          const animalBase = {
            sexo: sexoNormalizado || sexoItem,
            raca: item.raca || item.raca_animal || item.racaAnimal || 'Não informado',
            meses: item.meses || null,
            era: item.era || null,
            data_nascimento: item.data_nascimento || nf.data_compra || nf.data,
            quantidade: quantidade
          }
          
          if (isNF243) {
            console.log(`  🎯 ITEM NF 243 SANT ANNA: Quantidade=${quantidade}, Sexo="${sexoNormalizado}", Era="${animalBase.era}"`)
          }
          
          // Criar múltiplos animais se quantidade > 1
          for (let i = 0; i < quantidade; i++) {
            animais.push({ ...animalBase })
            totalAnimaisAdicionadosNFs++
          }
        }
        
        if (isNF243) {
          console.log(`  ✅ NF 243: Total de ${totalAnimaisAdicionadosNFs} animais adicionados até agora desta NF`)
        }
      }
      
      console.log(`📊 Total de animais após incluir NFs SANT ANNA: ${animais.length}`)
      console.log(`📊 Animais adicionados das NFs SANT ANNA: ${totalAnimaisAdicionadosNFs}`)
    } catch (e) {
      console.warn('⚠️ Erro ao buscar NFs SANT ANNA:', e.message)
    }
    
    // Estatísticas de debug
    let animaisSemIdade = 0
    let animaisComIdade = 0
    let animaisProcessados = 0
    
    // Agrupar por sexo e era
    const resumo = {
      total: 0, // Será calculado durante o processamento
      porSexo: { machos: 0, femeas: 0 },
      porEra: {
        'femea_0-7': 0,
        'femea_7-12': 0,
        'femea_12-18': 0,
        'femea_18-24': 0,
        'femea_24+': 0,
        'macho_0-7': 0,
        'macho_7-15': 0,
        'macho_15-18': 0,
        'macho_18-22': 0,
        'macho_36+': 0
      },
      porRaca: {}
    }

    animais.forEach((animal, index) => {
      // Verificar se é animal da NF 243 (animais adicionados das NFs têm quantidade mas não serie/rg)
      const isNF243 = animal.quantidade !== undefined && !animal.serie && !animal.rg
      
      // Log para debug dos primeiros animais da NF 243
      if (isNF243 && index < 5) {
        console.log(`🔍 Animal NF 243 detectado: quantidade=${animal.quantidade}, sexo=${animal.sexo}, era=${animal.era}, meses=${animal.meses}`)
      }
      
      // Calcular idade primeiro (mesma lógica do boletim)
      // O boletim usa dataNascimento (camelCase) ou data_nascimento (snake_case)
      const dataNascimento = animal.dataNascimento || animal.data_nascimento
      let idadeMeses = 0
      
      if (dataNascimento) {
        const nascimento = new Date(dataNascimento)
        const hoje = new Date()
        if (!isNaN(nascimento.getTime())) {
          idadeMeses = Math.floor((hoje - nascimento) / (1000 * 60 * 60 * 24 * 30.44))
        }
      }
      
      // Se não tem data de nascimento ou é inválida, usar campo meses
      if (idadeMeses === 0 && animal.meses) {
        idadeMeses = parseInt(animal.meses) || 0
      }
      
      // Se não tem idade mas tem era, calcular idade aproximada da era
      if (idadeMeses === 0 && animal.era) {
        const era = String(animal.era).toLowerCase()
        if (era.includes('24/36') || era.includes('24-36')) {
          idadeMeses = 30
        } else if (era.includes('12/24') || era.includes('12-24')) {
          idadeMeses = 18
        } else if (era.includes('18-22') || era.includes('18/22')) {
          idadeMeses = 20
        } else if (era.includes('7-15') || era.includes('7/15')) {
          idadeMeses = 11
        } else if (era.includes('15-18') || era.includes('15/18')) {
          idadeMeses = 16.5
        } else if (era.includes('12-18') || era.includes('12/18')) {
          idadeMeses = 15
        } else if (era.includes('36') || era.includes('+36')) {
          idadeMeses = 36
        } else if (era.includes('24') || era.includes('+24')) {
          idadeMeses = 24
        } else if (era.includes('22') || era.includes('+22')) {
          idadeMeses = 22
        } else if (era.includes('18')) {
          idadeMeses = 18
        } else if (era.includes('15')) {
          idadeMeses = 15
        } else if (era.includes('12')) {
          idadeMeses = 12
        } else if (era.includes('7')) {
          idadeMeses = 7
        }
      }
      
      // Se ainda não tem idade válida, pular animal (exceto se for da NF 243)
      if (idadeMeses === 0 && !isNF243) {
        animaisSemIdade++
        // Log apenas os primeiros 5 para não poluir
        if (animaisSemIdade <= 5) {
          console.log(`⚠️ Animal sem idade válida: ${animal.serie || 'N/A'} ${animal.rg || 'N/A'} | data_nascimento: ${dataNascimento || 'N/A'} | meses: ${animal.meses || 'N/A'} | era: ${animal.era || 'N/A'}`)
        }
        return
      }
      
      // Se for da NF 243 e ainda não tem idade válida, usar idade padrão
      if (idadeMeses === 0 && isNF243) {
        // Se já tentou calcular da era mas ainda é 0, usar 12 meses como padrão
        idadeMeses = 12
        console.log(`ℹ️ Animal NF 243 sem idade específica, usando idade padrão: ${idadeMeses} meses (era: ${animal.era || 'N/A'})`)
      }
      
      animaisComIdade++
      animaisProcessados++

      // Incrementar total apenas para animais com idade válida
      resumo.total++

      // Obter sexo do animal
      const sexo = (animal.sexo || '').toLowerCase()
      const isFemea = sexo.includes('fêmea') || sexo.includes('femea') || sexo === 'f'
      const isMacho = sexo.includes('macho') || sexo === 'm'
      
      if (isFemea) resumo.porSexo.femeas++
      if (isMacho) resumo.porSexo.machos++

      // Categorizar
      if (isFemea) {
        if (idadeMeses >= 0 && idadeMeses <= 7) resumo.porEra['femea_0-7']++
        else if (idadeMeses > 7 && idadeMeses <= 12) resumo.porEra['femea_7-12']++
        else if (idadeMeses > 12 && idadeMeses <= 18) resumo.porEra['femea_12-18']++
        else if (idadeMeses > 18 && idadeMeses <= 24) resumo.porEra['femea_18-24']++
        else if (idadeMeses > 24) resumo.porEra['femea_24+']++
      } else if (isMacho) {
        if (idadeMeses >= 0 && idadeMeses <= 7) resumo.porEra['macho_0-7']++
        else if (idadeMeses > 7 && idadeMeses <= 15) resumo.porEra['macho_7-15']++
        else if (idadeMeses > 15 && idadeMeses <= 18) resumo.porEra['macho_15-18']++
        else if (idadeMeses > 18 && idadeMeses <= 22) resumo.porEra['macho_18-22']++
        else if (idadeMeses > 22) resumo.porEra['macho_36+']++
      }

      // Por raça
      const raca = animal.raca || 'Não informado'
      if (!resumo.porRaca[raca]) {
        resumo.porRaca[raca] = { total: 0, machos: 0, femeas: 0 }
      }
      resumo.porRaca[raca].total++
      if (isMacho) resumo.porRaca[raca].machos++
      if (isFemea) resumo.porRaca[raca].femeas++
    })

    // Contar quantos animais da NF 243 foram processados
    const animaisNF243 = animais.filter(a => a.quantidade !== undefined && !a.serie && !a.rg).length
    
    console.log(`📊 Estatísticas de processamento Sant Anna:`)
    console.log(`   - Total de animais na query: ${animais.length}`)
    console.log(`   - Animais da NF 243 no array: ${animaisNF243}`)
    console.log(`   - Animais com idade válida: ${animaisComIdade}`)
    console.log(`   - Animais sem idade válida: ${animaisSemIdade}`)
    console.log(`   - Total processado: ${resumo.total}`)
    console.log(`   - Machos: ${resumo.porSexo.machos}, Fêmeas: ${resumo.porSexo.femeas}`)
    
    // Verificar se os 15 animais da NF 243 foram incluídos
    if (animaisNF243 < 15) {
      console.log(`⚠️ ATENÇÃO: Esperados 15 animais da NF 243, mas apenas ${animaisNF243} foram encontrados no array!`)
    } else if (animaisNF243 > 15) {
      console.log(`⚠️ ATENÇÃO: Mais de 15 animais da NF 243 encontrados (${animaisNF243})!`)
    } else {
      console.log(`✅ Todos os 15 animais da NF 243 foram encontrados no array`)
    }

    return resumo
  } catch (error) {
    console.error('Erro ao buscar resumo Sant Anna:', error)
    return { total: 0, porSexo: { machos: 0, femeas: 0 }, porEra: {}, porRaca: {}, erro: error.message }
  }
}

async function getResumoPardinho(pgStart, pgEnd) {
  try {
    console.log(`\n🚀 Iniciando getResumoPardinho com período: ${pgStart} até ${pgEnd}`)
    
    const cnpjDestinoPardinho = '18978214000445'
    const cnpjFornecedorPardinho = '44017440001018'
    
    // Buscar animais de movimentacoes_contabeis
    let animais = []
    
    try {
      const movResult = await query(`
        SELECT DISTINCT
          a.id,
          a.sexo,
          a.raca,
          a.meses,
          a.data_nascimento,
          a.era,
          mc.dados_extras
        FROM movimentacoes_contabeis mc
        LEFT JOIN animais a ON mc.animal_id = a.id
        WHERE mc.data_movimento >= $1
          AND mc.data_movimento <= $2
          AND mc.tipo = 'entrada'
          AND COALESCE(mc.localidade, '') ILIKE '%pardinho%'
      `, [pgStart, pgEnd])
      
      animais = movResult.rows || []
      console.log(`📊 Animais encontrados em movimentacoes_contabeis: ${animais.length}`)
    } catch (e) {
      console.warn('⚠️ Erro ao buscar movimentacoes:', e.message)
      console.error('Detalhes do erro:', e)
    }

    // Buscar das notas fiscais APENAS da PARDINHO
    // IMPORTANTE: PARDINHO deve ter apenas a NF 4346 (986 cabeças)
    // A NF 243 (15 cabeças) entrou na SANT ANNA, não na PARDINHO
    // AGORA TAMBÉM: NFs com itens que tenham local = 'Pardinho'
    const nfsResult = await query(`
      SELECT DISTINCT
        nf.id,
        nf.numero_nf,
        nf.data_compra,
        nf.data,
        nf.itens,
        nf.cnpj_origem_destino,
        nf.incricao
      FROM notas_fiscais nf
      LEFT JOIN notas_fiscais_itens nfi ON nfi.nota_fiscal_id = nf.id
      WHERE nf.tipo = 'entrada'
        AND (
          -- NF 4346 (sempre incluída - única NF da PARDINHO)
          CAST(nf.numero_nf AS TEXT) = '4346'
          -- OU NFs com CNPJ da PARDINHO E que não sejam SANT ANNA
          OR (
            (nf.data_compra BETWEEN $1 AND $2 OR nf.data BETWEEN $1 AND $2)
            AND (
              nf.cnpj_origem_destino = $3
              OR nf.cnpj_origem_destino = $4
            )
            AND COALESCE(UPPER(nf.incricao), '') != 'SANT ANNA'
          )
          -- OU NFs com itens que tenham local = 'Pardinho'
          OR (
            (nf.data_compra BETWEEN $1 AND $2 OR nf.data BETWEEN $1 AND $2)
            AND (
              COALESCE(nfi.dados_item::jsonb->>'local', '') ILIKE '%pardinho%'
              OR COALESCE(nf.itens::jsonb->0->>'local', '') ILIKE '%pardinho%'
            )
          )
        )
    `, [pgStart, pgEnd, cnpjDestinoPardinho, cnpjFornecedorPardinho])
    
    const todasNFs = nfsResult.rows || []
    
    console.log(`📋 Total de NFs encontradas para resumo Pardinho: ${todasNFs.length}`)
    console.log(`📋 NFs encontradas:`, todasNFs.map(nf => `NF ${nf.numero_nf}`).join(', '))
    
    // Verificar se a NF 4346 está na lista (única NF esperada na PARDINHO)
    const nf4346 = todasNFs.find(nf => nf.numero_nf === '4346' || nf.numero_nf === 4346 || String(nf.numero_nf) === '4346')
    
    if (nf4346) {
      console.log(`\n🎯 NF 4346 ENCONTRADA! ID: ${nf4346.id}, numero_nf: ${nf4346.numero_nf}, incricao: ${nf4346.incricao || 'N/A'}`)
    } else {
      console.log(`\n⚠️ NF 4346 NÃO ENCONTRADA na lista de NFs!`)
    }
    
    // Verificar se há NFs que não deveriam estar aqui (ex: NF 243 que é SANT ANNA)
    const nf243 = todasNFs.find(nf => nf.numero_nf === '243' || nf.numero_nf === 243 || String(nf.numero_nf) === '243')
    if (nf243) {
      console.log(`\n⚠️ ATENÇÃO: NF 243 encontrada na lista PARDINHO, mas ela é SANT ANNA! Incricao: ${nf243.incricao || 'N/A'}`)
    }

    for (const nf of todasNFs) {
      let itens = []
      
      const isNF4346 = nf.numero_nf === '4346' || nf.numero_nf === 4346 || String(nf.numero_nf) === '4346'
      console.log(`\n🔍 Processando NF ${nf.numero_nf} (ID: ${nf.id})${isNF4346 ? ' ⭐ NF 4346 ⭐' : ''} (Incricao: ${nf.incricao || 'N/A'})`)
      
      // Buscar do campo JSONB
      if (nf.itens) {
        try {
          if (typeof nf.itens === 'string') {
            itens = JSON.parse(nf.itens)
          } else if (Array.isArray(nf.itens)) {
            itens = nf.itens
          }
          console.log(`  📦 Itens do campo JSONB: ${itens.length}`)
        } catch (e) {
          console.log(`  ⚠️ Erro ao parsear itens do JSONB:`, e.message)
        }
      }
      
      // Buscar da tabela separada (sempre buscar, pois é a fonte mais confiável)
      if (nf.id) {
        try {
          const itensTabela = await query(`
            SELECT dados_item FROM notas_fiscais_itens
            WHERE nota_fiscal_id = $1
          `, [nf.id])
          
          if (itensTabela.rows?.length > 0) {
            console.log(`  📦 Itens encontrados na tabela separada: ${itensTabela.rows.length}`)
            // Se já tinha itens do JSONB, usar os da tabela (mais confiável)
            // Se não tinha, usar os da tabela
            if (itens.length === 0 || itensTabela.rows.length > itens.length) {
              itens = itensTabela.rows.map((row, idx) => {
              let dadosItem = row.dados_item
              if (typeof dadosItem === 'string') {
                try {
                  dadosItem = JSON.parse(dadosItem)
                } catch (e) {
                  console.log(`  ⚠️ Erro ao parsear item ${idx + 1}:`, e.message)
                  dadosItem = {}
                }
              }
              // Log do primeiro item para debug
              if (idx === 0 || (nf.numero_nf === '4346' || nf.numero_nf === 4346 || String(nf.numero_nf) === '4346')) {
                console.log(`  📋 Item ${idx + 1} parseado da tabela (NF ${nf.numero_nf}):`, JSON.stringify(dadosItem, null, 2))
              }
              return dadosItem
              })
            } else {
              console.log(`  ℹ️ Mantendo itens do JSONB (${itens.length}) ao invés da tabela (${itensTabela.rows.length})`)
            }
          } else {
            console.log(`  ⚠️ Nenhum item encontrado na tabela separada para NF ${nf.numero_nf}`)
          }
        } catch (e) {
          console.log(`  ❌ Erro ao buscar itens da tabela:`, e.message)
        }
      }
      
      if (!itens || itens.length === 0) {
        console.log(`  ⚠️ NF ${nf.numero_nf} não tem itens para processar`)
        continue
      }
      
      console.log(`  ✅ Total de itens a processar: ${itens.length}`)
      
      // Converter itens em animais (processar quantidade)
      for (const item of itens || []) {
        const quantidade = parseInt(item.quantidade) || 1
        // Tentar múltiplas formas de obter o sexo
        const sexoItem = item.sexo || 
                        item.sexo_animal || 
                        item.sexoAnimal || 
                        item.Sexo ||
                        (item.dados_item && (item.dados_item.sexo || item.dados_item.sexo_animal || item.dados_item.sexoAnimal)) ||
                        ''
        
        // Normalizar o sexo para garantir consistência
        let sexoNormalizado = String(sexoItem).toLowerCase().trim()
        if (sexoNormalizado === 'fêmea' || sexoNormalizado === 'femea' || sexoNormalizado === 'f') {
          sexoNormalizado = 'femea'
        } else if (sexoNormalizado === 'macho' || sexoNormalizado === 'm') {
          sexoNormalizado = 'macho'
        }
        
        const animalBase = {
          sexo: sexoNormalizado || sexoItem, // Usar normalizado se disponível, senão usar original
          raca: item.raca || item.raca_animal || item.racaAnimal || 'Não informado',
          meses: item.meses || null,
          era: item.era || null,
          data_nascimento: item.data_nascimento || nf.data_compra || nf.data,
          quantidade: quantidade // Manter quantidade para debug
        }
        
        if (isNF4346) {
          console.log(`  🎯 ITEM NF 4346: Quantidade=${quantidade}, Sexo Original="${sexoItem}" (tipo: ${typeof sexoItem}), Sexo Normalizado="${sexoNormalizado}", Era="${animalBase.era}", Raça="${animalBase.raca}"`)
          console.log(`     Item completo:`, JSON.stringify(item, null, 2))
          console.log(`     animalBase criado:`, JSON.stringify(animalBase, null, 2))
        } else {
          console.log(`  📊 Item NF ${nf.numero_nf}: Quantidade=${quantidade}, Sexo="${sexoItem}" (tipo: ${typeof sexoItem}), Era="${animalBase.era}", Raça="${animalBase.raca}"`)
        }
        
        // Criar múltiplos animais se quantidade > 1
        let animaisCriados = 0
        for (let i = 0; i < quantidade; i++) {
          animais.push({ ...animalBase })
          animaisCriados++
        }
        
        if (quantidade > 1 || isNF4346) {
          if (isNF4346) {
            console.log(`  🎯 NF 4346: Criados ${animaisCriados} registros de animais para este item (sexo: "${sexoNormalizado}", era: "${animalBase.era}")`)
            console.log(`     Total de animais no array agora: ${animais.length}`)
          } else {
            console.log(`  ✅ Criados ${animaisCriados} registros de animais para este item (sexo: "${sexoNormalizado}")`)
          }
        }
      }
    }
    
    console.log(`📊 Total de animais processados das notas fiscais para resumo Pardinho: ${animais.length}`)

    let saidasResumo = { total: 0, femeas: 0, machos: 0 }
    try {
      const saidasMov = await query(`
        SELECT mc.dados_extras
        FROM movimentacoes_contabeis mc
        WHERE mc.data_movimento >= $1
          AND mc.data_movimento <= $2
          AND mc.tipo = 'saida'
          AND COALESCE(mc.localidade, '') ILIKE '%pardinho%'
      `, [pgStart, pgEnd])
      const rows = saidasMov.rows || []
      for (const r of rows) {
        const d = r.dados_extras || {}
        const q = parseInt(d.quantidade) || 1
        let sexo = String(d.sexo || '').toLowerCase().trim()
        if (sexo === 'fêmea' || sexo === 'femea' || sexo === 'f') sexo = 'femea'
        if (sexo === 'macho' || sexo === 'm') sexo = 'macho'
        saidasResumo.total += q
        if (sexo === 'femea') saidasResumo.femeas += q
        if (sexo === 'macho') saidasResumo.machos += q
      }
    } catch (e) {}

    // Agrupar por sexo e era (mesma lógica do Sant Anna)
    // IMPORTANTE: O total deve ser calculado durante o processamento, não apenas animais.length
    // porque alguns animais podem não ter idade válida e serem pulados
    const resumo = {
      total: 0, // Será calculado durante o processamento
      porSexo: { machos: 0, femeas: 0 },
      porEra: {
        'femea_0-7': 0,
        'femea_7-12': 0,
        'femea_12-18': 0,
        'femea_18-24': 0,
        'femea_24+': 0,
        'macho_0-7': 0,
        'macho_7-15': 0,
        'macho_15-18': 0,
        'macho_18-22': 0,
        'macho_36+': 0
      },
      porRaca: {}
    }
    
    console.log(`📊 Iniciando processamento de ${animais.length} animais para resumo Pardinho`)

    // Estatísticas de debug para sexo
    let animaisSemSexo = 0
    let animaisComSexoFemea = 0
    let animaisComSexoMacho = 0
    
    animais.forEach((animal, index) => {
      const sexoOriginal = animal.sexo
      // Normalizar o sexo para garantir consistência
      let sexo = String(animal.sexo || '').toLowerCase().trim()
      
      // Se o sexo já foi normalizado anteriormente, usar diretamente
      if (sexo === 'femea' || sexo === 'fêmea' || sexo === 'f') {
        sexo = 'femea'
      } else if (sexo === 'macho' || sexo === 'm') {
        sexo = 'macho'
      }
      
      // Log detalhado para os primeiros 10 animais e todos os que têm problemas
      if (index < 10 || !sexo || (sexo !== 'macho' && sexo !== 'femea' && sexo !== 'f' && sexo !== 'm')) {
        console.log(`  🐄 Animal ${index + 1}: sexoOriginal="${sexoOriginal}", sexoNormalizado="${sexo}", era="${animal.era}", quantidade=${animal.quantidade || 1}`)
      }
      
      // Verificação mais robusta de fêmea - verificar primeiro valores exatos
      // IMPORTANTE: Verificar exatamente "femea" primeiro (sem acento, que é o valor normalizado)
      const isFemea = sexo === 'femea' ||  // Valor normalizado (sem acento)
                      sexo === 'fêmea' ||  // Com acento (caso não tenha sido normalizado)
                      sexo === 'f' ||      // Abreviação
                      (sexo.length > 0 && (sexo.includes('femea') || sexo.includes('fêmea')))
      
      // Verificação mais robusta de macho - verificar primeiro valores exatos
      const isMacho = sexo === 'macho' || 
                      sexo === 'm' ||
                      (sexo.length > 0 && sexo.includes('macho'))
      
      // Log de debug para fêmeas (especialmente da NF 4346)
      if (isFemea && index < 5) {
        console.log(`  ✅ Fêmea detectada: sexoOriginal="${sexoOriginal}", sexoNormalizado="${sexo}", isFemea=${isFemea}`)
      }
      
      if (!sexo || (!isFemea && !isMacho)) {
        animaisSemSexo++
        if (animaisSemSexo <= 5) {
          console.log(`  ⚠️ Animal sem sexo válido: sexo="${sexoOriginal}" (normalizado: "${sexo}")`)
        }
      }
      
      // Incrementar contadores de sexo e total apenas se o animal foi identificado
      if (isFemea) {
        resumo.porSexo.femeas++
        animaisComSexoFemea++
        resumo.total++ // Incrementar total quando fêmea é identificada
      }
      if (isMacho) {
        resumo.porSexo.machos++
        animaisComSexoMacho++
        resumo.total++ // Incrementar total quando macho é identificado
      }

      let idadeMeses = animal.meses || 0
      if (!idadeMeses && animal.data_nascimento) {
        const nascimento = new Date(animal.data_nascimento)
        const hoje = new Date()
        if (!isNaN(nascimento.getTime())) {
          idadeMeses = Math.floor((hoje - nascimento) / (1000 * 60 * 60 * 24 * 30.44))
        }
      }
      if (!idadeMeses && animal.era) {
        const era = String(animal.era).toLowerCase()
        // IMPORTANTE: Verificar faixas específicas ANTES de verificar valores isolados
        if (era.includes('24/36') || era.includes('24-36')) {
          idadeMeses = 30 // Idade média da faixa 24/36 meses
        } else if (era.includes('12/24') || era.includes('12-24')) {
          idadeMeses = 18 // Idade média da faixa 12/24 meses
        } else if (era.includes('18-22') || era.includes('18/22')) {
          idadeMeses = 20 // Idade média da faixa
        } else if (era.includes('7-15') || era.includes('7/15')) {
          idadeMeses = 11 // Idade média da faixa
        } else if (era.includes('15-18') || era.includes('15/18')) {
          idadeMeses = 16.5 // Idade média da faixa
        } else if (era.includes('12-18') || era.includes('12/18')) {
          idadeMeses = 15 // Idade média da faixa
        } else if (era.includes('36') || era.includes('+36')) {
          idadeMeses = 36
        } else if (era.includes('24') || era.includes('+24')) {
          idadeMeses = 24
        } else if (era.includes('22') || era.includes('+22')) {
          idadeMeses = 22
        } else if (era.includes('18')) {
          idadeMeses = 18
        } else if (era.includes('15')) {
          idadeMeses = 15
        } else if (era.includes('12')) {
          idadeMeses = 12
        } else if (era.includes('7')) {
          idadeMeses = 7
        }
      }

      if (isFemea) {
        if (idadeMeses >= 0 && idadeMeses <= 7) resumo.porEra['femea_0-7']++
        else if (idadeMeses > 7 && idadeMeses <= 12) resumo.porEra['femea_7-12']++
        else if (idadeMeses > 12 && idadeMeses <= 18) resumo.porEra['femea_12-18']++
        else if (idadeMeses > 18 && idadeMeses <= 24) resumo.porEra['femea_18-24']++
        else if (idadeMeses > 24) resumo.porEra['femea_24+']++
      } else if (isMacho) {
        if (idadeMeses >= 0 && idadeMeses <= 7) resumo.porEra['macho_0-7']++
        else if (idadeMeses > 7 && idadeMeses <= 15) resumo.porEra['macho_7-15']++
        else if (idadeMeses > 15 && idadeMeses <= 18) resumo.porEra['macho_15-18']++
        else if (idadeMeses > 18 && idadeMeses <= 22) resumo.porEra['macho_18-22']++
        else if (idadeMeses > 22) resumo.porEra['macho_36+']++
      }

      const raca = animal.raca || 'Não informado'
      if (!resumo.porRaca[raca]) {
        resumo.porRaca[raca] = { total: 0, machos: 0, femeas: 0 }
      }
      resumo.porRaca[raca].total++
      if (isMacho) resumo.porRaca[raca].machos++
      if (isFemea) resumo.porRaca[raca].femeas++
    })

    // Contar fêmeas especificamente da NF 4346
    const femeasNF4346 = animais.filter(animal => {
      const sexo = String(animal.sexo || '').toLowerCase().trim()
      return (sexo === 'femea' || sexo === 'fêmea' || sexo === 'f' || sexo.includes('femea'))
    }).length
    
    console.log(`📊 Estatísticas de processamento Pardinho:`)
    console.log(`   - Total de animais processados: ${animais.length}`)
    console.log(`   - Animais com sexo Fêmea: ${animaisComSexoFemea}`)
    console.log(`   - Animais com sexo Macho: ${animaisComSexoMacho}`)
    console.log(`   - Animais sem sexo válido: ${animaisSemSexo}`)
    console.log(`   - Total no resumo: ${resumo.total}`)
    console.log(`   - Fêmeas no resumo: ${resumo.porSexo.femeas}`)
    console.log(`   - Machos no resumo: ${resumo.porSexo.machos}`)
    console.log(`   🎯 Fêmeas da NF 4346: ${femeasNF4346}`)
    console.log(`   📋 Resumo por Era - Fêmeas:`, {
      '0-7': resumo.porEra['femea_0-7'],
      '7-12': resumo.porEra['femea_7-12'],
      '12-18': resumo.porEra['femea_12-18'],
      '18-24': resumo.porEra['femea_18-24'],
      '24+': resumo.porEra['femea_24+']
    })
    console.log(`   📋 Resumo por Era - Machos:`, {
      '0-7': resumo.porEra['macho_0-7'],
      '7-15': resumo.porEra['macho_7-15'],
      '15-18': resumo.porEra['macho_15-18'],
      '18-22': resumo.porEra['macho_18-22'],
      '36+': resumo.porEra['macho_36+']
    })
    
    // Se não há fêmeas mas deveria haver, mostrar detalhes
    if (resumo.porSexo.femeas === 0 && femeasNF4346 > 0) {
      console.log(`   ⚠️ ATENÇÃO: ${femeasNF4346} fêmeas foram processadas mas não aparecem no resumo!`)
    }
    
    // Garantir que o total seja calculado corretamente
    // Se o total for 0 mas houver animais por sexo, recalcular
    if (resumo.total === 0 && (resumo.porSexo.femeas > 0 || resumo.porSexo.machos > 0)) {
      resumo.total = resumo.porSexo.femeas + resumo.porSexo.machos
      console.log(`⚠️ Total estava 0 mas há animais! Recalculando para ${resumo.total}`)
    }
    
    // Log do resumo completo que será retornado
    console.log(`\n✅ Resumo Pardinho final que será retornado:`, JSON.stringify(resumo, null, 2))
    console.log(`📊 Validação final:`, {
      total: resumo.total,
      femeas: resumo.porSexo.femeas,
      machos: resumo.porSexo.machos,
      temFemeas: resumo.porEra['femea_0-7'] > 0 || resumo.porEra['femea_7-12'] > 0 || resumo.porEra['femea_12-18'] > 0 || resumo.porEra['femea_18-24'] > 0 || resumo.porEra['femea_24+'] > 0,
      temMachos: resumo.porEra['macho_0-7'] > 0 || resumo.porEra['macho_7-15'] > 0 || resumo.porEra['macho_15-18'] > 0 || resumo.porEra['macho_18-22'] > 0 || resumo.porEra['macho_36+'] > 0
    })

    resumo.total = Math.max(0, resumo.total - saidasResumo.total)
    resumo.porSexo.femeas = Math.max(0, (resumo.porSexo.femeas || 0) - saidasResumo.femeas)
    resumo.porSexo.machos = Math.max(0, (resumo.porSexo.machos || 0) - saidasResumo.machos)
    return resumo
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao buscar resumo Pardinho:', error)
    console.error('Stack trace completo:', error.stack)
    console.error('Mensagem do erro:', error.message)
    console.error('Código do erro:', error.code)
    
    // Retornar objeto vazio mas válido para não quebrar o frontend
    return { 
      total: 0, 
      porSexo: { machos: 0, femeas: 0 }, 
      porEra: {
        'femea_0-7': 0,
        'femea_7-12': 0,
        'femea_12-18': 0,
        'femea_18-24': 0,
        'femea_24+': 0,
        'macho_0-7': 0,
        'macho_7-15': 0,
        'macho_15-18': 0,
        'macho_18-22': 0,
        'macho_36+': 0
      }, 
      porRaca: {}
    }
  }
}

