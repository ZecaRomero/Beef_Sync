
import React, { useState } from 'react'

import { useToast } from '../../contexts/ToastContext'

const EmailTemplates = () => {
  const [activeTemplate, setActiveTemplate] = useState('monthly')
  const [templates, setTemplates] = useState({
    monthly: {
      name: 'RelatÃ³rio Mensal',
      subject: 'RelatÃ³rio Mensal - GestÃ£o Bovina - [MES/ANO]',
      body: `Prezado(a) Contador(a),

Segue em anexo o relatÃ³rio mensal da atividade pecuÃ¡ria referente ao perÃ­odo de [PERIODO].

ðÅ¸â€œÅ  RESUMO EXECUTIVO:
ââ‚¬¢ Total de animais no rebanho: [TOTAL_ANIMAIS]
ââ‚¬¢ Receita bruta do perÃ­odo: [RECEITA_BRUTA]
ââ‚¬¢ Custos operacionais: [CUSTOS_TOTAIS]
ââ‚¬¢ Resultado lÃ­quido: [RESULTADO_LIQUIDO]
ââ‚¬¢ ROI do perÃ­odo: [ROI]%

ðÅ¸â€œâ€¹ DOCUMENTOS EM ANEXO:
âÅ“â€œ RelatÃ³rio detalhado de custos por categoria
âÅ“â€œ Demonstrativo de vendas e receitas
âÅ“â€œ Controle de estoque de animais (inventÃ¡rio)
âÅ“â€œ Planilha de nascimentos e mortes
âÅ“â€œ Dados para emissÃ£o de notas fiscais

ðÅ¸â€�� DESTAQUES DO PERÃ�ODO:
ââ‚¬¢ Nascimentos: [NASCIMENTOS] animais
ââ‚¬¢ Vendas realizadas: [VENDAS] animais
ââ‚¬¢ Investimentos em melhorias: [INVESTIMENTOS]

Para dÃºvidas ou esclarecimentos, estou Ã  disposiÃ§Ã£o.

Atenciosamente,
[NOME_RESPONSAVEL]
Sistema Beef Sync - GestÃ£o Inteligente de Rebanho`,
      variables: ['PERIODO', 'TOTAL_ANIMAIS', 'RECEITA_BRUTA', 'CUSTOS_TOTAIS', 'RESULTADO_LIQUIDO', 'ROI', 'NASCIMENTOS', 'VENDAS', 'INVESTIMENTOS', 'NOME_RESPONSAVEL']
    },
    nf_request: {
      name: 'SolicitaÃ§Ã£o de Nota Fiscal',
      subject: 'URGENTE - EmissÃ£o de NF - Venda de Gado - [DATA_VENDA]',
      body: `Prezado(a) Contador(a),

Solicito com URGÃÅ NCIA a emissÃ£o de Nota Fiscal referente Ã  venda de gado realizada.

ðÅ¸�â€ž DADOS DA VENDA:
ââ‚¬¢ Data da venda: [DATA_VENDA]
ââ‚¬¢ Comprador: [COMPRADOR]
ââ‚¬¢ Valor total: [VALOR_TOTAL]
ââ‚¬¢ Quantidade de animais: [QTD_ANIMAIS]

ðÅ¸â€œâ€¹ DESCRIÃâ€¡ÃÆ’O DOS ANIMAIS:
[DESCRICAO_DETALHADA]

ðÅ¸â€œÅ  INFORMAÃâ€¡Ãâ€¢ES FISCAIS:
ââ‚¬¢ NCM: 0102.90.00 (Bovinos vivos)
ââ‚¬¢ CFOP: [CFOP_SUGERIDO]
ââ‚¬¢ AlÃ­quota ICMS: [ALIQUOTA_ICMS]
ââ‚¬¢ Base de cÃ¡lculo: [BASE_CALCULO]

ðÅ¸â€œÅ¾ DADOS DO COMPRADOR:
ââ‚¬¢ Nome/RazÃ£o Social: [COMPRADOR]
ââ‚¬¢ CNPJ/CPF: [A CONFIRMAR COM COMPRADOR]
ââ‚¬¢ EndereÃ§o: [A CONFIRMAR COM COMPRADOR]
ââ‚¬¢ InscriÃ§Ã£o Estadual: [A CONFIRMAR COM COMPRADOR]

âÅ¡ ï¸� OBSERVAÃâ€¡Ãâ€¢ES IMPORTANTES:
ââ‚¬¢ Prazo para emissÃ£o: [PRAZO_EMISSAO]
ââ‚¬¢ Forma de pagamento: [FORMA_PAGAMENTO]
ââ‚¬¢ Transporte: [RESPONSAVEL_TRANSPORTE]

Por favor, confirme o recebimento deste email e me informe quando a NF estiver emitida.

Atenciosamente,
[NOME_RESPONSAVEL]
Sistema Beef Sync`,
      variables: ['DATA_VENDA', 'COMPRADOR', 'VALOR_TOTAL', 'QTD_ANIMAIS', 'DESCRICAO_DETALHADA', 'CFOP_SUGERIDO', 'ALIQUOTA_ICMS', 'BASE_CALCULO', 'PRAZO_EMISSAO', 'FORMA_PAGAMENTO', 'RESPONSAVEL_TRANSPORTE', 'NOME_RESPONSAVEL']
    },
    quarterly: {
      name: 'RelatÃ³rio Trimestral',
      subject: 'RelatÃ³rio Trimestral - AnÃ¡lise Completa - [TRIMESTRE/ANO]',
      body: `Prezado(a) Contador(a),

Apresento o relatÃ³rio trimestral consolidado da atividade pecuÃ¡ria.

ðÅ¸â€œË† ANÃ�LISE TRIMESTRAL ([TRIMESTRE]):
ââ‚¬¢ Performance geral: [PERFORMANCE]
ââ‚¬¢ Crescimento do rebanho: [CRESCIMENTO]%
ââ‚¬¢ EficiÃªncia operacional: [EFICIENCIA]%
ââ‚¬¢ Margem de lucro: [MARGEM_LUCRO]%

ðÅ¸â€™° INDICADORES FINANCEIROS:
ââ‚¬¢ Receita acumulada: [RECEITA_ACUMULADA]
ââ‚¬¢ Custos acumulados: [CUSTOS_ACUMULADOS]
ââ‚¬¢ EBITDA: [EBITDA]
ââ‚¬¢ Fluxo de caixa: [FLUXO_CAIXA]

ðÅ¸Å½¯ METAS vs REALIZADO:
ââ‚¬¢ Meta de nascimentos: [META_NASCIMENTOS] | Realizado: [REAL_NASCIMENTOS]
ââ‚¬¢ Meta de vendas: [META_VENDAS] | Realizado: [REAL_VENDAS]
ââ‚¬¢ Meta de ROI: [META_ROI]% | Realizado: [REAL_ROI]%

ðÅ¸â€œÅ  ANEXOS INCLUSOS:
âÅ“â€œ Demonstrativo de resultados trimestral
âÅ“â€œ BalanÃ§o patrimonial (estoque de animais)
âÅ“â€œ Fluxo de caixa detalhado
âÅ“â€œ AnÃ¡lise de custos por categoria
âÅ“â€œ ProjeÃ§Ãµes para prÃ³ximo trimestre

Aguardo retorno para alinhamento das estratÃ©gias fiscais.

Atenciosamente,
[NOME_RESPONSAVEL]`,
      variables: ['TRIMESTRE', 'PERFORMANCE', 'CRESCIMENTO', 'EFICIENCIA', 'MARGEM_LUCRO', 'RECEITA_ACUMULADA', 'CUSTOS_ACUMULADOS', 'EBITDA', 'FLUXO_CAIXA', 'META_NASCIMENTOS', 'REAL_NASCIMENTOS', 'META_VENDAS', 'REAL_VENDAS', 'META_ROI', 'REAL_ROI', 'NOME_RESPONSAVEL']
    },
    tax_planning: {
      name: 'Planejamento TributÃ¡rio',
      subject: 'Planejamento TributÃ¡rio - Atividade Rural - [ANO]',
      body: `Prezado(a) Contador(a),

Solicito anÃ¡lise para planejamento tributÃ¡rio da atividade rural.

ðÅ¸�â€ºï¸� REGIME TRIBUTÃ�RIO ATUAL:
ââ‚¬¢ Pessoa FÃ­sica/JurÃ­dica: [TIPO_PESSOA]
ââ‚¬¢ Regime: [REGIME_ATUAL]
ââ‚¬¢ Atividade principal: CriaÃ§Ã£o de bovinos

ðÅ¸â€™¡ OPORTUNIDADES IDENTIFICADAS:
ââ‚¬¢ DepreciaÃ§Ã£o de animais reprodutores: [VALOR_DEPRECIACAO]
ââ‚¬¢ Investimentos em melhoramento genÃ©tico: [INVESTIMENTO_GENETICO]
ââ‚¬¢ Custos de formaÃ§Ã£o de pastagens: [CUSTO_PASTAGEM]
ââ‚¬¢ Investimentos em infraestrutura: [INVESTIMENTOS_INFRA]

ðÅ¸â€œÅ  DADOS PARA ANÃ�LISE:
ââ‚¬¢ Receita bruta anual estimada: [RECEITA_ESTIMADA]
ââ‚¬¢ Custos operacionais: [CUSTOS_OPERACIONAIS]
ââ‚¬¢ Investimentos planejados: [INVESTIMENTOS_PLANEJADOS]
ââ‚¬¢ Estoque de animais (valor): [VALOR_ESTOQUE]

ðÅ¸Å½¯ OBJETIVOS:
ââ‚¬¢ OtimizaÃ§Ã£o da carga tributÃ¡ria
ââ‚¬¢ Aproveitamento de incentivos fiscais rurais
ââ‚¬¢ Planejamento sucessÃ³rio (se aplicÃ¡vel)
ââ‚¬¢ EstruturaÃ§Ã£o para crescimento

Por favor, agende uma reuniÃ£o para discussÃ£o detalhada.

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
    if (confirm('Tem certeza que deseja restaurar o template padrÃ£o?')) {
      // Aqui vocÃª redefiniria para o template padrÃ£o
      toast.info('Template restaurado para o padrÃ£o')
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
            <h4>VariÃ¡veis disponÃ­veis:</h4>
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
          âÅ“â€°ï¸� Editor de Templates de Email
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
              placeholder="Use [VARIAVEL] para campos dinÃ¢micos"
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
              placeholder="Digite o conteÃºdo do email. Use [VARIAVEL] para campos que serÃ£o substituÃ­dos automaticamente."
            />
          </div>

          {/* VariÃ¡veis DisponÃ­veis */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
              ðÅ¸â€œ� VariÃ¡veis DisponÃ­veis
            </h4>
            <div className="flex flex-wrap gap-2">
              {templates[activeTemplate].variables.map((variable) => (
                <span
                  key={variable}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700"
                  onClick={() => {
                    navigator.clipboard.writeText(`[${variable}]`)
                    toast.success(`VariÃ¡vel [${variable}] copiada!`)
                  }}
                  title="Clique para copiar"
                >
                  [{variable}]
                </span>
              ))}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
              ðÅ¸â€™¡ Clique em uma variÃ¡vel para copiÃ¡-la. Essas variÃ¡veis serÃ£o substituÃ­das automaticamente pelos dados reais.
            </p>
          </div>

          {/* AÃ§Ãµes */}
          <div className="flex flex-wrap gap-3">
            <button onClick={saveTemplate} className="btn-primary">
              ðÅ¸â€™¾ Salvar Template
            </button>
            <button onClick={previewTemplate} className="btn-secondary">
              ðÅ¸â€˜�ï¸� Visualizar
            </button>
            <button onClick={testEmail} className="btn-secondary">
              ðÅ¸â€œ§ Testar Email
            </button>
            <button onClick={resetTemplate} className="btn-secondary">
              ðÅ¸â€�â€ž Restaurar PadrÃ£o
            </button>
          </div>
        </div>
      </div>

      {/* Dicas de Uso */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          ðÅ¸â€™¡ Dicas de Uso dos Templates
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-green-500 text-lg">âÅ“â€¦</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">VariÃ¡veis DinÃ¢micas</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Use [VARIAVEL] para campos que serÃ£o preenchidos automaticamente
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 text-lg">ðÅ¸â€œ§</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">IntegraÃ§Ã£o com Outlook</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Os emails abrem automaticamente no seu cliente de email padrÃ£o
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-purple-500 text-lg">ðÅ¸Å½¨</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">FormataÃ§Ã£o</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Use emojis e formataÃ§Ã£o para emails mais atrativos
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-orange-500 text-lg">ðÅ¸â€�â€ž</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Backup AutomÃ¡tico</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Seus templates sÃ£o salvos automaticamente no navegador
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