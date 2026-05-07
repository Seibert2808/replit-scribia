import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users } from 'lucide-react'

interface Participant {
  id: string; user_id: string; attended: boolean; registered_at: string
  user_profiles: { full_name: string; email: string } | null
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: eventData } = await supabase.from('events').select('id').order('start_date', { ascending: false }).limit(1)
      const eventId = (eventData as Array<{ id: string }>)?.[0]?.id
      if (!eventId) { setLoading(false); return }
      const { data } = await supabase.from('event_participants')
        .select('id, user_id, attended, registered_at, user_profiles(full_name, email)')
        .eq('event_id', eventId).order('registered_at', { ascending: false })
      setParticipants((data ?? []) as unknown as Participant[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Participantes</h1>
        <p className="text-[13px] text-text3 mt-0.5">Participantes dos seus eventos</p>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-bg3 rounded-xl animate-pulse" />)}</div>
      ) : participants.length > 0 ? (
        <div className="bg-bg2 border border-border-subtle rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Nome', 'Email', 'Cadastro', 'Status'].map((h) => (
                    <th key={h} className="text-[10.5px] text-text3 uppercase tracking-[0.8px] px-5 py-2.5 text-left border-b border-border-subtle">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-bg3 transition-colors">
                    <td className="px-5 py-3.5 text-[13px] text-text border-b border-border-subtle">{p.user_profiles?.full_name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-[13px] text-text2 border-b border-border-subtle">{p.user_profiles?.email ?? '—'}</td>
                    <td className="px-5 py-3.5 text-[12px] text-text3 border-b border-border-subtle">{new Date(p.registered_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-3.5 border-b border-border-subtle">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium ${p.attended ? 'bg-scribia-green/10 text-scribia-green' : 'bg-bg3 text-text3'}`}>
                        {p.attended ? 'Presente' : 'Registrado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-bg2 border border-border-subtle rounded-xl">
          <Users className="w-10 h-10 text-text3 mx-auto mb-3" />
          <p className="text-text2">Nenhum participante cadastrado ainda.</p>
        </div>
      )}
    </div>
  )
}
