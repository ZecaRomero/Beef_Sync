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

      const { data: rows = [], criarNaoEncontrados = false, limparForaDaLista = false } = body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({
          error: 'Envie um array "data" com objetos { serie, rg, iABCZ, deca, situacaoAbcz? }',
        });
      }

      const resultados = await processarLinhas(rows, criarNaoEncontrados, limparForaDaLista);
      let msg = `Importação concluída: ${resultados.animaisAtualizados} animais atualizados`;
      if (resultados.animaisLimpos > 0) msg += `, ${resultados.animaisLimpos} limpos (fora da planilha)`;
      return res.status(200).json({
        success: true,
        message: msg,
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
    const cellD1 = (primeiraLinha.getCell(4).value ?? '').toString().toUpperCase();
    const cellE1 = (primeiraLinha.getCell(5).value ?? '').toString().toUpperCase();
    const cellF1 = (primeiraLinha.getCell(6).value ?? '').toString().toUpperCase();
    const cellG1 = (primeiraLinha.getCell(7).value ?? '').toString().toUpperCase();
    // Formato completo 6 colunas: SÉRIE | RG | iABCZg | DECA | IQG | Pt IQG
    const formatoCompleto6Cols = cellC1.includes('IABCZ') && cellD1.includes('DECA') &&
      (cellE1.includes('IQG') || cellE1.includes('IQGG')) &&
      (cellF1.includes('PT') || cellF1.includes('PL') || cellF1.includes('IQG'));
    // Formato 7 colunas: Série | RG | iABCZg | DECA | IQG | Pt IQG | Situação ABCZ
    const formatoCompleto7Cols = formatoCompleto6Cols && (cellG1.includes('SITUAÇÃO') || cellG1.includes('SITUACAO') || cellG1.includes('STATUS'));
    const row1 = worksheet.getRow(startRow);
    const valC1 = row1.getCell(3).value;
    const valD1 = row1.getCell(4).value;
    const valE1 = row1.getCell(5).value;
    const valF1 = row1.getCell(6).value;
    const col3Num = valC1 != null && !isNaN(parseFloat(String(valC1).replace(',', '.')));
    const col4Num = valD1 != null && (/^[\d,.\s]+$/.test(String(valD1)) || String(valD1).length <= 3);
    const col5Num = valE1 != null && !isNaN(parseFloat(String(valE1).replace(',', '.')));
    const col6Num = valF1 != null && !isNaN(parseFloat(String(valF1).replace(',', '.')));
    const formatoCompleto6ColsPelosDados = startRow === 1 && col3Num && col4Num && col5Num && col6Num;
    // Formato Série|RG|IQG/IQGg|Pt (4 colunas) - col 3 e 4 vão para IQG e Pt IQG (não iABCZ/DECA)
    const formatoIQGPeloHeader = (cellC1.includes('IQG') || cellC1.includes('IQGG') || cellD1.includes('PT') || cellD1.includes('PL') || cellD1.includes('IQG')) &&
      !cellC1.includes('IABCZ') && !cellC1.includes('DECA');
    const formatoIQGPelosDados = startRow === 1 && col3Num && col4Num;
    const formatoIQG = formatoIQGPeloHeader || formatoIQGPelosDados;

    const rows = [];
    for (let i = startRow; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const serie = normalizarTexto(row.getCell(1).value);
      const rg = normalizarRG(row.getCell(2).value); // RG normalizado (sem zeros à esquerda) para matching
      if (!serie && !rg) continue;

      let iABCZ = null;
      let deca = null;
      let situacaoAbcz = null;

      let genetica2 = null;
      let decile2 = null;

      if (formatoStatusAbcz) {
        situacaoAbcz = normalizarTexto(row.getCell(3).value) || null;
      } else if (formatoCompleto6Cols || formatoCompleto7Cols || formatoCompleto6ColsPelosDados) {
        // Série, RG, iABCZg, DECA, IQG, Pt IQG (6 cols) + opcional Situação ABCZ (7ª col)
        iABCZ = normalizarNumero(row.getCell(3).value);
        deca = normalizarTexto(row.getCell(4).value);
        genetica2 = normalizarNumero(row.getCell(5).value) || normalizarTexto(row.getCell(5).value) || null;
        decile2 = normalizarTexto(row.getCell(6).value) || null;
        situacaoAbcz = normalizarTexto(row.getCell(7).value) || null;
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

      rows.push({ serie, rg, iABCZ, deca, situacaoAbcz, iqg: genetica2, pt_iqg: decile2 });
    }

    try { fs.unlinkSync(filepath); } catch (e) { /* ignorar */ }

    // Formidable v3: fields pode ser objeto ou Map; valor pode ser string ou array
    const raw = typeof fields?.get === 'function' ? fields.get('criarNaoEncontrados') : fields?.criarNaoEncontrados;
    const val = Array.isArray(raw) ? raw[0] : raw;
    const criarNaoEncontrados = !!(val === 'true' || val === true);
    const rawLimpar = typeof fields?.get === 'function' ? fields.get('limparForaDaLista') : fields?.limparForaDaLista;
    const valLimpar = Array.isArray(rawLimpar) ? rawLimpar[0] : rawLimpar;
    const limparForaDaLista = !!(valLimpar === 'true' || valLimpar === true);
    const resultados = await processarLinhas(rows, criarNaoEncontrados, limparForaDaLista);
    let msg = `Importação concluída: ${resultados.animaisAtualizados} animais atualizados`;
    if (resultados.animaisLimpos > 0) msg += `, ${resultados.animaisLimpos} limpos (fora da planilha)`;
    return res.status(200).json({
      success: true,
      message: msg,
      resultados,
    });
  } catch (error) {
    console.error('❌ Erro ao importar genética:', error);
    let details = error?.message || String(error);
    if (error?.name === 'AggregateError' && Array.isArray(error?.errors) && error.errors.length > 0) {
      details = error.errors.map(e => e?.message || String(e)).join('; ') || details;
    }
    return res.status(500).json({
      error: 'Erro ao processar importação',
      details,
    });
  }
}

/** Tenta INSERT com iqg/pt_iqg; se coluna não existir, usa genetica_2/decile_2 */
async function insertOuUpdateAnimal(nome, serie, rg, tatuagem, abczg, deca, situacaoAbcz, genetica2, decile2) {
  const params = [nome, serie, rg, tatuagem, abczg, deca, situacaoAbcz, genetica2, decile2];
  try {
    return await query(
      `INSERT INTO animais (nome, serie, rg, tatuagem, sexo, raca, situacao, abczg, deca, situacao_abcz, iqg, pt_iqg)
       VALUES ($1, $2, $3, $4, 'Não informado', 'Não informada', 'Ativo', $5, $6, $7, NULLIF(TRIM(REPLACE($8::text, ',', '.')), '')::numeric, NULLIF(TRIM(REPLACE($9::text, ',', '.')), '')::numeric)
       ON CONFLICT (serie, rg) DO UPDATE SET
         iqg = COALESCE(NULLIF(TRIM(REPLACE(EXCLUDED.iqg::text, ',', '.')), '')::numeric, animais.iqg),
         pt_iqg = COALESCE(NULLIF(TRIM(REPLACE(EXCLUDED.pt_iqg::text, ',', '.')), '')::numeric, animais.pt_iqg),
         abczg = CASE WHEN EXCLUDED.abczg IS NOT NULL AND TRIM(EXCLUDED.abczg::text) != '' THEN EXCLUDED.abczg::text ELSE NULL END,
         deca = CASE WHEN EXCLUDED.deca IS NOT NULL AND TRIM(EXCLUDED.deca::text) != '' THEN EXCLUDED.deca::text ELSE NULL END,
         situacao_abcz = COALESCE(EXCLUDED.situacao_abcz::text, animais.situacao_abcz::text),
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, serie, rg, situacao`,
      params
    );
  } catch (e) {
    if (/column.*does not exist/i.test(e?.message || '')) {
      return await query(
        `INSERT INTO animais (nome, serie, rg, tatuagem, sexo, raca, situacao, abczg, deca, situacao_abcz, genetica_2, decile_2)
         VALUES ($1, $2, $3, $4, 'Não informado', 'Não informada', 'Ativo', $5, $6, $7, NULLIF(TRIM(REPLACE($8::text, ',', '.')), '')::numeric, $9::text)
         ON CONFLICT (serie, rg) DO UPDATE SET
           genetica_2 = COALESCE(NULLIF(TRIM(REPLACE(EXCLUDED.genetica_2::text, ',', '.')), '')::numeric, animais.genetica_2),
           decile_2 = COALESCE(EXCLUDED.decile_2::text, animais.decile_2::text),
           abczg = CASE WHEN EXCLUDED.abczg IS NOT NULL AND TRIM(EXCLUDED.abczg::text) != '' THEN EXCLUDED.abczg::text ELSE NULL END,
           deca = CASE WHEN EXCLUDED.deca IS NOT NULL AND TRIM(EXCLUDED.deca::text) != '' THEN EXCLUDED.deca::text ELSE NULL END,
           situacao_abcz = COALESCE(EXCLUDED.situacao_abcz::text, animais.situacao_abcz::text),
           updated_at = CURRENT_TIMESTAMP
         RETURNING id, serie, rg, situacao`,
        params
      );
    }
    throw e;
  }
}

async function processarLinhas(rows, criarNaoEncontrados = false, limparForaDaLista = false) {
  const resultados = {
    animaisAtualizados: 0,
    animaisCriados: 0,
    animaisLimpos: 0,
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
      genetica2: normalizarNumero(r.iqg ?? r.genetica_2 ?? r.genetica2 ?? r['IQG'] ?? r['Genética 2']) != null ? String(normalizarNumero(r.iqg ?? r.genetica_2 ?? r.genetica2 ?? r['IQG'] ?? r['Genética 2'])) : null,
      decile2: (() => {
        const raw = r.pt_iqg ?? r.decile_2 ?? r.decile2 ?? r['Pt IQG'] ?? r['Pt'] ?? r['PL'];
        const num = normalizarNumero(raw);
        return num != null ? String(num) : null;
      })(),
    });
  }

  if (dados.length === 0) return resultados;

  // Buscar animais em lotes (evita query muito grande) - RG normalizado no banco (sem zeros à esquerda)
  const mapaAnimais = new Map();
  const BATCH_SELECT = 100;

  for (let b = 0; b < dados.length; b += BATCH_SELECT) {
    const batch = dados.slice(b, b + BATCH_SELECT);
    const pares = batch.map(d => [(d.serie || '').trim(), String(d.rg || '').trim()]);
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

    // 2) Fallback: buscar por tatuagem (serie-rg, serie+rg, serie+espaço+rg) para os que não foram encontrados
    const naoEncontradosNoBatch = batch.filter(d => !mapaAnimais.has(`${(d.serie || '').toUpperCase().trim()}|${d.rg}`));
    const tatuagens = [...new Set(naoEncontradosNoBatch.flatMap(d => {
      const s = (d.serie || '').trim().toUpperCase();
      const r = String(d.rg || '').trim();
      if (!s && !r) return [];
      return [
        `${s}-${r}`.replace(/\s/g, ''),
        `${s}${r}`.replace(/\s/g, ''),
        `${s} ${r}`.replace(/\s+/g, ' ').trim()
      ].filter(Boolean);
    }))];
    if (tatuagens.length > 0) {
      try {
        const tatNorm = tatuagens.map(t => t.replace(/\s/g, '').toUpperCase());
        const tatRes = await query(
          `SELECT id, serie, rg, situacao, tatuagem FROM animais a
           WHERE TRIM(COALESCE(a.tatuagem, '')) != ''
             AND REPLACE(UPPER(TRIM(a.tatuagem)), ' ', '') = ANY($1::text[])`,
          [tatNorm]
        );
        for (const d of naoEncontradosNoBatch) {
          const key = `${(d.serie || '').toUpperCase().trim()}|${d.rg}`;
          const dTat = `${(d.serie || '').trim()}${d.rg}`.replace(/\s/g, '').toUpperCase();
          const dTat2 = `${(d.serie || '').trim()}-${d.rg}`.replace(/\s/g, '').toUpperCase();
          const dTat3 = `${(d.serie || '').trim()} ${d.rg}`.replace(/\s+/g, ' ').trim().toUpperCase();
          const animal = tatRes.rows.find(a => {
            const tat = (a.tatuagem || '').replace(/\s/g, '').toUpperCase();
            const tat2 = (a.tatuagem || '').trim().toUpperCase();
            return tat === dTat || tat === dTat2 || tat2 === dTat3;
          });
          if (animal) mapaAnimais.set(key, animal);
        }
      } catch (tatErr) {
        console.warn('[excel-genetica] Fallback tatuagem:', tatErr?.message);
      }
    }

    // 3) Fallback: buscar por nome (ex: "CJCJ 17267")
    let aindaNaoEncontrados = naoEncontradosNoBatch.filter(d => !mapaAnimais.has(`${(d.serie || '').toUpperCase().trim()}|${d.rg}`));
    for (const d of aindaNaoEncontrados) {
      try {
        const nomeBusca = `${(d.serie || '').trim()} ${d.rg}`.replace(/\s+/g, ' ').trim();
        const nomeBusca2 = `${(d.serie || '').trim()}-${d.rg}`;
        const nomeRes = await query(
          `SELECT id, serie, rg, situacao FROM animais a
           WHERE (UPPER(TRIM(COALESCE(a.nome, ''))) = UPPER($1)
             OR UPPER(TRIM(COALESCE(a.nome, ''))) = UPPER($2)
             OR REPLACE(UPPER(TRIM(COALESCE(a.nome, ''))), ' ', '') = REPLACE(UPPER($1), ' ', ''))
           LIMIT 1`,
          [nomeBusca, nomeBusca2]
        );
        if (nomeRes.rows.length > 0) {
          const a = nomeRes.rows[0];
          const key = `${(d.serie || '').toUpperCase().trim()}|${d.rg}`;
          mapaAnimais.set(key, a);
        }
      } catch (_) {}
    }

    // 4) Fallback: busca individual por serie+rg (evita problemas com query em lote)
    aindaNaoEncontrados = batch.filter(d => !mapaAnimais.has(`${(d.serie || '').toUpperCase().trim()}|${d.rg}`));
    for (const d of aindaNaoEncontrados) {
      try {
        const indRes = await query(
          `SELECT id, serie, rg, situacao FROM animais a
           WHERE UPPER(TRIM(COALESCE(a.serie, ''))) = UPPER($1)
             AND COALESCE(NULLIF(REGEXP_REPLACE(TRIM(a.rg::text), '^0+', ''), ''), '0') = $2
           LIMIT 1`,
          [(d.serie || '').trim(), d.rg]
        );
        if (indRes.rows.length > 0) {
          const a = indRes.rows[0];
          const rgNorm = /^\d+$/.test(String(a.rg || '').trim()) ? String(parseInt(String(a.rg).trim(), 10)) : String(a.rg || '').trim();
          const key = `${(d.serie || '').toUpperCase().trim()}|${d.rg}`;
          mapaAnimais.set(key, a);
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
      let animal = mapaAnimais.get(key);
      if (!animal && criarNaoEncontrados) {
        try {
          const nome = `${(d.serie || '').trim()} ${d.rg}`.replace(/\s+/g, ' ').trim();
          const tatuagem = `${(d.serie || '').trim()}-${d.rg}`;
          const ins = await insertOuUpdateAnimal(
            nome, (d.serie || '').trim(), d.rg, tatuagem, d.abczg, d.deca, d.situacaoAbcz, d.genetica2, d.decile2
          );
          if (ins.rows.length > 0) {
            animal = ins.rows[0];
            mapaAnimais.set(key, animal);
            resultados.animaisCriados++;
            resultados.animaisAtualizados++;
            continue;
          }
        } catch (insErr) {
          resultados.naoEncontrados.push({ linha: d.linha, serie: d.serie, rg: d.rg });
          resultados.erros.push({ linha: d.linha, serie: d.serie, rg: d.rg, erro: insErr?.message || String(insErr) });
          continue;
        }
      }
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

    const runBatchUpdate = async (comGenetica2, useOldCols = false) => {
      const cols = comGenetica2
        ? (useOldCols ? 'abczg, deca, situacao_abcz, genetica_2, decile_2' : 'abczg, deca, situacao_abcz, iqg, pt_iqg')
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
      const setAbczDeca = 'abczg = CASE WHEN v.abczg IS NOT NULL AND TRIM(v.abczg::text) != \'\' THEN v.abczg::text ELSE NULL END, deca = CASE WHEN v.deca IS NOT NULL AND TRIM(v.deca::text) != \'\' THEN v.deca::text ELSE NULL END';
      const setClause = comGenetica2
        ? (useOldCols
          ? `${setAbczDeca}, situacao_abcz = CASE WHEN v.situacao_abcz IS NOT NULL AND TRIM(v.situacao_abcz::text) != \'\' THEN v.situacao_abcz::text ELSE NULL END, genetica_2 = COALESCE(NULLIF(TRIM(REPLACE(v.genetica_2::text, \',\', \'.\')), \'\')::numeric, animais.genetica_2), decile_2 = COALESCE(v.decile_2::text, animais.decile_2::text)`
          : `${setAbczDeca}, situacao_abcz = CASE WHEN v.situacao_abcz IS NOT NULL AND TRIM(v.situacao_abcz::text) != \'\' THEN v.situacao_abcz::text ELSE NULL END, iqg = COALESCE(NULLIF(TRIM(REPLACE(v.iqg::text, \',\', \'.\')), \'\')::numeric, animais.iqg), pt_iqg = COALESCE(NULLIF(TRIM(REPLACE(v.pt_iqg::text, \',\', \'.\')), \'\')::numeric, animais.pt_iqg)`)
        : `${setAbczDeca}, situacao_abcz = CASE WHEN v.situacao_abcz IS NOT NULL AND TRIM(v.situacao_abcz::text) != \'\' THEN v.situacao_abcz::text ELSE NULL END`;
      const vCols = comGenetica2 ? `id, ${cols}` : 'id, abczg, deca, situacao_abcz';
      await query(
        `UPDATE animais SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         FROM (VALUES ${vals}) AS v(${vCols}) WHERE animais.id = v.id`,
        flat
      );
    };

    try {
      if (temColGenetica2) {
        try {
          await runBatchUpdate(true, false);
        } catch (e) {
          if (/column.*does not exist|coluna.*não existe/i.test(e?.message || '')) {
            temColGenetica2 = false;
            await runBatchUpdate(true, true); // fallback: genetica_2, decile_2
          } else throw e;
        }
        resultados.animaisAtualizados += updates.length;
      } else {
        await runBatchUpdate(false);
        resultados.animaisAtualizados += updates.length;
      }
    } catch (colErr) {
      if (/column.*does not exist|coluna.*não existe/i.test(colErr?.message || '')) {
        temColGenetica2 = false;
        try {
          await runBatchUpdate(true, true);
          resultados.animaisAtualizados += updates.length;
        } catch (e) {
          try {
            await runBatchUpdate(false);
            resultados.animaisAtualizados += updates.length;
          } catch (e2) {
            for (const u of updates) {
              resultados.erros.push({ linha: 0, serie: u.serie, rg: u.rg, erro: e2.message });
            }
          }
        }
      } else {
        for (const u of updates) {
          resultados.erros.push({ linha: 0, serie: u.serie, rg: u.rg, erro: colErr.message });
        }
      }
    }
  }

  // Limpar iABCZ/DECA de animais da mesma série que NÃO estão na planilha
  if (limparForaDaLista && dados.length > 0) {
    try {
      const seriesNaPlanilha = [...new Set(dados.map(d => (d.serie || '').trim().toUpperCase()).filter(Boolean))];
      for (const serie of seriesNaPlanilha) {
        const rgsNaPlanilha = dados.filter(d => (d.serie || '').trim().toUpperCase() === serie).map(d => d.rg);
        if (rgsNaPlanilha.length === 0) continue;
        const clearRes = await query(
          `UPDATE animais SET abczg = NULL, deca = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE UPPER(TRIM(COALESCE(serie, ''))) = $1
             AND (abczg IS NOT NULL OR deca IS NOT NULL)
             AND TRIM(REGEXP_REPLACE(TRIM(rg::text), '^0+', '')) != ALL($2::text[])
           RETURNING id, serie, rg`,
          [serie, rgsNaPlanilha]
        );
        if (clearRes.rows?.length > 0) {
          resultados.animaisLimpos += clearRes.rows.length;
        }
      }
    } catch (clearErr) {
      console.warn('[excel-genetica] Erro ao limpar fora da lista:', clearErr?.message);
      resultados.erros.push({ linha: 0, serie: '', rg: '', erro: `Limpar fora da lista: ${clearErr?.message}` });
    }
  }

  return resultados;
}
