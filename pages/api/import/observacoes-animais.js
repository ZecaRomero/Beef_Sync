import { query } from '../../../lib/database'
import { blockIfNotZecaDeveloper } from '../../../utils/importAccess'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const blocked = blockIfNotZecaDeveloper(req, res)
  if (blocked) return blocked

  try {
    const { texto } = req.body

    if (!texto || typeof texto !== 'string') {
      return res.status(400).json({ error: 'Texto é obrigatório' })
    }

    // Processar linhas
    const linhas = texto.split('\n').filter(l => l.trim())
    
    if (linhas.length === 0) {
      return res.status(400).json({ error: 'Nenhuma linha válida encontrada' })
    }

    const resultados = {
      sucessos: 0,
      erros: 0,
      total: linhas.length,
      detalhes: []
    }

    for (const linha of linhas) {
      try {
        // Separar por TAB (padrão do Excel) ou espaços múltiplos
        const partes = linha.split(/\t+/).map(p => p.trim())
        
        // Se não tiver TAB, tentar separar por espaços
        const dados = partes.length >= 3 ? partes : linha.split(/\s{2,}/).map(p => p.trim())
        
        if (dados.length < 3) {
          resultados.erros++
          resultados.detalhes.push({
            linha: linha.substring(0, 50),
            erro: 'Formato inválido - esperado: Série, RG, Observação'
          })
          continue
        }

        const serie = dados[0].trim().toUpperCase()
        const rg = dados[1].trim()
        const observacao = dados.slice(2).join(' ').trim()

        if (!serie || !rg) {
          resultados.erros++
          resultados.detalhes.push({
            linha: linha.substring(0, 50),
            erro: 'Série ou RG vazio'
          })
          continue
        }

        // Buscar animal
        const animal = await query(`
          SELECT id, serie, rg, observacoes 
          FROM animais 
          WHERE serie = $1 AND rg = $2
          LIMIT 1
        `, [serie, rg])

        if (animal.rows.length === 0) {
          resultados.erros++
          resultados.detalhes.push({
            serie,
            rg,
            erro: 'Animal não encontrado'
          })
          continue
        }

        // Atualizar observação
        const observacaoAtual = animal.rows[0].observacoes || ''
        const novaObservacao = observacaoAtual 
          ? `${observacaoAtual}\n\n[Importado ${new Date().toLocaleDateString('pt-BR')}]: ${observacao}`
          : observacao

        await query(`
          UPDATE animais 
          SET observacoes = $1, updated_at = NOW()
          WHERE id = $2
        `, [novaObservacao, animal.rows[0].id])

        resultados.sucessos++
        resultados.detalhes.push({
          serie,
          rg,
          sucesso: true,
          mensagem: 'Observação atualizada'
        })

      } catch (erro) {
        resultados.erros++
        resultados.detalhes.push({
          linha: linha.substring(0, 50),
          erro: erro.message
        })
      }
    }

    return res.status(200).json(resultados)

  } catch (error) {
    console.error('Erro ao importar observações:', error)
    return res.status(500).json({ 
      error: 'Erro ao processar importação',
      message: error.message 
    })
  }
}
