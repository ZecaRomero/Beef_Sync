const { query: dbQuery, pool } = require('../../../lib/database')

export const config = { api: { externalResolver: true } }
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const {
        animalId,
        nome,
        serie,
        rg,
        sexo,
        nascimento,
        meses,
        dataUltimoPeso,
        peso,
        paiNomeRg,
        avoMaterno,
        maeBiologiaRg,
        receptora,
        iabcz,
        deca,
        mgq,
        top,
        mgta,
        topPrograma,
        dataServico,
        servicos,
        observacoes,
        ativos,
        vendidos,
        baixados
      } = req.body;

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Verificar qual tabela usar
        const checkOcorr = await client.query(`
          SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ocorrencias_animais') as existe
        `)
        const temOcorrenciasAnimais = checkOcorr.rows[0]?.existe === true

        let ocorrenciaId

        if (temOcorrenciasAnimais) {
          const ocorrenciaQuery = `
            INSERT INTO ocorrencias_animais (
              animal_id, nome, serie, rg, sexo, nascimento, meses, 
              data_ultimo_peso, peso, pai_nome_rg, avo_materno, 
              mae_biologia_rg, receptora, iabcz, deca, mgq, top, 
              mgta, top_programa, data_servico, observacoes, 
              ativos, vendidos, baixados, data_registro
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
              $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW()
            ) RETURNING id
          `
          const ocorrenciaResult = await client.query(ocorrenciaQuery, [
            animalId, nome, serie, rg, sexo, nascimento, meses,
            dataUltimoPeso, peso, paiNomeRg, avoMaterno, maeBiologiaRg,
            receptora, iabcz, deca, mgq, top, mgta, topPrograma,
            dataServico, observacoes, ativos, vendidos, baixados
          ])
          ocorrenciaId = ocorrenciaResult.rows[0].id

          const servicosAtivos = Object.entries(servicos || {})
            .filter(([key, value]) => value)
            .map(([key]) => key)
          if (servicosAtivos.length > 0) {
            const servicoQuery = `INSERT INTO ocorrencias_servicos (ocorrencia_id, servico_tipo) VALUES ($1, $2)`
            for (const servico of servicosAtivos) {
              await client.query(servicoQuery, [ocorrenciaId, servico])
            }
          }
        } else {
          // Usar historia_ocorrencias diretamente
          let tipoOcorrencia = 'outros'
          const servicosList = Object.entries(servicos || {}).filter(([, v]) => v).map(([k]) => k)
          if (servicosList.length > 0) {
            const primeiro = String(servicosList[0]).toLowerCase()
            if (primeiro.includes('pesagem')) tipoOcorrencia = 'pesagem'
            else if (primeiro.includes('parto')) tipoOcorrencia = 'parto'
            else if (primeiro.includes('vacin') || primeiro.includes('vacina')) tipoOcorrencia = 'vacinacao'
            else if (primeiro.includes('medic') || primeiro.includes('tratamento')) tipoOcorrencia = 'medicacao'
            else if (primeiro.includes('venda')) tipoOcorrencia = 'venda'
            else if (primeiro.includes('leilao')) tipoOcorrencia = 'leilao'
            else if (primeiro.includes('insemin') || primeiro.includes('iai')) tipoOcorrencia = 'inseminacao'
            else if (primeiro.includes('exame')) tipoOcorrencia = 'exame'
          }
          const descricao = observacoes || (servicosList.length > 0 ? `Serviço: ${servicosList.join(', ')}` : 'Ocorrência registrada')
          const historiaResult = await client.query(`
            INSERT INTO historia_ocorrencias (animal_id, tipo, data, descricao, observacoes, peso, medicamento, responsavel)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          `, [
            animalId,
            tipoOcorrencia,
            dataServico || new Date().toISOString().split('T')[0],
            descricao,
            observacoes,
            peso ? parseFloat(peso) : null,
            servicosList.length > 0 ? servicosList.join(', ') : null,
            'Sistema'
          ])
          ocorrenciaId = historiaResult.rows[0].id
        }

        if (animalId) {
          await client.query(`
            UPDATE animais SET 
              serie = COALESCE($2, serie), rg = COALESCE($3, rg), sexo = COALESCE($4, sexo),
              data_nascimento = COALESCE($5, data_nascimento), peso = COALESCE($6, peso),
              pai = COALESCE($7, pai), mae = COALESCE($8, mae), receptora = COALESCE($9, receptora),
              updated_at = NOW()
            WHERE id = $1
          `, [animalId, serie, rg, sexo, nascimento, peso, paiNomeRg, maeBiologiaRg, receptora])
        }

        await client.query('COMMIT')

        res.status(201).json({
          message: 'Ocorrência registrada com sucesso',
          ocorrenciaId
        })

      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }

    } catch (error) {
      console.error('Erro ao registrar ocorrência:', error)
      res.status(500).json({
        message: 'Erro interno do servidor',
        error: error.message
      })
    }
  } else if (req.method === 'GET') {
    try {
      const { animalId, startDate, endDate, limit = 50, offset = 0 } = req.query;

      let ocorrencias = []
      let total = 0

      // Verificar qual tabela usar (ocorrencias_animais pode não existir)
      const checkTbl = await dbQuery(`
        SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ocorrencias_animais') as existe
      `)
      let usaOcorrenciasAnimais = checkTbl.rows[0]?.existe === true

      if (usaOcorrenciasAnimais) {
        try {
          let listSql = `
            SELECT o.*, a.serie as animal_serie, a.rg as animal_rg,
                   ARRAY_AGG(os.servico_tipo) FILTER (WHERE os.servico_tipo IS NOT NULL) as servicos_aplicados
            FROM ocorrencias_animais o
            LEFT JOIN animais a ON o.animal_id = a.id
            LEFT JOIN ocorrencias_servicos os ON o.id = os.ocorrencia_id
            WHERE 1=1
          `
          const params = []
          let paramCount = 0
          if (animalId) { paramCount++; listSql += ` AND o.animal_id = $${paramCount}`; params.push(animalId); }
          if (startDate) { paramCount++; listSql += ` AND o.data_registro >= $${paramCount}`; params.push(startDate); }
          if (endDate) { paramCount++; listSql += ` AND o.data_registro <= $${paramCount}`; params.push(endDate); }
          listSql += ` GROUP BY o.id, a.serie, a.rg ORDER BY o.data_registro DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
          params.push(limit, offset)
          const result = await dbQuery(listSql, params)
          ocorrencias = result.rows || []
          let countSql = `SELECT COUNT(DISTINCT o.id) as total FROM ocorrencias_animais o WHERE 1=1`
          const countParams = []
          let cp = 0
          if (animalId) { cp++; countSql += ` AND o.animal_id = $${cp}`; countParams.push(animalId); }
          if (startDate) { cp++; countSql += ` AND o.data_registro >= $${cp}`; countParams.push(startDate); }
          if (endDate) { cp++; countSql += ` AND o.data_registro <= $${cp}`; countParams.push(endDate); }
          const countResult = await dbQuery(countSql, countParams)
          total = parseInt(countResult.rows[0]?.total || 0)
        } catch (e) {
          usaOcorrenciasAnimais = false
        }
      }

      if (!usaOcorrenciasAnimais || ocorrencias.length === 0) {
        const histParams = []
        let hp = 0
        let histQuery = `
          SELECT h.id, h.animal_id, h.tipo, h.data as data_registro, h.descricao, h.observacoes, h.peso, h.local,
                 h.medicamento, h.dosagem, h.veterinario, a.serie as animal_serie, a.rg as animal_rg,
                 ARRAY[]::text[] as servicos_aplicados
          FROM historia_ocorrencias h
          LEFT JOIN animais a ON h.animal_id = a.id
          WHERE 1=1
        `
        if (animalId) { hp++; histQuery += ` AND h.animal_id = $${hp}`; histParams.push(animalId); }
        if (startDate) { hp++; histQuery += ` AND h.data >= $${hp}`; histParams.push(startDate); }
        if (endDate) { hp++; histQuery += ` AND h.data <= $${hp}`; histParams.push(endDate); }
        histQuery += ` ORDER BY h.data DESC NULLS LAST, h.id DESC LIMIT $${hp + 1} OFFSET $${hp + 2}`
        histParams.push(parseInt(limit), parseInt(offset))
        const histResult = await dbQuery(histQuery, histParams)
        ocorrencias = histResult.rows || []
        let countHistQuery = 'SELECT COUNT(*) as total FROM historia_ocorrencias h WHERE 1=1'
        const countHistParams = []
        let chp = 0
        if (animalId) { chp++; countHistQuery += ` AND h.animal_id = $${chp}`; countHistParams.push(animalId); }
        if (startDate) { chp++; countHistQuery += ` AND h.data >= $${chp}`; countHistParams.push(startDate); }
        if (endDate) { chp++; countHistQuery += ` AND h.data <= $${chp}`; countHistParams.push(endDate); }
        const countHist = await dbQuery(countHistQuery, countHistParams)
        total = parseInt(countHist.rows[0]?.total || 0)
      }

      res.status(200).json({
        ocorrencias,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      console.error('Erro ao buscar ocorrências:', error);
      res.status(500).json({
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: 'Método não permitido' });
  }
}