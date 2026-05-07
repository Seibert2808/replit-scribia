import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { supabase } from '@/lib/supabase'
import { Chip } from '@/components/ui/chip'
import { Calendar } from 'lucide-react'

interface Event {
  id: string; name: string; status: string; start_date: string; organizer_id: string
  user_profiles: { full_name: string; email: string } | null
}

const statusMap: Record<string, { label: string; variant: 'green' | 'yellow' | 'default' | 'purple' }> = {
  draft: { label: 'Rascunho', variant: 'default' },
  active: { label: 'Ativo', variant: 'green' },
  completed: { label: 'Concluído', variant: 'purple' },
  archived: { label: 'Arquivado', variant: 'default' },
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('events').select('id, name, status, start_date, organizer_id, user_profiles(full_name, email)').order('start_date', { ascending: false })
      setEvents((data ?? []) as unknown as Event[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-6xl">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Todos os Eventos</h1>
        <p className="text-[13px] text-text3 mt-0.5">Eventos de todos os organizadores</p>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-bg3 rounded-xl animate-pulse" />)}</div>
      ) : events.length > 0 ? (
        <div className="space-y-2">
          {events.map((event) => {
            const { label, variant } = statusMap[event.status] ?? statusMap.draft
            return (
              <div key={event.id} className="flex items-center gap-3 bg-bg2 border border-border-subtle rounded-xl p-4 hover:border-border-purple transition-colors">
                <div className="w-9 h-9 rounded-lg bg-purple-dim border border-border-purple flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-purple-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-[13px] text-text">{event.name}</p>
                  <p className="text-[11px] text-text3 mt-0.5">{event.user_profiles?.full_name ?? 'Organizador'} · {new Date(event.start_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <Chip variant={variant}>{label}</Chip>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-bg2 border border-border-subtle rounded-xl">
          <Calendar className="w-10 h-10 text-text3 mx-auto mb-3" />
          <p className="text-text2">Nenhum evento cadastrado.</p>
        </div>
      )}
    </div>
  )
}
