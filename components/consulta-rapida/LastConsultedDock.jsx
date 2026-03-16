export default function LastConsultedDock({ ultimoConsultado, onOpenAnimal }) {
  if (!ultimoConsultado?.serie || !ultimoConsultado?.rg) return null

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
      <div className="rounded-2xl border border-white/50 dark:border-gray-700/60 bg-white/90 dark:bg-gray-900/85 backdrop-blur-xl shadow-2xl p-2">
        <button
          type="button"
          onClick={() => onOpenAnimal(ultimoConsultado)}
          className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors"
        >
          Último consultado: {ultimoConsultado.serie}-{ultimoConsultado.rg}
        </button>
      </div>
    </div>
  )
}

