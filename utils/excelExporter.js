// Utilitário para exportação Excel com formatação profissional usando HTML
export const exportToExcelWithFormatting = (births, stats, statsByTouro) => {
  try {
    // Função para gerar HTML da tabela principal
    const generateMainTableHTML = () => {
      const headers = ['Receptora', 'Doador', 'RG', 'Prev Parto', 'Nascimento', 'Tatuagem', 'CC', 'PS1', 'PS2', 'Sexo', 'Status', 'Touro', 'Data Real', 'Observações', 'Tipo Cobertura', 'Custo DNA', 'Descarte', 'Morte']
      
      let html = `
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #1F4E79; color: white; font-weight: bold; text-align: center;">
              ${headers.map(header => `<th style="padding: 8px; border: 1px solid black;">${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
      `
      
      births.forEach(birth => {
        html += `
          <tr style="text-align: center;">
            <td style="padding: 4px; border: 1px solid black;">${birth.receptora}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.doador}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.rg}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.prevParto}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.nascimento}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.tatuagem || ''}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.cc || ''}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.ps1 || ''}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.ps2 || ''}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.sexo === 'M' ? 'Macho' : birth.sexo === 'F' ? 'Fêmea' : ''}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.status === 'nascido' ? 'Nascido' : birth.status === 'morto' ? 'Morto' : birth.status === 'aborto' ? 'Aborto' : birth.status === 'gestante_atrasada' ? 'Atrasada' : birth.status}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.touro}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.data || ''}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.observacao}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.tipoCobertura}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.custoDNA ? `R$ ${parseFloat(birth.custoDNA).toFixed(2)}` : ''}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.descarte ? 'SIM' : 'NÃO'}</td>
            <td style="padding: 4px; border: 1px solid black;">${birth.morte || ''}</td>
          </tr>
        `
      })
      
      html += `
          </tbody>
        </table>
      `
      
      return html
    }

    // Função para gerar HTML da tabela de resumo
    const generateResumoTableHTML = () => {
      const resumoData = [
        ['Total de Registros', stats.total],
        ['Nascimentos', stats.nascidos],
        ['Machos', stats.machos],
        ['Fêmeas', stats.femeas],
        ['Perdas Totais', stats.totalPerdas],
        ['Mortos', stats.mortos],
        ['Abortos', stats.abortos],
        ['Cio (Repetiu)', stats.cio],
        ['Atrasadas', stats.atrasadas],
        ['Descartes', stats.descartes],
        ['FIV', stats.fiv],
        ['IA', stats.ia],
        ['Custo Total DNA', `R$ ${stats.custoTotalDNA.toFixed(2)}`]
      ]

      let html = `
        <table border="1" style="border-collapse: collapse; width: 100%; margin-top: 20px;">
          <thead>
            <tr style="background-color: #1F4E79; color: white; font-weight: bold; text-align: center;">
              <th style="padding: 8px; border: 1px solid black;">Métrica</th>
              <th style="padding: 8px; border: 1px solid black;">Valor</th>
            </tr>
          </thead>
          <tbody>
      `
      
      resumoData.forEach(([metrica, valor]) => {
        html += `
          <tr style="text-align: center;">
            <td style="padding: 4px; border: 1px solid black;">${metrica}</td>
            <td style="padding: 4px; border: 1px solid black;">${valor}</td>
          </tr>
        `
      })
      
      html += `
          </tbody>
        </table>
      `
      
      return html
    }

    // Função para gerar HTML da tabela de touros
    const generateTourosTableHTML = () => {
      let html = `
        <table border="1" style="border-collapse: collapse; width: 100%; margin-top: 20px;">
          <thead>
            <tr style="background-color: #1F4E79; color: white; font-weight: bold; text-align: center;">
              <th style="padding: 8px; border: 1px solid black;">Touro</th>
              <th style="padding: 8px; border: 1px solid black;">Total</th>
              <th style="padding: 8px; border: 1px solid black;">Nascidos</th>
              <th style="padding: 8px; border: 1px solid black;">Machos</th>
              <th style="padding: 8px; border: 1px solid black;">Fêmeas</th>
              <th style="padding: 8px; border: 1px solid black;">Taxa Sucesso</th>
            </tr>
          </thead>
          <tbody>
      `
      
      Object.entries(statsByTouro).forEach(([touro, tourosStats]) => {
        const taxaSucesso = tourosStats.total > 0 ? `${(tourosStats.nascidos / tourosStats.total * 100).toFixed(1)}%` : '0%'
        html += `
          <tr style="text-align: center;">
            <td style="padding: 4px; border: 1px solid black;">${touro}</td>
            <td style="padding: 4px; border: 1px solid black;">${tourosStats.total}</td>
            <td style="padding: 4px; border: 1px solid black;">${tourosStats.nascidos}</td>
            <td style="padding: 4px; border: 1px solid black;">${tourosStats.machos}</td>
            <td style="padding: 4px; border: 1px solid black;">${tourosStats.femeas}</td>
            <td style="padding: 4px; border: 1px solid black;">${taxaSucesso}</td>
          </tr>
        `
      })
      
      html += `
          </tbody>
        </table>
      `
      
      return html
    }

    // Gerar HTML completo
    const fullHTML = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Planilha de Nascimentos</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h2 { color: #1F4E79; margin-top: 30px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid black; padding: 4px; text-align: center; }
            th { background-color: #1F4E79; color: white; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1 style="color: #1F4E79; text-align: center;">📊 Planilha de Nascimentos - Beef-Sync</h1>
          
          <h2>🐣 Dados de Nascimentos</h2>
          ${generateMainTableHTML()}
          
          <h2>📈 Resumo Estatístico</h2>
          ${generateResumoTableHTML()}
          
          <h2>🐂 Performance por Touro</h2>
          ${generateTourosTableHTML()}
          
          <p style="margin-top: 30px; text-align: center; color: #666;">
            Gerado em: ${new Date().toLocaleString('pt-BR')} | Sistema Beef-Sync
          </p>
        </body>
      </html>
    `

    // Criar e baixar arquivo
    const blob = new Blob([fullHTML], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Planilha_Nascimentos_Formatada_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error('Erro ao exportar:', error)
    return false
  }
}

export default { exportToExcelWithFormatting }