// Script para importar inseminações com diagnósticos de gestação
const { query } = require('./lib/database')

async function importarInseminacoesCompletas() {
  console.log('🔄 IMPORTANDO INSEMINAÇÕES COM DIAGNÓSTICOS DE GESTAÇÃO')
  console.log('=' .repeat(70))
  console.log('')

  try {
    // Dados da planilha fornecida
    const dadosInseminacao = [
      { serie: 'CJCJ', rg: '15639', local: 'PIQ 1', touro: 'JAMBU FIV DA GAROUPA', serie_touro: 'AGJZ', rg_touro: '878', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '16235', local: 'PIQ 13', touro: 'JAMBU FIV DA GAROUPA', serie_touro: 'AGJZ', rg_touro: '878', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16511', local: 'PIQ 13', touro: 'JAMBU FIV DA GAROUPA', serie_touro: 'AGJZ', rg_touro: '878', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '15563', local: 'PIQ 1', touro: 'NERO DO MORRO', serie_touro: 'GFC', rg_touro: '1075', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '16182', local: 'PIQ 13', touro: 'GIBSON FIV GUADALUPE', serie_touro: 'FGPA', rg_touro: '1248', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16219', local: 'PIQ 13', touro: 'GIBSON FIV GUADALUPE', serie_touro: 'FGPA', rg_touro: '1248', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16236', local: 'PIQ 11', touro: 'GIBSON FIV GUADALUPE', serie_touro: 'FGPA', rg_touro: '1248', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16262', local: 'PIQ 11', touro: 'GIBSON FIV GUADALUPE', serie_touro: 'FGPA', rg_touro: '1248', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16373', local: 'PIQ 11', touro: 'GIBSON FIV GUADALUPE', serie_touro: 'FGPA', rg_touro: '1248', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16603', local: 'PIQ 11', touro: 'GIBSON FIV GUADALUPE', serie_touro: 'FGPA', rg_touro: '1248', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '15587', local: 'PIQ 17', touro: 'C2747 DA S.NICE (MAGO)', serie_touro: 'GRIC', rg_touro: '2747', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '16165', local: 'PIQ 13', touro: 'C2747 DA S.NICE (MAGO)', serie_touro: 'GRIC', rg_touro: '2747', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16173', local: 'PIQ 11', touro: 'C2747 DA S.NICE (MAGO)', serie_touro: 'GRIC', rg_touro: '2747', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16274', local: 'PIQ 11', touro: 'C2747 DA S.NICE (MAGO)', serie_touro: 'GRIC', rg_touro: '2747', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16308', local: 'PIQ 11', touro: 'C2747 DA S.NICE (MAGO)', serie_touro: 'GRIC', rg_touro: '2747', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16335', local: 'PIQ 13', touro: 'C2747 DA S.NICE (MAGO)', serie_touro: 'GRIC', rg_touro: '2747', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16397', local: 'PIQ 11', touro: 'C2747 DA S.NICE (MAGO)', serie_touro: 'GRIC', rg_touro: '2747', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16467', local: 'PIQ 11', touro: 'C2747 DA S.NICE (MAGO)', serie_touro: 'GRIC', rg_touro: '2747', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16578', local: 'PIQ 13', touro: 'C2747 DA S.NICE (MAGO)', serie_touro: 'GRIC', rg_touro: '2747', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16599', local: 'PIQ 11', touro: 'C2747 DA S.NICE (MAGO)', serie_touro: 'GRIC', rg_touro: '2747', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCA', rg: '2', local: 'PIQ 12', touro: 'IDEAL GUADALUPE', serie_touro: 'FGPA', rg_touro: '3139', data_ia: '26/12/25', data_dg: '26/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15959', local: 'PIQ 1', touro: 'IDEAL GUADALUPE', serie_touro: 'FGPA', rg_touro: '3139', data_ia: '22/12/25', data_dg: '26/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15829', local: 'PIQ 17', touro: 'CASANOVA BONS BONS', serie_touro: '', rg_touro: '4404', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15524', local: 'PIQ 1', touro: 'LANDROVER', serie_touro: 'XRGM', rg_touro: '4865', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '16068', local: 'PIQ 17', touro: 'LANDROVER', serie_touro: 'XRGM', rg_touro: '4865', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '16222', local: 'PIQ 11', touro: 'REM MAQUINA', serie_touro: 'REMCA', rg_touro: '5154', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '15535', local: 'PIQ 17', touro: 'PATENTE - KAT 6426', serie_touro: 'KAT', rg_touro: '6426', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '16189', local: 'PIQ 11', touro: 'B7556 FIV DA EAO (ELITE)', serie_touro: 'EAOB', rg_touro: '7556', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16525', local: 'PIQ 11', touro: 'B7556 FIV DA EAO (ELITE)', serie_touro: 'EAOB', rg_touro: '7556', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16622', local: 'PIQ 11', touro: 'B7556 FIV DA EAO (ELITE)', serie_touro: 'EAOB', rg_touro: '7556', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCA', rg: '6', local: 'PIQ 11', touro: 'B7661 FIV DA EAO (ESTEIO)', serie_touro: 'EAOB', rg_touro: '7556', data_ia: '08/03/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16368', local: 'PIQ 11', touro: 'B8015 FIV DA EAO (FEDERAL)', serie_touro: 'EAOB', rg_touro: '8015', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16478', local: 'PIQ 13', touro: 'B8015 FIV DA EAO (FEDERAL)', serie_touro: 'EAOB', rg_touro: '8015', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16199', local: 'PIQ 11', touro: '8542 FIV DA COMETA (AZULEJO)', serie_touro: 'FLPE', rg_touro: '8542', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '15875', local: 'PIQ 17', touro: 'REM 11627 - JAMANTA', serie_touro: 'REM', rg_touro: '11627', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '16220', local: 'PIQ 13', touro: 'REM 11627 - JAMANTA', serie_touro: 'REM', rg_touro: '11627', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16310', local: 'PIQ 11', touro: 'REM 11627 - JAMANTA', serie_touro: 'REM', rg_touro: '11627', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16591', local: 'PIQ 13', touro: 'REM 12551 - MAESTRO', serie_touro: 'REM', rg_touro: '12551', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16619', local: 'PIQ 13', touro: 'REM 12551 - MAESTRO', serie_touro: 'REM', rg_touro: '12551', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '15539', local: 'PIQ 17', touro: 'REM 12551 - MAESTRO', serie_touro: 'REM', rg_touro: '12551', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15687', local: 'PIQ 17', touro: 'REM 12551 - MAESTRO', serie_touro: 'REM', rg_touro: '12551', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15696', local: 'PIQ 17', touro: 'REM 12551 - MAESTRO', serie_touro: 'REM', rg_touro: '12551', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15707', local: 'PIQ 17', touro: 'REM 12551 - MAESTRO', serie_touro: 'REM', rg_touro: '12551', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '16249', local: 'PIQ 13', touro: 'REM 12551 - MAESTRO', serie_touro: 'REM', rg_touro: '12551', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'MFBN', rg: '9851', local: 'PIQ 1', touro: 'NORTICO - CJCJ 15236', serie_touro: 'CJCJ', rg_touro: '15236', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15592', local: 'PIQ 11', touro: 'NORTICO - CJCJ 15236', serie_touro: 'CJCJ', rg_touro: '15236', data_ia: '20/06/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16087', local: 'PIQ 11', touro: 'NORTICO - CJCJ 15236', serie_touro: 'CJCJ', rg_touro: '15236', data_ia: '20/06/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16131', local: 'PIQ 11', touro: 'NORTICO - CJCJ 15236', serie_touro: 'CJCJ', rg_touro: '15236', data_ia: '20/06/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16050', local: 'PIQ 11', touro: 'NACION 15397', serie_touro: 'CJCJ', rg_touro: '15397', data_ia: '20/06/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '15991', local: 'PIQ 11', touro: 'NACION 15937', serie_touro: 'CJCJ', rg_touro: '15397', data_ia: '20/06/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16153', local: 'PIQ 11', touro: 'NACION 15937', serie_touro: 'CJCJ', rg_touro: '15397', data_ia: '20/06/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16291', local: 'PIQ 13', touro: 'CJ SANT ANNA 15559', serie_touro: 'CJCJ', rg_touro: '15559', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16333', local: 'PIQ 13', touro: 'CJ SANT ANNA 15559', serie_touro: 'CJCJ', rg_touro: '15559', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '15521', local: 'PIQ 1', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15547', local: 'PIQ 17', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15548', local: 'PIQ 17', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15599', local: 'PIQ 17', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15607', local: 'PIQ 17', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15673', local: 'PIQ 17', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15801', local: 'PIQ 17', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15877', local: 'PIQ 17', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15897', local: 'PIQ 17', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15955', local: 'PIQ 17', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '16208', local: 'PIQ 11', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16400', local: 'PIQ 11', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16435', local: 'PIQ 11', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16446', local: 'PIQ 11', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '19/09/25', data_dg: '24/10/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16590', local: 'PIQ 13', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16600', local: 'PIQ 13', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '16601', local: 'PIQ 13', touro: 'MARACANA - CJCJ 15779', serie_touro: 'CJCJ', rg_touro: '15779', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' },
      { serie: 'CJCJ', rg: '15627', local: 'PIQ 17', touro: 'MALCOM SANT ANNA', serie_touro: 'CJCJ', rg_touro: '16141', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15714', local: 'PIQ 17', touro: 'MALCOM SANT ANNA', serie_touro: 'CJCJ', rg_touro: '16141', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15738', local: 'PIQ 17', touro: 'MALCOM SANT ANNA', serie_touro: 'CJCJ', rg_touro: '16141', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15775', local: 'PIQ 17', touro: 'MALCOM SANT ANNA', serie_touro: 'CJCJ', rg_touro: '16141', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '15785', local: 'PIQ 17', touro: 'MALCOM SANT ANNA', serie_touro: 'CJCJ', rg_touro: '16141', data_ia: '05/12/25', data_dg: '05/01/26', resultado: 'P' },
      { serie: 'CJCJ', rg: '16201', local: 'PIQ 13', touro: 'MALCOM SANT ANNA', serie_touro: 'CJCJ', rg_touro: '16141', data_ia: '13/11/25', data_dg: '16/12/25', resultado: 'P' }
    ]

    console.log(`📊 Total de registros para importar: ${dadosInseminacao.length}`)
    console.log('')

    // Função para converter data DD/MM/YY para YYYY-MM-DD
    function converterData(dataStr) {
      if (!dataStr) return null
      
      const [dia, mes, ano] = dataStr.split('/')
      const anoCompleto = ano.length === 2 ? `20${ano}` : ano
      return `${anoCompleto}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    }

    // Função para normalizar resultado DG
    function normalizarResultado(resultado) {
      if (!resultado) return null
      const r = resultado.toString().toUpperCase().trim()
      if (r === 'P' || r === 'PRENHA' || r === 'POSITIVO') return 'Prenha'
      if (r === 'N' || r === 'NÃO PRENHA' || r === 'NEGATIVO') return 'Não Prenha'
      return r
    }

    let sucessos = 0
    let erros = 0
    const errosDetalhes = []

    console.log('🔄 Processando registros...')
    console.log('')

    for (let i = 0; i < dadosInseminacao.length; i++) {
      const registro = dadosInseminacao[i]
      const numeroRegistro = i + 1
      
      try {
        console.log(`${numeroRegistro}/${dadosInseminacao.length} - ${registro.serie} ${registro.rg}`)

        // 1. Buscar animal
        const animalResult = await query(`
          SELECT id, sexo, situacao, nome
          FROM animais 
          WHERE serie = $1 AND rg = $2
        `, [registro.serie, registro.rg])

        if (animalResult.rows.length === 0) {
          erros++
          errosDetalhes.push(`${registro.serie} ${registro.rg}: Animal não encontrado`)
          console.log(`   ❌ Animal não encontrado`)
          continue
        }

        const animal = animalResult.rows[0]

        // 2. Validar se é fêmea
        if (animal.sexo !== 'Fêmea' && animal.sexo !== 'F') {
          erros++
          errosDetalhes.push(`${registro.serie} ${registro.rg}: É ${animal.sexo}, não pode ser inseminado`)
          console.log(`   ❌ É ${animal.sexo}, não pode ser inseminado`)
          continue
        }

        // 3. Converter datas
        const dataIA = converterData(registro.data_ia)
        const dataDG = converterData(registro.data_dg)

        if (!dataIA) {
          erros++
          errosDetalhes.push(`${registro.serie} ${registro.rg}: Data IA inválida: ${registro.data_ia}`)
          console.log(`   ❌ Data IA inválida`)
          continue
        }

        // 4. Buscar sêmen do touro (opcional)
        let semenId = null
        if (registro.serie_touro && registro.rg_touro) {
          const rgTouroCompleto = `${registro.serie_touro} ${registro.rg_touro}`.trim()
          
          const semenResult = await query(`
            SELECT id FROM estoque_semen 
            WHERE rg_touro = $1 OR rg_touro LIKE $2
            LIMIT 1
          `, [rgTouroCompleto, `%${registro.rg_touro}%`])

          if (semenResult.rows.length > 0) {
            semenId = semenResult.rows[0].id
          }
        }

        // 5. Verificar se já existe inseminação para este animal nesta data
        const iaExistente = await query(`
          SELECT id FROM inseminacoes 
          WHERE animal_id = $1 AND data_inseminacao = $2
        `, [animal.id, dataIA])

        if (iaExistente.rows.length > 0) {
          console.log(`   ⚠️ IA já existe para esta data, pulando...`)
          continue
        }

        // 6. Inserir inseminação
        const resultadoNormalizado = normalizarResultado(registro.resultado)
        
        const iaResult = await query(`
          INSERT INTO inseminacoes (
            animal_id,
            data_inseminacao,
            touro,
            semen_id,
            tecnico,
            observacoes,
            status_gestacao,
            custo_dose,
            numero_ia,
            rg_touro,
            numero_dg,
            data_dg,
            resultado_dg
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id
        `, [
          animal.id,
          dataIA,
          registro.touro,
          semenId,
          'Importação Automática',
          `Local: ${registro.local}`,
          resultadoNormalizado,
          18.00, // Custo padrão
          1, // Primeira IA
          registro.serie_touro && registro.rg_touro ? `${registro.serie_touro} ${registro.rg_touro}` : null,
          dataDG ? 1 : null,
          dataDG,
          resultadoNormalizado
        ])

        // 7. Criar custo da IA
        await query(`
          INSERT INTO custos (
            animal_id,
            tipo,
            subtipo,
            valor,
            data,
            observacoes,
            detalhes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          animal.id,
          'Reprodução',
          'Inseminação Artificial',
          18.00,
          dataIA,
          `IA - ${registro.touro}`,
          JSON.stringify({
            inseminacao_id: iaResult.rows[0].id,
            touro: registro.touro,
            local: registro.local,
            resultado_dg: resultadoNormalizado
          })
        ])

        // 8. Se resultado é prenha, criar gestação
        if (resultadoNormalizado === 'Prenha') {
          // Verificar se já existe gestação
          const gestacaoExistente = await query(`
            SELECT id FROM gestacoes 
            WHERE receptora_serie = $1 AND receptora_rg = $2 AND data_cobertura = $3
          `, [registro.serie, registro.rg, dataIA])

          if (gestacaoExistente.rows.length === 0) {
            await query(`
              INSERT INTO gestacoes (
                pai_serie,
                pai_rg,
                mae_serie,
                mae_rg,
                receptora_nome,
                receptora_serie,
                receptora_rg,
                data_cobertura,
                situacao,
                observacoes
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
              registro.serie_touro || 'N/A',
              registro.rg_touro || 'N/A',
              registro.serie, // mae_serie = receptora_serie (mesma fêmea)
              registro.rg,    // mae_rg = receptora_rg (mesma fêmea)
              animal.nome || `${registro.serie} ${registro.rg}`,
              registro.serie,
              registro.rg,
              dataIA,
              'Em Gestação',
              `Gestação confirmada via DG em ${dataDG ? new Date(dataDG).toLocaleDateString('pt-BR') : 'data não informada'}`
            ])
          }
        }

        sucessos++
        console.log(`   ✅ Importado com sucesso`)

      } catch (error) {
        erros++
        errosDetalhes.push(`${registro.serie} ${registro.rg}: ${error.message}`)
        console.log(`   ❌ Erro: ${error.message}`)
      }
    }

    // Relatório final
    console.log('')
    console.log('📊 RELATÓRIO FINAL')
    console.log('=' .repeat(50))
    console.log(`✅ Sucessos: ${sucessos}`)
    console.log(`❌ Erros: ${erros}`)
    console.log(`📊 Total processado: ${dadosInseminacao.length}`)
    console.log(`📈 Taxa de sucesso: ${((sucessos / dadosInseminacao.length) * 100).toFixed(1)}%`)

    if (erros > 0) {
      console.log('')
      console.log('❌ DETALHES DOS ERROS:')
      errosDetalhes.forEach((erro, index) => {
        console.log(`${index + 1}. ${erro}`)
      })
    }

    // Estatísticas adicionais
    console.log('')
    console.log('📈 ESTATÍSTICAS ADICIONAIS:')
    
    const totalIAs = await query('SELECT COUNT(*) as total FROM inseminacoes')
    const totalPrenhas = await query(`SELECT COUNT(*) as total FROM inseminacoes WHERE status_gestacao = 'Prenha'`)
    const totalGestacoes = await query('SELECT COUNT(*) as total FROM gestacoes')

    console.log(`Total de IAs no sistema: ${totalIAs.rows[0].total}`)
    console.log(`Total de prenhas confirmadas: ${totalPrenhas.rows[0].total}`)
    console.log(`Total de gestações: ${totalGestacoes.rows[0].total}`)

    console.log('')
    console.log('✅ IMPORTAÇÃO CONCLUÍDA!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar
importarInseminacoesCompletas()
  .then(() => {
    console.log('')
    console.log('🎯 RESULTADO FINAL:')
    console.log('• Inseminações importadas com diagnósticos')
    console.log('• Custos criados automaticamente')
    console.log('• Gestações criadas para prenhas confirmadas')
    console.log('• Sistema atualizado e pronto para uso')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })