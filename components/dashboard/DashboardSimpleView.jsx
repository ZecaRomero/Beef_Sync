import LotesWidget from '../LotesWidget'
import AccessMonitor from '../ui/AccessMonitor'
import StatsCards from './StatsCards'
import QuickActionsCard from './QuickActionsCard'
import SimplifiedNoticeCard from './SimplifiedNoticeCard'

export default function DashboardSimpleView({ stats }) {
  return (
    <>
      <StatsCards stats={stats} />

      <div className="mb-6">
        <LotesWidget />
      </div>

      <div className="mb-6">
        <AccessMonitor />
      </div>

      <QuickActionsCard />
      <SimplifiedNoticeCard />
    </>
  )
}

