const ds = require('../services/databaseService');

(async () => {
  try {
    const checks = [
      { serie: 'BENT', rg: '6420' },
      { serie: 'BENT', rg: '6423' },
      { serie: 'BENT', rg: '6424' },
    ];

    console.log('=== Verificação por Série e RG ===');
    for (const f of checks) {
      try {
        const rows = await ds.buscarAnimais(f);
        console.log('Consulta', f.serie, f.rg, '=>', rows.length, 'encontrado(s)');
        rows.slice(0, 10).forEach(a => {
          console.log(String(a.id) + ' ' + a.serie + '-' + a.rg + ' ' + (a.raca || '') + ' ' + (a.situacao || ''));
        });
      } catch (e) {
        console.error('Erro na consulta', f, e && e.message ? e.message : e);
      }
    }

    console.log('\n=== Verificação por RG apenas ===');
    for (const rg of ['6420', '6423', '6424']) {
      try {
        const rows2 = await ds.buscarAnimais({ rg });
        console.log('Consulta por RG', rg, '=>', rows2.length, 'encontrado(s)');
        rows2.slice(0, 10).forEach(a => {
          console.log(String(a.id) + ' ' + a.serie + '-' + a.rg + ' ' + (a.raca || '') + ' ' + (a.situacao || ''));
        });
      } catch (e) {
        console.error('Erro na consulta por RG', rg, e && e.message ? e.message : e);
      }
    }

    // Busca ampla por ocorrências de "BENT" em série/tatuagem
    const { query } = require('../lib/database');
    console.log('\n=== Busca ampla por "BENT" ===');
    const broad = await query(
      `SELECT id, serie, rg, tatuagem, raca, situacao
       FROM animais
       WHERE UPPER(TRIM(serie)) LIKE UPPER($1)
          OR UPPER(tatuagem) LIKE UPPER($2)
       ORDER BY created_at DESC
       LIMIT 50`,
      ['BENT%', '%BENT%']
    );
    console.log('Resultados BENT =>', broad.rows.length);
    broad.rows.forEach(a => {
      console.log(String(a.id) + ' ' + (a.serie || '') + '-' + (a.rg || '') + ' tatuagem=' + (a.tatuagem || '')); 
    });

    process.exit(0);
  } catch (e) {
    console.error('Erro geral:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
