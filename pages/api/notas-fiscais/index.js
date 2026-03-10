import { query } from '../../../lib/database'
import databaseService from '../../../services/databaseService'
import LoteTracker from '../../../utils/loteTracker'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'

// Função para gerar relatório DG em Excel
async function gerarRelatorioDG(nfId, numeroNF, dataNF, dataDG, itens, letra, numero, dataTE) {
  try {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Beef-Sync'
    workbook.created = new Date()
    workbook.title = `Relatório DG - NF ${numeroNF}`
    workbook.subject = 'Relatório de Diagnóstico de Gestação - Receptoras'

    const worksheet = workbook.addWorksheet('Relatório DG')

    // Configurações da planilha
    worksheet.properties.defaultRowHeight = 20
    worksheet.views = [{ showGridLines: true }]

    // Título principal
    worksheet.mergeCells('A1:F1')
    const titleRow = worksheet.getRow(1)
    titleRow.getCell(1).value = 'RELATÓRIO DE DIAGNÓSTICO DE GESTAÇÃO (DG) - RECEPTORAS'
    titleRow.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE91E63' } // Rosa
    }
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' }
    titleRow.height = 35

    // Informações da NF
    worksheet.addRow([])
    worksheet.addRow(['Nota Fiscal:', numeroNF])
    worksheet.addRow(['Data de Chegada dos Animais:', new Date(dataNF).toLocaleDateString('pt-BR')])
    worksheet.addRow(['Data de TE:', new Date(dataTE).toLocaleDateString('pt-BR')])
    worksheet.addRow(['Data Prevista para DG:', new Date(dataDG).toLocaleDateString('pt-BR')])
    worksheet.addRow(['Letra:', letra])
    worksheet.addRow(['Número:', numero])
    worksheet.addRow([])

    // Cabeçalhos da tabela
    const headerRow = worksheet.addRow([
      'Receptora',
      'Letra',
      'Número',
      'Data de TE',
      'Data Prevista DG',
      'Status'
    ])

    // Estilizar cabeçalho
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9C27B0' } // Roxo
    }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

    // Adicionar dados das receptoras
    itens.forEach(item => {
      if (item.tipoProduto === 'bovino') {
        const tatuagemParts = item.tatuagem && item.tatuagem.match(/^(\D*)(\d+)$/)
        const serieReceptora = tatuagemParts ? (tatuagemParts[1] || letra || '').trim() : (letra || '')
        const rgReceptora = tatuagemParts ? tatuagemParts[2] : numero
        const nomeReceptora = `${serieReceptora} ${rgReceptora}`.trim()

        worksheet.addRow([
          nomeReceptora,
          serieReceptora,
          rgReceptora,
          new Date(dataTE).toLocaleDateString('pt-BR'),
          new Date(dataDG).toLocaleDateString('pt-BR'),
          'Pendente'
        ])
      }
    })

    // Ajustar largura das colunas
    worksheet.columns = [
      { width: 20 }, // Receptora
      { width: 10 }, // Letra
      { width: 15 }, // Número
      { width: 15 }, // Data de TE
      { width: 18 }, // Data Prevista DG
      { width: 15 }  // Status
    ]

    // Salvar arquivo
    const reportsDir = path.join(process.cwd(), 'public', 'relatorios')
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }

    const filename = `Relatorio_DG_NF_${numeroNF}_${new Date().toISOString().split('T')[0]}.xlsx`
    const filepath = path.join(reportsDir, filename)

    await workbook.xlsx.writeFile(filepath)
    console.log(`✅ Relatório DG salvo em: ${filepath}`)

    return { filename, filepath }
  } catch (error) {
    console.error('Erro ao gerar relatório DG:', error)
    throw error
  }
}

export const config = { api: { externalResolver: true } }
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Testar conexão com PostgreSQL
      const connectionTest = await query('SELECT NOW() as timestamp, version() as version')
      
      // Listar todas as notas fiscais com cálculo correto do valor total
      // IMPORTANTE: Incluir explicitamente o campo destino para garantir que seja retornado
      const result = await query(`
        SELECT 
          nf.id,
          nf.numero_nf,
          nf.data,
          nf.data_compra,
          nf.data_saida,
          nf.data_chegada_animais,
          nf.fornecedor,
          nf.destino,
          nf.cnpj_origem_destino,
          nf.natureza_operacao,
          nf.observacoes,
          nf.tipo,
          nf.tipo_produto,
          nf.valor_total,
          nf.incricao,
          nf.eh_receptoras,
          nf.receptora_letra,
          nf.receptora_numero,
          nf.data_te,
          nf.created_at,
          nf.updated_at,
          COUNT(nfi.id) as total_itens,
          COALESCE(SUM(
            CASE 
              WHEN nfi.tipo_produto = 'bovino' AND (nfi.dados_item::jsonb->>'modoCadastro') = 'categoria' THEN
                (CAST(nfi.dados_item::jsonb->>'quantidade' AS INTEGER) * CAST(REPLACE(nfi.dados_item::jsonb->>'valorUnitario', ',', '.') AS NUMERIC))
              WHEN nfi.tipo_produto = 'semen' THEN
                (CAST(nfi.dados_item::jsonb->>'quantidadeDoses' AS INTEGER) * CAST(REPLACE(nfi.dados_item::jsonb->>'valorUnitario', ',', '.') AS NUMERIC))
              WHEN nfi.tipo_produto = 'embriao' THEN
                (CAST(nfi.dados_item::jsonb->>'quantidadeEmbrioes' AS INTEGER) * CAST(REPLACE(nfi.dados_item::jsonb->>'valorUnitario', ',', '.') AS NUMERIC))
              ELSE
                CAST(REPLACE(nfi.dados_item::jsonb->>'valorUnitario', ',', '.') AS NUMERIC)
            END
          ), nf.valor_total, 0) as valor_total_calculado
        FROM notas_fiscais nf
        LEFT JOIN notas_fiscais_itens nfi ON nfi.nota_fiscal_id = nf.id
        GROUP BY nf.id, nf.numero_nf, nf.data, nf.data_compra, nf.data_saida, nf.data_chegada_animais, nf.fornecedor, nf.destino, 
                 nf.cnpj_origem_destino, nf.natureza_operacao, nf.observacoes, nf.tipo, 
                 nf.tipo_produto, nf.valor_total, nf.incricao, nf.eh_receptoras, nf.receptora_letra, nf.receptora_numero, nf.data_te, nf.created_at, nf.updated_at
        ORDER BY nf.data DESC, nf.created_at DESC
      `)

      return res.status(200).json({
        success: true,
        connection: {
          timestamp: connectionTest.rows[0].timestamp,
          version: connectionTest.rows[0].version
        },
        data: result.rows,
        count: result.rows.length
      })
    }

    if (req.method === 'POST') {
      // Criar nova nota fiscal
      const {
        numeroNF,
        data,
        fornecedor,
        destino,
        cnpjOrigemDestino,
        naturezaOperacao,
        observacoes,
        tipo,
        tipoProduto,
        valorTotal,
        itens,
        fornecedorData,
        incricao,
        // Campos de Receptoras
        ehReceptoras,
        receptoraLetra,
        receptoraNumero,
        dataTE,
        dataChegadaAnimais
      } = req.body
      
      // Usar dados do fornecedor selecionado se disponível
      const fornecedorFinal = fornecedorData?.nome || fornecedor
      // Priorizar CNPJ informado manualmente, depois do fornecedor selecionado
      const cnpjFornecedorFinal = cnpjOrigemDestino || fornecedorData?.cnpj_cpf || null
      
      // Definir incrição automaticamente se não fornecida
      let incricaoFinal = incricao
      if (!incricaoFinal) {
        // Padrão: SANT ANNA
        incricaoFinal = 'SANT ANNA'
        
        // Verificar se é Pardinho pelo CNPJ
        const cnpjPardinho = '18978214000445'
        if (cnpjFornecedorFinal) {
          const cnpjNormalizado = cnpjFornecedorFinal.replace(/[.\-\/\s]/g, '').trim()
          if (cnpjNormalizado === cnpjPardinho) {
            incricaoFinal = 'PARDINHO'
          }
        }
        
        // Verificar se é Pardinho pelo nome do fornecedor/destino
        const fornecedorUpper = (fornecedorFinal || '').toUpperCase()
        const destinoUpper = (destino || '').toUpperCase()
        
        if (fornecedorUpper.includes('PARDINHO') || destinoUpper.includes('PARDINHO')) {
          incricaoFinal = 'PARDINHO'
        }
        
        console.log(`📋 Incrição definida automaticamente: ${incricaoFinal}`)
      }
      
      // Validar dados obrigatórios
      if (!numeroNF || !data || !naturezaOperacao || !tipo || !tipoProduto) {
        return res.status(400).json({ 
          error: 'Dados obrigatórios não fornecidos',
          required: ['numeroNF', 'data', 'naturezaOperacao', 'tipo', 'tipoProduto']
        })
      }

      // Verificar se NF já existe
      const existingNF = await query(
        'SELECT id FROM notas_fiscais WHERE numero_nf = $1',
        [numeroNF]
      )

      if (existingNF.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Nota fiscal já existe',
          numeroNF 
        })
      }

      // Converter data para formato DATE se necessário
      let dataFormatada = data
      if (data && typeof data === 'string' && data.includes('/')) {
        // Converter de DD/MM/YYYY para YYYY-MM-DD
        const [dia, mes, ano] = data.split('/')
        dataFormatada = `${ano}-${mes}-${dia}`
      }
      
      // Verificar se a coluna incricao existe, se não, adicionar
      try {
        await query(`
          ALTER TABLE notas_fiscais 
          ADD COLUMN IF NOT EXISTS incricao VARCHAR(50),
          ADD COLUMN IF NOT EXISTS endereco VARCHAR(255),
          ADD COLUMN IF NOT EXISTS bairro VARCHAR(100),
          ADD COLUMN IF NOT EXISTS cep VARCHAR(20),
          ADD COLUMN IF NOT EXISTS municipio VARCHAR(100),
          ADD COLUMN IF NOT EXISTS uf VARCHAR(2),
          ADD COLUMN IF NOT EXISTS telefone VARCHAR(50),
          ADD COLUMN IF NOT EXISTS eh_receptoras BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS receptora_letra VARCHAR(10),
          ADD COLUMN IF NOT EXISTS receptora_numero VARCHAR(50),
          ADD COLUMN IF NOT EXISTS data_te DATE,
          ADD COLUMN IF NOT EXISTS data_chegada_animais DATE,
          ADD COLUMN IF NOT EXISTS data_saida DATE,
          ADD COLUMN IF NOT EXISTS motorista VARCHAR(255)
        `)
      } catch (error) {
        // Ignorar erro se coluna já existe
        console.log('Erro ao criar colunas na tabela notas_fiscais:', error.message)
      }

      // Converter data de TE se fornecida
      let dataTEFormatada = null
      if (dataTE) {
        if (typeof dataTE === 'string' && dataTE.includes('/')) {
          const [dia, mes, ano] = dataTE.split('/')
          dataTEFormatada = `${ano}-${mes}-${dia}`
        } else {
          dataTEFormatada = dataTE
        }
      }

      // Data de chegada dos animais (para DG = +15 dias; se vazia, usa data da NF)
      let dataChegadaFormatada = null
      if (dataChegadaAnimais) {
        if (typeof dataChegadaAnimais === 'string' && dataChegadaAnimais.includes('/')) {
          const [dia, mes, ano] = dataChegadaAnimais.split('/')
          dataChegadaFormatada = `${ano}-${mes}-${dia}`
        } else {
          dataChegadaFormatada = dataChegadaAnimais
        }
      }

      // Data de saída dos animais (para NF de saída)
      let dataSaidaFormatada = null
      if (req.body.dataSaida) {
        if (typeof req.body.dataSaida === 'string' && req.body.dataSaida.includes('/')) {
          const [dia, mes, ano] = req.body.dataSaida.split('/')
          dataSaidaFormatada = `${ano}-${mes}-${dia}`
        } else {
          dataSaidaFormatada = req.body.dataSaida
        }
      }

      // Inserir nota fiscal (com correção automática da sequência se houver conflito de id)
      const insertParams = [
        numeroNF,
        dataFormatada,
        dataFormatada,
        fornecedorFinal || null,
        destino || null,
        cnpjFornecedorFinal || null,
        naturezaOperacao,
        observacoes || null,
        tipo,
        tipoProduto,
        valorTotal || 0,
        incricaoFinal || 'SANT ANNA',
        req.body.endereco || null,
        req.body.bairro || null,
        req.body.cep || null,
        req.body.municipio || null,
        req.body.uf || null,
        req.body.telefone || null,
        ehReceptoras || false,
        receptoraLetra || null,
        receptoraNumero || null,
        dataTEFormatada || null,
        dataChegadaFormatada || null,
        dataSaidaFormatada || null,
        req.body.motorista || null
      ]
      let nfResult
      try {
        nfResult = await query(`
          INSERT INTO notas_fiscais (
            numero_nf, data_compra, data, fornecedor, destino, cnpj_origem_destino,
            natureza_operacao, observacoes, tipo, tipo_produto, valor_total, incricao,
            endereco, bairro, cep, municipio, uf, telefone, eh_receptoras,
            receptora_letra, receptora_numero, data_te, data_chegada_animais, data_saida, motorista
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
          RETURNING *
        `, insertParams)
      } catch (insertErr) {
        if (insertErr.code === '23505' && insertErr.constraint === 'notas_fiscais_pkey') {
          await query(`
            SELECT setval('notas_fiscais_id_seq', COALESCE((SELECT MAX(id) FROM notas_fiscais), 1))
          `)
          nfResult = await query(`
            INSERT INTO notas_fiscais (
              numero_nf, data_compra, data, fornecedor, destino, cnpj_origem_destino,
              natureza_operacao, observacoes, tipo, tipo_produto, valor_total, incricao,
              endereco, bairro, cep, municipio, uf, telefone, eh_receptoras,
              receptora_letra, receptora_numero, data_te, data_chegada_animais, data_saida, motorista
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
            RETURNING *
          `, insertParams)
        } else {
          throw insertErr
        }
      }

      const nfId = nfResult.rows[0].id

      // Calcular valor total a partir dos itens
      let valorTotalCalculado = 0
      if (itens && itens.length > 0) {
        for (const item of itens) {
          // Normalizar valor unitário (converter string "1.234,56" para number 1234.56)
          if (item.valorUnitario && typeof item.valorUnitario === 'string') {
            // Remove pontos de milhar e substitui vírgula decimal por ponto
            const cleanValue = item.valorUnitario.replace(/\./g, '').replace(',', '.')
            item.valorUnitario = parseFloat(cleanValue) || 0
          } else if (typeof item.valorUnitario === 'number') {
             // Já é número, manter
          } else {
             item.valorUnitario = 0
          }

          const valorUnit = item.valorUnitario
          
          if (item.tipoProduto === 'bovino') {
            if (item.modoCadastro === 'categoria') {
              const quantidade = parseInt(item.quantidade) || 1
              valorTotalCalculado += valorUnit * quantidade
            } else {
              valorTotalCalculado += valorUnit
            }
          } else if (item.tipoProduto === 'semen') {
            const doses = parseInt(item.quantidadeDoses) || 0
            valorTotalCalculado += valorUnit * doses
          } else if (item.tipoProduto === 'embriao') {
            const embrioes = parseInt(item.quantidadeEmbrioes) || 0
            valorTotalCalculado += valorUnit * embrioes
          } else {
            valorTotalCalculado += valorUnit
          }
        }
        
        // Arredondar para 2 casas decimais
        valorTotalCalculado = Math.round(valorTotalCalculado * 100) / 100
        
        // Atualizar o valor_total na NF
        await query(`
          UPDATE notas_fiscais 
          SET valor_total = $1 
          WHERE id = $2
        `, [valorTotalCalculado, nfId])
      }

      // Garantir que notas_fiscais_itens tem coluna dados_item (schema esperado pela API)
      try {
        await query(`
          ALTER TABLE notas_fiscais_itens ADD COLUMN IF NOT EXISTS dados_item JSONB
        `)
      } catch (e) { /* coluna já existe ou tabela em outro schema */ }

      // Inserir itens
      if (itens && itens.length > 0) {
        for (const item of itens) {
          const itemTipo = item.tipoProduto || item.tipoItem || tipoProduto || 'bovino';
          await query(`
            INSERT INTO notas_fiscais_itens (nota_fiscal_id, tipo_produto, dados_item)
            VALUES ($1, $2, $3)
          `, [nfId, itemTipo, JSON.stringify(item)])
        }
      }

      // Se for sêmen de entrada, adicionar ao estoque
      if (tipo === 'entrada' && tipoProduto === 'semen' && itens) {
        for (const item of itens) {
          await query(`
            INSERT INTO estoque_semen (
              nome_touro,
              rg_touro,
              raca,
              botijao,
              caneca,
              fornecedor,
              numero_nf,
              valor_compra,
              data_compra,
              quantidade_doses,
              doses_disponiveis,
              certificado,
              data_validade,
              localizacao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          `, [
            item.nomeTouro,
            item.rgTouro || null,
            item.raca || null,
            item.botijao || null,
            item.caneca || null,
            fornecedorFinal,
            numeroNF,
            parseFloat(item.valorUnitario) * parseInt(item.quantidadeDoses),
            data,
            parseInt(item.quantidadeDoses),
            parseInt(item.quantidadeDoses),
            item.certificado || null,
            item.dataValidade || null,
            `${item.botijao || ''} ${item.caneca || ''}`.trim() || null
          ])
        }
      }

      // Processar Receptoras se for NF de Receptoras
      // MODIFICADO: Criar animais SEMPRE, mesmo sem receptoraLetra/receptoraNumero/dataTE
      if (tipo === 'entrada' && ehReceptoras && itens && Array.isArray(itens) && itens.length > 0) {
        try {
          console.log('🐄 Processando NF de Receptoras...')
          console.log('Dados:', { receptoraLetra, receptoraNumero, dataTEFormatada, itensCount: itens.length })
          
          // Calcular data do DG (15 dias após data de chegada dos animais; se não informada, usa data da NF)
          const dataChegadaRef = dataChegadaFormatada || dataFormatada
          const dataChegadaDate = new Date(dataChegadaRef)
          if (isNaN(dataChegadaDate.getTime())) {
            throw new Error('Data de chegada/NF inválida')
          }
          const dataDG = new Date(dataChegadaDate)
          dataDG.setDate(dataDG.getDate() + 15)
          const dataDGFormatada = dataDG.toISOString().split('T')[0]

          // Processar cada item (receptora) da NF - CRIAR ANIMAL SEMPRE
          for (const item of itens) {
          if (item.tipoProduto === 'bovino' && item.tatuagem) {
            // Buscar ou criar animal receptora
            const tatuagemParts = item.tatuagem.match(/^(\D*)(\d+)$/)
            let serieReceptora = ''
            let rgReceptora = ''
            
            if (tatuagemParts) {
              serieReceptora = (tatuagemParts[1] || receptoraLetra || '').trim()
              rgReceptora = tatuagemParts[2] || receptoraNumero
            } else {
              // Fallback: tatuagem pode vir como "M9775 9775" - extrair letras e número
              const parts = (item.tatuagem || '').split(/\s+/)
              if (parts.length >= 2) {
                serieReceptora = (parts[0] || receptoraLetra || '').replace(/\d+$/, '').trim() || 'M'
                rgReceptora = parts[parts.length - 1]?.replace(/\D/g, '') || receptoraNumero
              } else {
                serieReceptora = (receptoraLetra || '').trim()
                rgReceptora = receptoraNumero
              }
            }

            // Normalizar série: remover dígitos do final (M9775 -> M) para evitar duplicatas
            serieReceptora = (serieReceptora || '').replace(/\d+$/, '').trim() || serieReceptora || 'M'

            // Buscar animal existente - também por série+rg concatenado (evitar duplicatas M vs M9775)
            const animalResult = await query(`
              SELECT id FROM animais 
              WHERE rg = $1 AND (serie = $2 OR serie = $2 || $1)
              LIMIT 1
            `, [rgReceptora, serieReceptora])

            let animalId = null
            const dataChegadaAnimal = dataChegadaFormatada || dataFormatada
            if (animalResult.rows.length > 0) {
              animalId = animalResult.rows[0].id
              // Atualizar animal existente com data_chegada e data_dg_prevista para alertas DG
              await query(`
                ALTER TABLE animais 
                ADD COLUMN IF NOT EXISTS data_chegada DATE,
                ADD COLUMN IF NOT EXISTS data_dg_prevista DATE
              `).catch(() => {})
              await query(`
                UPDATE animais SET data_chegada = $1, data_dg_prevista = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3
              `, [dataChegadaAnimal, dataDGFormatada, animalId]).catch(() => {})
            } else {
              // Criar animal receptora se não existir (com data_chegada e data_dg_prevista para alertas)
              const dataDGPrevista = dataDGFormatada
              await query(`
                ALTER TABLE animais 
                ADD COLUMN IF NOT EXISTS data_chegada DATE,
                ADD COLUMN IF NOT EXISTS data_dg_prevista DATE
              `).catch(() => {})
              const novoAnimalResult = await query(`
                INSERT INTO animais (
                  serie, rg, nome, sexo, raca, situacao, data_compra, fornecedor, numero_nf_entrada, data_chegada, data_dg_prevista
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id
              `, [
                serieReceptora,
                rgReceptora,
                `${serieReceptora} ${rgReceptora}`,
                'femea',
                item.raca || 'Receptora',
                'Ativo',
                dataFormatada,
                fornecedorFinal,
                numeroNF,
                dataChegadaAnimal,
                dataDGPrevista
              ])
              animalId = novoAnimalResult.rows[0].id
              console.log(`✅ Receptora criada: ${serieReceptora} ${rgReceptora}`)
            }

            // Criar registro de Transferência de Embrião (TE) se não existir E se tiver data de TE
            // Usar serie+rg do item (cada receptora tem sua própria TE)
            if (dataTEFormatada && animalId) {
              const nomeReceptora = `${serieReceptora} ${rgReceptora}`.trim() || `${receptoraLetra} ${receptoraNumero}`
              const teExistente = await query(`
                SELECT id FROM transferencias_embrioes
                WHERE (receptora_id = $1 OR (receptora_nome = $2 AND data_te = $3))
                LIMIT 1
              `, [animalId, nomeReceptora, dataTEFormatada])

              if (teExistente.rows.length === 0) {
                await query(`
                  INSERT INTO transferencias_embrioes (
                    receptora_id,
                    receptora_nome,
                    data_te,
                    central,
                    status,
                    observacoes,
                    numero_nf
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                  animalId,
                  nomeReceptora,
                  dataTEFormatada,
                  fornecedorFinal || 'Não informado',
                  'realizada',
                  `NF de Entrada: ${numeroNF} - DG agendado para ${dataDGFormatada}`,
                  numeroNF
                ])
                console.log(`✅ TE criada para receptora: ${nomeReceptora} (data TE: ${dataTEFormatada})`)
              }
            }

            // Criar alerta/agendamento de DG (15 dias após chegada dos animais) - SOMENTE SE TIVER DATA DE TE
            if (dataTEFormatada && animalId) {
              try {
                // Verificar se já existe inseminação para este animal nesta data
                const iaExistente = await query(`
                  SELECT id FROM inseminacoes
                  WHERE animal_id = $1 AND data_ia = $2
                  LIMIT 1
                `, [animalId, dataTEFormatada])

                if (iaExistente.rows.length === 0) {
                  await query(`
                    INSERT INTO inseminacoes (
                      animal_id,
                      numero_ia,
                      data_ia,
                      data_dg,
                      observacoes,
                      status_gestacao
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                  `, [
                    animalId,
                    1,
                    dataTEFormatada, // Data da TE como data de IA
                    dataDGFormatada, // Data do DG agendado
                    `Receptora - NF ${numeroNF}. DG agendado automaticamente para 15 dias após chegada dos animais.`,
                    'Pendente'
                  ])
                  const nomeReceptora = `${serieReceptora} ${rgReceptora}`.trim()
                  console.log(`📅 DG agendado para ${dataDGFormatada} - Receptora: ${nomeReceptora}`)
                } else {
                  const nomeReceptora = `${serieReceptora} ${rgReceptora}`.trim()
                  console.log(`ℹ️ Inseminação já existe para receptora ${nomeReceptora}`)
                }
              } catch (error) {
                console.error('Erro ao criar agendamento de DG:', error.message)
                // Não falhar o processo se o agendamento de DG falhar
              }
            }
          }
        }

        console.log(`✅ NF de Receptoras processada com sucesso!${dataTEFormatada ? ` DG agendado para ${dataDGFormatada}` : ''}`)

          // Gerar relatório DG em Excel - SOMENTE SE TIVER DATA DE TE
          if (dataTEFormatada && receptoraLetra && receptoraNumero) {
            try {
              await gerarRelatorioDG(nfId, numeroNF, dataChegadaFormatada || dataFormatada, dataDGFormatada, itens, receptoraLetra, receptoraNumero, dataTEFormatada)
              console.log(`📊 Relatório DG gerado para NF ${numeroNF}`)
            } catch (error) {
              console.error('Erro ao gerar relatório DG:', error)
              // Não falhar o salvamento da NF se o relatório não for gerado
            }
          }
        } catch (error) {
          console.error('❌ Erro ao processar Receptoras:', error)
          console.error('Stack:', error.stack)
          // Não falhar o salvamento da NF se o processamento de receptoras falhar
          // A NF já foi salva, apenas o processamento adicional falhou
        }
      }

      // Se for bovino de entrada, adicionar aos animais e registrar no boletim contábil
      if (tipo === 'entrada' && tipoProduto === 'bovino' && itens) {
        const animaisIds = []
        
        // Função auxiliar para calcular meses a partir da era
        function calcularMesesDaEra(era) {
          if (!era) return null
          const eraLower = era.toLowerCase().trim()
          // IMPORTANTE: Verificar faixas específicas ANTES de verificar valores isolados
          if (eraLower.includes('24/36') || eraLower.includes('24-36')) {
            return 30 // Idade média da faixa 24/36 meses
          }
          if (eraLower.includes('0') && eraLower.includes('3')) return 1.5
          if (eraLower.includes('3') && eraLower.includes('8')) return 5.5
          if (eraLower.includes('8') && eraLower.includes('12')) return 10
          if (eraLower.includes('12') && eraLower.includes('24')) return 18
          // IMPORTANTE: Verificar faixas específicas ANTES de verificar valores isolados
          if (eraLower.includes('24/36') || eraLower.includes('24-36')) {
            return 30 // Idade média da faixa 24/36 meses
          }
          if (eraLower.includes('25') && eraLower.includes('36')) return 30.5
          if (eraLower.includes('acima') || (eraLower.includes('36') && !eraLower.includes('24'))) return 48
          const mesesMatch = era.match(/(\d+)\s*meses?/i)
          if (mesesMatch) return parseInt(mesesMatch[1])
          return null
        }
        
        for (const item of itens) {
          // Se for modo categoria, não criar animais individuais
          if (item.modoCadastro === 'categoria') {
            // Para modo categoria, apenas adicionar ao array de IDs vazio
            // A movimentação será registrada no boletim com a quantidade total
            continue
          }
          
          let serie = ''
          let rg = ''
          if (item.tatuagem) {
            const tat = String(item.tatuagem).trim().replace(/\s+/g, ' ')
            const m = tat.match(/^(\D*)\s*(\d+)$/)
            if (m) {
              serie = (m[1] || 'M').trim() || 'M'
              rg = m[2]
            } else if (tat.includes('-')) {
              const parts = tat.split('-')
              serie = (parts[0] || 'M').trim() || 'M'
              rg = (parts[1] || '').trim()
            } else {
              const num = tat.replace(/\D/g, '')
              const letters = tat.replace(/\d/g, '').trim() || 'M'
              serie = letters
              rg = num
            }
          }
          
          // Preparar observações com informações da NF
          const observacoesNF = [
            `NF: ${numeroNF}`,
            `Fornecedor: ${fornecedorFinal || fornecedor || 'Não informado'}`,
            `Valor compra: R$ ${parseFloat(item.valorUnitario || 0).toFixed(2)}`,
            item.peso ? `Peso entrada: ${item.peso} kg` : '',
            item.era ? `Era: ${item.era}` : ''
          ].filter(Boolean).join(' | ')
          
          let animalId = null
          try {
            const sexoRaw = String(item.sexo || '').trim().toLowerCase()
            const sexoTexto = sexoRaw === 'macho' || sexoRaw === 'm' || sexoRaw.startsWith('macho') ? 'Macho' : 'Fêmea'
            const mesesVal = calcularMesesDaEra(item.era)
            const pesoVal = item.peso ? parseFloat(String(item.peso).replace(',', '.')) : null
            const tatuagemVal = `${serie} ${rg}`.trim()
            const upsertResult = await query(`
              INSERT INTO animais (
                serie, rg, tatuagem, sexo, raca, meses, peso, situacao, observacoes, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Ativo', $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              ON CONFLICT (serie, rg) DO UPDATE SET
                sexo = EXCLUDED.sexo,
                raca = COALESCE(EXCLUDED.raca, animais.raca),
                meses = COALESCE(EXCLUDED.meses, animais.meses),
                peso = COALESCE(EXCLUDED.peso, animais.peso),
                observacoes = COALESCE(EXCLUDED.observacoes, animais.observacoes),
                updated_at = CURRENT_TIMESTAMP
              RETURNING id
            `, [
              serie || 'NF',
              rg || (item.tatuagem || '0'),
              tatuagemVal,
              sexoTexto,
              item.raca || 'Não informado',
              mesesVal,
              pesoVal,
              observacoesNF
            ])
            if (upsertResult.rows.length > 0) {
              animalId = upsertResult.rows[0].id
            }
          } catch (error) {
            console.error('Erro ao criar/atualizar animal a partir da NF:', error)
          }
          
          if (animalId) {
            animaisIds.push(animalId)
          }
        }

        // Verificar se o fornecedor tem CNPJ da AGROPECUÁRIA PARDINHO (18.978.214/0004-45)
        let cnpjFornecedor = cnpjFornecedorFinal
        let nomeFornecedor = fornecedorFinal
        
        // Se não tiver CNPJ nos dados do fornecedor, buscar no banco
        if (!cnpjFornecedor && fornecedorFinal) {
          try {
            const fornecedorResult = await query(`
              SELECT cnpj_cpf, nome FROM fornecedores_destinatarios
              WHERE nome ILIKE $1 AND tipo = 'fornecedor'
              LIMIT 1
            `, [`%${fornecedorFinal}%`])
            
            if (fornecedorResult.rows.length > 0) {
              cnpjFornecedor = fornecedorResult.rows[0].cnpj_cpf
              nomeFornecedor = fornecedorResult.rows[0].nome
            }
          } catch (error) {
            console.error('Erro ao buscar CNPJ do fornecedor:', error)
          }
        }
        
        // Normalizar CNPJ para comparação (remover pontos, barras, hífens e espaços)
        const normalizarCNPJ = (cnpj) => {
          if (!cnpj) return null
          return cnpj.replace(/[.\-\/\s]/g, '').trim()
        }
        
        const cnpjPardinho = '18978214000445'
        const cnpjFornecedorNormalizado = normalizarCNPJ(cnpjFornecedor)
        const nomeFornecedorUpper = nomeFornecedor?.toUpperCase() || ''
        const incricaoUpper = (incricao || '').toUpperCase()
        
        // Registrar movimentação no boletim contábil se:
        // 1. Fornecedor for AGROPECUÁRIA PARDINHO (por CNPJ ou nome contendo "PARDINHO")
        // 2. OU se a incrição for "SANT ANNA" ou "PARDINHO"
        const ehPardinho = cnpjFornecedorNormalizado === cnpjPardinho || nomeFornecedorUpper.includes('PARDINHO')
        const incricaoValida = incricaoUpper === 'SANT ANNA' || incricaoUpper === 'PARDINHO'
        
        if (ehPardinho || incricaoValida) {
          try {
            // Obter período atual (formato YYYY-MM)
            const periodoAtual = new Date().toISOString().slice(0, 7)
            
          // Registrar movimentação para cada item
          let animalIndex = 0
          for (let i = 0; i < itens.length; i++) {
            const item = itens[i]
            
            // Se for modo categoria, registrar uma movimentação com quantidade
            if (item.modoCadastro === 'categoria') {
              const quantidade = parseInt(item.quantidade) || 1
              const valorTotal = parseFloat(item.valorUnitario || 0) * quantidade
              
              await databaseService.registrarMovimentacao({
                periodo: periodoAtual,
                tipo: 'entrada',
                subtipo: 'compra',
                dataMovimento: data,
                animalId: null, // Sem animal individual no modo categoria
                valor: valorTotal,
                descricao: `Compra de ${quantidade} bovino(s) via NF ${numeroNF} - ${item.tipoAnimal === 'registrado' ? 'Registrado' : 'Cria/Recria'} - ${item.sexo === 'macho' ? 'Macho' : 'Fêmea'} - ${item.era}`,
                observacoes: `Quantidade: ${quantidade} | Tipo: ${item.tipoAnimal === 'registrado' ? 'Registrado' : 'Cria/Recria'} | ${item.raca || 'Não informado'} | Valor unitário: R$ ${parseFloat(item.valorUnitario || 0).toFixed(2)}`,
                localidade: incricao || (ehPardinho ? 'AGROPECUÁRIA PARDINHO LTDA' : 'SANT ANNA'),
                dadosExtras: {
                  numeroNF: numeroNF,
                  fornecedor: nomeFornecedor,
                  cnpjFornecedor: cnpjFornecedor,
                  tipoProduto: 'bovino',
                  modoCadastro: 'categoria',
                  quantidade: quantidade,
                  tipoAnimal: item.tipoAnimal,
                  era: item.era,
                  sexo: item.sexo,
                  incricao: incricao || null
                }
              })
            } else {
              // Modo individual - registrar para cada animal
              const animalId = animaisIds[animalIndex] || null
              animalIndex++
              
              await databaseService.registrarMovimentacao({
                periodo: periodoAtual,
                tipo: 'entrada',
                subtipo: 'compra',
                dataMovimento: data,
                animalId: animalId,
                valor: parseFloat(item.valorUnitario) || 0,
                descricao: `Compra de bovino via NF ${numeroNF}`,
                observacoes: `Animal: ${item.tatuagem} - ${item.raca || 'Não informado'} - ${item.sexo === 'macho' ? 'Macho' : 'Fêmea'}`,
                localidade: incricao || (ehPardinho ? 'AGROPECUÁRIA PARDINHO LTDA' : 'SANT ANNA'),
                dadosExtras: {
                  numeroNF: numeroNF,
                  fornecedor: nomeFornecedor,
                  cnpjFornecedor: cnpjFornecedor,
                  tipoProduto: 'bovino',
                  era: item.era,
                  peso: item.peso,
                  incricao: incricao || null
                }
              })
            }
          }
          } catch (error) {
            console.error('Erro ao registrar movimentação no boletim contábil:', error)
            // Não falhar a criação da NF se houver erro no boletim
          }
        }
      }

      // Registrar operação no Sistema de Lotes
      try {
        const animaisEnvolvidos = itens ? itens.map(i => i.tatuagem || i.nomeTouro || i.rgTouro).filter(Boolean).join(', ') : '';
        
        await LoteTracker.registrarOperacao({
          tipo_operacao: tipo === 'entrada' ? 'ENTRADA_NF' : 'SAIDA_NF',
          descricao: `Nota Fiscal ${numeroNF} - ${tipo === 'entrada' ? 'Entrada' : 'Saída'} - ${fornecedorFinal || destino || 'Sem identificação'}${animaisEnvolvidos ? ` - Animais: ${animaisEnvolvidos}` : ''}`,
          detalhes: {
            id: nfId,
            numero_nf: numeroNF,
            valor_total: valorTotalCalculado,
            quantidade_itens: itens ? itens.length : 0,
            tipo_produto: tipoProduto,
            fornecedor: fornecedorFinal,
            destino: destino,
            animais: animaisEnvolvidos
          },
          usuario: req.body.usuario || 'Sistema',
          quantidade_registros: itens ? itens.length : 1,
          modulo: 'CONTABILIDADE',
          req
        })
      } catch (error) {
        console.error('Erro ao registrar lote da NF:', error)
      }

      return res.status(201).json({
        success: true,
        message: 'Nota fiscal criada com sucesso',
        data: nfResult.rows[0],
        itensCount: itens ? itens.length : 0
      })
    }

    if (req.method === 'PUT') {
      // Atualizar nota fiscal
      const {
        id,
        numeroNF,
        data,
        fornecedor,
        destino,
        cnpjOrigemDestino,
        naturezaOperacao,
        observacoes,
        tipo,
        tipoProduto,
        valorTotal,
        itens,
        fornecedorData,
        incricao
      } = req.body
      
      // Usar dados do fornecedor selecionado se disponível
      const fornecedorFinal = fornecedorData?.nome || fornecedor
      // Priorizar CNPJ informado manualmente, depois do fornecedor selecionado
      const cnpjFornecedorFinal = cnpjOrigemDestino || fornecedorData?.cnpj_cpf || null

      if (!id) {
        return res.status(400).json({ error: 'ID da nota fiscal é obrigatório' })
      }

      // Converter data para formato DATE se necessário
      let dataFormatada = data
      if (data && typeof data === 'string' && data.includes('/')) {
        const [dia, mes, ano] = data.split('/')
        dataFormatada = `${ano}-${mes}-${dia}`
      }
      const toPgDate = (val) => {
        if (!val) return null
        if (typeof val === 'string' && val.includes('/')) {
          const [d, m, y] = val.split('/')
          return `${y}-${m}-${d}`
        }
        return val
      }
      const dataChegadaAnimaisPut = toPgDate(req.body.dataChegadaAnimais)
      const dataTEPut = toPgDate(req.body.dataTE)
      const dataSaidaPut = toPgDate(req.body.dataSaida)

      const result = await query(`
        UPDATE notas_fiscais SET
          numero_nf = $1,
          data_compra = $2,
          data = $3,
          fornecedor = $4,
          destino = $5,
          cnpj_origem_destino = $6,
          natureza_operacao = $7,
          observacoes = $8,
          tipo = $9,
          tipo_produto = $10,
          valor_total = $11,
          incricao = $12,
          endereco = $13,
          bairro = $14,
          cep = $15,
          municipio = $16,
          uf = $17,
          telefone = $18,
          data_chegada_animais = $19,
          data_saida = $20,
          motorista = $21,
          eh_receptoras = $22,
          receptora_letra = $23,
          receptora_numero = $24,
          data_te = $25,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $26
        RETURNING *
      `, [
        numeroNF,
        dataFormatada, // data_compra (obrigatório)
        dataFormatada, // data (opcional, mas usando o mesmo valor)
        fornecedorFinal || null,
        destino || null,
        cnpjFornecedorFinal || null,
        naturezaOperacao,
        observacoes || null,
        tipo,
        tipoProduto,
        valorTotal || 0,
        incricao || null,
        req.body.endereco || null,
        req.body.bairro || null,
        req.body.cep || null,
        req.body.municipio || null,
        req.body.uf || null,
        req.body.telefone || null,
        dataChegadaAnimaisPut,
        dataSaidaPut,
        req.body.motorista || null,
        req.body.ehReceptoras || false,
        req.body.receptoraLetra || null,
        req.body.receptoraNumero || null,
        dataTEPut,
        id
      ])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Nota fiscal não encontrada' })
      }

      // Deletar itens antigos
      await query('DELETE FROM notas_fiscais_itens WHERE nota_fiscal_id = $1', [id])

      // Calcular valor total a partir dos itens
      let valorTotalCalculado = 0
      if (itens && itens.length > 0) {
        for (const item of itens) {
          const valorUnit = parseFloat(item.valorUnitario) || 0
          
          if (item.tipoProduto === 'bovino') {
            if (item.modoCadastro === 'categoria') {
              const quantidade = parseInt(item.quantidade) || 1
              valorTotalCalculado += valorUnit * quantidade
            } else {
              valorTotalCalculado += valorUnit
            }
          } else if (item.tipoProduto === 'semen') {
            const doses = parseInt(item.quantidadeDoses) || 0
            valorTotalCalculado += valorUnit * doses
          } else if (item.tipoProduto === 'embriao') {
            const embrioes = parseInt(item.quantidadeEmbrioes) || 0
            valorTotalCalculado += valorUnit * embrioes
          } else {
            valorTotalCalculado += valorUnit
          }
        }
        
        // Arredondar para 2 casas decimais
        valorTotalCalculado = Math.round(valorTotalCalculado * 100) / 100
        
        // Atualizar o valor_total na NF
        await query(`
          UPDATE notas_fiscais 
          SET valor_total = $1 
          WHERE id = $2
        `, [valorTotalCalculado, id])
      }

      // Inserir novos itens
      if (itens && itens.length > 0) {
        for (const item of itens) {
          await query(`
            INSERT INTO notas_fiscais_itens (
              nota_fiscal_id,
              tipo_produto,
              dados_item
            ) VALUES ($1, $2, $3)
          `, [id, item.tipoProduto, JSON.stringify(item)])
        }
      }

      // Se for bovino de entrada OU saída, registrar no boletim contábil
      if (tipoProduto === 'bovino' && itens) {
        const animaisIds = []
        
        // Função auxiliar para calcular meses a partir da era
        function calcularMesesDaEra(era) {
          if (!era) return null
          const eraLower = era.toLowerCase().trim()
          // IMPORTANTE: Verificar faixas específicas ANTES de verificar valores isolados
          if (eraLower.includes('24/36') || eraLower.includes('24-36')) {
            return 30 // Idade média da faixa 24/36 meses
          }
          if (eraLower.includes('0') && eraLower.includes('3')) return 1.5
          if (eraLower.includes('3') && eraLower.includes('8')) return 5.5
          if (eraLower.includes('8') && eraLower.includes('12')) return 10
          if (eraLower.includes('12') && eraLower.includes('24')) return 18
          // IMPORTANTE: Verificar faixas específicas ANTES de verificar valores isolados
          if (eraLower.includes('24/36') || eraLower.includes('24-36')) {
            return 30 // Idade média da faixa 24/36 meses
          }
          if (eraLower.includes('25') && eraLower.includes('36')) return 30.5
          if (eraLower.includes('acima') || (eraLower.includes('36') && !eraLower.includes('24'))) return 48
          const mesesMatch = era.match(/(\d+)\s*meses?/i)
          if (mesesMatch) return parseInt(mesesMatch[1])
          return null
        }
        
        for (const item of itens) {
          // Se for modo categoria, não criar animais individuais
          if (item.modoCadastro === 'categoria') {
            continue
          }
          
          // Extrair série e RG da tatuagem
          let serie = ''
          let rg = ''
          if (item.tatuagem) {
            const tatuagemClean = item.tatuagem.trim()
            if (tatuagemClean.includes('-')) {
              [serie, rg] = tatuagemClean.split('-')
            } else if (tatuagemClean.includes(' ')) {
              const parts = tatuagemClean.split(' ')
              serie = parts[0]
              rg = parts.slice(1).join('')
            } else {
              // Se for apenas números, assume que é RG sem série
              if (/^\d+$/.test(tatuagemClean)) {
                  serie = ''
                  rg = tatuagemClean
              } else {
                  // Fallback para lógica de 4 caracteres
                  serie = tatuagemClean.substring(0, 4)
                  rg = tatuagemClean.substring(4)
              }
            }
            serie = serie ? serie.trim() : ''
            rg = rg ? rg.trim() : ''
          }
          
          // Preparar observações com informações da NF
          const observacoesNF = [
            `NF: ${numeroNF}`,
            `Fornecedor: ${fornecedorFinal || fornecedor || 'Não informado'}`,
            `Valor compra: R$ ${parseFloat(item.valorUnitario || 0).toFixed(2)}`,
            item.peso ? `Peso entrada: ${item.peso} kg` : '',
            item.era ? `Era: ${item.era}` : ''
          ].filter(Boolean).join(' | ')
          
          // HABILITADO: Criar animais automaticamente se não existirem
          let animalId = null
          try {
            // Verificar se o animal já existe
            const animalExistente = await query(`
              SELECT id FROM animais 
              WHERE serie = $1 AND rg = $2
              LIMIT 1
            `, [serie || 'NF', rg || item.tatuagem || '0'])
            
            if (animalExistente.rows.length > 0) {
              // Animal já existe, apenas atualizar observações se necessário
              animalId = animalExistente.rows[0].id
              await query(`
                UPDATE animais SET
                  observacoes = COALESCE($1, observacoes),
                  updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
              `, [observacoesNF, animalId])
            } else {
               // Animal não existe, criar automaticamente
               const sexoMap = item.sexo === 'macho' ? 'Macho' : (item.sexo === 'femea' ? 'Fêmea' : item.sexo)
               
               const novoAnimal = await query(`
                INSERT INTO animais (
                  serie, 
                  rg, 
                  sexo, 
                  raca, 
                  peso, 
                  observacoes,
                  situacao,
                  created_at,
                  updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
              `, [
                serie || 'NF', 
                rg || item.tatuagem || '0', 
                sexoMap || 'Macho',
                item.raca || 'Não informado',
                parseFloat(item.peso) || 0,
                observacoesNF,
                'Ativo'
              ])
              
              if (novoAnimal.rows.length > 0) {
                animalId = novoAnimal.rows[0].id
                console.log(`✅ Animal criado automaticamente: ${serie}${rg}`)
              }
            }
          } catch (error) {
            console.error('Erro ao verificar/criar animal:', error)
          }
          
          if (animalId) {
            animaisIds.push(animalId)
          }
        }

        // Verificar se o fornecedor tem CNPJ da AGROPECUÁRIA PARDINHO
        let cnpjFornecedor = cnpjFornecedorFinal
        let nomeFornecedor = fornecedorFinal
        
        if (!cnpjFornecedor && fornecedorFinal) {
          try {
            const fornecedorResult = await query(`
              SELECT cnpj_cpf, nome FROM fornecedores_destinatarios
              WHERE nome ILIKE $1 AND tipo = 'fornecedor'
              LIMIT 1
            `, [`%${fornecedorFinal}%`])
            
            if (fornecedorResult.rows.length > 0) {
              cnpjFornecedor = fornecedorResult.rows[0].cnpj_cpf
              nomeFornecedor = fornecedorResult.rows[0].nome
            }
          } catch (error) {
            console.error('Erro ao buscar CNPJ do fornecedor:', error)
          }
        }
        
        // Para saída, buscar dados do destino
        let cnpjDestino = cnpjFornecedorFinal
        let nomeDestino = destino || fornecedorFinal
        
        if (tipo === 'saida' && destino) {
          try {
            const destinoResult = await query(`
              SELECT cnpj_cpf, nome FROM fornecedores_destinatarios
              WHERE nome ILIKE $1 AND tipo IN ('destinatario', 'fornecedor')
              LIMIT 1
            `, [`%${destino}%`])
            
            if (destinoResult.rows.length > 0) {
              cnpjDestino = destinoResult.rows[0].cnpj_cpf
              nomeDestino = destinoResult.rows[0].nome
            }
          } catch (error) {
            console.error('Erro ao buscar CNPJ do destino:', error)
          }
        }
        
        const normalizarCNPJ = (cnpj) => {
          if (!cnpj) return null
          return cnpj.replace(/[.\-\/]/g, '').trim()
        }
        
        const cnpjPardinho = '18978214000445'
        const cnpjFornecedorNormalizado = normalizarCNPJ(cnpjFornecedor)
        const nomeFornecedorUpper = nomeFornecedor?.toUpperCase() || ''
        const incricaoUpper = (incricao || '').toUpperCase()
        
        // Verificar se é PARDINHO
        const ehPardinho = cnpjFornecedorNormalizado === cnpjPardinho || nomeFornecedorUpper.includes('PARDINHO')
        const incricaoValida = incricaoUpper === 'SANT ANNA' || incricaoUpper === 'PARDINHO'
        
        // Registrar movimentação no boletim contábil
        // Para entrada: se fornecedor for PARDINHO OU se incrição for SANT ANNA/PARDINHO
        // Para saída: sempre registrar (venda)
        const deveRegistrarEntrada = tipo === 'entrada' && (ehPardinho || incricaoValida)
        const deveRegistrarSaida = tipo === 'saida'
        
        if (deveRegistrarEntrada || deveRegistrarSaida) {
          try {
            // Remover movimentações antigas desta NF antes de recriar
            // Isso garante que itens adicionados/removidos sejam refletidos corretamente
            try {
              await query(
                `DELETE FROM movimentacoes_contabeis 
                 WHERE (dados_extras::jsonb->>'numeroNF' = $1 OR dados_extras::jsonb->>'numero_nf' = $1)`,
                [String(numeroNF)]
              )
              console.log(`🗑️ Movimentações antigas (entrada e saída) da NF ${numeroNF} removidas antes de recriar`)
            } catch (deleteError) {
              console.warn(`⚠️ Erro ao remover movimentações antigas da NF ${numeroNF}:`, deleteError.message)
            }
            
            const periodoAtual = new Date().toISOString().slice(0, 7)
            
            let animalIndex = 0
            for (let i = 0; i < itens.length; i++) {
              const item = itens[i]
              
              if (tipo === 'entrada') {
                // REGISTRO DE ENTRADA (COMPRA)
                if (item.modoCadastro === 'categoria') {
                  const quantidade = parseInt(item.quantidade) || 1
                  const valorTotal = parseFloat(item.valorUnitario || 0) * quantidade
                  
                  await databaseService.registrarMovimentacao({
                    periodo: periodoAtual,
                    tipo: 'entrada',
                    subtipo: 'compra',
                    dataMovimento: dataFormatada,
                    animalId: null,
                    valor: valorTotal,
                    descricao: `Compra de ${quantidade} bovino(s) via NF ${numeroNF} - ${item.tipoAnimal === 'registrado' ? 'Registrado' : 'Cria/Recria'} - ${item.sexo === 'macho' ? 'Macho' : 'Fêmea'} - ${item.era}`,
                    observacoes: `Quantidade: ${quantidade} | Tipo: ${item.tipoAnimal === 'registrado' ? 'Registrado' : 'Cria/Recria'} | ${item.raca || 'Não informado'} | Valor unitário: R$ ${parseFloat(item.valorUnitario || 0).toFixed(2)}`,
                    localidade: incricao || (ehPardinho ? 'AGROPECUÁRIA PARDINHO LTDA' : 'SANT ANNA'),
                    dadosExtras: {
                      numeroNF: numeroNF,
                      numero_nf: numeroNF,
                      fornecedor: nomeFornecedor,
                      cnpjFornecedor: cnpjFornecedor,
                      tipoProduto: 'bovino',
                      modoCadastro: 'categoria',
                      quantidade: quantidade,
                      tipoAnimal: item.tipoAnimal,
                      era: item.era,
                      sexo: item.sexo,
                      incricao: incricao || null
                    }
                  })
                } else {
                  const animalId = animaisIds[animalIndex] || null
                  animalIndex++
                  
                  await databaseService.registrarMovimentacao({
                    periodo: periodoAtual,
                    tipo: 'entrada',
                    subtipo: 'compra',
                    dataMovimento: dataFormatada,
                    animalId: animalId,
                    valor: parseFloat(item.valorUnitario) || 0,
                    descricao: `Compra de bovino via NF ${numeroNF}`,
                    observacoes: `Animal: ${item.tatuagem} - ${item.raca || 'Não informado'} - ${item.sexo === 'macho' ? 'Macho' : 'Fêmea'}`,
                    localidade: incricao || (ehPardinho ? 'AGROPECUÁRIA PARDINHO LTDA' : 'SANT ANNA'),
                    dadosExtras: {
                      numeroNF: numeroNF,
                      numero_nf: numeroNF,
                      fornecedor: nomeFornecedor,
                      cnpjFornecedor: cnpjFornecedor,
                      tipoProduto: 'bovino',
                      era: item.era,
                      peso: item.peso,
                      incricao: incricao || null
                    }
                  })
                }
              } else if (tipo === 'saida') {
                // REGISTRO DE SAÍDA (VENDA)
                if (item.modoCadastro === 'categoria') {
                  const quantidade = parseInt(item.quantidade) || 1
                  const valorTotal = parseFloat(item.valorUnitario || 0) * quantidade
                  
                  await databaseService.registrarMovimentacao({
                    periodo: periodoAtual,
                    tipo: 'saida',
                    subtipo: 'venda',
                    dataMovimento: dataFormatada,
                    animalId: null,
                    valor: valorTotal,
                    descricao: `Venda de ${quantidade} bovino(s) via NF ${numeroNF} - ${item.tipoAnimal === 'registrado' ? 'Registrado' : 'Cria/Recria'} - ${item.sexo === 'macho' ? 'Macho' : 'Fêmea'} - ${item.era}`,
                    observacoes: `Quantidade: ${quantidade} | Destino: ${nomeDestino || destino || 'Não informado'} | ${item.raca || 'Não informado'} | Valor unitário: R$ ${parseFloat(item.valorUnitario || 0).toFixed(2)}`,
                    localidade: incricao || (ehPardinho ? 'AGROPECUÁRIA PARDINHO LTDA' : 'SANT ANNA'),
                    dadosExtras: {
                      numeroNF: numeroNF,
                      numero_nf: numeroNF,
                      destino: nomeDestino || destino,
                      cnpjDestino: cnpjDestino,
                      tipoProduto: 'bovino',
                      modoCadastro: 'categoria',
                      quantidade: quantidade,
                      tipoAnimal: item.tipoAnimal,
                      era: item.era,
                      sexo: item.sexo,
                      incricao: incricao || null
                    }
                  })
                } else {
                  const animalId = animaisIds[animalIndex] || null
                  animalIndex++
                  
                  await databaseService.registrarMovimentacao({
                    periodo: periodoAtual,
                    tipo: 'saida',
                    subtipo: 'venda',
                    dataMovimento: dataFormatada,
                    animalId: animalId,
                    valor: parseFloat(item.valorUnitario) || 0,
                    descricao: `Venda de bovino via NF ${numeroNF}`,
                    observacoes: `Animal: ${item.tatuagem} - Destino: ${nomeDestino || destino || 'Não informado'} - ${item.raca || 'Não informado'} - ${item.sexo === 'macho' ? 'Macho' : 'Fêmea'}`,
                    localidade: incricao || (ehPardinho ? 'AGROPECUÁRIA PARDINHO LTDA' : 'SANT ANNA'),
                    dadosExtras: {
                      numeroNF: numeroNF,
                      numero_nf: numeroNF,
                      destino: nomeDestino || destino,
                      cnpjDestino: cnpjDestino,
                      tipoProduto: 'bovino',
                      era: item.era,
                      peso: item.peso,
                      incricao: incricao || null
                    }
                  })
                }
              }
            }
            
            console.log(`✅ ${itens.length} movimentação(ões) criada(s) para NF ${numeroNF}`)
          } catch (error) {
            console.error('Erro ao registrar movimentação no boletim contábil:', error)
          }
        }
      }

      // Registrar operação no Sistema de Lotes
      try {
        const animaisEnvolvidos = itens ? itens.map(i => i.tatuagem || i.nomeTouro || i.rgTouro).filter(Boolean).join(', ') : '';
        
        await LoteTracker.registrarOperacao({
          tipo_operacao: 'EDICAO_NF',
          descricao: `Edição de Nota Fiscal ${numeroNF} - ${tipo === 'entrada' ? 'Entrada' : 'Saída'} - ${fornecedorFinal || destino || 'Sem identificação'}${animaisEnvolvidos ? ` - Animais: ${animaisEnvolvidos}` : ''}`,
          detalhes: {
            id: id,
            numero_nf: numeroNF,
            valor_total: valorTotalCalculado,
            quantidade_itens: itens ? itens.length : 0,
            tipo_produto: tipoProduto,
            fornecedor: fornecedorFinal,
            destino: destino,
            animais: animaisEnvolvidos
          },
          usuario: req.body.usuario || 'Sistema',
          quantidade_registros: itens ? itens.length : 1,
          modulo: 'CONTABILIDADE',
          req
        })
      } catch (error) {
        console.error('Erro ao registrar lote da NF:', error)
      }

      return res.status(200).json({
        success: true,
        message: 'Nota fiscal atualizada com sucesso',
        data: result.rows[0]
      })
    }

    return res.status(405).json({ error: 'Método não permitido' })
  } catch (error) {
    console.error('❌ Erro na API de notas fiscais:', error)
    console.error('Stack trace:', error.stack)
    console.error('Request body:', JSON.stringify(req.body, null, 2))
    
    return res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor',
      message: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
