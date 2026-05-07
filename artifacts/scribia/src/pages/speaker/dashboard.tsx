import { useEffect, useState } from 'react'
import { Redirect } from 'wouter'
import { supabase } from '@/lib/supabase'
import { SpeakerSidebar } from '@/components/layout/speaker-sidebar'
import { StatCard } from '@/components/ui/stat-card'
import { Mic2 } from 'lucide-react'

interface Lead {
  id: string; full_name: string | null; email: string
  lead_temperature: 'hot' | 'warm' | 'cold'; engagement_score: number
}

interface Lecture {
  id: string; title: string; events: { name: string } | null
}

export default function SpeakerDashboardPage() {
  const [speakerName, setSpeakerName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); setSpeakerName('__unauthorized__'); return }

      const { data: speaker } = await supabase.from('speakers').select('id, name, profile_photo_url, avatar_url').eq('user_id', user.id).single()
      if (!speaker) { setLoading(false); return }
      const s = speaker as { id: string; name: string; profile_photo_url: string | null; avatar_url: string | null }
      setSpeakerName(s.name)
      setAvatarUrl(s.profile_photo_url || s.avatar_url)

      const { data: lecData } = await supabase.from('lectures').select('id, title, events(name)').eq('speaker_id', s.id)
      const lecs = (lecData ?? []) as unknown as Lecture[]
      setLectures(lecs)

      if (lecs.length > 0) {
        const { data: leadsData } = await supabase.from('lecture_leads').select('*').in('lecture_id', lecs.map((l) => l.id))
        setLeads((leadsData ?? []) as unknown as Lead[])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (speakerName === '__unauthorized__') return <Redirect to="/login" />

  if (loading) return (
    <div className="min-h-screen bg-bg lg:pl-64 pt-14 lg:pt-0">
      <div className="p-6 max-w-4xl">
        <div className="h-8 w-48 bg-bg3 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-bg3 rounded-xl animate-pulse" />)}</div>
      </div>
    </div>
  )

  const hotLeads = leads.filter((l) => l.lead_temperature === 'hot')
  const warmLeads = leads.filter((l) => l.lead_temperature === 'warm')

  return (
    <div className="min-h-screen bg-bg">
      <SpeakerSidebar userName={speakerName || 'Palestrante'} avatarUrl={avatarUrl} />
      <main className="lg:pl-64 pt-14 lg:pt-0 p-4 sm:p-6 md:p-8 min-h-screen">
        <div className="max-w-4xl">
          <div className="mb-6">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Quem na plateia virou lead?</h1>
            <p className="text-[13px] text-text3 mt-1">Engajamento dos participantes com suas palestras</p>
          </div>

          {lectures.length === 0 ? (
            <div className="text-center py-16 bg-bg2 border border-border-subtle rounded-xl">
              <Mic2 className="w-10 h-10 text-text3 mx-auto mb-3" />
              <p className="text-text2">Você ainda não tem palestras atribuídas.</p>
              <p className="text-text3 text-sm mt-1">Entre em contato com o organizador do evento.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 stagger-children">
                <StatCard label="Total de Leads" value={leads.length} sub="participantes" accent="purple" />
                <StatCard label="Leads Quentes" value={hotLeads.length} sub="alta intenção" accent="red" />
                <StatCard label="Leads Mornos" value={warmLeads.length} sub="engajados" accent="yellow" />
                <StatCard label="Palestras" value={lectures.length} sub="atribuídas" accent="green" />
              </div>

              {leads.length > 0 && (
                <div className="bg-bg2 border border-border-subtle rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border-subtle">
                    <h2 className="font-heading text-[15px] font-bold text-text">Leads recentes</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>{['Nome', 'Email', 'Temperatura', 'Score'].map((h) => <th key={h} className="text-[10.5px] text-text3 uppercase tracking-[0.8px] px-5 py-2.5 text-left border-b border-border-subtle">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {leads.slice(0, 10).map((lead) => {
                          const tempConfig = { hot: { label: 'Quente', style: 'text-red-500 bg-red-500/10' }, warm: { label: 'Morno', style: 'text-scribia-yellow bg-scribia-yellow/10' }, cold: { label: 'Frio', style: 'text-text3 bg-bg3' } }
                          const tc = tempConfig[lead.lead_temperature] ?? tempConfig.cold
                          return (
                            <tr key={lead.id} className="hover:bg-bg3 transition-colors">
                              <td className="px-5 py-3.5 text-[13px] text-text border-b border-border-subtle">{lead.full_name ?? '—'}</td>
                              <td className="px-5 py-3.5 text-[13px] text-text2 border-b border-border-subtle">{lead.email}</td>
                              <td className="px-5 py-3.5 border-b border-border-subtle">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium ${tc.style}`}>{tc.label}</span>
                              </td>
                              <td className="px-5 py-3.5 text-[13px] text-text2 border-b border-border-subtle">{lead.engagement_score}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
