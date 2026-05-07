import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserCircle, Mail } from 'lucide-react'

interface Speaker {
  id: string; name: string; email: string | null; bio: string | null
  company: string | null; role: string | null; created_at: string
}

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('speakers').select('id, name, email, bio, company, role, created_at').order('created_at', { ascending: false })
      setSpeakers((data ?? []) as unknown as Speaker[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="font-heading text-[22px] sm:text-[26px] font-extrabold text-text leading-tight">Palestrantes</h1>
          <p className="text-[13px] text-text3 mt-1">Gerencie palestrantes e convide por e-mail</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-bg3 rounded-xl animate-pulse" />)}</div>
      ) : speakers.length > 0 ? (
        <div className="space-y-3">
          {speakers.map((speaker) => {
            const initials = speaker.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
            return (
              <div key={speaker.id} className="flex items-center gap-4 bg-bg2 border border-border-subtle rounded-xl p-4 hover:border-border-purple transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-dim border border-border-purple flex items-center justify-center text-[12px] font-heading font-bold text-purple-light shrink-0">{initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-text">{speaker.name}</div>
                  <div className="text-[11px] text-text3 mt-0.5">{speaker.company ?? ''}{speaker.role ? ` · ${speaker.role}` : ''}</div>
                </div>
                {speaker.email && (
                  <a href={`mailto:${speaker.email}`} className="flex items-center gap-1.5 text-[12px] text-text3 hover:text-purple-light transition-colors">
                    <Mail className="w-3.5 h-3.5" /> {speaker.email}
                  </a>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-bg2 border border-border-subtle rounded-xl">
          <UserCircle className="w-10 h-10 text-text3 mx-auto mb-3" />
          <p className="text-text2">Nenhum palestrante cadastrado ainda.</p>
        </div>
      )}
    </div>
  )
}
