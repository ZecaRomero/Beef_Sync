/**
 * Script para atualizar avô materno de animais em lote a partir de arquivo Excel
 * 
 * Formato esperado do Excel:
 * - Coluna A: Série (ex: BENT, CJCJ)
 * - Coluna B: RG (ex: 6167, 16173)
 * - Coluna C: Avô Materno (ex: CALVARIO SANT FIV 51)
 * 
 * O script aceita:
 * - Primeira linha pode ser cabeçalho (será ignorada se contiver "serie", "rg", "avo")
 * - Ou pode começar direto com os dados
 */

const { Pool } = require('pg')
const ExcelJS = require('exceljs')
const path = require('path')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function atualizarAvoMaternoExcel(arquivoExcel) {
  const client = await pool.connect()
  
  try {
    // Verificar se arquivo existe
    const caminhoArquivo = path.resolve(arquivoExcel)
    const fs = require('fs')
    
    if (!fs.existsSync(caminhoArquivo)) {
      console.error(`�Œ Arquivo não encontrado: ${caminhoArquivo}`)
      console.log('\n�Ÿ’� Dicas:')
      console.log('   - Use o caminho completo do arquivo')
      console.log('   - Ou coloque o arquivo na pasta scripts/')
      console.log('   - Formato esperado: .xlsx (Excel)')
      process.exit(1)
    }
    
    console.log(`�Ÿ“‚ Lendo arquivo: ${caminhoArquivo}\n`)
    
    // Ler arquivo Excel
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(caminhoArquivo)
    
    // Pegar primeira planilha
    const worksheet = workbook.worksheets[0]
    console.log(`�Ÿ“Š Planilha: ${worksheet.name}`)
    console.log(`�Ÿ“� Total de linhas: ${worksheet.rowCount}\n`)
    
    // Detectar onde começam os dados (pular cabeçalho se houver)
    let linhaInicio = 1
    const primeiraLinha = worksheet.getRow(1)
    const primeiraCelula = primeiraLinha.getCell(1).value
    
    // Se primeira linha parece ser cabeçalho, começar da linha 2
    if (primeiraCelula && typeof primeiraCelula === 'string') {
      const textoCabeçalho = primeiraCelula.toString().toLowerCase()
      if (textoCabeçalho.includes('serie') || textoCabeçalho.includes('série') || 
          textoCabeçalho.includes('rg') || textoCabeçalho.includes('avo')) {
        linhaInicio = 2
        console.log('�Ÿ“‹ Cabeçalho detectado, pulando primeira linha\n')
      }
    }
    
    const resultados = {
      sucessos: [],
      erros: [],
      naoEncontrados: [],
      jaCorretos: []
    }
    
    // Coletar todos os dados primeiro
    const dados = []
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < linhaInicio) return
      
      // Ler células (A = série, B = RG, C = avô materno)
      const serie = row.getCell(1).value
      const rg = row.getCell(2).value
      const avoMaterno = row.getCell(3).value
      
      // Validar dados básicos
      if (!serie || !rg || !avoMaterno) {
        resultados.erros.push({ 
          linha: rowNumber, 
          motivo: 'Dados incompletos',
          serie: serie || 'N/A',
          rg: rg || 'N/A'
        })
        return
      }
      
      // Converter para string e limpar
      const serieStr = String(serie).trim().toUpperCase()
      const rgStr = String(rg).trim()
      const avoMaternoStr = String(avoMaterno).trim()
      
      if (!serieStr || !rgStr || !avoMaternoStr) {
        resultados.erros.push({ 
          linha: rowNumber, 
          motivo: 'Campos vazios após limpeza',
          serie: serieStr,
          rg: rgStr
        })
        return
      }
      
      dados.push({ serieStr, rgStr, avoMaternoStr, rowNumber })
    })
    
    console.log(`�Ÿ“‹ Total de linhas válidas para processar: ${dados.length}\n`)
    
    // Processar sequencialmente
    for (const dado of dados) {
      try {
        await processarAnimal(client, dado.serieStr, dado.rgStr, dado.avoMaternoStr, dado.rowNumber, resultados)
      } catch (error) {
        console.error(`�Œ Erro na linha ${dado.rowNumber}:`, error.message)
        resultados.erros.push({ 
          linha: dado.rowNumber, 
          serie: dado.serieStr,
          rg: dado.rgStr,
          motivo: error.message
        })
      }
    }
    
    const totalProcessados = dados.length
    
    // Resumo
    console.log('\n' + '='.repeat(60))
    console.log('�Ÿ“Š RESUMO DA ATUALIZA�‡�ƒO')
    console.log('='.repeat(60))
    console.log(`�Ÿ“‹ Total processado: ${totalProcessados}`)
    console.log(`�œ… Atualizados: ${resultados.sucessos.length}`)
    console.log(`�„�️  Já corretos: ${resultados.jaCorretos.length}`)
    console.log(`�Œ Erros: ${resultados.erros.length}`)
    console.log(`�š�️  Não encontrados: ${resultados.naoEncontrados.length}`)
    
    if (resultados.sucessos.length > 0) {
      console.log('\n�œ… Animais atualizados:')
      resultados.sucessos.slice(0, 10).forEach(r => {
        console.log(`   - ${r.serie}-${r.rg}: "${r.avoMaterno}"`)
      })
      if (resultados.sucessos.length > 10) {
        console.log(`   ... e mais ${resultados.sucessos.length - 10} animais`)
      }
    }
    
    if (resultados.naoEncontrados.length > 0) {
      console.log('\n�š�️  Animais não encontrados:')
      resultados.naoEncontrados.forEach(a => {
        console.log(`   - ${a.serie}-${a.rg}`)
      })
    }
    
    if (resultados.erros.length > 0) {
      console.log('\n�Œ Erros:')
      resultados.erros.slice(0, 5).forEach(e => {
        console.log(`   Linha ${e.linha}: ${e.motivo} - ${e.serie}-${e.rg}`)
      })
      if (resultados.erros.length > 5) {
        console.log(`   ... e mais ${resultados.erros.length - 5} erros`)
      }
    }
    
    // Salvar log
    const logFile = path.join(__dirname, `log-avo-materno-${Date.now()}.json`)
    fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2))
    console.log(`\n�Ÿ“„ Log detalhado salvo em: ${logFile}`)
    
  } catch (error) {
    console.error('�Œ Erro fatal:', error.message)
    if (error.message.includes('Cannot find module')) {
      console.log('\n�Ÿ’� Certifique-se de que o arquivo Excel existe e está acessível')
    }
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

async function processarAnimal(client, serie, rg, avoMaterno, linhaNumero, resultados) {
  try {
    // Buscar animal
    const animalResult = await client.query(`
      SELECT id, serie, rg, avo_materno 
      FROM animais 
      WHERE serie = $1 AND rg = $2
    `, [serie, rg])
    
    if (animalResult.rows.length === 0) {
      resultados.naoEncontrados.push({ serie, rg, avoMaterno })
      return
    }
    
    const animal = animalResult.rows[0]
    
    // Verificar se já tem o mesmo valor
    if (animal.avo_materno === avoMaterno) {
      resultados.jaCorretos.push({ 
        serie, 
        rg, 
        avoMaterno, 
        id: animal.id 
      })
      return
    }
    
    // Atualizar
    await client.query(`
      UPDATE animais 
      SET avo_materno = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [avoMaterno, animal.id])
    
    console.log(`�œ… ${serie}-${rg}: "${animal.avo_materno || 'NULL'}" �†’ "${avoMaterno}"`)
    resultados.sucessos.push({ 
      serie, 
      rg, 
      avoMaterno, 
      id: animal.id,
      valorAnterior: animal.avo_materno
    })
    
  } catch (error) {
    throw error
  }
}

// Verificar argumentos
const arquivoExcel = process.argv[2]

if (!arquivoExcel) {
  console.log('�Ÿ“‹ Script para atualizar avô materno de animais em lote (Excel)\n')
  console.log('Uso:')
  console.log('  node scripts/atualizar-avo-materno-excel.js <arquivo.xlsx>\n')
  console.log('Formato do Excel:')
  console.log('  Coluna A: Série (ex: BENT, CJCJ)')
  console.log('  Coluna B: RG (ex: 6167, 16173)')
  console.log('  Coluna C: Avô Materno (ex: CALVARIO SANT FIV 51)\n')
  console.log('Exemplo:')
  console.log('  node scripts/atualizar-avo-materno-excel.js avo-materno.xlsx\n')
  console.log('�Ÿ’� Você pode ter cabeçalho na primeira linha ou começar direto com os dados')
  process.exit(1)
}

atualizarAvoMaternoExcel(arquivoExcel)
  .then(() => {
    console.log('\n�œ… Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n�Œ Erro fatal:', error)
    process.exit(1)
  })

