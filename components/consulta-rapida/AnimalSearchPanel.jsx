import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { formatNomeAnimal } from '../../utils/animalUtils'

export default function AnimalSearchPanel({
  nomeIdent,
  modoBusca,
  onModoBuscaChange,
  onPreencherSeriePadrao,
  onLimparFormulario,
  handleSubmit,
  buscaPrincipalRef,
  nomeAnimal,
  onNomeAnimalChange,
  onBuscaPrincipalKeyDown,
  onBuscaPrincipalFocus,
  sugestoes,
  showSugestoes,
  loadingSugestoes,
  sugestaoAtivaIdx,
  onSugestaoMouseEnter,
  onAbrirAnimal,
  serieRef,
  serie,
  rg,
  onSerieChange,
  onSerieBlur,
  onRgChange,
  onRgBlur,
  touched,
  isSerieValid,
  isRgValid,
  canSubmit,
  loading,
  error,
  getInputClass,
}) {
  return (
    <div className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 dark:border-gray-700/70 p-5 mb-4 animate-slide-up">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MagnifyingGlassIcon className="w-6 h-6 text-amber-600 dark:text-amber-500" />
          Consulta Animal
        </h2>
        <div className="text-[11px] px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {nomeIdent || 'Usuário'}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 p-1 rounded-xl bg-gray-100 dark:bg-gray-700/80">
        <button
          type="button"
          onClick={() => onModoBuscaChange('inteligente')}
          className={`py-2.5 rounded-lg text-sm font-bold transition-all ${
            modoBusca === 'inteligente'
              ? 'bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-300 shadow'
              : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          Inteligente
        </button>
        <button
          type="button"
          onClick={() => onModoBuscaChange('manual')}
          className={`py-2.5 rounded-lg text-sm font-bold transition-all ${
            modoBusca === 'manual'
              ? 'bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-300 shadow'
              : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          Manual
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPreencherSeriePadrao}
          className="px-3 py-2 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
        >
          Série padrão
        </button>
        <button
          type="button"
          onClick={onLimparFormulario}
          className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 transition-colors"
        >
          Limpar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {modoBusca === 'inteligente' && (
          <div className="relative sugestoes-container">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome ou RG
            </label>
            <div className="relative">
              <input
                ref={buscaPrincipalRef}
                type="text"
                value={nomeAnimal}
                onChange={onNomeAnimalChange}
                onKeyDown={onBuscaPrincipalKeyDown}
                onFocus={onBuscaPrincipalFocus}
                placeholder="Ex.: 12345 ou nome do animal"
                className="w-full px-4 py-4 text-lg rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-amber-500 focus:ring-amber-500"
                autoComplete="off"
                disabled={loading}
              />
              {loadingSugestoes && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent" />
                </div>
              )}
            </div>

            {showSugestoes && sugestoes.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {sugestoes.map((animal, index) => (
                  <button
                    key={index}
                    type="button"
                    onMouseEnter={() => onSugestaoMouseEnter(index)}
                    onClick={() => onAbrirAnimal(animal)}
                    className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                      sugestaoAtivaIdx === index
                        ? 'bg-amber-50 dark:bg-gray-700/90'
                        : 'hover:bg-amber-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatNomeAnimal(animal)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Série: <span className="font-medium text-amber-600 dark:text-amber-500">{animal.serie}</span> • RG: <span className="font-medium text-amber-600 dark:text-amber-500">{animal.rg}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Série</label>
            <div className="relative">
              <input
                ref={serieRef}
                type="text"
                value={serie}
                onChange={onSerieChange}
                onBlur={onSerieBlur}
                placeholder="Ex: CJCJ"
                className={getInputClass(isSerieValid, touched.serie)}
                autoComplete="on"
                autoCapitalize="characters"
                inputMode="text"
                disabled={loading}
              />
              {touched.serie && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isSerieValid ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <XCircleIcon className="w-6 h-6 text-red-500" />}
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">RG</label>
            <div className="relative">
              <input
                type="text"
                value={rg}
                onChange={onRgChange}
                onBlur={onRgBlur}
                placeholder="Ex: 12345"
                className={getInputClass(isRgValid, touched.rg)}
                autoComplete="off"
                inputMode="numeric"
                disabled={loading}
              />
              {touched.rg && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isRgValid ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <XCircleIcon className="w-6 h-6 text-red-500" />}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 hover:from-amber-700 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:shadow-amber-600/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Buscando...
            </>
          ) : (
            <>
              <MagnifyingGlassIcon className="w-6 h-6" />
              Buscar Animal
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2 animate-shake">
          <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

