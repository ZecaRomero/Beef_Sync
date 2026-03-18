import {
    PencilIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '../../../utils/formatters'
import InfoRow from '../InfoRow'

function GeneticRow({ label, value, icon: Icon, posicao, filhoTop, className }) {
  const hasValue = value !== null && value !== undefined && value !== ''
  if (!hasValue) return null

  const bgClasses = filhoTop ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' :
    posicao === 1 ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30' :
    posicao === 2 ? 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-700' :
    posicao === 3 ? 'bg-amber-50/30 dark:bg-amber-900/5 border-amber-100 dark:border-amber-800/20' :
    posicao && posicao <= 10 ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30' :
    'bg-amber-50/30 dark:bg-amber-900/5 border-amber-100 dark:border-amber-800/20'

  const textClasses = filhoTop ? 'text-emerald-800 dark:text-emerald-200' :
    posicao === 1 ? 'text-amber-800 dark:text-amber-200' :
    posicao === 2 ? 'text-slate-700 dark:text-slate-300' :
    posicao === 3 ? 'text-amber-800 dark:text-amber-200' :
    posicao && posicao <= 10 ? 'text-blue-800 dark:text-blue-200' :
    'text-amber-700 dark:text-amber-300'

  const valueClasses = filhoTop ? 'text-emerald-600 dark:text-emerald-400' :
    posicao === 1 ? 'text-amber-600 dark:text-amber-400' :
    posicao === 2 ? 'text-slate-600 dark:text-slate-300' :
    posicao === 3 ? 'text-amber-700 dark:text-amber-400' :
    posicao && posicao <= 10 ? 'text-blue-600 dark:text-blue-400' :
    'text-amber-600 dark:text-amber-400'

  const badgeClasses = filhoTop ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100' :
    posicao === 1 ? 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100' :
    posicao === 2 ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' :
    posicao === 3 ? 'bg-amber-300 dark:bg-amber-800 text-amber-900 dark:text-amber-100' :
    'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100'

  return (
    <div className={`px-4 py-2.5 flex justify-between items-center border-t ${bgClasses} ${className || ''}`}>
      <span className={`text-sm font-medium flex items-center gap-1 ${textClasses}`}>
        {filhoTop ? <UserGroupIcon className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        {label}
      </span>
      <span className={`text-lg font-bold ${valueClasses}`}>
        {value}
        {filhoTop && (
          <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${badgeClasses}`}>Mãe do 1º</span>
        )}
        {posicao && posicao <= 10 && !filhoTop && (
          <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${badgeClasses}`}>{posicao}º ranking</span>
        )}
      </span>
    </div>
  )
}

export default function GeneticInfoSection({ animal, rankings, onEditGenetica }) {
  const {
    posicaoIABCZ: rankingPosicao,
    posicaoIQG: rankingPosicaoGenetica2,
    filhoTopIABCZ: filhoTopRanking,
    filhoTopIQG: filhoTopRankingIQG
  } = rankings || {}

  return (
    <>
      {/* ── Puberdade ── */}
      {(animal.pub_classe || animal.pub_grupo) && (
        <div className="border-t border-orange-100 dark:border-orange-800/30">
          <div className="px-4 py-2 bg-orange-50/60 dark:bg-orange-900/10">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">Puberdade</p>
          </div>
          {animal.pub_classe && (
            <div className="px-4 py-2 flex justify-between items-center border-t border-orange-100/60 dark:border-orange-800/20">
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Classe</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{animal.pub_classe}</span>
            </div>
          )}
          {(animal.pub_grupo) && (
            <div className="px-4 py-2 flex justify-between items-center border-t border-orange-100/60 dark:border-orange-800/20">
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Grupo</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{animal.pub_grupo}</span>
            </div>
          )}
          {(animal.pub_idade != null) && (
            <div className="px-4 py-2 flex justify-between items-center border-t border-orange-100/60 dark:border-orange-800/20">
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Idade</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{animal.pub_idade} meses</span>
            </div>
          )}
          {(animal.pub_pct_media != null) && (
            <div className="px-4 py-2 flex justify-between items-center border-t border-orange-100/60 dark:border-orange-800/20">
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">% Média</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{animal.pub_pct_media}%</span>
            </div>
          )}
          {(animal.pub_classif != null) && (
            <div className="px-4 py-2 flex justify-between items-center border-t border-orange-100/60 dark:border-orange-800/20">
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Classificação</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{animal.pub_classif}º</span>
            </div>
          )}
        </div>
      )}

      <InfoRow label="Brinco" value={animal.brinco} />
      <InfoRow label="Tatuagem" value={animal.tatuagem} />
      {(animal.valor_venda || animal.valorVenda) && (
        <InfoRow label="Valor venda" value={formatCurrency(animal.valor_venda || animal.valorVenda)} />
      )}
      <InfoRow label="Comprador/Destino" value={animal.comprador || animal.destino} />
      <InfoRow label="Receptora" value={animal.receptora} />
      {(animal.situacao_abcz || animal.situacaoAbcz) && (
        <InfoRow
          label="Situação ABCZ"
          value={animal.situacao_abcz || animal.situacaoAbcz}
          action={
            <button
              type="button"
              onClick={onEditGenetica}
              className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
              title="Editar dados genéticos"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          }
        />
      )}
      {(animal.custo_aquisicao || animal.custoAquisicao) && (
        <InfoRow label="Custo aquisição" value={formatCurrency(animal.custo_aquisicao || animal.custoAquisicao)} />
      )}
    </>
  )
}
