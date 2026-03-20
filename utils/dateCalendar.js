/**
 * Datas de calendário (nascimento, DATE do Postgres) não devem ser parseadas com
 * new Date('YYYY-MM-DD') ou meia-noite UTC, pois em pt-BR o dia aparece com -1.
 */

export function toLocalCalendarDate(input) {
  if (input == null || input === '') return null
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return null
    const uh = input.getUTCHours()
    const um = input.getUTCMinutes()
    const us = input.getUTCSeconds()
    const ums = input.getUTCMilliseconds()
    if (uh === 0 && um === 0 && us === 0 && ums === 0) {
      return new Date(
        input.getUTCFullYear(),
        input.getUTCMonth(),
        input.getUTCDate()
      )
    }
    return input
  }
  const s = String(input).trim()

  const isoZ = s.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z)?$/i
  )
  if (isoZ) {
    const h = parseInt(isoZ[4], 10)
    const mi = parseInt(isoZ[5], 10)
    const se = parseInt(isoZ[6], 10)
    if (h === 0 && mi === 0 && se === 0) {
      const y = parseInt(isoZ[1], 10)
      const mo = parseInt(isoZ[2], 10) - 1
      const d = parseInt(isoZ[3], 10)
      return new Date(y, mo, d)
    }
    const inst = new Date(s)
    return isNaN(inst.getTime()) ? null : inst
  }

  const isoDateOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDateOnly) {
    const y = parseInt(isoDateOnly[1], 10)
    const mo = parseInt(isoDateOnly[2], 10) - 1
    const d = parseInt(isoDateOnly[3], 10)
    const out = new Date(y, mo, d)
    return isNaN(out.getTime()) ? null : out
  }

  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (br) {
    const d = parseInt(br[1], 10)
    const mo = parseInt(br[2], 10) - 1
    const y = parseInt(br[3], 10)
    const out = new Date(y, mo, d)
    return isNaN(out.getTime()) ? null : out
  }

  const fallback = new Date(s)
  return isNaN(fallback.getTime()) ? null : fallback
}
