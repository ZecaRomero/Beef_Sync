import { query } from '../../../lib/database'

let tableReady = false
async function ensureBoletimDefesaTable() {
  if (tableReady) return
  await query(`
    CREATE TABLE IF NOT EXISTS boletim_defesa_fazendas (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      cnpj VARCHAR(20),
      quantidades JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)
  tableReady = true
}

const FAIXAS_LABELS = {
  '0a3': '0 a 3 meses',
  '3a8': '3 a 8 meses',
  '8a12': '8 a 12 meses',
  '12a24': '12 a 24 meses',
  '25a36': '25 a 36 meses',
  'acima36': 'Acima de 36 meses'
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await ensureBoletimDefesaTable()

      // Garantir que tabela de histórico existe
      await query(`
        CREATE TABLE IF NOT EXISTS boletim_defesa_historico (
          id SERIAL PRIMARY KEY,
          fazenda_id INTEGER NOT NULL,
          fazenda_nome VARCHAR(255) NOT NULL,
          faixa VARCHAR(20) NOT NULL,
          faixa_label VARCHAR(50) NOT NULL,
          sexo CHAR(1) NOT NULL,
          sexo_label VARCHAR(20) NOT NULL,
          valor_anterior INTEGER NOT NULL DEFAULT 0,
          valor_novo INTEGER NOT NULL DEFAULT 0,
          usuario VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `).catch(() => {})

      // Buscar todas as fazendas
      const fazendas = await query(`
        SELECT 
          id,
          nome,
          cnpj,
          quantidades,
          created_at,
          updated_at
        FROM boletim_defesa_fazendas
        ORDER BY nome
      `)

      // Buscar histórico (últimos 50 registros)
      let historico = []
      try {
        const histRes = await query(`
          SELECT id, fazenda_nome, faixa, faixa_label, sexo, sexo_label, valor_anterior, valor_novo, usuario, created_at
          FROM boletim_defesa_historico
          ORDER BY created_at DESC
          LIMIT 50
        `)
        historico = histRes.rows || []
      } catch (_) {}

      return res.status(200).json({
        success: true,
        historico,
        fazendas: fazendas.rows.map(f => ({
          id: f.id,
          nome: f.nome,
          cnpj: f.cnpj,
          quantidades: f.quantidades || {
            '0a3': { M: 0, F: 0 },
            '3a8': { M: 0, F: 0 },
            '8a12': { M: 0, F: 0 },
            '12a24': { M: 0, F: 0 },
            '25a36': { M: 0, F: 0 },
            'acima36': { M: 0, F: 0 }
          },
          createdAt: f.created_at,
          updatedAt: f.updated_at
        }))
      })
    } catch (error) {
      console.error('Erro ao buscar fazendas:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar fazendas',
        error: error.message
      })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { fazendaId, faixa, sexo, valor, valorAntigo, fazendaNome, usuario } = req.body

      // Buscar fazenda atual
      const fazendaResult = await query(
        'SELECT nome, quantidades FROM boletim_defesa_fazendas WHERE id = $1',
        [fazendaId]
      )

      if (fazendaResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Fazenda não encontrada'
        })
      }

      const fazenda = fazendaResult.rows[0]
      const quantidades = fazenda.quantidades || {}
      const valorAnterior = valorAntigo ?? quantidades[faixa]?.[sexo] ?? 0
      const valorNovo = parseInt(valor) || 0

      // Atualizar quantidade
      if (!quantidades[faixa]) {
        quantidades[faixa] = { M: 0, F: 0 }
      }
      quantidades[faixa][sexo] = valorNovo

      // Salvar no banco
      await query(
        `UPDATE boletim_defesa_fazendas 
         SET quantidades = $1, updated_at = NOW() 
         WHERE id = $2`,
        [JSON.stringify(quantidades), fazendaId]
      )

      // Registrar no histórico
      try {
        await query(`CREATE TABLE IF NOT EXISTS boletim_defesa_historico (
          id SERIAL PRIMARY KEY,
          fazenda_id INTEGER NOT NULL,
          fazenda_nome VARCHAR(255) NOT NULL,
          faixa VARCHAR(20) NOT NULL,
          faixa_label VARCHAR(50) NOT NULL,
          sexo CHAR(1) NOT NULL,
          sexo_label VARCHAR(20) NOT NULL,
          valor_anterior INTEGER NOT NULL DEFAULT 0,
          valor_novo INTEGER NOT NULL DEFAULT 0,
          usuario VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW()
        )`).catch(() => {})
        await query(`
          INSERT INTO boletim_defesa_historico 
          (fazenda_id, fazenda_nome, faixa, faixa_label, sexo, sexo_label, valor_anterior, valor_novo, usuario)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          fazendaId,
          fazendaNome || fazenda.nome,
          faixa,
          FAIXAS_LABELS[faixa] || faixa,
          sexo,
          sexo === 'M' ? 'Machos' : 'Fêmeas',
          valorAnterior,
          valorNovo,
          usuario || null
        ])
      } catch (histErr) {
        console.warn('Histórico não registrado:', histErr.message)
      }

      return res.status(200).json({
        success: true,
        message: 'Quantidade atualizada com sucesso'
      })
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar quantidade',
        error: error.message
      })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id, usuario } = req.body
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID do registro é obrigatório' })
      }

      // Buscar o registro
      const reg = await query(
        'SELECT id, usuario FROM boletim_defesa_historico WHERE id = $1',
        [id]
      )
      if (reg.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Registro não encontrado' })
      }

      const regUsuario = reg.rows[0].usuario || ''
      // Somente o próprio usuário pode excluir seus registros (ou desenvolvedor em localhost pode excluir qualquer)
      const podeExcluir = usuario && (
        regUsuario === usuario ||
        regUsuario === '' ||
        regUsuario === '-' ||
        usuario === 'Zeca' // desenvolvedor
      )
      if (!podeExcluir) {
        return res.status(403).json({ success: false, message: 'Somente você pode excluir seus próprios registros' })
      }

      await query('DELETE FROM boletim_defesa_historico WHERE id = $1', [id])
      return res.status(200).json({ success: true, message: 'Registro excluído' })
    } catch (error) {
      console.error('Erro ao excluir histórico:', error)
      return res.status(500).json({ success: false, message: 'Erro ao excluir', error: error.message })
    }
  }

  return res.status(405).json({ message: 'Método não permitido' })
}
