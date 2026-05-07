import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users } from 'lucide-react'

interface Organizer {
  id: string; email: string; full_name: string; created_at: string
}

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('user_profiles').select('id, email, full_name, created_at').eq('role', 'organizer').order('created_at', { ascending: false })
      setOrganizers((data ?? []) as unknown as Organizer[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Organizadores</h1>
        <p className="text-[13px] text-text3 mt-0.5">Todas as contas de organizador</p>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-bg3 rounded-xl animate-pulse" />)}</div>
      ) : organizers.length > 0 ? (
        <div className="bg-bg2 border border-border-subtle rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>{['Nome', 'Email', 'Desde'].map((h) => <th key={h} className="text-[10.5px] text-text3 uppercase tracking-[0.8px] px-5 py-2.5 text-left border-b border-border-subtle">{h}</th>)}</tr>
            </thead>
            <tbody>
              {organizers.map((org) => (
                <tr key={org.id} className="hover:bg-bg3 transition-colors">
                  <td className="px-5 py-3.5 text-[13px] text-text border-b border-border-subtle">{org.full_name || '—'}</td>
                  <td className="px-5 py-3.5 text-[13px] text-text2 border-b border-border-subtle">{org.email}</td>
                  <td className="px-5 py-3.5 text-[12px] text-text3 border-b border-border-subtle">{new Date(org.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-bg2 border border-border-subtle rounded-xl">
          <Users className="w-10 h-10 text-text3 mx-auto mb-3" />
          <p className="text-text2">Nenhum organizador cadastrado.</p>
        </div>
      )}
    </div>
  )
}
