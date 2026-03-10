/**
 * API para atualizar localizações dos animais com base nas pesagens
 * Quando um animal é pesado em um piquete, sua localização é atualizada
 */

import { query } from '../../../lib/database'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    // Verificar se a coluna piquete existe na tabela pesagens
    const colunaCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pesagens' 
        AND column_name IN ('piquete', 'local', 'localizacao')
    `)
    
    const colunas = colunaCheck.rows.map(r => r.column_name)
    const colunaPiquete = colunas.includes('piquete') ? 'piquete' 
                        : colunas.includes('local') ? 'local'
                        : colunas.includes('localizacao') ? 'localizacao'
                        : null
    
    if (!colunaPiquete) {
      return res.status(400).json({
        success: false,
        error: 'A tabela pesagens não possui coluna de piquete/local/localização'
      })
    }

    // 1. Buscar todas as pesagens que têm piquete informado
    const pesagensComPiquete = await query(`
      SELECT DISTINCT ON (p.animal_id, p.${colunaPiquete}, p.data)
        p.id,
        p.animal_id,
        p.${colunaPiquete} as piquete,
        p.data,
        a.serie,
        a.rg
      FROM pesagens p
      JOIN animais a ON p.animal_id = a.id
      WHERE p.${colunaPiquete} IS NOT NULL 
        AND TRIM(p.${colunaPiquete}) != ''
        AND a.situacao = 'Ativo'
      ORDER BY p.animal_id, p.${colunaPiquete}, p.data, p.id DESC
    `)

    const pesagens = pesagensComPiquete.rows || []
    
    if (pesagens.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhuma pesagem com piquete encontrada',
        atualizados: 0
      })
    }

    let atualizados = 0
    let erros = []
    const detalhes = []

    for (const pesagem of pesagens) {
      try {
        // Verificar se já existe uma localização atual para esse animal
        const locAtual = await query(`
          SELECT id, piquete
          FROM localizacoes_animais
          WHERE animal_id = $1 
            AND data_saida IS NULL
          ORDER BY data_entrada DESC
          LIMIT 1
        `, [pesagem.animal_id])

        const localizacaoAtual = locAtual.rows[0]

        // Se já está no piquete correto, pular
        if (localizacaoAtual && localizacaoAtual.piquete === pesagem.piquete) {
          continue
        }

        // Se tem localização atual diferente, fechar ela
        if (localizacaoAtual) {
          await query(`
            UPDATE localizacoes_animais
            SET data_saida = $1
            WHERE id = $2
          `, [pesagem.data, localizacaoAtual.id])
        }

        // Criar nova localização
        await query(`
          INSERT INTO localizacoes_animais (
            animal_id,
            piquete,
            data_entrada,
            data_saida,
            observacoes
          ) VALUES ($1, $2, $3, NULL, $4)
          ON CONFLICT DO NOTHING
        `, [
          pesagem.animal_id,
          pesagem.piquete,
          pesagem.data,
          `Localização atualizada automaticamente pela pesagem`
        ])

        // Atualizar também o campo pasto_atual na tabela animais
        await query(`
          UPDATE animais
          SET pasto_atual = $1
          WHERE id = $2
        `, [pesagem.piquete, pesagem.animal_id])

        atualizados++
        detalhes.push({
          animal: `${pesagem.serie} ${pesagem.rg}`,
          piquete: pesagem.piquete,
          data: pesagem.data,
          localizacaoAnterior: localizacaoAtual?.piquete || 'Não informado'
        })

      } catch (err) {
        erros.push({
          animal: `${pesagem.serie} ${pesagem.rg}`,
          erro: err.message
        })
      }
    }

    return res.status(200).json({
      success: true,
      message: `Localizações atualizadas: ${atualizados} animais`,
      atualizados,
      erros: erros.length,
      detalhes: detalhes.slice(0, 50), // Limitar a 50 para não sobrecarregar
      errosDetalhes: erros.slice(0, 10)
    })

  } catch (error) {
    console.error('Erro ao atualizar localizações:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atualizar localizações'
    })
  }
}
