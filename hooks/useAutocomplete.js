/**
 * Hook para buscar dados de autocomplete da API genérica.
 * Retorna um objeto com os valores por campo para a tabela informada.
 *
 * Uso:
 *   const autocomplete = useAutocomplete('animais')
 *   // autocomplete.raca = ['Nelore', 'Angus', ...]
 *   // autocomplete.serie = ['AF 6039', ...]
 */
import { useState, useEffect } from 'react'

export function useAutocomplete(tabela, enabled = true) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tabela || !enabled) return
    setLoading(true)
    fetch(`/api/autocomplete?tabela=${encodeURIComponent(tabela)}&todos=1`)
      .then((res) => (res.ok ? res.json() : { data: {} }))
      .then((json) => {
        setData(json.data || {})
      })
      .catch(() => setData({}))
      .finally(() => setLoading(false))
  }, [tabela, enabled])

  return { data, loading }
}
