import React, { useState, useEffect } from 'react'
import { DocumentTextIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from './ui/Icons'

export default function ImportarTextoPesagens({ animais, onImportComplete, onRefreshAnimais }) {
  const [texto, setTexto] = useState('')
  const [validacao, setValidacao] = useState(null)
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    onRefreshAnimais?.()
  }, [])

  const isHeaderRow = (partes) => {
    const p0 = (partes[0] || '').toString().trim().toLowerCase()
    const p1 = (partes[1] || '').toString().trim().toLowerCase()
    const p2 = (partes[2] || '').toString().trim().toLowerCase()
    const pLast = (partes[partes.length - 1] || '').toString().trim().toLowerCase()
    return /^(serie|série|animal|identificação|identificacao|numero|nº|#)$/i.test(p0) ||
      /^(rgn|rg|peso|data|c\.e\.|ce)$/i.test(p1) ||
      (p2 === 'sexo' && partes.length >= 4) ||
      /^local$/i.test(pLast)
  }

  const buscarAnimal = (partes, animaisLista) => {
    if (!animaisLista?.length || isHeaderRow(partes)) return null
    const p0 = (partes[0] || '').toString().trim()
    const p1 = (partes[1] || '').toString().trim()
    const p0Low = p0.toLowerCase()
    const p1Low = p1.toLowerCase()
    return animaisLista.find(a => {
      const s = (a.serie || '').toString().toLowerCase()
      const r = (a.rg || '').toString().toLowerCase()
      const ident = `${s}-${r}`.toLowerCase()
      const identEsp = `${s} ${r}`.toLowerCase()
      return s === p0Low && r === p1Low ||
        s === p0Low || r === p0Low ||
        ident === `${p0Low}-${p1Low}` || ident === p0Low ||
        identEsp === `${p0Low} ${p1Low}` ||
        (partes.length >= 2 && /^\d+$/.test(p1) && s === p0Low)
    }) || null
  }

  const isSexo = (s) => /^(femea|macho)$/i.test(String(s || '').trim())
  const parsePartesToPesagem = (partes) => {
    const isData = (s) => s && (/^\d{2}\/\d{2}\/\d{4}$/.test(s) || /^\d{4}-\d{2}-\d{2}$/.test(s))
    const isNum = (s) => s != null && !isNaN(parseFloat(String(s).replace(',', '.'))) && /^[\d.,]+$/.test(String(s))
    let serieOuRg, pesoStr, ceStr, dataStr, obsPartes = [], sexo = null
    // Formato: SERIE RG SEXO DATA PESO CE LOCAL (ex: CICS 2 FEMEA 11/02/2026 165 XX PIQUETE 16)
    if (partes.length >= 7 && isSexo(partes[2]) && isData(partes[3]) && isNum(partes[4])) {
      sexo = /^femea$/i.test(partes[2]) ? 'Fêmea' : 'Macho'
      serieOuRg = partes[0]
      dataStr = partes[3]
      pesoStr = partes[4]
      ceStr = isNum(partes[5]) ? partes[5] : ''
      obsPartes = partes.slice(6)
    } else if (partes.length === 2) {
      [serieOuRg, pesoStr] = partes
      ceStr = dataStr = ''
    } else if (partes.length === 3) {
      if (isNum(partes[2]) && parseFloat(partes[2]) > 50) {
        [serieOuRg, , pesoStr] = [partes[0], partes[1], partes[2]]
        ceStr = dataStr = ''
      } else {
        [serieOuRg, pesoStr, ceStr] = [partes[0], partes[1], partes[2] || '']
        dataStr = ''
      }
    } else if (partes.length >= 4) {
      const p2 = partes[2], p3 = partes[3]
      if (isData(p2) && isNum(p3)) {
        [serieOuRg, , dataStr, pesoStr, ceStr, ...obsPartes] = [partes[0], partes[1], partes[2], partes[3], partes[4] || '', ...(partes.slice(5) || [])]
      } else if (isNum(p2) && isData(p3)) {
        [serieOuRg, pesoStr, dataStr, ceStr, ...obsPartes] = [partes[0], partes[1], partes[2], partes[3] || '', ...(partes.slice(4) || [])]
      } else if (isNum(p2)) {
        [serieOuRg, pesoStr, ceStr, dataStr, ...obsPartes] = [partes[0], partes[1], partes[2] || '', partes[3] || '', ...(partes.slice(4) || [])]
      } else {
        [serieOuRg, , pesoStr, dataStr, ceStr, ...obsPartes] = [partes[0], partes[1], partes[2], partes[3] || '', partes[4] || '', ...(partes.slice(5) || [])]
      }
      dataStr = dataStr || ''
      ceStr = ceStr || ''
    } else return null
    const observacoes = (obsPartes || []).join(' ').trim()
    return { serieOuRg, pesoStr, ceStr: ceStr || '', dataStr: dataStr || '', observacoes: observacoes || '', sexo }
  }

  const validarTexto = (animaisOverride) => {
    if (!texto.trim()) {
      alert('Por favor, cole o texto com os dados das pesagens')
      return
    }
    setProcessando(true)
    const animaisParaUsar = Array.isArray(animaisOverride) ? animaisOverride : (animais || [])
    const linhas = texto.trim().split('\n').filter(l => l.trim())
    const resultados = []
    const erros = []
    const pendentes = []

    linhas.forEach((linha, index) => {
      const numeroLinha = index + 1
      const partes = linha.split(/[\s\t|,;]+/).filter(p => p.trim())
      if (partes.length < 2) {
        erros.push({ linha: numeroLinha, texto: linha, erro: 'Formato inválido. Mínimo: SERIE PESO' })
        return
      }
      if (isHeaderRow(partes)) return
      const parsed = parsePartesToPesagem(partes)
      if (!parsed) {
        erros.push({ linha: numeroLinha, texto: linha, erro: 'Formato inválido' })
        return
      }
      const { serieOuRg, pesoStr, ceStr, dataStr, observacoes, sexo } = parsed

      const animal = buscarAnimal(partes, animaisParaUsar)
      if (!animal) {
        const serie = (partes[0] || '').toString().trim()
        const rg = partes.length >= 2 ? (partes[1] || '').toString().trim() : ''
        let data = new Date().toISOString().split('T')[0]
        if (dataStr) {
          const dataMatch = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/)
          if (dataMatch) data = `${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}`
          else if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) data = dataStr
        }
        pendentes.push({
          linha: numeroLinha,
          texto: linha,
          serie,
          rg,
          serieOuRg,
          pesoStr,
          ceStr,
          dataStr,
          observacoes,
          sexo: sexo || null,
          partes
        })
        return
      }

      const peso = parseFloat(pesoStr?.replace(',', '.'))
      if (isNaN(peso) || peso <= 0) {
        erros.push({ linha: numeroLinha, texto: linha, erro: `Peso inválido: "${pesoStr}"` })
        return
      }

      let ce = null
      if (ceStr && /^[\d.,]+$/.test(ceStr) && animal.sexo === 'Macho') {
        ce = parseFloat(ceStr.replace(',', '.'))
        if (isNaN(ce)) ce = null
      }
      let data = new Date().toISOString().split('T')[0]
      if (dataStr) {
        const dataMatch = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/)
        if (dataMatch) data = `${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}`
        else if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) data = dataStr
      }

      resultados.push({
        linha: numeroLinha,
        animal_id: animal.id,
        animal: `${animal.serie} - ${animal.rg}`,
        animal_sexo: animal.sexo,
        peso, ce, data, observacoes, valido: true
      })
    })

    setValidacao({
      total: linhas.length,
      validos: resultados.length,
      errosCount: erros.length,
      pendentesCount: pendentes.length,
      resultados, erros, pendentes
    })
    setProcessando(false)
  }

  const validarNovamente = async () => {
    try {
      const res = await fetch('/api/animals')
      const data = await res.json()
      const anims = data.animals || []
      validarTexto(anims)
    } catch (e) {
      console.error('Erro ao recarregar animais:', e)
      alert('Erro ao recarregar lista de animais. Tente novamente.')
      setProcessando(false)
    }
  }

  const importarDados = async (criarAnimais = false) => {
    const temValidos = validacao?.validos > 0
    const temPendentes = validacao?.pendentesCount > 0
    if (!validacao || (!temValidos && !temPendentes)) {
      alert('Não há dados válidos para importar')
      return
    }
    if (criarAnimais && !temPendentes) {
      alert('Não há animais pendentes para cadastrar')
      return
    }

    setProcessando(true)
    try {
      const pesagens = criarAnimais ? validacao.resultados : validacao.resultados
      const pendentesParaApi = (validacao.pendentes || []).map(p => {
        let data = new Date().toISOString().split('T')[0]
        if (p.dataStr) {
          const m = p.dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/)
          if (m) data = `${m[3]}-${m[2]}-${m[1]}`
          else if (/^\d{4}-\d{2}-\d{2}$/.test(p.dataStr)) data = p.dataStr
        }
        let ce = null
        if (p.ceStr && /^[\d.,]+$/.test(p.ceStr)) ce = parseFloat(p.ceStr.replace(',', '.'))
        return {
          serie: p.serie || p.serieOuRg,
          rg: p.rg || '',
          sexo: p.sexo || null,
          peso: parseFloat(p.pesoStr?.replace(',', '.')) || 0,
          ce: isNaN(ce) ? null : ce,
          data,
          observacoes: p.observacoes || null
        }
      })

      const body = criarAnimais
        ? { pesagens, pendentes: pendentesParaApi, criarAnimaisAusentes: true }
        : { pesagens }

      const response = await fetch('/api/import/texto-pesagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      let result
      try {
        result = await response.json()
      } catch (parseErr) {
        console.error('Resposta não é JSON:', parseErr)
        throw new Error(response.status === 500 ? 'Erro no servidor. Verifique se o banco está acessível.' : 'Resposta inválida do servidor.')
      }

      if (response.ok) {
        let msg = `✅ ${result.importados} pesagens importadas com sucesso!`
        if (result.criados > 0) {
          msg += `\n\n📋 ${result.criados} animais foram cadastrados com dados mínimos (Série, RG).`
          msg += `\n\nComplete o cadastro (data nascimento, sexo, raça, etc.) em Animais → filtre por raça "Não informado" para encontrá-los.`
        }
        alert(msg)
        setTexto('')
        setValidacao(null)
        if (onImportComplete) onImportComplete(result)
      } else {
        alert(`❌ Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao importar:', error)
      alert('❌ Erro ao importar dados: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5" />
          Como usar a importação por texto
        </h3>
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
          <p><strong>Formatos aceitos:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><code>SERIE PESO</code> ou <code>SERIE RG PESO</code></li>
            <li><code>SERIE RG SEXO DATA PESO CE LOCAL</code> (ex: CICS 2 FEMEA 11/02/2026 165 XX PIQUETE 16)</li>
            <li><code>SERIE RG DATA PESO CE LOCAL</code> (ex: CJCA 5 14/02/2026 519 XX PIQUETE 13)</li>
            <li><code>SERIE PESO CE DATA</code> (com circunferência escrotal)</li>
          </ul>
          <p className="mt-2"><strong>Separadores aceitos:</strong> espaço, tab, vírgula, ponto-e-vírgula, pipe (|)</p>
          <p className="mt-2"><strong>Exemplos:</strong></p>
          <div className="bg-white dark:bg-gray-800 p-2 rounded font-mono text-xs mt-1">
            <div>M1234 450.5</div>
            <div>F5678 380 15/02/2026</div>
            <div>M9012|520.3|35.5|20/02/2026|Animal em ótimo estado</div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cole os dados das pesagens (uma por linha)
        </label>
        <textarea
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            setValidacao(null)
          }}
          className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
          placeholder="M1234 450.5 35.5 20/02/2026 Animal em ótimo estado
F5678 380 15/02/2026
M9012 520.3"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={validarTexto}
          disabled={!texto.trim() || processando}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {processando ? 'Validando...' : 'Validar Dados'}
        </button>
        {validacao && validacao.validos > 0 && (
          <button
            onClick={() => importarDados(false)}
            disabled={processando}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70"
          >
            Importar {validacao.validos} Pesagens
          </button>
        )}
        {validacao && validacao.pendentesCount > 0 && (
          <>
            <button
              onClick={() => importarDados(true)}
              disabled={processando}
              className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              title="Cadastra os animais não encontrados no app/banco e importa as pesagens. Depois complete o cadastro (nascimento, sexo, raça) em Animais."
            >
              {processando ? 'Importando... (aguarde 1-2 min)' : `Importar e Cadastrar ${validacao.pendentesCount} Animais`}
            </button>
            <button
              onClick={validarNovamente}
              disabled={processando}
              className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Validar Novamente
            </button>
          </>
        )}
      </div>

      {validacao && (
        <div className="space-y-4">
          <div className={`grid gap-4 ${validacao.pendentesCount > 0 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{validacao.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{validacao.validos}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Válidos (importar agora)</div>
            </div>
            {validacao.pendentesCount > 0 && (
              <div className="bg-amber-100 dark:bg-amber-900/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{validacao.pendentesCount}</div>
                <div className="text-sm text-amber-600 dark:text-amber-400">Pendentes (animal não cadastrado)</div>
              </div>
            )}
            <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{validacao.erros?.length ?? 0}</div>
              <div className="text-sm text-red-600 dark:text-red-400">Erros</div>
            </div>
          </div>

          {validacao.resultados.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-200 mb-3 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5" />
                Pesagens Válidas ({validacao.validos})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {validacao.resultados.map((item, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Linha {item.linha}:
                        </span>
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                          {String(item.animal)}
                        </span>
                        <span className="ml-2">
                          {item.animal_sexo === 'Macho' ? '♂️' : '♀️'}
                        </span>
                      </div>
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="mt-1 text-gray-600 dark:text-gray-400">
                      Peso: <strong>{String(item.peso)} kg</strong>
                      {item.ce && <> • CE: <strong>{String(item.ce)} cm</strong></>}
                      {' • Data: '}{new Date(item.data).toLocaleDateString('pt-BR')}
                      {item.observacoes && <> • {String(item.observacoes)}</>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {validacao.pendentes && validacao.pendentes.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg">
              <h4 className="font-medium text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                Pendentes – Animais não cadastrados ({validacao.pendentes.length})
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                <strong>Opção 1:</strong> Clique em <strong>Importar e Cadastrar</strong> para criar os animais no app/banco com dados mínimos (Série, RG) e importar as pesagens. Depois complete o cadastro (data de nascimento, sexo, raça, etc.) em Animais.
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Opção 2:</strong> Cadastre manualmente em Animais e clique em <strong>Validar Novamente</strong>.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {validacao.pendentes.slice(0, 20).map((p, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 p-2 rounded text-sm font-mono flex justify-between">
                    <span className="text-amber-700 dark:text-amber-400">Linha {p.linha}:</span>
                    <span className="text-gray-700 dark:text-gray-300">{String(p.texto)}</span>
                  </div>
                ))}
                {validacao.pendentes.length > 20 && (
                  <p className="text-xs text-amber-600">... e mais {validacao.pendentes.length - 20} linhas</p>
                )}
              </div>
            </div>
          )}

          {validacao.erros && validacao.erros.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
              <h4 className="font-medium text-red-900 dark:text-red-200 mb-3 flex items-center gap-2">
                <XCircleIcon className="w-5 h-5" />
                Erros Encontrados ({validacao.erros.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {validacao.erros.map((erro, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Linha {erro.linha}:
                        </span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400 font-mono">
                          {String(erro.texto)}
                        </span>
                      </div>
                      <XCircleIcon className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="mt-1 text-red-600 dark:text-red-400">
                      ⚠️ {String(erro.erro)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
