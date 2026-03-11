import React from 'react'
import { TrophyIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { getRankingBadgeClass } from '../../../utils/rankingStyles'

export default function RankingBadges({ rankings }) {
  const {
    posicaoIABCZ: rankingPosicao,
    posicaoDECA,
    posicaoIQG: rankingPosicaoGenetica2,
    posicaoPtIQG,
    filhoTopIABCZ: filhoTopRanking,
    filhoTopDECA,
    filhoTopIQG: filhoTopRankingIQG,
    filhoTopPtIQG
  } = rankings || {}

  const badges = []

  if (filhoTopRanking) badges.push({ key: 'ft-iabcz', cls: getRankingBadgeClass('iabcz', 1, true), icon: UserGroupIcon, text: 'Mãe do 1º iABCZ' })
  if (filhoTopDECA) badges.push({ key: 'ft-deca', cls: getRankingBadgeClass('deca', 1, true), icon: UserGroupIcon, text: 'Mãe do 1º DECA' })
  if (filhoTopRankingIQG) badges.push({ key: 'ft-iqg', cls: getRankingBadgeClass('iqg', 1, true), icon: UserGroupIcon, text: 'Mãe do 1º IQG' })
  if (filhoTopPtIQG) badges.push({ key: 'ft-ptiqg', cls: getRankingBadgeClass('ptiqg', 1, true), icon: UserGroupIcon, text: 'Mãe do 1º Pt IQG' })
  if (rankingPosicao === 1 && !filhoTopRanking) badges.push({ key: 'iabcz-1', cls: getRankingBadgeClass('iabcz', 1), icon: TrophyIcon, text: '1º iABCZ' })
  if (rankingPosicao === 2) badges.push({ key: 'iabcz-2', cls: getRankingBadgeClass('iabcz', 2), icon: TrophyIcon, text: '2º iABCZ' })
  if (rankingPosicao === 3) badges.push({ key: 'iabcz-3', cls: getRankingBadgeClass('iabcz', 3), icon: TrophyIcon, text: '3º iABCZ' })
  if (rankingPosicao >= 4 && rankingPosicao <= 10) badges.push({ key: 'iabcz-n', cls: getRankingBadgeClass('iabcz', rankingPosicao), icon: TrophyIcon, text: `${rankingPosicao}º iABCZ` })
  if (posicaoDECA === 1 && !filhoTopDECA) badges.push({ key: 'deca-1', cls: getRankingBadgeClass('deca', 1), icon: TrophyIcon, text: '1º DECA' })
  if (posicaoDECA === 2) badges.push({ key: 'deca-2', cls: getRankingBadgeClass('deca', 2), icon: TrophyIcon, text: '2º DECA' })
  if (posicaoDECA === 3) badges.push({ key: 'deca-3', cls: getRankingBadgeClass('deca', 3), icon: TrophyIcon, text: '3º DECA' })
  if (rankingPosicaoGenetica2 === 1 && !filhoTopRankingIQG) badges.push({ key: 'iqg-1', cls: getRankingBadgeClass('iqg', 1), icon: TrophyIcon, text: '1º IQG' })
  if (rankingPosicaoGenetica2 === 2) badges.push({ key: 'iqg-2', cls: getRankingBadgeClass('iqg', 2), icon: TrophyIcon, text: '2º IQG' })
  if (rankingPosicaoGenetica2 === 3) badges.push({ key: 'iqg-3', cls: getRankingBadgeClass('iqg', 3), icon: TrophyIcon, text: '3º IQG' })
  if (posicaoPtIQG === 1 && !filhoTopPtIQG) badges.push({ key: 'ptiqg-1', cls: getRankingBadgeClass('ptiqg', 1), icon: TrophyIcon, text: '1º Pt IQG' })
  if (posicaoPtIQG === 2) badges.push({ key: 'ptiqg-2', cls: getRankingBadgeClass('ptiqg', 2), icon: TrophyIcon, text: '2º Pt IQG' })
  if (posicaoPtIQG === 3) badges.push({ key: 'ptiqg-3', cls: getRankingBadgeClass('ptiqg', 3), icon: TrophyIcon, text: '3º Pt IQG' })

  if (badges.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {badges.map(({ key, cls, icon: Icon, text }) => (
        <span key={key} className={`${cls}`}>
          <Icon className="h-4 w-4 inline mr-1" />
          {text}
        </span>
      ))}
    </div>
  )
}
