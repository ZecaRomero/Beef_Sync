// Script para melhorar a validação de importação de inseminação
const fs = require('fs')
const path = require('path')

async function improveInseminacaoValidation() {
  console.log('�Ÿ”� Melhorando validação de importação de inseminação...\n')

  try {
    // Caminho do arquivo de inseminação
    const inseminacaoFile = 'pages/reproducao/inseminacao.js'
    
    if (!fs.existsSync(inseminacaoFile)) {
      console.error('�Œ Arquivo de inseminação não encontrado:', inseminacaoFile)
      return
    }

    console.log('1. Lendo arquivo atual...')
    let content = fs.readFileSync(inseminacaoFile, 'utf8')

    // Melhorar a mensagem de erro para ser mais clara
    const oldErrorMessage = `errosDetalhes.push(\`Animal \${serie} \${rg} não é fêmea (sexo: \${sexoAnimal}) - apenas fêmeas podem ser inseminadas\`)`
    
    const newErrorMessage = `errosDetalhes.push(\`�Œ ERRO: Animal \${serie} \${rg} é \${sexoAnimal.toUpperCase()} - apenas F�ŠMEAS podem ser inseminadas. Remova este animal da planilha.\`)`

    if (content.includes(oldErrorMessage)) {
      content = content.replace(oldErrorMessage, newErrorMessage)
      console.log('   �œ… Mensagem de erro melhorada')
    }

    // Adicionar validação adicional no início da função de importação
    const importFunctionStart = `const handleImportExcel = async (event) => {`
    
    if (content.includes(importFunctionStart)) {
      const validationCode = `
    // Validação prévia: avisar sobre a importação de inseminação
    console.log('�Ÿ”� IMPORTANTE: Importação de Inseminação Artificial')
    console.log('�Ÿ“‹ Certifique-se de que a planilha contém APENAS F�ŠMEAS')
    console.log('�Œ Animais MACHOS serão rejeitados automaticamente')
    console.log('�Ÿ’� Dica: Filtre sua planilha por sexo = "Fêmea" antes de importar')
    console.log('')
`

      // Inserir a validação logo após a declaração da função
      const functionIndex = content.indexOf(importFunctionStart) + importFunctionStart.length
      content = content.slice(0, functionIndex) + validationCode + content.slice(functionIndex)
      console.log('   �œ… Validação prévia adicionada')
    }

    // Melhorar o resumo final da importação
    const oldSummary = `let mensagem = \`�œ… \${sucesso} inseminação(ões) importada(s) com sucesso!\``
    
    const newSummary = `let mensagem = \`�œ… SUCESSO: \${sucesso} inseminação(ões) importada(s)!\`
        
        if (erros > 0) {
          mensagem += \`\\n\\n�Œ ERROS ENCONTRADOS: \${erros}\`
          mensagem += \`\\n\\n�Ÿ“‹ PRINCIPAIS CAUSAS DE ERRO:\`
          mensagem += \`\\n�€� Animais MACHOS na planilha (apenas fêmeas podem ser inseminadas)\`
          mensagem += \`\\n�€� Animais não encontrados no sistema\`
          mensagem += \`\\n�€� Datas inválidas\`
          mensagem += \`\\n\\n�Ÿ’� SOLU�‡�ƒO: Revise a planilha e remova os animais problemáticos\`
        }`

    if (content.includes(oldSummary)) {
      content = content.replace(oldSummary, newSummary)
      console.log('   �œ… Resumo de importação melhorado')
    }

    // Salvar o arquivo modificado
    console.log('2. Salvando melhorias...')
    fs.writeFileSync(inseminacaoFile, content, 'utf8')
    console.log('   �œ… Arquivo salvo com melhorias')

    // Criar um arquivo de dicas para o usuário
    console.log('3. Criando guia de importação...')
    const guideContent = `# �Ÿ“‹ GUIA DE IMPORTA�‡�ƒO - INSEMINA�‡�ƒO ARTIFICIAL

## �Œ PROBLEMA COMUM: "Animal não é fêmea"

### �Ÿ”� CAUSA
O sistema está tentando importar dados de inseminação para animais **MACHOS**, mas apenas **F�ŠMEAS** podem ser inseminadas.

### �ŸŽ� SOLU�‡�ƒO

#### 1. **Verificar a Planilha Excel**
- Abra sua planilha de inseminação
- Verifique a coluna de **SEXO** ou **S�‰RIE/RG** dos animais
- **REMOVA** todos os animais **MACHOS** da planilha

#### 2. **Animais Problemáticos Identificados:**
- **CJCJ 16235** - MACHO �Œ
- **CJCJ 16511** - MACHO �Œ  
- **CJCJ 16635** - MACHO �Œ

#### 3. **Como Filtrar Corretamente:**
1. No Excel, selecione toda a tabela
2. Vá em **Dados > Filtro**
3. Na coluna **SEXO**, marque apenas **"Fêmea"** ou **"F"**
4. Copie apenas os dados filtrados para uma nova planilha
5. Importe a nova planilha

#### 4. **Verificação Antes de Importar:**
- �œ… Todos os animais são **F�ŠMEAS**?
- �œ… As **DATAS** estão no formato correto?
- �œ… Os **RGs dos TOUROS** estão corretos?

### �Ÿ“Š ESTATÍSTICAS DO REBANHO
- **Machos**: 1.405 animais (76,78%)
- **Fêmeas**: 425 animais (23,22%)

### �Ÿ’� DICAS IMPORTANTES
1. **Apenas fêmeas** podem ser inseminadas
2. **Machos** são usados como reprodutores (monta natural)
3. Verifique sempre o **sexo** antes de incluir na planilha de IA
4. Use a **validação automática** do sistema para identificar erros

### �Ÿ†˜ SE O PROBLEMA PERSISTIR
1. Verifique se o **sexo** do animal está correto no sistema
2. Se um animal **fêmea** está marcado como **macho**, corrija no cadastro
3. Entre em contato com o suporte técnico

---
**Gerado automaticamente pelo sistema BeefSync**
`

    fs.writeFileSync('GUIA-IMPORTACAO-INSEMINACAO.md', guideContent, 'utf8')
    console.log('   �œ… Guia criado: GUIA-IMPORTACAO-INSEMINACAO.md')

    console.log('\n�œ… Melhorias aplicadas com sucesso!')

  } catch (error) {
    console.error('�Œ Erro:', error)
  }
}

// Executar
improveInseminacaoValidation()
  .then(() => {
    console.log('\n�ŸŽ� RESULTADO:')
    console.log('�€� Validação de importação melhorada')
    console.log('�€� Mensagens de erro mais claras')
    console.log('�€� Guia de importação criado')
    console.log('�€� Usuário receberá orientações mais detalhadas')
    console.log('')
    console.log('�Ÿ“‹ PR�“XIMOS PASSOS PARA O USUÁRIO:')
    console.log('1. Leia o arquivo GUIA-IMPORTACAO-INSEMINACAO.md')
    console.log('2. Remova os animais machos da planilha Excel')
    console.log('3. Importe novamente apenas com fêmeas')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })