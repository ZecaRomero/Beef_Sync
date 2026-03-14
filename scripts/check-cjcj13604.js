const { query } = require('../lib/database');
async function main() {
  const a = await query(`SELECT id, serie, rg, nome, sexo, situacao FROM animais WHERE serie = 'CJCJ' AND rg = '13604'`);
  console.log('Animal:', JSON.stringify(a.rows[0]));
  if (!a.rows[0]) { console.log('NAO ENCONTRADO'); process.exit(0); }

  const f1 = await query(`SELECT id, serie, rg, nome, situacao, data_nascimento, serie_mae, rg_mae, mae FROM animais WHERE serie_mae = 'CJCJ' AND rg_mae = '13604' ORDER BY data_nascimento DESC`);
  console.log('\nFilhos por serie_mae/rg_mae:', f1.rows.length);
  f1.rows.forEach(r => console.log(' -', r.serie, r.rg, r.situacao, r.data_nascimento));

  const f2 = await query(`SELECT id, serie, rg, nome, situacao, data_nascimento FROM animais WHERE mae LIKE '%CJCJ-13604%' OR mae = 'CJCJ 13604' ORDER BY data_nascimento DESC`);
  console.log('\nFilhos por mae texto:', f2.rows.length);
  f2.rows.forEach(r => console.log(' -', r.serie, r.rg, r.situacao, r.data_nascimento));

  const b = await query(`SELECT b.id, b.tipo, b.valor, b.data_baixa, b.serie_mae, b.rg_mae, a.serie, a.rg FROM baixas b LEFT JOIN animais a ON b.animal_id = a.id WHERE b.serie_mae = 'CJCJ' AND b.rg_mae = '13604'`);
  console.log('\nBaixas filhos:', b.rows.length);
  b.rows.forEach(r => console.log(' -', r.serie, r.rg, r.tipo, r.valor, r.data_baixa));

  // Verificar fêmeas ativas sem nenhum filho registrado
  console.log('\n--- Fêmeas ativas sem filhos ---');
  const semFilhos = await query(`
    SELECT a.serie, a.rg, a.nome, a.situacao,
      (SELECT COUNT(*) FROM animais f WHERE f.serie_mae = a.serie AND f.rg_mae = a.rg) as filhos_serie,
      (SELECT COUNT(*) FROM animais f WHERE f.mae LIKE '%' || a.serie || '-' || a.rg || '%') as filhos_mae_texto,
      (SELECT COUNT(*) FROM baixas b WHERE b.serie_mae = a.serie AND b.rg_mae = a.rg) as baixas_filhos
    FROM animais a
    WHERE a.sexo = 'Fêmea' AND a.situacao = 'Ativo'
      AND (SELECT COUNT(*) FROM animais f WHERE f.serie_mae = a.serie AND f.rg_mae = a.rg) = 0
      AND (SELECT COUNT(*) FROM animais f WHERE f.mae LIKE '%' || a.serie || '-' || a.rg || '%') = 0
      AND (SELECT COUNT(*) FROM baixas b WHERE b.serie_mae = a.serie AND b.rg_mae = a.rg) = 0
    ORDER BY a.serie, a.rg::int
    LIMIT 20
  `);
  console.log('Fêmeas ativas sem nenhum filho/baixa registrada:', semFilhos.rows.length);
  semFilhos.rows.forEach(r => console.log(' -', r.serie, r.rg, r.nome, r.situacao));
}
main().catch(console.error).finally(() => process.exit(0));
