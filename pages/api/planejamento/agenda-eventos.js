/**
 * API de Eventos da Agenda - Brucelose, DGT e atividades
 * 
 * Regras:
 * - Brucelose: Fêmeas entre 3-8 meses (90-240 dias) - obrigatório
 * - DGT (Avaliação para Diagnóstico de Gestação): Animais entre 330-640 dias de vida
 */
import databaseService from '../../../services/databaseService'
import { sendSuccess, sendError } from '../../../utils/apiResponse'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { mes, ano } = req.query
    const hoje = new Date()
    const dataInicio = mes && ano 
      ? new Date(parseInt(ano), parseInt(mes) - 1, 1) 
      : new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const dataFim = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + 1, 0)

    const dataInicioStr = dataInicio.toISOString().split('T')[0]
    const dataFimStr = dataFim.toISOString().split('T')[0]

    // 1. Animais para Brucelose: fêmeas 3-8 meses (90-240 dias)
    // Excluir quem já tomou (custos com tipo/subtipo/observacoes contendo brucelose)
    const bruceloseResult = await databaseService.query(`
      WITH animais_com_brucelose AS (
        SELECT DISTINCT c.animal_id
        FROM custos c
        WHERE c.tipo ILIKE '%brucelose%' OR c.subtipo ILIKE '%brucelose%' OR c.observacoes ILIKE '%brucelose%')
      SELECT
        a.id,
        a.serie,
        a.rg,
        a.sexo,
        a.raca,
        a.data_nascimento,
        a.peso,
        a.nome,
        a.piquete_atual,
        a.pasto_atual,
        (SELECT l2.piquete FROM localizacoes_animais l2 
         WHERE l2.animal_id = a.id AND l2.data_saida IS NULL 
         ORDER BY l2.data_entrada DESC LIMIT 1) as piquete_localizacao,
        (CURRENT_DATE - a.data_nascimento::date) as idade_dias
      FROM animais a
      LEFT JOIN animais_com_brucelose b ON a.id = b.animal_id
      WHERE a.situacao = 'Ativo'
        AND a.sexo = 'Fêmea'
        AND a.data_nascimento IS NOT NULL
        AND b.animal_id IS NULL
        AND (CURRENT_DATE - a.data_nascimento::date) BETWEEN 90 AND 240
      ORDER BY a.data_nascimento DESC
    `)

    // 2. Animais para DGT: 330-640 dias de vida
    const dgtResult = await databaseService.query(`
      SELECT 
        a.id,
        a.serie,
        a.rg,
        a.sexo,
        a.raca,
        a.data_nascimento,
        a.peso,
        a.nome,
        a.piquete_atual,
        a.pasto_atual,
        (SELECT l2.piquete FROM localizacoes_animais l2 
         WHERE l2.animal_id = a.id AND l2.data_saida IS NULL 
         ORDER BY l2.data_entrada DESC LIMIT 1) as piquete_localizacao,
        (CURRENT_DATE - a.data_nascimento::date) as idade_dias
      FROM animais a
      WHERE a.situacao = 'Ativo'
        AND a.data_nascimento IS NOT NULL
        AND (CURRENT_DATE - a.data_nascimento::date) BETWEEN 330 AND 640
      ORDER BY a.data_nascimento DESC
    `)

    // 3. Verificar quais animais entrarão na janela do mês (para exibir no calendário)
    const bruceloseComData = bruceloseResult.rows.map(a => {
      const dataNasc = new Date(a.data_nascimento)
      const dataInicioJanela = new Date(dataNasc)
      dataInicioJanela.setDate(dataInicioJanela.getDate() + 90)
      const dataFimJanela = new Date(dataNasc)
      dataFimJanela.setDate(dataFimJanela.getDate() + 240)
      return {
        ...a,
        piquete: a.piquete_localizacao || a.piquete_atual || a.pasto_atual || 'Não informado',
        data_inicio_janela: dataInicioJanela.toISOString().split('T')[0],
        data_fim_janela: dataFimJanela.toISOString().split('T')[0],
        tipo_evento: 'brucelose'
      }
    })

    const dgtComData = dgtResult.rows.map(a => {
      const dataNasc = new Date(a.data_nascimento)
      const dataInicioJanela = new Date(dataNasc)
      dataInicioJanela.setDate(dataInicioJanela.getDate() + 330)
      const dataFimJanela = new Date(dataNasc)
      dataFimJanela.setDate(dataFimJanela.getDate() + 640)
      return {
        ...a,
        piquete: a.piquete_localizacao || a.piquete_atual || a.pasto_atual || 'Não informado',
        data_inicio_janela: dataInicioJanela.toISOString().split('T')[0],
        data_fim_janela: dataFimJanela.toISOString().split('T')[0],
        tipo_evento: 'dgt'
      }
    })

    // Retornar TODOS os animais elegíveis (lista completa para o usuário ver)
    // Brucelose: só fêmeas 3-8 meses | DGT: machos e fêmeas 330-640 dias
    return sendSuccess(res, {
      brucelose: bruceloseComData,
      dgt: dgtComData,
      bruceloseTotal: bruceloseComData.length,
      dgtTotal: dgtComData.length,
      periodo: {
        dataInicio: dataInicioStr,
        dataFim: dataFimStr,
        mes: dataInicio.getMonth() + 1,
        ano: dataInicio.getFullYear()
      }
    })
  } catch (error) {
    console.error('Erro ao buscar eventos da agenda:', error)
    return sendError(res, `Erro ao buscar eventos: ${error.message}`, 500)
  }
}
