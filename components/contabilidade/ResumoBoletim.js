/**
 * Componente para exibir resumo de animais por sexo e era
 */
const ResumoBoletim = ({ resumo }) => {
  // Log para debug
  console.log('🔍 ResumoBoletim recebido:', resumo)
  
  // Verificar se há animais mesmo que total seja 0 (pode haver problema no cálculo)
  const temAnimais = resumo && (
    resumo.total > 0 || 
    (resumo.porSexo && (resumo.porSexo.femeas > 0 || resumo.porSexo.machos > 0)) ||
    (resumo.porEra && Object.values(resumo.porEra).some(v => v > 0))
  )
  
  if (!resumo || !temAnimais) {
    console.log('⚠️ ResumoBoletim: Nenhum animal encontrado', {
      resumo,
      temAnimais,
      total: resumo?.total,
      porSexo: resumo?.porSexo,
      porEra: resumo?.porEra
    })
    return (
      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ Nenhum animal encontrado para este período
        </p>
      </div>
    )
  }
  
  // Recalcular total se necessário (caso tenha animais mas total seja 0)
  const totalRecalculado = resumo.total || 
    ((resumo.porSexo?.femeas || 0) + (resumo.porSexo?.machos || 0)) ||
    Object.values(resumo.porEra || {}).reduce((sum, val) => sum + (val || 0), 0)

  const { total, porSexo, porEra } = resumo
  const totalFinal = totalRecalculado || total || 0

  console.log('✅ ResumoBoletim: Exibindo dados', {
    totalOriginal: total,
    totalRecalculado,
    totalFinal,
    porSexo,
    porEra
  })

  return (
    <div className="mt-4 space-y-3">
      {/* Total */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Total de Animais:
        </span>
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          {totalFinal.toLocaleString('pt-BR')}
        </span>
      </div>

      {/* Por Sexo - Lado a Lado */}
      <div className="grid grid-cols-2 gap-3">
        {/* Fêmeas */}
        <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Fêmeas</span>
            <span className="text-lg font-bold text-pink-600 dark:text-pink-400">
              {porSexo.femeas || 0}
            </span>
          </div>
          <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
            {porEra['femea_0-7'] > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">0-7 meses:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{porEra['femea_0-7']}</span>
              </div>
            )}
            {porEra['femea_7-12'] > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">7-12 meses:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{porEra['femea_7-12']}</span>
              </div>
            )}
            {porEra['femea_12-18'] > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">12-18 meses:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{porEra['femea_12-18']}</span>
              </div>
            )}
            {porEra['femea_18-24'] > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">18-24 meses:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{porEra['femea_18-24']}</span>
              </div>
            )}
            {porEra['femea_24+'] > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">24+ meses:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{porEra['femea_24+']}</span>
              </div>
            )}
          </div>
        </div>

        {/* Machos */}
        <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Machos</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {porSexo.machos || 0}
            </span>
          </div>
          <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
            {porEra['macho_0-7'] > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">0-7 meses:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{porEra['macho_0-7']}</span>
              </div>
            )}
            {porEra['macho_7-15'] > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">7-15 meses:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{porEra['macho_7-15']}</span>
              </div>
            )}
            {porEra['macho_15-18'] > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">15-18 meses:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{porEra['macho_15-18']}</span>
              </div>
            )}
            {porEra['macho_18-22'] > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">18-22 meses:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{porEra['macho_18-22']}</span>
              </div>
            )}
            {porEra['macho_36+'] > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">36+ meses:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{porEra['macho_36+']}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumoBoletim

