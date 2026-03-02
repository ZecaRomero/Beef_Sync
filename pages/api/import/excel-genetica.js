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
  
  let s = '';
  if (typeof val === 'object') {
    if (val.richText) {
      s = val.richText.map(t => t.text).join('');
    } else if (val.text) {
      s = val.text;
    } else if (val.result !== undefined) {
      s = String(val.result);
    } else {
      s = String(val);
    }
  } else {
    s = String(val);
  }
  
  s = s.trim();
  if (!s) return null;
  const num = parseFloat(s.replace(',', '.').replace(/\s/g, ''));
  return isNaN(num) ? null : s.replace(',', '.');
}

/**
 * Normaliza texto (Série, RG, Deca)
 */
function normalizarTexto(val) {
  if (val === null || val === undefined) return '';
  
  if (typeof val === 'object') {
    if (val.richText) {
      return val.richText.map(t => t.text).join('').trim();
    }
    if (val.text) {
      return val.text.trim();
    }
    if (val.result !== undefined) {
      return String(val.result).trim();
    }
  }
  
  return String(val).trim();
}

/**
 * Normaliza RG: remove zeros à esquerda quando for numérico (ex: 017328 -> 17328)
 * para garantir matching com o banco
 */
function normalizarRG(val) {
  const s = normalizarTexto(val);
  if (!s) return '';
  return /^\d+$/.test(s) ? String(parseInt(s, 10)) : s;
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
    // Formato Série|RG|IQG|Pt IQG (4 colunas) - col 3 e 4 vão para genetica_2 e decile_2
    const cellD1 = (primeiraLinha.getCell(4).value ?? '').toString().toUpperCase();
    const formatoIQG = (cellC1.includes('IQG') || cellD1.includes('PT') || cellD1.includes('IQG')) &&
      !cellC1.includes('IABCZ') && !cellC1.includes('DECA');

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
      } else if (formatoIQG) {
        genetica2 = normalizarNumero(row.getCell(3).value) || normalizarTexto(row.getCell(3).value) || null;
        decile2 = normalizarTexto(row.getCell(4).value) || null;
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

  // Normalizar e filtrar linhas (RG sem zeros à esquerda para matching)
  const dados = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    let serie = normalizarTexto(r.serie || r.Série || r.SERIE);
    let rg = normalizarRG(r.rg || r.RG || r.RGN);
    
    // Se RG contém hífen, pode estar no formato "CJCJ-16310" (série-rg junto)
    if (rg && rg.includes('-')) {
      const partes = rg.split('-');
      if (partes.length === 2) {
        // Se série está vazia, usar a primeira parte como série
        if (!serie) {
          serie = partes[0].trim();
        }
        rg = normalizarRG(partes[1]);
      }
    }
    
    if (!serie && !rg) continue;
    dados.push({
      linha: i + 1,
      serie,
      rg,
      abczg: normalizarNumero(r.iABCZ ?? r.iabcz ?? r.abczg) != null ? String(normalizarNumero(r.iABCZ ?? r.iabcz ?? r.abczg)) : null,
      deca: normalizarTexto(r.deca ?? r.Deca ?? r.DECA) || null,
      situacaoAbcz: normalizarTexto(r.situacaoAbcz ?? r.situacao_abcz ?? r['Situação ABCZ'] ?? r.Status) || null,
      genetica2: normalizarNumero(r.genetica_2 ?? r.genetica2 ?? r['IQG'] ?? r['Genética 2']) != null ? String(normalizarNumero(r.genetica_2 ?? r.genetica2 ?? r['IQG'] ?? r['Genética 2'])) : null,
      decile2: normalizarTexto(r.decile_2 ?? r.decile2 ?? r['Pt IQG']) || null,
    });
  }

  if (dados.length === 0) return resultados;

  // Buscar animais em lotes (evita query muito grande) - RG normalizado no banco (sem zeros à esquerda)
  const mapaAnimais = new Map();
  const BATCH_SELECT = 500;

  for (let b = 0; b < dados.length; b += BATCH_SELECT) {
    const batch = dados.slice(b, b + BATCH_SELECT);
    const pares = batch.map(d => [d.serie, d.rg]);
    const flatParams = pares.flat();

    // 1) Busca por serie + rg (RG normalizado: sem zeros à esquerda no banco)
    const animaisRes = await query(
      `SELECT id, serie, rg, situacao FROM animais a
       WHERE (UPPER(COALESCE(TRIM(a.serie), '')), COALESCE(NULLIF(REGEXP_REPLACE(TRIM(a.rg::text), '^0+', ''), ''), '0')) IN (
         ${pares.map((_, i) => `(UPPER($${i * 2 + 1}), $${i * 2 + 2})`).join(', ')}
       )`,
      flatParams
    );

    for (const a of animaisRes.rows) {
      const rgNorm = /^\d+$/.test(String(a.rg || '').trim()) ? String(parseInt(String(a.rg).trim(), 10)) : String(a.rg || '').trim();
      const key = `${(a.serie || '').toUpperCase().trim()}|${rgNorm}`;
      mapaAnimais.set(key, a);
    }

    // 2) Fallback: buscar por tatuagem (serie-rg, serie+rg) para os que não foram encontrados
    const naoEncontradosNoBatch = batch.filter(d => !mapaAnimais.has(`${(d.serie || '').toUpperCase().trim()}|${d.rg}`));
    const tatuagens = [...new Set(naoEncontradosNoBatch.flatMap(d => [
      `${(d.serie || '').trim()}-${d.rg}`.replace(/\s/g, '').toUpperCase(),
      `${(d.serie || '').trim()}${d.rg}`.replace(/\s/g, '').toUpperCase()
    ]).filter(Boolean))];
    if (tatuagens.length > 0) {
      try {
        const tatRes = await query(
          `SELECT id, serie, rg, situacao, tatuagem FROM animais a
           WHERE TRIM(COALESCE(a.tatuagem, '')) != ''
             AND REPLACE(UPPER(TRIM(a.tatuagem)), ' ', '') IN (SELECT unnest($1::text[]))`,
          [tatuagens]
        );
        for (const d of naoEncontradosNoBatch) {
          const key = `${(d.serie || '').toUpperCase().trim()}|${d.rg}`;
          const dTat = `${(d.serie || '').trim()}${d.rg}`.replace(/\s/g, '').toUpperCase();
          const dTat2 = `${(d.serie || '').trim()}-${d.rg}`.replace(/\s/g, '').toUpperCase();
          const animal = tatRes.rows.find(a => {
            const tat = (a.tatuagem || '').replace(/\s/g, '').toUpperCase();
            return tat === dTat || tat === dTat2;
          });
          if (animal) mapaAnimais.set(key, animal);
        }
      } catch (_) {}
    }
  }

  // Atualizar em lotes (1 UPDATE por lote em vez de 1 por linha)
  const BATCH = 50;
  let temColGenetica2 = true;

  for (let b = 0; b < dados.length; b += BATCH) {
    const batch = dados.slice(b, b + BATCH);
    const updates = [];

    for (const d of batch) {
      const key = `${(d.serie || '').toUpperCase().trim()}|${d.rg}`;
      const animal = mapaAnimais.get(key);
      if (!animal) {
        resultados.naoEncontrados.push({ linha: d.linha, serie: d.serie, rg: d.rg });
        continue;
      }
      if (String(animal.situacao || '').trim() === 'Inativo') {
        resultados.ignoradosInativos.push({ linha: d.linha, serie: d.serie, rg: d.rg });
        continue;
      }
      updates.push({
        id: animal.id,
        serie: d.serie,
        rg: d.rg,
        abczg: d.abczg,
        deca: d.deca,
        situacaoAbcz: d.situacaoAbcz,
        genetica2: d.genetica2,
        decile2: d.decile2,
      });
    }

    if (updates.length === 0) continue;

    const runBatchUpdate = async (comGenetica2) => {
      const cols = comGenetica2
        ? 'abczg, deca, situacao_abcz, genetica_2, decile_2'
        : 'abczg, deca, situacao_abcz';
      const nCols = comGenetica2 ? 6 : 4;
      const vals = updates.map((u, i) => {
        const off = i * nCols;
        const params = comGenetica2
          ? `($${off + 1}::int, $${off + 2}, $${off + 3}, $${off + 4}, $${off + 5}, $${off + 6})`
          : `($${off + 1}::int, $${off + 2}, $${off + 3}, $${off + 4})`;
        return params;
      }).join(', ');
      const flat = updates.flatMap(u =>
        comGenetica2 ? [u.id, u.abczg, u.deca, u.situacaoAbcz, u.genetica2, u.decile2] : [u.id, u.abczg, u.deca, u.situacaoAbcz]
      );
      const setClause = comGenetica2
        ? 'a.abczg = COALESCE(v.abczg, a.abczg), a.deca = COALESCE(v.deca, a.deca), a.situacao_abcz = COALESCE(v.situacao_abcz, a.situacao_abcz), a.genetica_2 = COALESCE(v.genetica_2, a.genetica_2), a.decile_2 = COALESCE(v.decile_2, a.decile_2)'
        : 'a.abczg = COALESCE(v.abczg, a.abczg), a.deca = COALESCE(v.deca, a.deca), a.situacao_abcz = COALESCE(v.situacao_abcz, a.situacao_abcz)';
      const vCols = comGenetica2 ? 'id, abczg, deca, situacao_abcz, genetica_2, decile_2' : 'id, abczg, deca, situacao_abcz';
      await query(
        `UPDATE animais a SET ${setClause}, a.updated_at = CURRENT_TIMESTAMP
         FROM (VALUES ${vals}) AS v(${vCols}) WHERE a.id = v.id`,
        flat
      );
    };

    try {
      if (temColGenetica2) {
        await runBatchUpdate(true);
        resultados.animaisAtualizados += updates.length;
      } else {
        await runBatchUpdate(false);
        resultados.animaisAtualizados += updates.length;
      }
    } catch (colErr) {
      if (/column.*does not exist/i.test(colErr?.message || '')) {
        temColGenetica2 = false;
        try {
          await runBatchUpdate(false);
          resultados.animaisAtualizados += updates.length;
        } catch (e) {
          for (const u of updates) {
            resultados.erros.push({ linha: 0, serie: u.serie, rg: u.rg, erro: e.message });
          }
        }
      } else {
        for (const u of updates) {
          resultados.erros.push({ linha: 0, serie: u.serie, rg: u.rg, erro: colErr.message });
        }
      }
    }
  }

  return resultados;
}
