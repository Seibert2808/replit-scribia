import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/modal'
import { Mail, Plus, Copy, Check } from 'lucide-react'

interface Invitation {
  id: string; email: string; role: string; status: string; created_at: string; token: string
}

const inputClass = 'w-full bg-bg3 border border-border-subtle rounded-lg px-3.5 py-2.5 text-[13px] text-text placeholder:text-text3 outline-none transition-all focus:border-border-purple focus:ring-2 focus:ring-purple/20'
const labelClass = 'block text-[12px] font-medium text-text2 mb-1.5'

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'organizer' | 'speaker'>('organizer')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('invitations').select('*').order('created_at', { ascending: false })
    setInvitations((data ?? []) as unknown as Invitation[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)
    const { error } = await supabase.from('invitations').insert({ email: inviteEmail, role: inviteRole, status: 'pending' } as never)
    if (error) { setError(error.message); setSending(false); return }
    setShowModal(false)
    setInviteEmail('')
    await load()
    setSending(false)
  }

  function copyLink(token: string, id: string) {
    const link = `${window.location.origin}/auth/set-password?token=${token}`
    navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const statusStyles: Record<string, string> = {
    pending: 'bg-scribia-yellow/10 text-scribia-yellow',
    accepted: 'bg-scribia-green/10 text-scribia-green',
    expired: 'bg-bg3 text-text3',
    revoked: 'bg-scribia-red/10 text-scribia-red',
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Convites</h1>
          <p className="text-[13px] text-text3 mt-0.5">Gerencie convites de organizadores e palestrantes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 bg-purple text-white px-4 py-2.5 rounded-lg text-[13px] font-medium hover:bg-purple-light transition-all self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5" /> Novo convite
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-bg3 rounded-xl animate-pulse" />)}</div>
      ) : invitations.length > 0 ? (
        <div className="bg-bg2 border border-border-subtle rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>{['Email', 'Papel', 'Status', 'Enviado', 'Link'].map((h) => <th key={h} className="text-[10.5px] text-text3 uppercase tracking-[0.8px] px-5 py-2.5 text-left border-b border-border-subtle">{h}</th>)}</tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-bg3 transition-colors">
                    <td className="px-5 py-3.5 text-[13px] text-text border-b border-border-subtle">{inv.email}</td>
                    <td className="px-5 py-3.5 text-[12px] text-text2 border-b border-border-subtle">{inv.role}</td>
                    <td className="px-5 py-3.5 border-b border-border-subtle">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyles[inv.status] ?? statusStyles.pending}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-text3 border-b border-border-subtle">{new Date(inv.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-3.5 border-b border-border-subtle">
                      {inv.token && inv.status === 'pending' && (
                        <button onClick={() => copyLink(inv.token, inv.id)} className="w-7 h-7 rounded-md bg-bg3 border border-border-subtle flex items-center justify-center text-text2 hover:border-border-purple hover:text-purple-light transition-all">
                          {copiedId === inv.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-bg2 border border-border-subtle rounded-xl">
          <Mail className="w-10 h-10 text-text3 mx-auto mb-3" />
          <p className="text-text2">Nenhum convite enviado ainda.</p>
        </div>
      )}

      {showModal && (
        <Modal title="Novo convite" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required className={inputClass} placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className={labelClass}>Papel *</label>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'organizer' | 'speaker')} className={inputClass}>
                <option value="organizer">Organizador</option>
                <option value="speaker">Palestrante</option>
              </select>
            </div>
            {error && <div className="text-[12px] text-scribia-red bg-scribia-red/8 border border-scribia-red/20 rounded-lg px-3 py-2">{error}</div>}
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={sending} className="px-5 py-2.5 rounded-lg bg-purple text-white text-[13px] font-medium hover:bg-purple-light disabled:opacity-50 transition-all">
                {sending ? 'Enviando...' : 'Enviar convite'}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg bg-transparent border border-border-subtle text-[13px] text-text2 hover:border-border-purple hover:text-purple-light transition-all">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
