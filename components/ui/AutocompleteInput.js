/**
 * Input com autocomplete reutilizável para todo o app.
 * Usa dados do banco para sugerir valores já cadastrados.
 *
 * Uso:
 *   <AutocompleteInput tabela="animais" campo="raca" value={x} onChange={setX} />
 *   <AutocompleteInput suggestions={['A','B']} value={x} onChange={setX} />
 */
import React from 'react'

export default function AutocompleteInput({
  tabela,
  campo,
  suggestions = [],
  value,
  onChange,
  id,
  className = '',
  placeholder = '',
  required = false,
  error,
  ...rest
}) {
  const datalistId = id || `datalist-${tabela || 'gen'}-${campo || Math.random().toString(36).slice(2)}`
  const opts = Array.isArray(suggestions) ? suggestions : []

  return (
    <>
      <datalist id={datalistId}>
        {opts.map((v, i) => (
          <option key={i} value={String(v)} />
        ))}
      </datalist>
      <input
        type="text"
        list={datalistId}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        className={className}
        placeholder={placeholder}
        required={required}
        {...rest}
      />
    </>
  )
}
