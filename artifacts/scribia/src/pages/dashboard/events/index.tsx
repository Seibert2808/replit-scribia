import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { supabase } from '@/lib/supabase'
import { Chip } from '@/components/ui/chip'
import { Plus, Calendar, MapPin } from 'lucide-react'

interface Event {
  id: string; name: string; start_date: string; end_date: string
  status: string; location: string | null; cover_image_url: string | null; lecture_count: number
}

const statusMap: Record<string, { label: string; variant: 'green' | 'yellow' | 'default' | 'purple' }> = {
  draft: { label: 'Rascunho', variant: 'default' },
  active: { label: 'Ativo', variant: 'green' },
  completed: { label: 'Concluído', variant: 'purple' },
  archived: { label: 'Arquivado', variant: 'default' },
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('events').select('*, lectures(count)').order('start_date', { ascending: false })
      const rows = (data ?? []) as unknown as Array<Event & { lectures: { count: number }[] }>
      setEvents(rows.map((e) => ({ ...e, lecture_count: e.lectures?.[0]?.count ?? 0 })))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-9">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Eventos</h1>
          <p className="text-[13px] text-text3 mt-0.5">Gerencie todos os seus eventos</p>
        </div>
        <Link href="/dashboard/events/new" className="inline-flex items-center justify-center gap-1.5 bg-purple text-white px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all hover:bg-purple-light self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5" /> Novo Evento
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-bg3 rounded-xl animate-pulse" />)}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {events.map((event) => {
            const { label, variant } = statusMap[event.status] ?? statusMap.draft
            const startDate = new Date(event.start_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
            const endDate = new Date(event.end_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
            return (
              <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                <div className="relative bg-bg2 border border-border-subtle rounded-xl overflow-hidden hover:border-border-purple transition-all animate-fade-up cursor-pointer h-full">
                  <div className="h-1 bg-purple w-full" />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-heading font-bold text-[15px] text-text leading-snug">{event.name}</h3>
                      <Chip variant={variant}>{label}</Chip>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[12px] text-text3">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {startDate} – {endDate}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-[12px] text-text3">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-border-subtle">
                      <span className="text-[12px] text-purple-light">{event.lecture_count} palestras</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-dim border border-border-purple flex items-center justify-center mx-auto mb-4">
            <Plus className="w-7 h-7 text-purple-light" />
          </div>
          <p className="text-lg text-text2">Nenhum evento criado.</p>
          <p className="mt-2 text-text3"><Link href="/dashboard/events/new" className="text-purple-light hover:text-purple transition-colors">Crie seu primeiro evento!</Link></p>
        </div>
      )}
    </div>
  )
}
