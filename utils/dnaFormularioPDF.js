import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generateDNAFormularioVRGEN = async (dados) => {
  console.log('ðÅ¸Å½¨ Gerando PDF com dados:', dados)
  
  const {
    dataEnvio,
    dataColeta,
    proprietario,
    responsavel,
    raca,
    emailAssociacao,
    emailFazenda,
    tipoExame,
    animais,
    observacoes
  } = dados

  console.log('ðÅ¸�â€ž Animais recebidos no gerador:', animais)
  console.log('ðÅ¸â€œÅ  Quantidade de animais:', animais?.length)

  // Validar se hÃ¡ animais
  if (!animais || animais.length === 0) {
    console.error('â�Å’ Nenhum animal fornecido para gerar PDF')
    throw new Error('Nenhum animal fornecido para gerar o PDF')
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })
  
  // Garantir que autoTable estÃ¡ disponÃ­vel
  if (!doc.autoTable && typeof autoTable === 'function') {
    // Registrar autoTable no doc se necessÃ¡rio
    doc.autoTable = autoTable
  }

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Tentar carregar logotipo
  let logoBase64 = null
  try {
    const logoPaths = [
      '/logo-santanna.png.jpg',
      '/logo-santanna.jpg',
      '/Logotipo Fazendas Sant\'Anna.jpg',
      '/Logotipo%20Fazendas%20Sant%27Anna.jpg'
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
    console.warn('âÅ¡ ï¸� Erro ao carregar logotipo:', error)
  }

  // CabeÃ§alho preto
  doc.setFillColor(0, 0, 0)
  doc.rect(0, 0, pageWidth, 15, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('ANIMAIS PARA DNA', pageWidth / 2, 10, { align: 'center' })

  // Adicionar logotipo se disponÃ­vel
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', pageWidth - 50, 2, 45, 12)
      // Texto abaixo do logo
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('FAZENDAS SANT\'ANNA', pageWidth - 25, 16, { align: 'center' })
      doc.setFontSize(7)
      doc.text('A GENÃâ€°TICA DA CARNE', pageWidth - 25, 19, { align: 'center' })
    } catch (e) {
      console.warn('Erro ao adicionar logo:', e)
    }
  }

  // InformaÃ§Ãµes do cabeÃ§alho
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  let yPos = 25

  // Linha 1: Data Envio e Data Coleta
  doc.setFont('helvetica', 'bold')
  doc.text('DATA ENVIO:', 15, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(dataEnvio || '', 45, yPos)

  doc.setFont('helvetica', 'bold')
  doc.text('DATA DA COLETA:', 150, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(dataColeta || '', 190, yPos)

  yPos += 7

  // Linha 2: ProprietÃ¡rio e ResponsÃ¡vel
  doc.setFont('helvetica', 'bold')
  doc.text('PROPRIETÃ�RIO:', 15, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(proprietario || '', 45, yPos)

  doc.setFont('helvetica', 'bold')
  doc.text('RESPONSÃ�VEL:', 150, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(responsavel || '', 190, yPos)

  yPos += 7

  // Linha 3: RaÃ§a
  doc.setFont('helvetica', 'bold')
  doc.text('RAÃâ€¡A:', 15, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(raca || 'NELORE', 45, yPos)

  yPos += 7

  // Linha 4: E-mails
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const emailText = `E-mail para envio a AssociaÃ§Ã£o ABCZ (LAUDOS): ${emailAssociacao || ''}`
  doc.text(emailText, 15, yPos)

  yPos += 5

  doc.text(`Fazenda: ${emailFazenda || ''}`, 15, yPos)

  yPos += 10

  // Tabela de animais - estrutura conforme a planilha
  const tableHeaders = [
    'Para uso LaboratÃ³rio',
    'SÃ©r',
    'RG',
    'raÃ§a',
    'Tipo Exame',
    '', // Coluna sem cabeÃ§alho (sexo)
    'Nascimento',
    'Mes',
    'SÃ©rie Pa',
    'Rg Pa',
    'Nome do Pai',
    'SÃ©rie MÃ£',
    'Rg MÃ£',
    'Nome da MÃ£e',
    'OBS'
  ]

  // Preparar dados da tabela
  const tableData = animais.map((animal, index) => {
    // Calcular meses se nÃ£o fornecido
    let meses = animal.meses || ''
    if (!meses && animal.data_nascimento) {
      try {
        const hoje = new Date()
        const nascimento = new Date(animal.data_nascimento)
        const diffTime = Math.abs(hoje - nascimento)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        meses = Math.floor(diffDays / 30).toString()
      } catch (e) {
        meses = ''
      }
    }

    // Tipo de exame: pode ser por animal ou global
    const tipoExameAnimal = animal.tipoExame || animal.tipo_exame || tipoExame || ''

    // Formatar data de nascimento
    let dataNascimento = ''
    if (animal.data_nascimento) {
      try {
        const data = new Date(animal.data_nascimento)
        if (!isNaN(data.getTime())) {
          dataNascimento = data.toLocaleDateString('pt-BR')
        }
      } catch (e) {
        console.warn('Erro ao formatar data de nascimento:', e)
      }
    }

    return [
      (index + 1).toString(), // Para uso LaboratÃ³rio
      String(animal.serie || ''), // SÃ©r
      String(animal.rg || ''), // RG
      String(animal.raca || raca || 'NELORE'), // raÃ§a
      String(animal.tipoExame || animal.tipo_exame || tipoExame || ''), // Tipo Exame
      String(animal.sexo || ''), // Sexo (sem cabeÃ§alho)
      dataNascimento, // Nascimento
      String(meses), // Mes
      String(animal.serie_pai || ''), // SÃ©rie Pa
      String(animal.rg_pai || ''), // Rg Pa
      String(animal.nome_pai || ''), // Nome do Pai
      String(animal.serie_mae || ''), // SÃ©rie MÃ£
      String(animal.rg_mae || ''), // Rg MÃ£
      String(animal.nome_mae || ''), // Nome da MÃ£e
      String(animal.observacoes || '') // OBS
    ]
  })

  console.log('ðÅ¸â€œâ€¹ Dados da tabela preparados:', tableData.length, 'linhas')

  // Gerar tabela
  try {
    // Validar dados antes de gerar tabela
    if (!tableData || tableData.length === 0) {
      throw new Error('Nenhum dado de animal para gerar tabela')
    }

    console.log('ðÅ¸â€œÅ  Gerando tabela com', tableData.length, 'linhas e', tableHeaders.length, 'colunas')
    console.log('ðÅ¸â€œâ€¹ Primeira linha de dados:', tableData[0])
    console.log('ðÅ¸â€œâ€¹ Headers:', tableHeaders)

    // Executar autoTable de forma robusta (mesma abordagem do exportUtils.js)
    // Tentar doc.autoTable primeiro, depois a funÃ§Ã£o importada
    let runAutoTable = doc.autoTable
    
    if (typeof runAutoTable !== 'function') {
      runAutoTable = typeof autoTable === 'function' ? autoTable : (autoTable?.default || autoTable)
    }
    
    if (typeof runAutoTable !== 'function') {
      console.error('â�Å’ autoTable nÃ£o Ã© uma funÃ§Ã£o. Tipo:', typeof autoTable)
      console.error('â�Å’ autoTable:', autoTable)
      console.error('â�Å’ doc.autoTable:', doc.autoTable)
      throw new Error('Falha ao carregar plugin de tabela PDF')
    }
    
    console.log('âÅ“â€¦ autoTable carregado corretamente, tipo:', typeof runAutoTable)

    // Calcular largura total disponÃ­vel (pÃ¡gina landscape A4 = 297mm, menos margens)
    const availableWidth = pageWidth - 20 // 10mm de margem de cada lado
    
    const tableConfig = {
      startY: yPos,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 6,
        cellPadding: 1,
        overflow: 'linebreak',
        halign: 'center',
        valign: 'middle',
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        fontSize: 6
      },
      bodyStyles: {
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
        fontSize: 6
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' }, // Para uso LaboratÃ³rio
        1: { cellWidth: 12, halign: 'center' }, // SÃ©r
        2: { cellWidth: 12, halign: 'center' }, // RG
        3: { cellWidth: 14, halign: 'center' }, // raÃ§a
        4: { cellWidth: 18, halign: 'center' }, // Tipo Exame
        5: { cellWidth: 10, halign: 'center' },  // Sexo (aumentado de 6 para 10)
        6: { cellWidth: 18, halign: 'center' }, // Nascimento
        7: { cellWidth: 8, halign: 'center' }, // Mes
        8: { cellWidth: 12, halign: 'center' }, // SÃ©rie Pa
        9: { cellWidth: 12, halign: 'center' }, // Rg Pa
        10: { cellWidth: 30, halign: 'left' },  // Nome do Pai (aumentado de 20 para 30)
        11: { cellWidth: 12, halign: 'center' }, // SÃ©rie MÃ£
        12: { cellWidth: 12, halign: 'center' }, // Rg MÃ£
        13: { cellWidth: 30, halign: 'left' },   // Nome da MÃ£e (aumentado de 20 para 30)
        14: { cellWidth: 20, halign: 'left' }    // OBS (aumentado de 12 para 20)
      },
      margin: { left: 10, right: 10 },
      didDrawPage: function (data) {
        // Garantir que o conteÃºdo seja desenhado
        console.log('ðÅ¸â€œâ€ž PÃ¡gina desenhada:', data.pageNumber)
      }
    }
    
    console.log('ðÅ¸â€�§ Chamando autoTable com configuraÃ§Ã£o:', {
      startY: tableConfig.startY,
      headRows: tableConfig.head.length,
      bodyRows: tableConfig.body.length
    })
    
    runAutoTable(doc, tableConfig)
    
    // Verificar se a tabela foi gerada
    if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
      console.log('âÅ“â€¦ Tabela gerada com sucesso. Final Y:', doc.lastAutoTable.finalY)
    } else {
      console.warn('âÅ¡ ï¸� Tabela pode nÃ£o ter sido gerada. doc.lastAutoTable:', doc.lastAutoTable)
    }
  } catch (error) {
    console.error('â�Å’ Erro ao gerar tabela:', error)
    console.error('Stack:', error.stack)
    console.error('Tipo de autoTable:', typeof autoTable)
    console.error('autoTable:', autoTable)
    
    // Gerar tabela manualmente como Ãºltimo recurso
    try {
      doc.setFontSize(8)
      doc.setTextColor(0, 0, 0)
      doc.text('Erro ao gerar tabela automÃ¡tica. Dados dos animais:', 15, yPos)
      yPos += 7
      
      animais.forEach((animal, index) => {
        if (yPos > pageHeight - 20) {
          doc.addPage()
          yPos = 20
        }
        const linha = `${index + 1}. ${animal.serie || ''}${animal.rg || ''} - ${animal.nome_pai || 'Sem nome'}`
        doc.text(linha, 15, yPos)
        yPos += 5
      })
      console.log('âÅ¡ ï¸� Tabela gerada manualmente como fallback')
    } catch (manualError) {
      console.error('â�Å’ Erro ao gerar tabela manual:', manualError)
      throw error
    }
  }

  // ObservaÃ§Ãµes em vermelho
  let finalY = yPos + 10
  if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
    finalY = doc.lastAutoTable.finalY + 10
  }

  doc.setTextColor(255, 0, 0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  const obsText = observacoes || 'ANIMAIS VÃÆ’O SER CONTROLADOS NO COMEÃâ€¡O DE FEVEREIRO'
  doc.text(`OBS: ${obsText}`, pageWidth / 2, finalY, { align: 'center' })

  console.log('âÅ“â€¦ PDF gerado com sucesso')
  return doc
}

export const downloadDNAFormularioVRGEN = async (dados) => {
  try {
    const doc = await generateDNAFormularioVRGEN(dados)
    const fileName = `DNA_VRGEN_${dados.dataEnvio?.replace(/\//g, '-')}_${Date.now()}.pdf`
    doc.save(fileName)
  } catch (error) {
    console.error('â�Å’ Erro ao gerar PDF:', error)
    throw error
  }
}

export const previewDNAFormularioVRGEN = async (dados) => {
  try {
    const doc = await generateDNAFormularioVRGEN(dados)
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
  } catch (error) {
    console.error('â�Å’ Erro ao gerar preview do PDF:', error)
    throw error
  }
}
