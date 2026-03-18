/**
 * Modal para importar dados de Puberdade e Carcaça.
 * Suporta:
 *   1) Upload do Excel COMPLETO (5 abas: PROCRIAR, DGT, GENEPLUS, ANCP, PMGZ) — importa tudo de uma vez
 *   2) Cole diretamente do Excel (aba a aba)
 */
import { ClipboardDocumentListIcon, DocumentArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useMemo, useState } from 'react'
import ImportProgressOverlay from '../ImportProgressOverlay'

const FORMATOS = {
  puberdade: {
    label: 'Puberdade',
    color: 'orange',
    colunas: 'SERIE E RG | CLASSE | IDADE | %MÉDIA | GRUPO | CLASSIF',
    exemplo: 'CJCJ 15874\tSUPERPRECOCE\t9,85\t68\tELITE\t1',
    headers: ['SERIE E RG', 'CLASSE', 'IDADE', '%MEDIA', 'GRUPO', 'CLASSIF'],
    parse: (cols) => ({
      serie_rg: cols[0],
      classe: cols[1] || null,
      idade: cols[2] || null,
      pct_media: cols[3] || null,
      grupo: cols[4] || null,
      classif: cols[5] || null,
    }),
    preview: (d) => `${d.serie_rg} → ${d.classe || '-'} | Idade: ${d.idade || '-'} | ${d.grupo || '-'} | ${d.classif || '-'}º`,
  },
  carcaca: {
    label: 'Carcaça',
    color: 'red',
    colunas: 'SERIE E RG | AOL | AOL/100kg | RATIO | MAR | EGS | EGS/100kg | PICANHA',
    exemplo: 'CJCJ 16659\t76,63\t18,51\t0,5\t2,99\t4,71\t1,14\t5,16',
    headers: ['SERIE E RG', 'AOL', 'AOL/100kg', 'RATIO', 'MAR', 'EGS', 'EGS/100kg', 'PICANHA'],
    parse: (cols) => ({
      serie_rg: cols[0],
      aol: cols[1] || null,
      aol_100kg: cols[2] || null,
      ratio: cols[3] || null,
      mar: cols[4] || null,
      egs: cols[5] || null,
      egs_100kg: cols[6] || null,
      picanha: cols[7] || null,
    }),
    preview: (d) => `${d.serie_rg} → AOL: ${d.aol || '-'} | MAR: ${d.mar || '-'} | EGS: ${d.egs || '-'} | Picanha: ${d.picanha || '-'}`,
  },
}

function parsearTexto(texto, tipo) {
  const fmt = FORMATOS[tipo]
  const linhas = texto.trim().split(/\r?\n/).filter(Boolean)
  if (!linhas.length) return []
  const primeira = linhas[0].toUpperCase()
  const ehHeader = fmt.headers.some(h => primeira.includes(h.replace('%', '').replace('/', '')))
  const inicio = ehHeader ? 1 : 0
  return linhas.slice(inicio).map(l => {
    const cols = l.split('\t').map(c => c.trim())
    return fmt.parse(cols)
  }).filter(d => d.serie_rg && d.serie_rg.trim())
}

export default function ImportPuberdadeCarcacaModal({ isOpen, onClose, onSuccess }) {
  const [modo, setModo] = useState('arquivo') // 'arquivo' | 'texto'
  const [tipo, setTipo] = useState('puberdade')
  const [texto, setTexto] = useState('')
  const [arquivo, setArquivo] = useState(null)
  const [importando, setImportando] = useState(false)
  const [progress, setProgress] = useState(null)
  const [resultado, setResultado] = useState(null)

  const fmt = FORMATOS[tipo]
  const preview = useMemo(() => parsearTexto(texto, tipo).slice(0, 5), [texto, tipo])

  const handleImportarArquivo = async () => {
    if (!arquivo) { alert('Selecione o arquivo Excel'); return }
    setImportando(true)
    setResultado(null)
    try {
      const fd = new FormData()
      fd.append('file', arquivo)
      const res = await fetch('/api/import/excel-avaliacao-completa', { method: 'POST', body: fd })
      // Se a API devolver HTML/texto (ex: erro 500 do Vercel), `res.json()` quebra com
      // "Unexpected token '<'/'A'". Então tentamos converter com segurança.
      const raw = await res.text()
      let json = null
      try {
        json = raw ? JSON.parse(raw) : null
      } catch (_) {
        // Mantém fallback para o usuário ver o erro real que veio no corpo da resposta.
        throw new Error(raw?.slice(0, 500) || `Resposta não-JSON (HTTP ${res.status})`)
      }
      setResultado(json)
      if (json.success) {
        const abasMsgs = (json.abas || []).filter(a => a.tipo !== 'ignorada').map(a => `• ${a.nome}: ${a.atualizados} animais`).join('\n')
        alert(`✅ ${json.message}\n\n${abasMsgs}${json.naoEncontrados ? `\n\n⚠️ Não encontrados: ${json.naoEncontrados}` : ''}`)
        setArquivo(null)
        onSuccess?.()
      } else {
        alert(`❌ Erro: ${json.error}`)
      }
    } catch (e) {
      alert(`❌ Erro: ${e?.message || String(e)}`)
    } finally {
      setImportando(false)
    }
  }

  const handleImportarTexto = async () => {
    const dados = parsearTexto(texto, tipo)
    if (!dados.length) {
      alert('Nenhum dado válido encontrado. Cole os dados copiados do Excel.')
      return
    }
    setImportando(true)
    setResultado(null)
    try {
      const res = await fetch('/api/import/excel-puberdade-carcaca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, data: dados }),
      })
      const json = await res.json()
      setResultado(json)
      if (json.success) {
        alert(`✅ ${json.message}${json.naoEncontrados?.length ? `\n\n⚠️ Não encontrados (${json.naoEncontrados.length}): ${json.naoEncontrados.slice(0, 5).join(', ')}` : ''}`)
        setTexto('')
        onSuccess?.()
      } else {
        alert(`❌ Erro: ${json.error}`)
      }
    } catch (e) {
      alert(`❌ Erro: ${e.message}`)
    } finally {
      setImportando(false)
    }
  }

  if (!isOpen) return null

  const colorMap = {
    orange: {
      btn: 'bg-orange-600 hover:bg-orange-700',
      badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      tab: 'bg-orange-600 text-white',
      tabInactive: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20',
    },
    red: {
      btn: 'bg-red-600 hover:bg-red-700',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      tab: 'bg-red-600 text-white',
      tabInactive: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20',
    },
  }
  const c = colorMap[fmt.color]

  return (
    <>
      <ImportProgressOverlay importando={importando} progress={progress} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Importar Puberdade / Carcaça
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Seleção de modo */}
          <div className="flex gap-2">
            <button
              onClick={() => { setModo('arquivo'); setResultado(null) }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                modo === 'arquivo'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50'
              }`}
            >
              <DocumentArrowUpIcon className="w-4 h-4" />
              Excel Completo (5 abas)
            </button>
            <button
              onClick={() => { setModo('texto'); setResultado(null) }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                modo === 'texto'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <ClipboardDocumentListIcon className="w-4 h-4" />
              Colar aba a aba
            </button>
          </div>

          {/* MODO ARQUIVO */}
          {modo === 'arquivo' && (
            <>
              <div className="rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-300">
                <p className="font-bold mb-2">Selecione o arquivo Excel com as abas:</p>
                <ul className="space-y-1 text-xs">
                  <li>🟠 <strong>PROCRIAR</strong> → Puberdade (CLASSE, IDADE, GRUPO, CLASSIF)</li>
                  <li>🔴 <strong>DGT</strong> → Carcaça (AOL, MAR, EGS, PICANHA)</li>
                  <li>🟢 <strong>GENEPLUS</strong> → Genética (IQG, Pt IQG)</li>
                  <li>🔵 <strong>ANCP</strong> → Genética (MGTe, TOP)</li>
                  <li>🟣 <strong>PMGZ</strong> → DEP/DECA por trait (PN, PD, PA, PS, IPP, STAY, PE365, AOL, ACAB, MAR)</li>
                </ul>
                <p className="text-xs mt-2 opacity-75">As abas são detectadas automaticamente pelo nome.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Arquivo Excel (.xlsx):
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={e => setArquivo(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {arquivo && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">✅ {arquivo.name}</p>
                )}
              </div>
            </>
          )}

          {/* MODO TEXTO */}
          {modo === 'texto' && (
            <>
              <div className="flex gap-2">
                {Object.entries(FORMATOS).map(([key, f]) => (
                  <button
                    key={key}
                    onClick={() => { setTipo(key); setTexto(''); setResultado(null) }}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                      tipo === key ? colorMap[f.color].tab : colorMap[f.color].tabInactive
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className={`rounded-xl p-3 text-sm ${c.badge}`}>
                <p className="font-semibold mb-1">Colunas ({fmt.headers.length}): <span className="font-normal font-mono text-xs">{fmt.colunas}</span></p>
                <p className="font-semibold mt-1">Exemplo: <span className="font-normal font-mono text-xs">{fmt.exemplo}</span></p>
              </div>
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value)}
                rows={7}
                placeholder="Cole aqui os dados copiados do Excel (Ctrl+C → Ctrl+V). O cabeçalho é detectado automaticamente."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 p-3 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {preview.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Preview ({parsearTexto(texto, tipo).length} registros):</p>
                  <div className="space-y-1">
                    {preview.map((d, i) => (
                      <p key={i} className="text-xs font-mono bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300">
                        {fmt.preview(d)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Resultado */}
          {resultado && (
            <div className={`rounded-xl p-3 text-sm ${resultado.success ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
              {resultado.success
                ? `✅ ${resultado.message}`
                : `❌ ${resultado.error}`}
              {resultado.abas && (
                <ul className="mt-2 text-xs space-y-0.5">
                  {resultado.abas.filter(a => a.tipo !== 'ignorada').map((a, i) => (
                    <li key={i}>• {a.nome}: {a.atualizados} de {a.registros} animais</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            Fechar
          </button>
          <button
            onClick={modo === 'arquivo' ? handleImportarArquivo : handleImportarTexto}
            disabled={importando || (modo === 'arquivo' ? !arquivo : !texto.trim())}
            className={`flex-1 py-2.5 rounded-xl text-white font-semibold transition-all disabled:opacity-50 ${
              modo === 'arquivo' ? 'bg-blue-600 hover:bg-blue-700' : c.btn
            }`}
          >
            {importando ? 'Importando...' : modo === 'arquivo' ? 'Importar Todas as Abas' : `Importar ${fmt.label}`}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
