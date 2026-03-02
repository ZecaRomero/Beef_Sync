import { query } from '../../../lib/database';
import formidable from 'formidable';
import ExcelJS from 'exceljs';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Normaliza valor numérico (iABCZ pode vir com vírgula: 47,71)
 */
function normalizarNumero(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s) return null;
  const num = parseFloat(s.replace(',', '.').replace(/\s/g, ''));
  return isNaN(num) ? null : s.replace(',', '.');
}

/**
 * Normaliza texto (Série, RG, Deca)
 */
function normalizarTexto(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Importa Série, RG, iABCZ, Deca de animais.
 * Formato esperado: Série (A) | RG (B) | iABCZ (C) | Deca (D)
 * Aceita Excel (.xlsx, .xls) ou JSON no body (para colar texto).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const contentType = req.headers['content-type'] || '';

    // Se for JSON (colar texto / dados diretos)
    if (contentType.includes('application/json')) {
      const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => { data += chunk; });
        req.on('end', () => {
          try {
            resolve(JSON.parse(data || '{}'));
          } catch (e) {
            reject(e);
          }
        });
        req.on('error', reject);
      });

      const { data: rows = [] } = body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({
          error: 'Envie um array "data" com objetos { serie, rg, iABCZ, deca, situacaoAbcz? }',
        });
      }

      const resultados = await processarLinhas(rows);
      return res.status(200).json({
        success: true,
        message: `Importação concluída: ${resultados.animaisAtualizados} animais atualizados`,
        resultados,
      });
    }

    // Se for multipart (arquivo Excel)
    const form = formidable({ multiples: false });
    const [err, fields, files] = await new Promise((resolve) => {
      form.parse(req, (e, f, fi) => resolve([e, f, fi]));
    });

    if (err) {
      console.error('Erro ao fazer parse do formulário:', err);
      return res.status(500).json({ error: 'Erro ao processar arquivo', details: String(err?.message || err) });
    }

    const file = Array.isArray(files?.file) ? files.file[0] : files?.file;
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const filepath = file.filepath || file.path;
    if (!filepath) {
      return res.status(400).json({ error: 'Arquivo inválido' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filepath);

    const worksheet = workbook.worksheets[0];
    if (!worksheet || !worksheet.rowCount) {
      try { fs.unlinkSync(filepath); } catch (e) { /* ignorar */ }
      return res.status(400).json({ error: 'Planilha vazia ou sem dados' });
    }

    let startRow = 1;
    const primeiraLinha = worksheet.getRow(1);
    const cellA1 = (primeiraLinha.getCell(1).value ?? '').toString().toUpperCase();
    const cellB1 = (primeiraLinha.getCell(2).value ?? '').toString().toUpperCase();
    const cellC1 = (primeiraLinha.getCell(3).value ?? '').toString().toUpperCase();
    if (cellA1.includes('SÉRIE') || cellA1.includes('SERIE') || cellA1.includes('SERIE') || cellB1.includes('RG') || cellB1.includes('RGN')) {
      startRow = 2;
    }

    // Formato Série|RGN|Status (3 colunas) - ex: SERIE, RGN, Status
    const formatoStatusAbcz = cellC1.includes('STATUS');

    const rows = [];
    for (let i = startRow; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const serie = normalizarTexto(row.getCell(1).value);
      const rg = normalizarTexto(row.getCell(2).value);
      if (!serie && !rg) continue;

      let iABCZ = null;
      let deca = null;
      let situacaoAbcz = null;

      let genetica2 = null;
      let decile2 = null;

      if (formatoStatusAbcz) {
        situacaoAbcz = normalizarTexto(row.getCell(3).value) || null;
      } else {
        iABCZ = normalizarNumero(row.getCell(3).value);
        deca = normalizarTexto(row.getCell(4).value);
        situacaoAbcz = normalizarTexto(row.getCell(5).value) || null;
        genetica2 = normalizarNumero(row.getCell(6).value) || normalizarTexto(row.getCell(6).value) || null;
        decile2 = normalizarTexto(row.getCell(7).value) || null;
      }

      rows.push({ serie, rg, iABCZ, deca, situacaoAbcz, genetica_2: genetica2, decile_2: decile2 });
    }

    try { fs.unlinkSync(filepath); } catch (e) { /* ignorar */ }

    const resultados = await processarLinhas(rows);
    return res.status(200).json({
      success: true,
      message: `Importação concluída: ${resultados.animaisAtualizados} animais atualizados`,
      resultados,
    });
  } catch (error) {
    console.error('❌ Erro ao importar genética:', error);
    return res.status(500).json({
      error: 'Erro ao processar importação',
      details: String(error?.message || error),
    });
  }
}

async function processarLinhas(rows) {
  const resultados = {
    animaisAtualizados: 0,
    naoEncontrados: [],
    ignoradosInativos: [],
    erros: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const serie = normalizarTexto(r.serie || r.Série || r.SERIE);
    const rg = normalizarTexto(r.rg || r.RG || r.RGN);
    const iABCZ = normalizarNumero(r.iABCZ ?? r.iabcz ?? r.abczg);
    const deca = normalizarTexto(r.deca ?? r.Deca ?? r.DECA);
    const situacaoAbcz = normalizarTexto(r.situacaoAbcz ?? r.situacao_abcz ?? r['Situação ABCZ'] ?? r.Status) || null;
    const genetica2 = normalizarNumero(r.genetica_2 ?? r.genetica2 ?? r['Avaliação 2'] ?? r['Genética 2']) ?? normalizarTexto(r.genetica_2 ?? r.genetica2);
    const decile2 = normalizarTexto(r.decile_2 ?? r.decile2 ?? r['Decile 2']) || null;

    if (!serie && !rg) continue;

    try {
      const animalResult = await query(
        'SELECT id, serie, rg, situacao FROM animais WHERE UPPER(COALESCE(TRIM(serie), \'\')) = UPPER($1) AND TRIM(rg::text) = $2',
        [serie, String(rg)]
      );

      if (animalResult.rows.length === 0) {
        resultados.naoEncontrados.push({ linha: i + 1, serie, rg });
        continue;
      }

      const animal = animalResult.rows[0];
      if (String(animal.situacao || '').trim() === 'Inativo') {
        resultados.ignoradosInativos.push({ linha: i + 1, serie, rg });
        continue;
      }
      const abczgVal = iABCZ != null ? String(iABCZ) : null;
      const decaVal = deca || null;
      const genetica2Val = genetica2 != null ? String(genetica2) : null;
      const decile2Val = decile2 || null;

      try {
        await query(
          `UPDATE animais 
           SET abczg = COALESCE($1, abczg), 
               deca = COALESCE($2, deca),
               situacao_abcz = COALESCE($3, situacao_abcz),
               genetica_2 = COALESCE($4, genetica_2),
               decile_2 = COALESCE($5, decile_2),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $6`,
          [abczgVal, decaVal, situacaoAbcz, genetica2Val, decile2Val, animal.id]
        );
      } catch (colErr) {
        if (/column.*does not exist/i.test(colErr?.message || '')) {
          await query(
            `UPDATE animais 
             SET abczg = COALESCE($1, abczg), 
                 deca = COALESCE($2, deca),
                 situacao_abcz = COALESCE($3, situacao_abcz),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [abczgVal, decaVal, situacaoAbcz, animal.id]
          );
          if (genetica2Val != null || decile2Val != null) {
            try {
              await query(
                `UPDATE animais SET genetica_2 = COALESCE($1, genetica_2), decile_2 = COALESCE($2, decile_2), updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
                [genetica2Val, decile2Val, animal.id]
              );
            } catch (_) {}
          }
        } else throw colErr;
      }

      resultados.animaisAtualizados++;
    } catch (rowError) {
      console.error(`Erro linha ${i + 1}:`, rowError);
      resultados.erros.push({
        linha: i + 1,
        serie,
        rg,
        erro: rowError.message,
      });
    }
  }

  return resultados;
}
