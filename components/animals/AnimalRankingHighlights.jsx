import Link from 'next/link'
import { UserGroupIcon, TrophyIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function AnimalRankingHighlights({ animal, rankings }) {
  const { 
    posicaoIABCZ: rankingPosicao, 
    posicaoIQG: rankingPosicaoGenetica2, 
    filhoTopIABCZ: filhoTopRanking, 
    filhoTopIQG: filhoTopRankingIQG 
  } = rankings || {}

  return (
    <>
      {/* Destaque: MÃ£e do animal mais bem avaliado do PMGZ */}
      {filhoTopRanking && (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white border-2 border-emerald-400/50 ring-4 ring-emerald-400/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur">
              <UserGroupIcon className="h-12 w-12 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold tracking-wider opacity-90">MÃÆ’E DO ANIMAL MAIS BEM AVALIADO</p>
              <p className="text-2xl font-bold mt-0.5">Filho(a) em 1Âº lugar no Ranking iABCZ do PMGZ</p>
              <p className="text-sm mt-1 opacity-90 flex items-center gap-1">
                <SparklesIcon className="h-4 w-4" />
                Filho(a): {filhoTopRanking.serie} {filhoTopRanking.rg}
                {filhoTopRanking.nome && ` ââ‚¬¢ ${filhoTopRanking.nome}`}
              </p>
            </div>
            <Link
              href={`/consulta-animal/${filhoTopRanking.serie}-${filhoTopRanking.rg}`}
              className="hidden sm:flex w-16 h-16 rounded-full bg-white/20 items-center justify-center text-2xl font-black hover:bg-white/30 transition-colors"
            >
              ðÅ¸�â€ 
            </Link>
          </div>
        </div>
      )}

      {/* Destaque: 1Âº do Ranking iABCZ (apenas quando o prÃ³prio animal Ã© o 1Âº, nÃ£o a mÃ£e dele) */}
      {rankingPosicao === 1 && !filhoTopRanking && (
        <div className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-2xl shadow-xl p-6 text-white border-2 border-amber-300/50 ring-4 ring-amber-400/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur">
              <TrophyIcon className="h-12 w-12 text-amber-100" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold tracking-wider opacity-90">1Âº LUGAR NO RANKING iABCZ</p>
              <p className="text-2xl font-bold mt-0.5">Animal mais bem avaliado do rebanho</p>
              <p className="text-sm mt-1 opacity-90 flex items-center gap-1">
                <SparklesIcon className="h-4 w-4" />
                iABCZ: {animal.abczg || '-'} ââ‚¬¢ Melhor avaliaÃ§Ã£o genÃ©tica iABCZ
              </p>
            </div>
            <div className="hidden sm:flex w-16 h-16 rounded-full bg-white/20 items-center justify-center text-3xl font-black">
              1Âº
            </div>
          </div>
        </div>
      )}

      {/* Destaque: 1Âº do Ranking IQG (mesma lÃ³gica do iABCZ) */}
      {rankingPosicaoGenetica2 === 1 && !filhoTopRankingIQG && (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white border-2 border-indigo-400/50 ring-4 ring-indigo-400/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur">
              <TrophyIcon className="h-12 w-12 text-indigo-100" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold tracking-wider opacity-90">1Âº LUGAR NO RANKING IQG</p>
              <p className="text-2xl font-bold mt-0.5">Animal mais bem avaliado do rebanho (IQG)</p>
              <p className="text-sm mt-1 opacity-90 flex items-center gap-1">
                <SparklesIcon className="h-4 w-4" />
                IQG: {animal.iqg ?? animal.genetica_2 ?? '-'} ââ‚¬¢ Melhor avaliaÃ§Ã£o genÃ©tica IQG
              </p>
            </div>
            <div className="hidden sm:flex w-16 h-16 rounded-full bg-white/20 items-center justify-center text-3xl font-black">
              1Âº
            </div>
          </div>
        </div>
      )}

      {/* Destaque: 2Âº do Ranking iABCZ (PMGZ) - trofÃ©u prata */}
      {rankingPosicao === 2 && (
        <div className="bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 rounded-2xl shadow-xl p-6 text-white border-2 border-slate-300/50 ring-4 ring-slate-400/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur">
              <TrophyIcon className="h-12 w-12 text-slate-100" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold tracking-wider opacity-90">ðÅ¸¥Ë† 2Âº LUGAR NO RANKING iABCZ (PMGZ)</p>
              <p className="text-2xl font-bold mt-0.5">Segunda melhor avaliaÃ§Ã£o genÃ©tica</p>
              <p className="text-sm mt-1 opacity-90 flex items-center gap-1">
                <SparklesIcon className="h-4 w-4" />
                iABCZ: {animal.abczg || '-'} ââ‚¬¢ Excelente avaliaÃ§Ã£o genÃ©tica
              </p>
            </div>
            <div className="hidden sm:flex w-16 h-16 rounded-full bg-white/20 items-center justify-center text-3xl font-black">
              2Âº
            </div>
          </div>
        </div>
      )}
      {/* Destaque: 3Âº do Ranking iABCZ (PMGZ) - trofÃ©u bronze */}
      {rankingPosicao === 3 && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-2xl shadow-xl p-6 text-white border-2 border-amber-500/50 ring-4 ring-amber-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur">
              <TrophyIcon className="h-12 w-12 text-amber-100" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold tracking-wider opacity-90">ðÅ¸¥â€° 3Âº LUGAR NO RANKING iABCZ (PMGZ)</p>
              <p className="text-2xl font-bold mt-0.5">Terceira melhor avaliaÃ§Ã£o genÃ©tica</p>
              <p className="text-sm mt-1 opacity-90 flex items-center gap-1">
                <SparklesIcon className="h-4 w-4" />
                iABCZ: {animal.abczg || '-'} ââ‚¬¢ Ãâ€œtima avaliaÃ§Ã£o genÃ©tica
              </p>
            </div>
            <div className="hidden sm:flex w-16 h-16 rounded-full bg-white/20 items-center justify-center text-3xl font-black">
              3Âº
            </div>
          </div>
        </div>
      )}

      {/* Badge posiÃ§Ãµes 4Âº a 10Âº no ranking */}
      {rankingPosicao >= 4 && rankingPosicao <= 10 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">{rankingPosicao}Âº</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{rankingPosicao}Âº no Ranking iABCZ</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Top 10 ââ‚¬¢ Boa avaliaÃ§Ã£o genÃ©tica</p>
            </div>
          </div>
        </div>
      )}

      {/* Destaque: MÃ£e do animal mais bem avaliado do IQG */}
      {filhoTopRankingIQG && (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white border-2 border-indigo-400/50 ring-4 ring-indigo-400/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur">
              <UserGroupIcon className="h-12 w-12 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold tracking-wider opacity-90">MÃÆ’E DO ANIMAL MAIS BEM AVALIADO</p>
              <p className="text-2xl font-bold mt-0.5">Filho(a) em 1Âº lugar no Ranking IQG</p>
              <p className="text-sm mt-1 opacity-90 flex items-center gap-1">
                <SparklesIcon className="h-4 w-4" />
                Filho(a): {filhoTopRankingIQG.serie} {filhoTopRankingIQG.rg}
                {filhoTopRankingIQG.nome && ` ââ‚¬¢ ${filhoTopRankingIQG.nome}`}
              </p>
            </div>
            <Link
              href={`/consulta-animal/${filhoTopRankingIQG.serie}-${filhoTopRankingIQG.rg}`}
              className="hidden sm:flex w-16 h-16 rounded-full bg-white/20 items-center justify-center text-2xl font-black hover:bg-white/30 transition-colors"
            >
              ðÅ¸�â€ 
            </Link>
          </div>
        </div>
      )}

      {/* Destaque: 2Âº do Ranking IQG - trofÃ©u prata */}
      {rankingPosicaoGenetica2 === 2 && (
        <div className="bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 rounded-2xl shadow-xl p-6 text-white border-2 border-slate-300/50 ring-4 ring-slate-400/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur">
              <TrophyIcon className="h-12 w-12 text-slate-100" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold tracking-wider opacity-90">ðÅ¸¥Ë† 2Âº LUGAR NO RANKING IQG</p>
              <p className="text-2xl font-bold mt-0.5">Segunda melhor avaliaÃ§Ã£o genÃ©tica IQG</p>
              <p className="text-sm mt-1 opacity-90 flex items-center gap-1">
                <SparklesIcon className="h-4 w-4" />
                IQG: {animal.iqg ?? animal.genetica_2 ?? '-'} ââ‚¬¢ Excelente avaliaÃ§Ã£o genÃ©tica
              </p>
            </div>
            <div className="hidden sm:flex w-16 h-16 rounded-full bg-white/20 items-center justify-center text-3xl font-black">
              2Âº
            </div>
          </div>
        </div>
      )}
    </>
  )
}
