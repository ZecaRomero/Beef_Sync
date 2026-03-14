import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { CurrencyDollarIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { formatDate, formatCurrency } from '../../utils/formatters'

const TIPOS_CUSTO = [
  'Protocolo SanitÃ¡rio', 'DNA', 'Medicamento', 'Vacina',
  'VeterinÃ¡rio', 'Manejo', 'Pesagens', 'Transporte', 'ABCZ', 'Exame', 'Outros'
]

export default function AnimalCosts({ animal, onCustosUpdated }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingCusto, setEditingCusto] = useState(null)
  const [applyToAll, setApplyToAll] = useState(false)
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
      
      let userName = ''
      try {
        const stored = localStorage.getItem('beef_usuario_identificado')
        if (stored) {
          const data = JSON.parse(stored)
          userName = data.nome || ''
        }
      } catch (_) {}

      // Permite ediÃ§Ã£o se for localhost ou se o usuÃ¡rio identificado for "Zeca Desenvolvedor"
      if (isLocal || (userName && userName.toLowerCase() === 'zeca desenvolvedor')) {
        setCanEdit(true)
      }
    }
  }, [])

  const custosArray = animal?.custos || []
  const [margin, setMargin] = useState(30) // Margem de lucro padrÃ£o 30%

  const custoTotal = custosArray.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
  const temCustos = custosArray.length > 0 && custoTotal > 0

  const precoVendaSugerido = custoTotal * (1 + (margin / 100))
  const lucroProjetado = precoVendaSugerido - custoTotal

  const custosPorTipo = custosArray.reduce((acc, curr) => {
    const tipo = curr.tipo || curr.subtipo || 'Outros'
    acc[tipo] = (acc[tipo] || 0) + (Number(curr.valor) || 0)
    return acc
  }, {})

  const handleEdit = (c) => {
    setEditingCusto({
      id: c.id,
      tipo: c.tipo || '',
      subtipo: c.subtipo || '',
      valor: String(c.valor ?? ''),
      data: c.data || new Date().toISOString().split('T')[0],
      observacoes: c.observacoes || ''
    })
    setApplyToAll(false)
  }

  const handleSaveEdit = async () => {
    if (!canEdit) return
    if (!editingCusto || !animal?.id) return
    if (!editingCusto.tipo || !editingCusto.valor) {
      alert('Tipo e valor sÃ£o obrigatÃ³rios')
      return
    }
    try {
      const res = await fetch(`/api/custos?id=${editingCusto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: editingCusto.tipo,
          subtipo: editingCusto.subtipo || null,
          valor: parseFloat(editingCusto.valor),
          data: editingCusto.data,
          observacoes: editingCusto.observacoes || null,
          applyToAll
        })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Erro ao atualizar')
      const msg = data.data?.aplicadosTodos
        ? `âÅ“â€¦ Atualizado! Aplicado a ${data.data.aplicadosTodos.atualizados} lanÃ§amento(s) em ${data.data.aplicadosTodos.animais} animal(is).`
        : 'âÅ“â€¦ Custo atualizado!'
      alert(msg)
      setEditingCusto(null)
      onCustosUpdated?.()
    } catch (e) {
      alert('â�Å’ Erro: ' + (e.message || e))
    }
  }

  const handleDelete = async (c) => {
    if (!canEdit) return
    if (!confirm(`Excluir custo "${c.tipo}${c.subtipo ? ' - ' + c.subtipo : ''}" de R$ ${parseFloat(c.valor || 0).toFixed(2)}?`)) return
    try {
      const res = await fetch(`/api/custos?id=${c.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Erro ao excluir')
      setEditingCusto(null)
      onCustosUpdated?.()
    } catch (e) {
      alert('â�Å’ Erro: ' + (e.message || e))
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-green-600/10 to-emerald-600/10 dark:from-green-900/30 dark:to-emerald-900/30 border-b border-gray-200 dark:border-gray-700 text-left hover:from-green-600/20 hover:to-emerald-600/20 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Custos Detalhados</h2>
          </div>
          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
        <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(custoTotal)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {temCustos ? `${custosArray.length} lanÃ§amento(s)` : 'Nenhum custo registrado'}
        </p>
        {!temCustos && canEdit && (
          <Link
            href="/custos"
            onClick={(e) => e.stopPropagation()}
            className="inline-block mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Registrar custos ou aplicar automÃ¡ticos ââ€ â€™
          </Link>
        )}
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        {!temCustos && isExpanded && (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm mb-2">Nenhum custo registrado para este animal.</p>
            {canEdit && (
              <Link href="/custos" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                Ir para Custos por Animal ââ€ â€™
              </Link>
            )}
          </div>
        )}
        {temCustos && (
        <>
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {custosArray.length} lanÃ§amento{custosArray.length !== 1 ? 's' : ''}
          </span>
          {canEdit && (
            <Link
              href={animal?.id ? `/custos?animalId=${animal.id}` : '/custos'}
              className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 hover:underline"
            >
              + Adicionar custo
            </Link>
          )}
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
          {custosArray.map((c, i) => (
            <div key={c.id || i} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {c.tipo}
                    </p>
                    {c.subtipo && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {c.subtipo}
                      </span>
                    )}
                  </div>
                  {c.observacoes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{c.observacoes}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(c.data)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(c.valor)}
                  </span>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleEdit(c) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(c) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SimulaÃ§Ã£o de Lucro */}
        <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">SimulaÃ§Ã£o de Venda e Lucro</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Margem de Lucro Desejada (%)</label>
              <input 
                type="number" 
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Custo Total:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(custoTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Lucro Projetado:</span>
                <span className="font-medium text-green-600 dark:text-green-400">+{formatCurrency(lucroProjetado)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">PreÃ§o de Venda:</span>
                <span className="text-blue-600 dark:text-blue-400">{formatCurrency(precoVendaSugerido)}</span>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Modal Editar Custo */}
      {editingCusto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingCusto(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Editar Custo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo *</label>
                <select
                  value={editingCusto.tipo}
                  onChange={e => setEditingCusto({ ...editingCusto, tipo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione</option>
                  {TIPOS_CUSTO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtipo</label>
                <input
                  type="text"
                  value={editingCusto.subtipo}
                  onChange={e => setEditingCusto({ ...editingCusto, subtipo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Brinco Amarelo, RGN..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingCusto.valor}
                  onChange={e => setEditingCusto({ ...editingCusto, valor: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                <input
                  type="date"
                  value={editingCusto.data}
                  onChange={e => setEditingCusto({ ...editingCusto, data: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ObservaÃ§Ãµes</label>
                <textarea
                  value={editingCusto.observacoes}
                  onChange={e => setEditingCusto({ ...editingCusto, observacoes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="2"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToAll}
                  onChange={e => setApplyToAll(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Aplicar esta alteraÃ§Ã£o a todos os animais com este mesmo custo (tipo + subtipo)
                </span>
              </label>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
              >
                Salvar
              </button>
              <button
                onClick={() => setEditingCusto(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
