import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { supabase } from '@/lib/supabase'
import { StatCard } from '@/components/ui/stat-card'
import { Plus } from 'lucide-react'

interface Organizer {
  id: string; email: string; full_name: string; created_at: string
}

export default function AdminPage() {
  const [organizerCount, setOrganizerCount] = useState(0)
  const [participantCount, setParticipantCount] = useState(0)
  const [eventCount, setEventCount] = useState(0)
  const [activeEventCount, setActiveEventCount] = useState(0)
  const [pendingInvitations, setPendingInvitations] = useState(0)
  const [recentOrganizers, setRecentOrganizers] = useState<Organizer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [oc, pc, ec, aec, pi, ro] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'organizer'),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'participant'),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('invitations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('user_profiles').select('id, email, full_name, created_at').eq('role', 'organizer').order('created_at', { ascending: false }).limit(5),
      ])
      setOrganizerCount(oc.count ?? 0)
      setParticipantCount(pc.count ?? 0)
      setEventCount(ec.count ?? 0)
      setActiveEventCount(aec.count ?? 0)
      setPendingInvitations(pi.count ?? 0)
      setRecentOrganizers((ro.data ?? []) as unknown as Organizer[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="max-w-6xl">
      <div className="h-8 w-48 bg-bg3 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-bg3 rounded-xl animate-pulse" />)}</div>
    </div>
  )

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-9">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Painel Administrativo</h1>
          <p className="text-[13px] text-text3 mt-0.5">Gerencie organizadores, eventos e convites</p>
        </div>
        <Link href="/admin/invitations?action=new&role=organizer" className="inline-flex items-center justify-center gap-1.5 bg-purple text-white px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all hover:bg-purple-light self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Convidar Organizador</span>
          <span className="sm:hidden">Convidar</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 md:mb-7 stagger-children">
        <StatCard label="Organizadores" value={organizerCount} sub="contas ativas" accent="purple" />
        <StatCard label="Participantes" value={participantCount} sub="registrados" accent="green" />
        <StatCard label="Eventos" value={eventCount} sub={`${activeEventCount} ativos`} badge={activeEventCount ? `${activeEventCount} ativos` : undefined} badgeVariant="green" accent="yellow" />
        <StatCard label="Convites Pendentes" value={pendingInvitations} sub="aguardando aceite" accent="teal" />
      </div>

      <div className="bg-bg2 border border-border-subtle rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-[15px] font-bold text-text">Organizadores Recentes</h2>
          <Link href="/admin/organizers" className="text-[12px] text-purple-light hover:text-purple transition-colors">Ver todos</Link>
        </div>
        {recentOrganizers.length === 0 ? (
          <p className="text-[13px] text-text3 text-center py-8">Nenhum organizador cadastrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {recentOrganizers.map((org) => (
              <div key={org.id} className="flex items-center justify-between px-4 py-3 bg-bg3 rounded-lg">
                <div>
                  <div className="text-[13px] font-medium text-text">{org.full_name || 'Sem nome'}</div>
                  <div className="text-[11px] text-text3">{org.email}</div>
                </div>
                <div className="text-[11px] text-text3">{new Date(org.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
