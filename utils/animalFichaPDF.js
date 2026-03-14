import jsPDF from 'jspdf'

/**
 * Gera PDF da ficha completa de um ou vários animais
 * @param {Array} animals - Array de animais
 * @param {Object} examesAndrologicos - Objeto com exames andrológicos por RG
 * @param {Object} reproducaoStatsMap - Mapa de estatísticas reprodutivas por ID do animal
 * @param {Object} transferenciasEmbrioesMap - Mapa de transferências de embriões por ID do animal (opcional)
 */
export async function generateAnimalFichaPDF(animals, examesAndrologicos = {}, reproducaoStatsMap = {}, transferenciasEmbrioesMap = {}) {
  const doc = new jsPDF()
  let yPosition = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  
  // Carregar logotipo uma vez
  let logoBase64 = null
  try {
    // Tentar carregar da pasta public (arquivo deve estar em public/logo-santanna.jpg)
    // Se não encontrar, tentar outros caminhos
    const logoPaths = [
      '/logo-santanna.png.jpg', // Nome atual do arquivo
      '/logo-santanna.jpg',
      '/Logotipo Fazendas Sant\'Anna.jpg',
      '/Logotipo%20Fazendas%20Sant%27Anna.jpg' // URL encoded
    ]
    
    for (const logoPath of logoPaths) {
      try {
        const response = await fetch(logoPath)
        if (response.ok) {
          const blob = await response.blob()
          logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
          })
          if (logoBase64) break
        }
      } catch (e) {
        // Continuar tentando outros caminhos
      }
    }
  } catch (error) {
    console.warn('Erro ao carregar logotipo:', error)
  }
  
  // Função para adicionar logotipo
  const addLogo = (doc, x, y) => {
    if (!logoBase64) return 0
    try {
      const imgWidth = 50
      const imgHeight = 30 // Altura fixa para manter proporção
      doc.addImage(logoBase64, 'JPEG', x, y, imgWidth, imgHeight)
      return imgHeight + 5
    } catch (error) {
      console.warn('Erro ao adicionar logotipo ao PDF:', error)
      return 0
    }
  }

  // Função para adicionar nova página se necessário
  const checkPageBreak = (requiredSpace = 20) => {
    if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      yPosition = 20
      return true
    }
    return false
  }

  // Função para adicionar texto com quebra de linha
  const addText = (text, x, y, options = {}) => {
    const { fontSize = 10, fontStyle = 'normal', color = [0, 0, 0], maxWidth = contentWidth } = options
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle)
    doc.setTextColor(...color)
    
    const lines = doc.splitTextToSize(String(text || ''), maxWidth)
    doc.text(lines, x, y)
    return lines.length * (fontSize * 0.4) + 2
  }

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'Não informado'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Função para formatar moeda
  const formatCurrency = (value) => {
    if (!value) return 'Não informado'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Processar cada animal
  for (let index = 0; index < animals.length; index++) {
    const animal = animals[index]
    // Adicionar cabeçalho para cada animal (exceto o primeiro)
    if (index > 0) {
      checkPageBreak(30)
      yPosition += 10
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 15
    }

    // Adicionar logotipo no topo (apenas na primeira página do primeiro animal)
    if (index === 0 && doc.internal.getCurrentPageInfo().pageNumber === 1) {
      const logoHeight = addLogo(doc, pageWidth - margin - 50, 10)
      if (logoHeight > 0) {
        yPosition = Math.max(yPosition, 10 + logoHeight)
      }
    }

    // Cabeçalho do animal
    doc.setFontSize(18)
    doc.setTextColor(37, 99, 235)
    doc.setFont('helvetica', 'bold')
    doc.text(' FICHA COMPLETA DO ANIMAL', margin, yPosition)
    yPosition += 10

    // Identificação
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.text(`${animal.serie || ''}-${animal.rg || ''}`, margin, yPosition)
    if (animal.nome) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      yPosition += 7
      doc.text(`Nome: ${animal.nome}`, margin, yPosition)
    }
    yPosition += 10

    // Informações Básicas
    checkPageBreak(80)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('INFORMAÇÕES BÁSICAS', margin, yPosition)
    yPosition += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const basicInfo = []
    
    // Adicionar apenas campos com informações
    if (animal.sexo) basicInfo.push(['Sexo:', animal.sexo])
    if (animal.raca) basicInfo.push(['Raça:', animal.raca])
    if (animal.cor) basicInfo.push(['Cor:', animal.cor])
    if (animal.situacao) basicInfo.push(['Situação:', animal.situacao])
    if (animal.peso) basicInfo.push(['Peso:', `${animal.peso} kg`])
    
    // Tatuagem: usar série-RG se não tiver tatuagem específica
    const tatuagem = animal.tatuagem || (animal.serie && animal.rg ? `${animal.serie} ${animal.rg}` : null)
    if (tatuagem) basicInfo.push(['Tatuagem:', tatuagem])
    
    // É Doadora sempre mostrar
    basicInfo.push(['É Doadora:', (animal.is_doadora || (animal.fivs && animal.fivs.length > 0)) ? 'Sim' : 'Não'])

    let col1X = margin
    let col2X = margin + 70
    let col3X = margin + 140
    let currentCol = 0
    let rowY = yPosition

    basicInfo.forEach(([label, value], idx) => {
      if (idx > 0 && idx % 3 === 0) {
        rowY += 6
        currentCol = 0
      }
      
      const xPos = currentCol === 0 ? col1X : currentCol === 1 ? col2X : col3X
      doc.setFont('helvetica', 'bold')
      doc.text(label, xPos, rowY)
      doc.setFont('helvetica', 'normal')
      const labelWidth = doc.getTextWidth(label)
      doc.text(value, xPos + labelWidth + 2, rowY)
      
      currentCol++
      if (currentCol >= 3) {
        currentCol = 0
        rowY += 6
      }
    })

    yPosition = rowY + (currentCol > 0 ? 6 : 0) + 10

    // Nascimento
    checkPageBreak(50)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('NASCIMENTO', margin, yPosition)
    yPosition += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    // Data de nascimento com meses de vida - SEMPRE EXIBIR
    const dataNascimentoTexto = animal.data_nascimento ? formatDate(animal.data_nascimento) : 'Não informado'
    const mesesVida = animal.meses ? ` (${animal.meses} meses)` : ''
    yPosition += addText(`Data: ${dataNascimentoTexto}${mesesVida}`, margin, yPosition, { maxWidth: contentWidth / 2 })
    
    // Hora de nascimento
    if (animal.hora_nascimento) {
      yPosition += addText(`Hora: ${animal.hora_nascimento}`, margin + contentWidth / 2, yPosition - 5, { maxWidth: contentWidth / 2 })
    }
    
    // Peso ao nascer - apenas se tiver informação
    if (animal.peso_nascimento) {
      yPosition += addText(`Peso ao Nascer: ${animal.peso_nascimento} kg`, margin, yPosition, { maxWidth: contentWidth / 2 })
    }
    
    // Tipo de nascimento
    if (animal.tipo_nascimento) {
      yPosition += addText(`Tipo de Nascimento: ${animal.tipo_nascimento}`, margin + contentWidth / 2, yPosition - 5, { maxWidth: contentWidth / 2 })
    }
    
    // Dificuldade de parto
    if (animal.dificuldade_parto) {
      yPosition += addText(`Dificuldade de Parto: ${animal.dificuldade_parto}`, margin, yPosition, { maxWidth: contentWidth / 2 })
    }
    
    yPosition += 10
    
    // Informações Adicionais
    if (animal.veterinario || animal.abczg || animal.deca || animal.iabcz || animal.mgq || animal.top || animal.mgta) {
      checkPageBreak(40)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(50, 50, 50)
      doc.text('INFORMAÇÕES ADICIONAIS', margin, yPosition)
      yPosition += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      let infoCol = 0
      let infoRowY = yPosition
      
      const infoItems = []
      if (animal.veterinario) infoItems.push(['Veterinário:', animal.veterinario])
      if (animal.abczg) infoItems.push(['ABCZG:', animal.abczg])
      if (animal.deca) infoItems.push(['DECA:', animal.deca])
      if (animal.iabcz) infoItems.push(['IABCZ:', animal.iabcz])
      if (animal.mgq) infoItems.push(['MGQ:', animal.mgq])
      if (animal.top) infoItems.push(['TOP:', animal.top])
      if (animal.mgta) infoItems.push(['MGTA:', animal.mgta])
      
      infoItems.forEach(([label, value]) => {
        const xPos = infoCol === 0 ? margin : margin + contentWidth / 2
        doc.setFont('helvetica', 'bold')
        doc.text(String(label), xPos, infoRowY)
        doc.setFont('helvetica', 'normal')
        const labelWidth = doc.getTextWidth(String(label))
        doc.text(String(value), xPos + labelWidth + 2, infoRowY)
        infoCol++
        if (infoCol >= 2) {
          infoCol = 0
          infoRowY += 6
        }
      })
      
      yPosition = infoRowY + (infoCol > 0 ? 6 : 0) + 10
    }

    // Parentesco - SEMPRE EXIBIR
    checkPageBreak(50)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('PARENTESCO', margin, yPosition)
    yPosition += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    // Pai - SEMPRE EXIBIR
    const paiTexto = animal.pai || 'Não informado'
    yPosition += addText(`Pai: ${paiTexto}`, margin, yPosition, { maxWidth: contentWidth / 2 })
    
    // Mãe - SEMPRE EXIBIR
    const maeTexto = animal.mae || 'Não informado'
    yPosition += addText(`Mãe: ${maeTexto}`, margin + contentWidth / 2, yPosition - 5, { maxWidth: contentWidth / 2 })
    
    // Avô Materno
    const avoTexto = animal.avo_materno || animal.avoMaterno || 'Não informado'
    yPosition += addText(`Avô Materno: ${avoTexto}`, margin, yPosition, { maxWidth: contentWidth / 2 })
    
    // Receptora
    const receptoraTexto = animal.receptora || 'Não informado'
    yPosition += addText(`Receptora: ${receptoraTexto}`, margin + contentWidth / 2, yPosition - 5, { maxWidth: contentWidth / 2 })
    
    yPosition += 10

    // Informações Financeiras
    checkPageBreak(60)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('INFORMAÇÕES FINANCEIRAS', margin, yPosition)
    yPosition += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const financeInfo = [
      ['Valor de Venda:', formatCurrency(animal.valor_venda)],
      ['Valor Real:', formatCurrency(animal.valor_real)],
      ['Custo Total:', formatCurrency(animal.custo_total || 0)],
    ]
    
    let financeCol = 0
    let financeRowY = yPosition
    financeInfo.forEach(([label, value]) => {
      const xPos = financeCol === 0 ? margin : financeCol === 1 ? margin + contentWidth / 3 : margin + (contentWidth / 3) * 2
      doc.setFont('helvetica', 'bold')
      doc.text(label, xPos, financeRowY)
      doc.setFont('helvetica', 'normal')
      const labelWidth = doc.getTextWidth(label)
      doc.text(value, xPos + labelWidth + 2, financeRowY)
      
      financeCol++
      if (financeCol >= 3) {
        financeCol = 0
        financeRowY += 6
      }
    })
    
    yPosition = financeRowY + (financeCol > 0 ? 6 : 0) + 10
    
    // Calcular lucro/prejuízo se tiver valor de venda e custo
    if (animal.valor_venda && animal.custo_total) {
      const lucro = parseFloat(animal.valor_venda) - parseFloat(animal.custo_total || 0)
      const corLucro = lucro >= 0 ? [34, 197, 94] : [239, 68, 68]
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...corLucro)
      yPosition += addText(`Lucro/Prejuízo: ${formatCurrency(lucro)}`, margin, yPosition)
      doc.setTextColor(0, 0, 0)
      yPosition += 8
    }
    
    // Histórico de Custos Detalhado (se disponível)
    if (animal.custos && Array.isArray(animal.custos) && animal.custos.length > 0) {
      checkPageBreak(50)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(50, 50, 50)
      doc.text('HISTÓRICO DE CUSTOS DETALHADO', margin, yPosition)
      yPosition += 8
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      
      // Cabeçalho da tabela
      doc.setFont('helvetica', 'bold')
      doc.text('Data', margin, yPosition)
      doc.text('Tipo', margin + 40, yPosition)
      doc.text('Subtipo', margin + 80, yPosition)
      doc.text('Valor', margin + 130, yPosition)
      yPosition += 6
      
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2)
      yPosition += 4
      
      doc.setFont('helvetica', 'normal')
      let totalCustos = 0
      
      animal.custos.slice(0, 10).forEach((custo) => { // Limitar a 10 custos para não sobrecarregar
        checkPageBreak(15)
        
        const custoData = custo.data || custo.data_custo || 'N/A'
        const custoTipo = custo.tipo || 'N/A'
        const custoSubtipo = custo.subtipo || '-'
        const custoValor = parseFloat(custo.valor || 0)
        totalCustos += custoValor
        
        // Destacar custos de exames andrológicos
        const isAndrologico = custoTipo === 'Exame' && custoSubtipo === 'Andrológico'
        if (isAndrologico) {
          doc.setTextColor(219, 39, 119) // Rosa
        }
        
        doc.text(formatDate(custoData), margin, yPosition)
        doc.text(custoTipo.substring(0, 15), margin + 40, yPosition)
        doc.text(custoSubtipo.substring(0, 20), margin + 80, yPosition)
        doc.text(formatCurrency(custoValor), margin + 130, yPosition)
        
        if (isAndrologico) {
          doc.setTextColor(0, 0, 0) // Voltar ao preto
        }
        
        yPosition += 5
      })
      
      if (animal.custos.length > 10) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8)
        doc.text(`... e mais ${animal.custos.length - 10} custo(s)`, margin, yPosition)
        yPosition += 5
      }
      
      // Total dos custos exibidos
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 5
      doc.text(`Total dos Custos Exibidos: ${formatCurrency(totalCustos)}`, margin + 80, yPosition)
      yPosition += 10
    }

    // Exames Andrológicos (apenas para machos)
    const animalRG = String(animal.rg || '').trim()
    const examesAnimal = examesAndrologicos[animalRG] || []
    
    if ((animal.sexo && (animal.sexo.toLowerCase().includes('macho') || animal.sexo === 'M')) && examesAnimal.length > 0) {
      checkPageBreak(50)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(50, 50, 50)
      doc.text('EXAMES ANDROLÓGICOS', margin, yPosition)
      yPosition += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      examesAnimal.forEach((exame, idx) => {
        checkPageBreak(40)
        
        // Linha separadora entre exames
        if (idx > 0) {
          doc.setDrawColor(220, 220, 220)
          doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2)
          yPosition += 5
        }
        
        // Resultado com cor
        const resultado = exame.resultado || 'Pendente'
        let corResultado = [0, 0, 0]
        if (resultado === 'Apto') corResultado = [34, 197, 94] // Verde
        else if (resultado === 'Inapto') corResultado = [239, 68, 68] // Vermelho
        else corResultado = [234, 179, 8] // Amarelo

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(...corResultado)
        doc.text(`Exame Andrológico ${idx + 1}: ${resultado}`, margin, yPosition)
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        yPosition += 7
        
        // Data do exame
        const dataExame = formatDate(exame.data_exame || exame.data)
        yPosition += addText(`Data: ${dataExame}`, margin, yPosition, { maxWidth: contentWidth / 2 })
        
        // C.E
        if (exame.ce) {
          yPosition += addText(`CE: ${exame.ce} cm`, margin + contentWidth / 2, yPosition - 5, { maxWidth: contentWidth / 2 })
        }
        
        // Status do exame
        if (exame.status) {
          yPosition += addText(`Status: ${exame.status}`, margin, yPosition, { maxWidth: contentWidth / 2 })
        }
        
        // Reagendamento
        if (exame.reagendado) {
          const dataReagendamento = exame.data_reagendamento ? formatDate(exame.data_reagendamento) : 'Não definida'
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(59, 130, 246)
          yPosition += addText(`Reagendado para: ${dataReagendamento}`, margin + contentWidth / 2, yPosition - 5, { fontSize: 9, color: [59, 130, 246] })
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
        }
        
        // Defeitos encontrados
        if (exame.defeitos) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(239, 68, 68)
          yPosition += addText(`Defeitos: ${exame.defeitos}`, margin, yPosition, { fontSize: 9, color: [239, 68, 68] })
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
        }
        
        // Observações do exame
        if (exame.observacoes) {
          yPosition += addText(`Observações: ${exame.observacoes}`, margin, yPosition, { fontSize: 9 })
        }
        
        // ID do exame (se disponível)
        if (exame.id) {
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          yPosition += addText(`ID: ${exame.id}`, margin, yPosition, { fontSize: 8 })
          doc.setTextColor(0, 0, 0)
        }
        
        yPosition += 10
      })
      
      // Resumo dos exames
      if (examesAnimal.length > 1) {
        checkPageBreak(20)
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 5
        
        const aptos = examesAnimal.filter(e => e.resultado === 'Apto').length
        const inaptos = examesAnimal.filter(e => e.resultado === 'Inapto').length
        const pendentes = examesAnimal.filter(e => e.resultado === 'Pendente' || !e.resultado).length
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(50, 50, 50)
        doc.text(`Resumo: ${aptos} Apto(s) | ${inaptos} Inapto(s) | ${pendentes} Pendente(s)`, margin, yPosition)
        yPosition += 8
      }
    }

    // Coletas FIV - Doadora de Oócitos
    if (animal.fivs && Array.isArray(animal.fivs) && animal.fivs.length > 0) {
      checkPageBreak(80)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(219, 39, 119) // Rosa/Pink
      doc.text('DOADORA DE OÓCITOS (FIV)', margin, yPosition)
      yPosition += 8

      // Calcular estatísticas
      const totalColetas = animal.fivs.length
      const totalOocitos = animal.fivs.reduce((sum, fiv) => sum + (parseInt(fiv.quantidade_oocitos) || 0), 0)
      const mediaOocitos = totalColetas > 0 ? (totalOocitos / totalColetas).toFixed(1) : 0
      
      // Ordenar coletas por data
      const coletasOrdenadas = [...animal.fivs].sort((a, b) => 
        new Date(a.data_fiv) - new Date(b.data_fiv)
      )
      const primeiraColeta = coletasOrdenadas[0]
      const ultimaColeta = coletasOrdenadas[coletasOrdenadas.length - 1]

      // Resumo em grid
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      
      const resumoFIV = [
        ['Total de Coletas:', totalColetas],
        ['Total de Oócitos:', totalOocitos],
        ['Média por Coleta:', `${mediaOocitos} oócitos`],
        ['Primeira Coleta:', formatDate(primeiraColeta.data_fiv)],
        ['Última Coleta:', formatDate(ultimaColeta.data_fiv)],
      ]

      let colFIV = 0
      let rowYFIV = yPosition
      resumoFIV.forEach(([label, value]) => {
        const xPos = colFIV === 0 ? margin : margin + contentWidth / 2
        doc.setFont('helvetica', 'bold')
        doc.text(String(label), xPos, rowYFIV)
        const labelWidth = doc.getTextWidth(String(label))
        doc.setFont('helvetica', 'normal')
        doc.text(String(value), xPos + labelWidth + 2, rowYFIV)
        
        colFIV++
        if (colFIV >= 2) {
          colFIV = 0
          rowYFIV += 6
        }
      })
      yPosition = rowYFIV + (colFIV > 0 ? 6 : 0) + 8

      // Tabela de Histórico de Coletas
      checkPageBreak(50)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(219, 39, 119)
      doc.text('HISTÓRICO DE COLETAS FIV', margin, yPosition)
      yPosition += 6

      // Cabeçalho da tabela
      doc.setFontSize(9)
      doc.setFillColor(250, 200, 220) // Fundo rosa claro
      doc.rect(margin, yPosition - 4, contentWidth, 6, 'F')
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'bold')
      doc.text('Data FIV', margin + 2, yPosition)
      doc.text('Laboratório', margin + 35, yPosition)
      doc.text('Veterinário', margin + 85, yPosition)
      doc.text('Touro', margin + 135, yPosition)
      doc.text('Oócitos', margin + 170, yPosition)
      doc.text('Data Transf.', margin + 195, yPosition)
      yPosition += 6

      // Linhas da tabela
      doc.setFont('helvetica', 'normal')
      animal.fivs.forEach((fiv) => {
        checkPageBreak(10)
        
        const dataFIV = formatDate(fiv.data_fiv)
        const laboratorio = (fiv.laboratorio || '-').substring(0, 20)
        const veterinario = (fiv.veterinario || '-').substring(0, 20)
        const touro = (fiv.touro || '-').substring(0, 15)
        const oocitos = fiv.quantidade_oocitos || 0
        const dataTransf = fiv.data_transferencia ? formatDate(fiv.data_transferencia) : '-'

        doc.text(dataFIV, margin + 2, yPosition)
        doc.text(laboratorio, margin + 35, yPosition)
        doc.text(veterinario, margin + 85, yPosition)
        doc.text(touro, margin + 135, yPosition)
        doc.setFont('helvetica', 'bold')
        doc.text(String(oocitos), margin + 170, yPosition)
        doc.setFont('helvetica', 'normal')
        doc.text(dataTransf, margin + 195, yPosition)

        yPosition += 5
      })

      // Observações gerais das coletas (se houver)
      const coletasComObservacoes = animal.fivs.filter(fiv => fiv.observacoes)
      if (coletasComObservacoes.length > 0) {
        checkPageBreak(30)
        yPosition += 5
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.text('Observações das Coletas:', margin, yPosition)
        yPosition += 6
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        coletasComObservacoes.forEach((fiv) => {
          checkPageBreak(15)
          doc.text(`Data ${formatDate(fiv.data_fiv)}: ${fiv.observacoes}`, margin + 5, yPosition, { maxWidth: contentWidth - 10 })
          yPosition += 5
        })
      }

      yPosition += 10
    }

    // Resumo Reprodutivo (TE)
    const stats = reproducaoStatsMap[animal.id]
    
    if (stats) {
      checkPageBreak(60)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(50, 50, 50)
      doc.text('RESUMO REPRODUTIVO (TE)', margin, yPosition)
      yPosition += 8

      // Summary Grid
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      const summaryData = [
        ['Total Produzido:', stats.total],
        ['Nascidos/Paridos:', stats.nascidos],
        ['Machos:', `${stats.machos} (${stats.total > 0 ? ((stats.machos/stats.total)*100).toFixed(0) : 0}%)`],
        ['Fêmeas:', `${stats.femeas} (${stats.total > 0 ? ((stats.femeas/stats.total)*100).toFixed(0) : 0}%)`],
      ]

      let col = 0
      let rowY = yPosition
      summaryData.forEach(([label, value]) => {
          const xPos = col === 0 ? margin : margin + contentWidth / 2
          doc.setFont('helvetica', 'bold')
          doc.text(String(label), xPos, rowY)
          const labelWidth = doc.getTextWidth(String(label))
          doc.setFont('helvetica', 'normal')
          doc.text(String(value), xPos + labelWidth + 2, rowY)
          
          col++
          if (col >= 2) {
              col = 0
              rowY += 6
          }
      })
      yPosition = rowY + (col > 0 ? 6 : 0) + 4

      // Partners Table
      if (stats.parceiros && Object.keys(stats.parceiros).length > 0) {
          const isMacho = animal.sexo && (animal.sexo.toLowerCase().startsWith('m') || animal.sexo === 'M')
          const tableTitle = isMacho ? 'Doadoras Utilizadas' : 'Touros Utilizados'
          
          doc.setFont('helvetica', 'bold')
          doc.text(tableTitle, margin, yPosition)
          yPosition += 6

          // Table Header
          doc.setFontSize(9)
          doc.setFillColor(240, 240, 240)
          doc.rect(margin, yPosition - 4, contentWidth, 6, 'F')
          doc.text('Nome', margin + 2, yPosition)
          doc.text('Total', margin + 100, yPosition)
          doc.text('Fêmeas', margin + 125, yPosition)
          doc.text('Machos', margin + 150, yPosition)
          yPosition += 6

          // Table Rows
          doc.setFont('helvetica', 'normal')
          Object.entries(stats.parceiros).forEach(([name, data]) => {
              checkPageBreak(10)
              doc.text(name.substring(0, 45), margin + 2, yPosition)
              doc.text(String(data.total), margin + 100, yPosition)
              doc.text(String(data.femeas), margin + 125, yPosition)
              doc.text(String(data.machos), margin + 150, yPosition)
              yPosition += 5
          })
          yPosition += 5
      }

      // Prenhezes Ativas (Active Pregnancies)
      if (stats.prenhezes_ativas && stats.prenhezes_ativas.length > 0) {
          checkPageBreak(30)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(34, 197, 94) // Green
          doc.text(`Prenhezes Ativas (${stats.prenhezes_ativas.length})`, margin, yPosition)
          yPosition += 6

          // Table Header
          doc.setFontSize(9)
          doc.setTextColor(0, 0, 0)
          doc.setFillColor(230, 255, 230) // Light green background
          doc.rect(margin, yPosition - 4, contentWidth, 6, 'F')
          doc.text('Data TE', margin + 2, yPosition)
          doc.text('Previsão Parto', margin + 35, yPosition)
          doc.text('Dias Restantes', margin + 70, yPosition)
          doc.text('Acasalamento', margin + 105, yPosition)
          doc.text('Sexo', margin + 160, yPosition)
          yPosition += 6

          // Table Rows
          doc.setFont('helvetica', 'normal')
          stats.prenhezes_ativas.forEach((prenhez) => {
              checkPageBreak(10)
              
              const dataTE = formatDate(prenhez.data_te)
              const previsaoParto = formatDate(prenhez.previsao_parto)
              const diasRestantes = prenhez.dias_restantes
              const parceiro = animal.sexo && (animal.sexo.toLowerCase().startsWith('m') || animal.sexo === 'M') 
                  ? (prenhez.doadora_nome || 'Não Inf.') 
                  : (prenhez.touro || 'Não Inf.')
              const sexoPrevisto = prenhez.sexo_prenhez || '?'

              doc.text(dataTE, margin + 2, yPosition)
              
              // Highlight due date
              doc.setFont('helvetica', 'bold')
              doc.text(previsaoParto, margin + 35, yPosition)
              doc.setFont('helvetica', 'normal')

              // Highlight urgent due dates
              if (diasRestantes <= 30) {
                  doc.setTextColor(220, 38, 38) // Red
                  doc.setFont('helvetica', 'bold')
              } else if (diasRestantes <= 60) {
                  doc.setTextColor(217, 119, 6) // Orange
              }
              doc.text(`${diasRestantes} dias`, margin + 70, yPosition)
              doc.setTextColor(0, 0, 0) // Reset color
              doc.setFont('helvetica', 'normal')

              doc.text(parceiro.substring(0, 25), margin + 105, yPosition)
              doc.text(sexoPrevisto, margin + 160, yPosition)

              yPosition += 5
          })
          yPosition += 5
      }

      yPosition += 5
    }

    // Resumo de Transferências de Embriões (detalhado)
    const transferencias = transferenciasEmbrioesMap[animal.id] || []
    if (transferencias.length > 0) {
      checkPageBreak(80)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(219, 39, 119) // Rosa/Pink
      doc.text('TRANSFERÊNCIAS DE EMBRIÕES', margin, yPosition)
      yPosition += 8

      // Separar por tipo (doadora, receptora, touro)
      // Função auxiliar para verificar se a transferência pertence ao animal
      const pertenceAoAnimal = (te, tipo) => {
        // Verificar por ID primeiro (mais confiável)
        if (tipo === 'doadora' && te.doadora_id === animal.id) return true
        if (tipo === 'receptora' && te.receptora_id === animal.id) return true
        if (tipo === 'touro' && te.touro_id === animal.id) return true
        
        // Verificar por nome (quando ID não está disponível)
        if (tipo === 'doadora' && te.doadora_nome) {
          const nome = te.doadora_nome.toLowerCase()
          const serie = animal.serie ? animal.serie.toLowerCase() : ''
          const rg = animal.rg ? animal.rg.toString() : ''
          // Verificar se contém série e RG, ou formato "SERIE (RG: RG)"
          if ((nome.includes(serie) && nome.includes(rg)) || 
              nome.includes(`${serie} (rg: ${rg})`) || 
              nome.includes(`${serie}(rg: ${rg})`)) {
            return true
          }
        }
        
        if (tipo === 'receptora' && te.receptora_nome) {
          const nome = te.receptora_nome.toLowerCase()
          const serie = animal.serie ? animal.serie.toLowerCase() : ''
          const rg = animal.rg ? animal.rg.toString() : ''
          // Para receptoras, pode ser formato "G RG" ou "SERIE RG"
          if (nome.includes(rg) || (serie && nome.includes(serie))) {
            return true
          }
        }
        
        if (tipo === 'touro' && te.touro) {
          const nome = te.touro.toLowerCase()
          const serie = animal.serie ? animal.serie.toLowerCase() : ''
          const rg = animal.rg ? animal.rg.toString() : ''
          if (nome.includes(serie) || nome.includes(rg)) {
            return true
          }
        }
        
        return false
      }
      
      const comoDoadora = transferencias.filter(t => pertenceAoAnimal(t, 'doadora'))
      const comoReceptora = transferencias.filter(t => pertenceAoAnimal(t, 'receptora'))
      const comoTouro = transferencias.filter(t => pertenceAoAnimal(t, 'touro'))

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)

      // Resumo geral
      const resumoTE = []
      if (comoDoadora.length > 0) {
        resumoTE.push(['Como Doadora:', `${comoDoadora.length} transferência(s)`])
      }
      if (comoReceptora.length > 0) {
        resumoTE.push(['Como Receptora:', `${comoReceptora.length} transferência(s)`])
      }
      if (comoTouro.length > 0) {
        resumoTE.push(['Como Touro:', `${comoTouro.length} transferência(s)`])
      }

      if (resumoTE.length > 0) {
        let colTE = 0
        let rowYTE = yPosition
        resumoTE.forEach(([label, value]) => {
          const xPos = colTE === 0 ? margin : margin + contentWidth / 2
          doc.setFont('helvetica', 'bold')
          doc.text(String(label), xPos, rowYTE)
          const labelWidth = doc.getTextWidth(String(label))
          doc.setFont('helvetica', 'normal')
          doc.text(String(value), xPos + labelWidth + 2, rowYTE)
          
          colTE++
          if (colTE >= 2) {
            colTE = 0
            rowYTE += 6
          }
        })
        yPosition = rowYTE + (colTE > 0 ? 6 : 0) + 8
      }

      // Tabela de Transferências como Doadora
      if (comoDoadora.length > 0) {
        checkPageBreak(50)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(219, 39, 119)
        doc.text(`Transferências como Doadora (${comoDoadora.length})`, margin, yPosition)
        yPosition += 6

        // Cabeçalho da tabela
        doc.setFontSize(9)
        doc.setFillColor(250, 200, 220) // Fundo rosa claro
        doc.rect(margin, yPosition - 4, contentWidth, 6, 'F')
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        doc.text('Data TE', margin + 2, yPosition)
        doc.text('Receptora', margin + 35, yPosition)
        doc.text('Touro', margin + 100, yPosition)
        doc.text('Status', margin + 160, yPosition)
        doc.text('Sexo', margin + 190, yPosition)
        yPosition += 6

        // Linhas da tabela
        doc.setFont('helvetica', 'normal')
        comoDoadora.slice(0, 10).forEach((te) => { // Limitar a 10 para não sobrecarregar
          checkPageBreak(10)
          
          const dataTE = formatDate(te.data_te)
          const receptora = (te.receptora_nome || '-').substring(0, 30)
          const touro = (te.touro || '-').substring(0, 25)
          const status = te.status || 'Realizada'
          const sexoPrenhez = te.sexo_prenhez || '-'

          doc.text(dataTE, margin + 2, yPosition)
          doc.text(receptora, margin + 35, yPosition)
          doc.text(touro, margin + 100, yPosition)
          
          // Colorir status
          if (status === 'Nascido' || status === 'Parida' || status === 'Concluída') {
            doc.setTextColor(34, 197, 94) // Verde
          } else if (status === 'Negativo' || status === 'Falha' || status === 'Aborto') {
            doc.setTextColor(239, 68, 68) // Vermelho
          } else {
            doc.setTextColor(234, 179, 8) // Amarelo
          }
          doc.text(status, margin + 160, yPosition)
          doc.setTextColor(0, 0, 0) // Reset
          
          doc.text(sexoPrenhez, margin + 190, yPosition)

          yPosition += 5
        })
        
        if (comoDoadora.length > 10) {
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(8)
          doc.text(`... e mais ${comoDoadora.length - 10} transferência(s)`, margin, yPosition)
          yPosition += 5
        }
        
        yPosition += 5
      }

      // Tabela de Transferências como Receptora
      if (comoReceptora.length > 0) {
        checkPageBreak(50)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(219, 39, 119)
        doc.text(`Transferências como Receptora (${comoReceptora.length})`, margin, yPosition)
        yPosition += 6

        // Cabeçalho da tabela
        doc.setFontSize(9)
        doc.setFillColor(250, 200, 220) // Fundo rosa claro
        doc.rect(margin, yPosition - 4, contentWidth, 6, 'F')
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        doc.text('Data TE', margin + 2, yPosition)
        doc.text('Doadora', margin + 35, yPosition)
        doc.text('Touro', margin + 100, yPosition)
        doc.text('Status', margin + 160, yPosition)
        doc.text('Sexo', margin + 190, yPosition)
        yPosition += 6

        // Linhas da tabela
        doc.setFont('helvetica', 'normal')
        comoReceptora.slice(0, 10).forEach((te) => { // Limitar a 10
          checkPageBreak(10)
          
          const dataTE = formatDate(te.data_te)
          const doadora = (te.doadora_nome || '-').substring(0, 30)
          const touro = (te.touro || '-').substring(0, 25)
          const status = te.status || 'Realizada'
          const sexoPrenhez = te.sexo_prenhez || '-'

          doc.text(dataTE, margin + 2, yPosition)
          doc.text(doadora, margin + 35, yPosition)
          doc.text(touro, margin + 100, yPosition)
          
          // Colorir status
          if (status === 'Nascido' || status === 'Parida' || status === 'Concluída') {
            doc.setTextColor(34, 197, 94) // Verde
          } else if (status === 'Negativo' || status === 'Falha' || status === 'Aborto') {
            doc.setTextColor(239, 68, 68) // Vermelho
          } else {
            doc.setTextColor(234, 179, 8) // Amarelo
          }
          doc.text(status, margin + 160, yPosition)
          doc.setTextColor(0, 0, 0) // Reset
          
          doc.text(sexoPrenhez, margin + 190, yPosition)

          yPosition += 5
        })
        
        if (comoReceptora.length > 10) {
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(8)
          doc.text(`... e mais ${comoReceptora.length - 10} transferência(s)`, margin, yPosition)
          yPosition += 5
        }
        
        yPosition += 5
      }

      // Tabela de Transferências como Touro
      if (comoTouro.length > 0) {
        checkPageBreak(50)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(219, 39, 119)
        doc.text(`Transferências como Touro (${comoTouro.length})`, margin, yPosition)
        yPosition += 6

        // Cabeçalho da tabela
        doc.setFontSize(9)
        doc.setFillColor(250, 200, 220) // Fundo rosa claro
        doc.rect(margin, yPosition - 4, contentWidth, 6, 'F')
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        doc.text('Data TE', margin + 2, yPosition)
        doc.text('Doadora', margin + 35, yPosition)
        doc.text('Receptora', margin + 100, yPosition)
        doc.text('Status', margin + 160, yPosition)
        doc.text('Sexo', margin + 190, yPosition)
        yPosition += 6

        // Linhas da tabela
        doc.setFont('helvetica', 'normal')
        comoTouro.slice(0, 10).forEach((te) => { // Limitar a 10
          checkPageBreak(10)
          
          const dataTE = formatDate(te.data_te)
          const doadora = (te.doadora_nome || '-').substring(0, 30)
          const receptora = (te.receptora_nome || '-').substring(0, 25)
          const status = te.status || 'Realizada'
          const sexoPrenhez = te.sexo_prenhez || '-'

          doc.text(dataTE, margin + 2, yPosition)
          doc.text(doadora, margin + 35, yPosition)
          doc.text(receptora, margin + 100, yPosition)
          
          // Colorir status
          if (status === 'Nascido' || status === 'Parida' || status === 'Concluída') {
            doc.setTextColor(34, 197, 94) // Verde
          } else if (status === 'Negativo' || status === 'Falha' || status === 'Aborto') {
            doc.setTextColor(239, 68, 68) // Vermelho
          } else {
            doc.setTextColor(234, 179, 8) // Amarelo
          }
          doc.text(status, margin + 160, yPosition)
          doc.setTextColor(0, 0, 0) // Reset
          
          doc.text(sexoPrenhez, margin + 190, yPosition)

          yPosition += 5
        })
        
        if (comoTouro.length > 10) {
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(8)
          doc.text(`... e mais ${comoTouro.length - 10} transferência(s)`, margin, yPosition)
          yPosition += 5
        }
        
        yPosition += 5
      }

      yPosition += 5
    }

    // Observações - SEMPRE EXIBIR
    checkPageBreak(40)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('OBSERVAÇÕES', margin, yPosition)
    yPosition += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const observacoesTexto = animal.observacoes || 'Nenhuma observação registrada'
    yPosition += addText(observacoesTexto, margin, yPosition, { maxWidth: contentWidth })
    yPosition += 10
    
    // Informações do Sistema
    checkPageBreak(30)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text('INFORMAÇÕES DO SISTEMA', margin, yPosition)
    yPosition += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    
    const infoSistema = []
    if (animal.created_at) {
      infoSistema.push(`Cadastrado em: ${formatDate(animal.created_at)}`)
    }
    if (animal.updated_at && animal.updated_at !== animal.created_at) {
      infoSistema.push(`Última atualização: ${formatDate(animal.updated_at)}`)
    }
    if (animal.id) {
      infoSistema.push(`ID do Sistema: ${animal.id}`)
    }
    
    if (infoSistema.length > 0) {
      infoSistema.forEach((info, idx) => {
        const xPos = idx % 2 === 0 ? margin : margin + contentWidth / 2
        const yPos = yPosition + (Math.floor(idx / 2) * 5)
        doc.text(info, xPos, yPos, { maxWidth: contentWidth / 2 })
      })
      yPosition += Math.ceil(infoSistema.length / 2) * 5 + 5
    } else {
      yPosition += 5
    }
    
    doc.setTextColor(0, 0, 0) // Voltar ao preto
  }

  // Rodapé em todas as páginas
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.setFont('helvetica', 'normal')
    doc.text(`Página ${i} de ${pageCount}`, margin, doc.internal.pageSize.getHeight() - 10)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin - 60, doc.internal.pageSize.getHeight() - 10)
    doc.text('© Beef-Sync - Sistema de Gestão Pecuária', pageWidth / 2 - 40, doc.internal.pageSize.getHeight() - 10)
  }

  return doc
}

