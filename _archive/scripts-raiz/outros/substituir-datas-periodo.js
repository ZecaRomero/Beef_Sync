const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'pages/api/relatorios-envio/enviar.js')
let content = fs.readFileSync(filePath, 'utf8')

// Lista de substituições a fazer
const substituicoes = [
  // addResumoSheet - periodo
  {
    de: `periodo: \`\${period.startDate} até \${period.endDate}\``,
    para: `periodo: \`\${formatDateBR(period.startDate)} até \${formatDateBR(period.endDate)}\``
  },
  // Células A2 com Período:
  {
    de: `sheet.getCell('A2').value = \`Período: \${period.startDate} até \${period.endDate}\``,
    para: `sheet.getCell('A2').value = \`Período: \${formatDateBR(period.startDate)} até \${formatDateBR(period.endDate)}\``
  },
  // Células A2 com Período de chegada:
  {
    de: `sheet.getCell('A2').value = \`Período de chegada: \${period.startDate} até \${period.endDate} �€� DG previsto em 15 dias\``,
    para: `sheet.getCell('A2').value = \`Período de chegada: \${formatDateBR(period.startDate)} até \${formatDateBR(period.endDate)} �€� DG previsto em 15 dias\``
  },
  // sheetDashboard
  {
    de: `sheetDashboard.getCell('A2').value = \`Período: \${period.startDate} até \${period.endDate}\``,
    para: `sheetDashboard.getCell('A2').value = \`Período: \${formatDateBR(period.startDate)} até \${formatDateBR(period.endDate)}\``
  },
  // Calendário Reprodutivo com Gerado em
  {
    de: `sheet.getCell('A2').value = \`Período: \${period.startDate} até \${period.endDate} �€� Gerado em: \${new Date().toLocaleString('pt-BR')}\``,
    para: `sheet.getCell('A2').value = \`Período: \${formatDateBR(period.startDate)} até \${formatDateBR(period.endDate)} �€� Gerado em: \${new Date().toLocaleString('pt-BR')}\``
  }
]

let totalSubstituicoes = 0

substituicoes.forEach((sub, idx) => {
  const regex = new RegExp(sub.de.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
  const matches = content.match(regex)
  const count = matches ? matches.length : 0
  
  if (count > 0) {
    content = content.replace(regex, sub.para)
    console.log(`�œ… Substituição ${idx + 1}: ${count} ocorrência(s)`)
    totalSubstituicoes += count
  } else {
    console.log(`�š�️  Substituição ${idx + 1}: 0 ocorrências (pode já estar correta)`)
  }
})

fs.writeFileSync(filePath, content, 'utf8')

console.log(`\n�œ… Total de substituições: ${totalSubstituicoes}`)
console.log(`�Ÿ“� Arquivo atualizado: ${filePath}`)
