/**
 * Script para atualizar avô materno de animais em lote
 * 
 * Formato do CSV:
 * serie,rg,avo_materno
 * BENT,6167,CALVARIO SANT FIV 51
 * CJCJ,16173,NOME DO AVO MATERNO
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function atualizarAvoMaternoLote(arquivoCSV) {
  const client = await pool.connect()
  
  try {
    // Ler arquivo CSV
    const caminhoArquivo = path.resolve(arquivoCSV)
    
    if (!fs.existsSync(caminhoArquivo)) {
      console.error(`❌ Arquivo não encontrado: ${caminhoArquivo}`)
      console.log('\n💡 Crie um arquivo CSV com o formato:')
      console.log('serie,rg,avo_materno')
      console.log('BENT,6167,CALVARIO SANT FIV 51')
      console.log('CJCJ,16173,NOME DO AVO MATERNO')
      process.exit(1)
    }
    
    const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8')
    const linhas = conteudo.split('\n').filter(linha => linha.trim() !== '')
    
    if (linhas.length < 2) {
      console.error('❌ Arquivo CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados')
      process.exit(1)
    }
    
    // Remover cabeçalho
    const dados = linhas.slice(1)
    
    console.log(`📋 Processando ${dados.length} animais...\n`)
    
    const resultados = {
      sucessos: [],
      erros: [],
      naoEncontrados: []
    }
    
    for (let i = 0; i < dados.length; i++) {
      const linha = dados[i].trim()
      if (!linha) continue
      
      // Separar por vírgula
      const campos = linha.split(',').map(c => c.trim())
      
      if (campos.length < 3) {
        console.log(`⚠️ Linha ${i + 2} inválida (formato: serie,rg,avo_materno): ${linha}`)
        resultados.erros.push({ linha: i + 2, motivo: 'Formato inválido', dados: linha })
        continue
      }
      
      const [serie, rg, avoMaterno] = campos
      
      if (!serie || !rg || !avoMaterno) {
        console.log(`⚠️ Linha ${i + 2} com campos vazios: ${linha}`)
        resultados.erros.push({ linha: i + 2, motivo: 'Campos vazios', dados: linha })
        continue
      }
      
      try {
        // Buscar animal
        const animalResult = await client.query(`
          SELECT id, serie, rg, avo_materno 
          FROM animais 
          WHERE serie = $1 AND rg = $2
        `, [serie, rg])
        
        if (animalResult.rows.length === 0) {
          console.log(`❌ Animal ${serie}-${rg} não encontrado`)
          resultados.naoEncontrados.push({ serie, rg, avoMaterno })
          continue
        }
        
        const animal = animalResult.rows[0]
        
        // Verificar se já tem o mesmo valor
        if (animal.avo_materno === avoMaterno) {
          console.log(`ℹ️  ${serie}-${rg} já tem esse avô materno: "${avoMaterno}"`)
          resultados.sucessos.push({ 
            serie, 
            rg, 
            avoMaterno, 
            acao: 'já estava correto',
            id: animal.id 
          })
          continue
        }
        
        // Atualizar
        await client.query(`
          UPDATE animais 
          SET avo_materno = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2
        `, [avoMaterno, animal.id])
        
        console.log(`✅ ${serie}-${rg}: "${animal.avo_materno || 'NULL'}" → "${avoMaterno}"`)
        resultados.sucessos.push({ 
          serie, 
          rg, 
          avoMaterno, 
          acao: 'atualizado',
          id: animal.id,
          valorAnterior: animal.avo_materno
        })
        
      } catch (error) {
        console.error(`❌ Erro ao processar ${serie}-${rg}:`, error.message)
        resultados.erros.push({ 
          linha: i + 2, 
          serie, 
          rg, 
          motivo: error.message,
          dados: linha 
        })
      }
    }
    
    // Resumo
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMO DA ATUALIZAÇÃO')
    console.log('='.repeat(60))
    console.log(`✅ Sucessos: ${resultados.sucessos.length}`)
    console.log(`❌ Erros: ${resultados.erros.length}`)
    console.log(`⚠️  Não encontrados: ${resultados.naoEncontrados.length}`)
    
    if (resultados.naoEncontrados.length > 0) {
      console.log('\n⚠️  Animais não encontrados:')
      resultados.naoEncontrados.forEach(a => {
        console.log(`   - ${a.serie}-${a.rg}`)
      })
    }
    
    if (resultados.erros.length > 0) {
      console.log('\n❌ Erros:')
      resultados.erros.forEach(e => {
        console.log(`   Linha ${e.linha}: ${e.motivo} - ${e.dados}`)
      })
    }
    
    // Salvar log em arquivo
    const logFile = path.join(__dirname, `log-avo-materno-${Date.now()}.json`)
    fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2))
    console.log(`\n📄 Log salvo em: ${logFile}`)
    
  } catch (error) {
    console.error('❌ Erro fatal:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Verificar argumentos
const arquivoCSV = process.argv[2]

if (!arquivoCSV) {
  console.log('📋 Script para atualizar avô materno de animais em lote\n')
  console.log('Uso:')
  console.log('  node scripts/atualizar-avo-materno-lote.js <arquivo.csv>\n')
  console.log('Formato do CSV:')
  console.log('  serie,rg,avo_materno')
  console.log('  BENT,6167,CALVARIO SANT FIV 51')
  console.log('  CJCJ,16173,NOME DO AVO MATERNO\n')
  console.log('Exemplo:')
  console.log('  node scripts/atualizar-avo-materno-lote.js dados/avo-materno.csv\n')
  process.exit(1)
}

atualizarAvoMaternoLote(arquivoCSV)
  .then(() => {
    console.log('\n✅ Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })

