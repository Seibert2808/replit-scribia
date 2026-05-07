'use client'

import { Users, Flame, Download, Headphones } from 'lucide-react'

interface EngagementStatsProps {
  totalLeads: number
  hotLeads: number
  totalDownloads: number
  audioCompletes: number
}

export function EngagementStats({ totalLeads, hotLeads, totalDownloads, audioCompletes }: EngagementStatsProps) {
  const stats = [
    { label: 'Total de Leads', value: totalLeads, icon: Users, color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/20' },
    { label: 'Leads Quentes', value: hotLeads, icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
    { label: 'Downloads', value: totalDownloads, icon: Download, color: 'text-scribia-green', bgColor: 'bg-scribia-green/10', borderColor: 'border-scribia-green/20' },
    { label: 'Escutas Completas', value: audioCompletes, icon: Headphones, color: 'text-scribia-teal', bgColor: 'bg-scribia-teal/10', borderColor: 'border-scribia-teal/20' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`bg-bg2 border ${stat.borderColor} rounded-xl p-4 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </div>
          <div className="font-heading text-3xl font-extrabold text-text mb-1">{stat.value}</div>
          <span className="text-[11px] text-text3 font-medium">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}
