import { Pool } from 'pg';

// Carregar variáveis de ambiente
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'beef_sync',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: parseInt(process.env.DB_PORT) || 5432,
});

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

        // Inserir a ocorrência
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
        `;

        const ocorrenciaResult = await client.query(ocorrenciaQuery, [
          animalId, nome, serie, rg, sexo, nascimento, meses,
          dataUltimoPeso, peso, paiNomeRg, avoMaterno, maeBiologiaRg,
          receptora, iabcz, deca, mgq, top, mgta, topPrograma,
          dataServico, observacoes, ativos, vendidos, baixados
        ]);

        const ocorrenciaId = ocorrenciaResult.rows[0].id;

        // Inserir os serviços selecionados
        const servicosAtivos = Object.entries(servicos)
          .filter(([key, value]) => value)
          .map(([key]) => key);

        if (servicosAtivos.length > 0) {
          const servicoQuery = `
            INSERT INTO ocorrencias_servicos (ocorrencia_id, servico_tipo)
            VALUES ($1, $2)
          `;

          for (const servico of servicosAtivos) {
            await client.query(servicoQuery, [ocorrenciaId, servico]);
          }
        }

        // Atualizar dados do animal se necessário
        if (animalId) {
          const updateAnimalQuery = `
            UPDATE animais SET 
              serie = COALESCE($2, serie),
              rg = COALESCE($3, rg),
              sexo = COALESCE($4, sexo),
              data_nascimento = COALESCE($5, data_nascimento),
              peso = COALESCE($6, peso),
              pai = COALESCE($7, pai),
              mae = COALESCE($8, mae),
              receptora = COALESCE($9, receptora),
              updated_at = NOW()
            WHERE id = $1
          `;

          await client.query(updateAnimalQuery, [
            animalId, serie, rg, sexo, nascimento, peso,
            paiNomeRg, maeBiologiaRg, receptora
          ]);
        }

        // SINCRONIZAR: Salvar também na tabela historia_ocorrencias para aparecer no histórico
        // Verificar se já existe a tabela historia_ocorrencias
        const checkTableQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'historia_ocorrencias'
          )
        `;
        const tableExists = await client.query(checkTableQuery);
        
        if (tableExists.rows[0].exists && animalId) {
          try {
            // Determinar o tipo de ocorrência baseado nos serviços aplicados
            let tipoOcorrencia = 'outros';
            const servicosAplicados = Object.entries(servicos)
              .filter(([key, value]) => value && value.ativo)
              .map(([key, value]) => value.tipo || key);

            // Mapear serviços para tipos de ocorrência
            if (servicosAplicados.length > 0) {
              const primeiroServico = servicosAplicados[0].toLowerCase();
              if (primeiroServico.includes('pesagem')) tipoOcorrencia = 'pesagem';
              else if (primeiroServico.includes('parto')) tipoOcorrencia = 'parto';
              else if (primeiroServico.includes('vacin') || primeiroServico.includes('vacina')) tipoOcorrencia = 'vacinacao';
              else if (primeiroServico.includes('medic') || primeiroServico.includes('tratamento')) tipoOcorrencia = 'medicacao';
              else if (primeiroServico.includes('venda')) tipoOcorrencia = 'venda';
              else if (primeiroServico.includes('leilao')) tipoOcorrencia = 'leilao';
              else if (primeiroServico.includes('insemin') || primeiroServico.includes('iai')) tipoOcorrencia = 'inseminacao';
              else if (primeiroServico.includes('exame')) tipoOcorrencia = 'exame';
            }

            // Construir descrição da ocorrência
            const descricaoOcorrencia = observacoes || `Serviço aplicado: ${servicosAplicados.join(', ')}`;

            // Inserir na tabela historia_ocorrencias
            const historiaQuery = `
              INSERT INTO historia_ocorrencias (
                animal_id, tipo, data, descricao, observacoes, peso, 
                valor, veterinario, medicamento, dosagem, responsavel
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;

            await client.query(historiaQuery, [
              animalId,
              tipoOcorrencia,
              dataServico || new Date().toISOString().split('T')[0],
              descricaoOcorrencia,
              observacoes,
              peso ? parseFloat(peso) : null,
              null, // valor - pode ser extraído dos serviços se necessário
              null, // veterinario
              servicosAplicados.length > 0 ? servicosAplicados.join(', ') : null,
              null, // dosagem
              'Sistema' // responsavel
            ]);
          } catch (historiaError) {
            console.error('Erro ao sincronizar com historia_ocorrencias:', historiaError);
            // Não bloquear o commit se houver erro na sincronização
          }
        }

        await client.query('COMMIT');

        res.status(201).json({
          message: 'Ocorrência registrada com sucesso',
          ocorrenciaId: ocorrenciaId
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Erro ao registrar ocorrência:', error);
      res.status(500).json({
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  } else if (req.method === 'GET') {
    try {
      const { animalId, startDate, endDate, limit = 50, offset = 0 } = req.query;

      let ocorrencias = []
      let total = 0

      try {
        let query = `
          SELECT 
            o.*,
            a.serie as animal_serie,
            a.rg as animal_rg,
            ARRAY_AGG(os.servico_tipo) FILTER (WHERE os.servico_tipo IS NOT NULL) as servicos_aplicados
          FROM ocorrencias_animais o
          LEFT JOIN animais a ON o.animal_id = a.id
          LEFT JOIN ocorrencias_servicos os ON o.id = os.ocorrencia_id
          WHERE 1=1
        `;
        const params = []
        let paramCount = 0
        if (animalId) { paramCount++; query += ` AND o.animal_id = $${paramCount}`; params.push(animalId); }
        if (startDate) { paramCount++; query += ` AND o.data_registro >= $${paramCount}`; params.push(startDate); }
        if (endDate) { paramCount++; query += ` AND o.data_registro <= $${paramCount}`; params.push(endDate); }
        query += ` GROUP BY o.id, a.serie, a.rg ORDER BY o.data_registro DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
        params.push(limit, offset)
        const result = await pool.query(query, params)
        ocorrencias = result.rows || []
        let countQuery = `SELECT COUNT(DISTINCT o.id) as total FROM ocorrencias_animais o WHERE 1=1`
        const countParams = []
        let cp = 0
        if (animalId) { cp++; countQuery += ` AND o.animal_id = $${cp}`; countParams.push(animalId); }
        if (startDate) { cp++; countQuery += ` AND o.data_registro >= $${cp}`; countParams.push(startDate); }
        if (endDate) { cp++; countQuery += ` AND o.data_registro <= $${cp}`; countParams.push(endDate); }
        const countResult = await pool.query(countQuery, countParams)
        total = parseInt(countResult.rows[0]?.total || 0)
      } catch (tblErr) {
        console.warn('ocorrencias_animais não disponível, usando historia_ocorrencias:', tblErr.message)
      }

      if (ocorrencias.length === 0 && animalId) {
        const histQuery = `
          SELECT h.id, h.animal_id, h.tipo, h.data as data_registro, h.descricao, h.observacoes, h.peso, h.local,
                 h.medicamento, h.dosagem, h.veterinario, a.serie as animal_serie, a.rg as animal_rg,
                 ARRAY[]::text[] as servicos_aplicados
          FROM historia_ocorrencias h
          LEFT JOIN animais a ON h.animal_id = a.id
          WHERE h.animal_id = $1
          ORDER BY h.data DESC, h.created_at DESC
          LIMIT $2 OFFSET $3
        `
        const histResult = await pool.query(histQuery, [animalId, parseInt(limit), parseInt(offset)])
        ocorrencias = histResult.rows || []
        const countHist = await pool.query(
          'SELECT COUNT(*) as total FROM historia_ocorrencias WHERE animal_id = $1',
          [animalId]
        )
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