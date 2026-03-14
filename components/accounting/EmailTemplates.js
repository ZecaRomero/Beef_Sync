
import React, { useState } from 'react'

import { useToast } from '../../contexts/ToastContext'

const EmailTemplates = () => {
  const [activeTemplate, setActiveTemplate] = useState('monthly')
  const [templates, setTemplates] = useState({
    monthly: {
      name: 'Relatório Mensal',
      subject: 'Relatório Mensal - Gestão Bovina - [MES/ANO]',
      body: `Prezado(a) Contador(a),

Segue em anexo o relatório mensal da atividade pecuária referente ao período de [PERIODO].

📊 RESUMO EXECUTIVO:
• Total de animais no rebanho: [TOTAL_ANIMAIS]
• Receita bruta do período: [RECEITA_BRUTA]
• Custos operacionais: [CUSTOS_TOTAIS]
• Resultado líquido: [RESULTADO_LIQUIDO]
• ROI do período: [ROI]%

📋 DOCUMENTOS EM ANEXO:
✓ Relatório detalhado de custos por categoria
✓ Demonstrativo de vendas e receitas
✓ Controle de estoque de animais (inventário)
✓ Planilha de nascimentos e mortes
✓ Dados para emissão de notas fiscais

🔍 DESTAQUES DO PERÍODO:
• Nascimentos: [NASCIMENTOS] animais
• Vendas realizadas: [VENDAS] animais
• Investimentos em melhorias: [INVESTIMENTOS]

Para dúvidas ou esclarecimentos, estou à disposição.

Atenciosamente,
[NOME_RESPONSAVEL]
Sistema Beef Sync - Gestão Inteligente de Rebanho`,
      variables: ['PERIODO', 'TOTAL_ANIMAIS', 'RECEITA_BRUTA', 'CUSTOS_TOTAIS', 'RESULTADO_LIQUIDO', 'ROI', 'NASCIMENTOS', 'VENDAS', 'INVESTIMENTOS', 'NOME_RESPONSAVEL']
    },
    nf_request: {
      name: 'Solicitação de Nota Fiscal',
      subject: 'URGENTE - Emissão de NF - Venda de Gado - [DATA_VENDA]',
      body: `Prezado(a) Contador(a),

Solicito com URGÊNCIA a emissão de Nota Fiscal referente à venda de gado realizada.

🐄 DADOS DA VENDA:
• Data da venda: [DATA_VENDA]
• Comprador: [COMPRADOR]
• Valor total: [VALOR_TOTAL]
• Quantidade de animais: [QTD_ANIMAIS]

📋 DESCRIÇÃO DOS ANIMAIS:
[DESCRICAO_DETALHADA]

📊 INFORMAÇÕES FISCAIS:
• NCM: 0102.90.00 (Bovinos vivos)
• CFOP: [CFOP_SUGERIDO]
• Alíquota ICMS: [ALIQUOTA_ICMS]
• Base de cálculo: [BASE_CALCULO]

📞 DADOS DO COMPRADOR:
• Nome/Razão Social: [COMPRADOR]
• CNPJ/CPF: [A CONFIRMAR COM COMPRADOR]
• Endereço: [A CONFIRMAR COM COMPRADOR]
• Inscrição Estadual: [A CONFIRMAR COM COMPRADOR]

⚠️ OBSERVAÇÕES IMPORTANTES:
• Prazo para emissão: [PRAZO_EMISSAO]
• Forma de pagamento: [FORMA_PAGAMENTO]
• Transporte: [RESPONSAVEL_TRANSPORTE]

Por favor, confirme o recebimento deste email e me informe quando a NF estiver emitida.

Atenciosamente,
[NOME_RESPONSAVEL]
Sistema Beef Sync`,
      variables: ['DATA_VENDA', 'COMPRADOR', 'VALOR_TOTAL', 'QTD_ANIMAIS', 'DESCRICAO_DETALHADA', 'CFOP_SUGERIDO', 'ALIQUOTA_ICMS', 'BASE_CALCULO', 'PRAZO_EMISSAO', 'FORMA_PAGAMENTO', 'RESPONSAVEL_TRANSPORTE', 'NOME_RESPONSAVEL']
    },
    quarterly: {
      name: 'Relatório Trimestral',
      subject: 'Relatório Trimestral - Análise Completa - [TRIMESTRE/ANO]',
      body: `Prezado(a) Contador(a),

Apresento o relatório trimestral consolidado da atividade pecuária.

📈 ANÁLISE TRIMESTRAL ([TRIMESTRE]):
• Performance geral: [PERFORMANCE]
• Crescimento do rebanho: [CRESCIMENTO]%
• Eficiência operacional: [EFICIENCIA]%
• Margem de lucro: [MARGEM_LUCRO]%

💰 INDICADORES FINANCEIROS:
• Receita acumulada: [RECEITA_ACUMULADA]
• Custos acumulados: [CUSTOS_ACUMULADOS]
• EBITDA: [EBITDA]
• Fluxo de caixa: [FLUXO_CAIXA]

🎯 METAS vs REALIZADO:
• Meta de nascimentos: [META_NASCIMENTOS] | Realizado: [REAL_NASCIMENTOS]
• Meta de vendas: [META_VENDAS] | Realizado: [REAL_VENDAS]
• Meta de ROI: [META_ROI]% | Realizado: [REAL_ROI]%

📊 ANEXOS INCLUSOS:
✓ Demonstrativo de resultados trimestral
✓ Balanço patrimonial (estoque de animais)
✓ Fluxo de caixa detalhado
✓ Análise de custos por categoria
✓ Projeções para próximo trimestre

Aguardo retorno para alinhamento das estratégias fiscais.

Atenciosamente,
[NOME_RESPONSAVEL]`,
      variables: ['TRIMESTRE', 'PERFORMANCE', 'CRESCIMENTO', 'EFICIENCIA', 'MARGEM_LUCRO', 'RECEITA_ACUMULADA', 'CUSTOS_ACUMULADOS', 'EBITDA', 'FLUXO_CAIXA', 'META_NASCIMENTOS', 'REAL_NASCIMENTOS', 'META_VENDAS', 'REAL_VENDAS', 'META_ROI', 'REAL_ROI', 'NOME_RESPONSAVEL']
    },
    tax_planning: {
      name: 'Planejamento Tributário',
      subject: 'Planejamento Tributário - Atividade Rural - [ANO]',
      body: `Prezado(a) Contador(a),

Solicito análise para planejamento tributário da atividade rural.

🏛️ REGIME TRIBUTÁRIO ATUAL:
• Pessoa Física/Jurídica: [TIPO_PESSOA]
• Regime: [REGIME_ATUAL]
• Atividade principal: Criação de bovinos

💡 OPORTUNIDADES IDENTIFICADAS:
• Depreciação de animais reprodutores: [VALOR_DEPRECIACAO]
• Investimentos em melhoramento genético: [INVESTIMENTO_GENETICO]
• Custos de formação de pastagens: [CUSTO_PASTAGEM]
• Investimentos em infraestrutura: [INVESTIMENTOS_INFRA]

📊 DADOS PARA ANÁLISE:
• Receita bruta anual estimada: [RECEITA_ESTIMADA]
• Custos operacionais: [CUSTOS_OPERACIONAIS]
• Investimentos planejados: [INVESTIMENTOS_PLANEJADOS]
• Estoque de animais (valor): [VALOR_ESTOQUE]

🎯 OBJETIVOS:
• Otimização da carga tributária
• Aproveitamento de incentivos fiscais rurais
• Planejamento sucessório (se aplicável)
• Estruturação para crescimento

Por favor, agende uma reunião para discussão detalhada.

Atenciosamente,
[NOME_RESPONSAVEL]`,
      variables: ['ANO', 'TIPO_PESSOA', 'REGIME_ATUAL', 'VALOR_DEPRECIACAO', 'INVESTIMENTO_GENETICO', 'CUSTO_PASTAGEM', 'INVESTIMENTOS_INFRA', 'RECEITA_ESTIMADA', 'CUSTOS_OPERACIONAIS', 'INVESTIMENTOS_PLANEJADOS', 'VALOR_ESTOQUE', 'NOME_RESPONSAVEL']
    }
  })

  const toast = useToast()

  const saveTemplate = () => {
    localStorage.setItem('emailTemplates', JSON.stringify(templates))
    toast.success('Template salvo com sucesso!')
  }

  const resetTemplate = () => {
    if (confirm('Tem certeza que deseja restaurar o template padrão?')) {
      // Aqui você redefiniria para o template padrão
      toast.info('Template restaurado para o padrão')
    }
  }

  const previewTemplate = () => {
    const template = templates[activeTemplate]
    const previewWindow = window.open('', '_blank', 'width=800,height=600')
    
    const previewContent = `
      <html>
        <head>
          <title>Preview - ${template.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            .header { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .content { white-space: pre-wrap; }
            .variables { background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${template.name}</h2>
            <p><strong>Assunto:</strong> ${template.subject}</p>
          </div>
          <div class="content">${template.body}</div>
          <div class="variables">
            <h4>Variáveis disponíveis:</h4>
            <p>${template.variables.map(v => `[${v}]`).join(', ')}</p>
          </div>
        </body>
      </html>
    `
    
    previewWindow.document.write(previewContent)
    previewWindow.document.close()
  }

  const testEmail = () => {
    const template = templates[activeTemplate]
    const mailtoLink = `mailto:?subject=${encodeURIComponent(template.subject)}&body=${encodeURIComponent(template.body)}`
    window.open(mailtoLink, '_blank')
    toast.success('Email de teste aberto no Outlook!')
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Template */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ✉️ Editor de Templates de Email
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(templates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => setActiveTemplate(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTemplate === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {template.name}
            </button>
          ))}
        </div>

        {/* Editor do Template */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome do Template
            </label>
            <input
              type="text"
              value={templates[activeTemplate].name}
              onChange={(e) => setTemplates(prev => ({
                ...prev,
                [activeTemplate]: { ...prev[activeTemplate], name: e.target.value }
              }))}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assunto do Email
            </label>
            <input
              type="text"
              value={templates[activeTemplate].subject}
              onChange={(e) => setTemplates(prev => ({
                ...prev,
                [activeTemplate]: { ...prev[activeTemplate], subject: e.target.value }
              }))}
              className="input-field"
              placeholder="Use [VARIAVEL] para campos dinâmicos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Corpo do Email
            </label>
            <textarea
              value={templates[activeTemplate].body}
              onChange={(e) => setTemplates(prev => ({
                ...prev,
                [activeTemplate]: { ...prev[activeTemplate], body: e.target.value }
              }))}
              rows={15}
              className="input-field font-mono text-sm"
              placeholder="Digite o conteúdo do email. Use [VARIAVEL] para campos que serão substituídos automaticamente."
            />
          </div>

          {/* Variáveis Disponíveis */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
              📝 Variáveis Disponíveis
            </h4>
            <div className="flex flex-wrap gap-2">
              {templates[activeTemplate].variables.map((variable) => (
                <span
                  key={variable}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700"
                  onClick={() => {
                    navigator.clipboard.writeText(`[${variable}]`)
                    toast.success(`Variável [${variable}] copiada!`)
                  }}
                  title="Clique para copiar"
                >
                  [{variable}]
                </span>
              ))}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
              💡 Clique em uma variável para copiá-la. Essas variáveis serão substituídas automaticamente pelos dados reais.
            </p>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-3">
            <button onClick={saveTemplate} className="btn-primary">
              💾 Salvar Template
            </button>
            <button onClick={previewTemplate} className="btn-secondary">
              👁️ Visualizar
            </button>
            <button onClick={testEmail} className="btn-secondary">
              📧 Testar Email
            </button>
            <button onClick={resetTemplate} className="btn-secondary">
              🔄 Restaurar Padrão
            </button>
          </div>
        </div>
      </div>

      {/* Dicas de Uso */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          💡 Dicas de Uso dos Templates
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Variáveis Dinâmicas</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Use [VARIAVEL] para campos que serão preenchidos automaticamente
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 text-lg">📧</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Integração com Outlook</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Os emails abrem automaticamente no seu cliente de email padrão
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-purple-500 text-lg">🎨</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Formatação</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Use emojis e formatação para emails mais atrativos
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-orange-500 text-lg">🔄</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Backup Automático</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Seus templates são salvos automaticamente no navegador
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailTemplates