'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { Chip } from '@/components/ui/chip'
import { SpeakerFormModal } from './speaker-form-modal'
import {
  Mail,
  Send,
  Upload,
  RefreshCw,
  Trash2,
  X,
  Pencil,
  MoreVertical,
  FileSpreadsheet,
  Link2,
  Check,
  KeyRound,
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface ConfirmedSpeaker {
  id: string
  name: string
  email: string | null
  bio: string | null
  company: string | null
  role: string | null
  mini_bio: string | null
  linkedin_url: string | null
  pronouns: string | null
  lectureTitle: string
}

interface PendingInvite {
  id: string
  email: string
  speakerName: string | null
  sentAt: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expiresAt: string
  token?: string
}

interface SpeakersPageClientProps {
  eventId: string
  initialConfirmed: ConfirmedSpeaker[]
  initialPending: PendingInvite[]
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'agora'
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

function isExpired(expiresAt: string, status: string): boolean {
  if (status === 'expired' || status === 'revoked') return true
  return new Date(expiresAt).getTime() < Date.now()
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function SpeakersPageClient({
  eventId,
  initialConfirmed,
  initialPending,
}: SpeakersPageClientProps) {
  const [emailInput, setEmailInput] = useState('')
  const [emailTags, setEmailTags] = useState<string[]>([])
  const [confirmed] = useState(initialConfirmed)
  const [pending] = useState(initialPending)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingSpeaker, setEditingSpeaker] = useState<ConfirmedSpeaker | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  function copyInviteLink(invite: PendingInvite) {
    if (!invite.token) return
    const link = `${window.location.origin}/auth/set-password?token=${invite.token}`
    navigator.clipboard.writeText(link)
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function addEmail() {
    const val = emailInput.trim()
    if (!val || !val.includes('@')) return
    if (emailTags.includes(val)) return
    setEmailTags((prev) => [...prev, val])
    setEmailInput('')
  }

  async function sendSingleInvite() {
    const val = emailInput.trim()
    if (!val || !val.includes('@')) return
    setEmailTags([val])
    setEmailInput('')
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Sessão expirada. Faça login novamente.')
      setLoading(false)
      setEmailTags([])
      return
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const speakerName = val.split('@')[0].replace(/[._]/g, ' ')

    const response = await fetch(`${supabaseUrl}/functions/v1/send-invitation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: val,
        role: 'speaker',
        event_id: eventId,
        speaker_name: speakerName,
        origin: window.location.origin,
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setError(data?.error || `Erro ao convidar ${val}`)
    } else {
      setSuccess(data?.message || `Convite enviado para ${val}`)
    }

    setEmailTags([])
    setLoading(false)
    router.refresh()
  }

  function removeTag(email: string) {
    setEmailTags((prev) => prev.filter((e) => e !== email))
  }

  async function sendInvites() {
    if (emailTags.length === 0) return
    setLoading(true)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Sessão expirada. Faça login novamente.')
      setLoading(false)
      return
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    let failCount = 0

    for (const email of emailTags) {
      const speakerName = email.split('@')[0].replace(/[._]/g, ' ')

      const response = await fetch(`${supabaseUrl}/functions/v1/send-invitation`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role: 'speaker',
          event_id: eventId,
          speaker_name: speakerName,
          origin: window.location.origin,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error(`Failed to invite ${email}:`, data.error)
        failCount++
      }
    }

    setEmailTags([])
    setLoading(false)

    if (failCount > 0) {
      setError(`${failCount} convite(s) falharam. Verifique os emails e tente novamente.`)
    }

    router.refresh()
  }

  async function revokeInvite(invitationId: string) {
    if (!confirm('Revogar este convite?')) return
    await supabase
      .from('invitations')
      .update({ status: 'revoked' } as never)
      .eq('id', invitationId)
    router.refresh()
  }

  async function resendInvite(email: string) {
    setLoading(true)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Sessão expirada.')
      setLoading(false)
      return
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    const response = await fetch(`${supabaseUrl}/functions/v1/send-invitation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        role: 'speaker',
        event_id: eventId,
        origin: window.location.origin,
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Erro' }))
      setError(data.error || 'Erro ao reenviar convite')
    }

    setLoading(false)
    router.refresh()
  }

  function importFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })

        const emails: string[] = []
        for (const row of rows.slice(1)) {
          const email = String(row[1] ?? '').trim()
          if (email && email.includes('@') && !emailTags.includes(email)) {
            emails.push(email)
          }
        }
        setEmailTags((prev) => [...prev, ...emails])
      } catch {
        setError('Erro ao ler o arquivo. Verifique se é um Excel (.xlsx) ou CSV válido.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function downloadTemplate() {
    const headers = ['Nome', 'Email', 'Empresa', 'Cargo']
    const example = ['João Silva', 'joao@empresa.com', 'TechCorp', 'CTO']
    const ws = XLSX.utils.aoa_to_sheet([headers, example])
    ws['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 20 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Palestrantes')
    XLSX.writeFile(wb, 'modelo-palestrantes.xlsx')
  }

  async function resetSpeakerPassword(speakerEmail: string, speakerName: string) {
    try {
      const res = await fetch('/api/reset-speaker-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: speakerEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(`Erro ao enviar link de senha: ${data.error}`)
        return
      }
      if (data.email_sent) {
        setSuccess(`Link para definir senha enviado para ${speakerName}!`)
      } else if (data.reset_link) {
        await navigator.clipboard.writeText(data.reset_link)
        setSuccess(`Link copiado! Envie manualmente para ${speakerName}.`)
      }
    } catch {
      setError('Erro ao enviar link de senha')
    }
  }

  async function deleteSpeaker(speakerId: string, speakerName: string) {
    if (!confirm(`Remover palestrante "${speakerName}"? Esta ação não pode ser desfeita.`)) return

    try {
      const res = await fetch('/api/delete-speaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speakerId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(`Erro ao remover: ${data.error}`)
        return
      }
      router.refresh()
    } catch {
      setError('Erro ao remover palestrante')
    }
  }

  const inputClass =
    'w-full bg-bg3 border border-border-subtle rounded-xl pl-11 pr-4 py-3.5 text-[14px] text-text placeholder:text-text3 outline-none transition-all focus:border-border-purple focus:ring-2 focus:ring-purple/20'

  return (
    <div>
      {/* Feedback banners */}
      {error && (
        <div className="bg-scribia-red/8 border border-scribia-red/20 rounded-xl px-5 py-3 mb-4 text-[13px] text-scribia-red">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/8 border border-green-500/20 rounded-xl px-5 py-3 mb-4 text-[13px] text-green-400 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Invite section */}
      <div className="bg-bg2 border border-border-subtle rounded-2xl p-5 sm:p-7 mb-6 animate-fade-up">
        <div className="font-heading text-base font-bold text-text mb-1">
          Convidar por e-mail
        </div>
        <p className="text-[13px] text-text3 mb-5 sm:mb-6">
          O palestrante receberá um email com link para criar sua conta
        </p>

        {/* Email input row */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
          <div className="flex-1 relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-text3" />
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  sendSingleInvite()
                }
              }}
              placeholder="nome@empresa.com.br"
              className={inputClass}
            />
          </div>
          <button
            onClick={emailTags.length > 0 ? sendInvites : sendSingleInvite}
            disabled={loading || (!emailInput.trim() && emailTags.length === 0)}
            className="inline-flex items-center justify-center gap-2 bg-purple text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl text-[14px] font-medium hover:bg-purple-light glow-purple disabled:opacity-50 transition-all whitespace-nowrap cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Enviando...' : emailTags.length > 0 ? `Enviar ${emailTags.length} convite${emailTags.length > 1 ? 's' : ''}` : 'Enviar convite'}
          </button>
        </div>

        {/* Email tags */}
        {emailTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {emailTags.map((email) => (
              <div
                key={email}
                className="bg-purple-dim border border-border-purple rounded-full px-3 py-1 text-[12px] text-purple-light flex items-center gap-1.5"
              >
                {email}
                <button
                  onClick={() => removeTag(email)}
                  className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              onClick={sendInvites}
              disabled={loading}
              className="bg-purple text-white rounded-full px-4 py-1 text-[12px] font-medium hover:bg-purple-light disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? 'Enviando...' : 'Enviar todos'}
            </button>
          </div>
        )}

        {/* Divider + CSV */}
        <div className="mt-5">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-[11.5px] text-text3">ou</span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-[12.5px] text-text2 hover:border-border-purple hover:text-purple-light transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar Excel
            </button>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-[12.5px] text-text2 hover:border-border-purple hover:text-purple-light transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Baixar modelo
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
          />
        </div>
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        {/* Pending invites */}
        <div className="bg-bg2 border border-border-subtle rounded-[14px] overflow-hidden">
          <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
            <div className="font-heading text-[13px] font-bold text-text flex items-center gap-2">
              Convites pendentes
              <span className="bg-bg3 border border-border-subtle rounded-full px-2.5 py-0.5 text-[11px] text-text2 font-normal font-sans">
                {pending.length}
              </span>
            </div>
          </div>
          {pending.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr>
                  <th className="text-[10px] text-text3 uppercase tracking-[0.8px] px-5 py-2.5 text-left border-b border-border-subtle">
                    E-mail
                  </th>
                  <th className="text-[10px] text-text3 uppercase tracking-[0.8px] px-5 py-2.5 text-left border-b border-border-subtle">
                    Enviado em
                  </th>
                  <th className="text-[10px] text-text3 uppercase tracking-[0.8px] px-5 py-2.5 text-left border-b border-border-subtle">
                    Status
                  </th>
                  <th className="text-[10px] text-text3 uppercase tracking-[0.8px] px-5 py-2.5 text-left border-b border-border-subtle" />
                </tr>
              </thead>
              <tbody>
                {pending.map((invite) => {
                  const expired = isExpired(invite.expiresAt, invite.status)
                  return (
                    <tr key={invite.id} className="transition-colors hover:bg-bg3">
                      <td className="px-5 py-3 text-[13px] text-text border-b border-border-subtle">
                        <div>{invite.email}</div>
                        {invite.speakerName && (
                          <div className="text-[11px] text-text3">{invite.speakerName}</div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-text3 border-b border-border-subtle">
                        {timeAgo(invite.sentAt)}
                      </td>
                      <td className="px-5 py-3 border-b border-border-subtle">
                        <Chip variant={expired ? 'red' : 'yellow'}>
                          {expired ? 'Expirado' : 'Pendente'}
                        </Chip>
                      </td>
                      <td className="px-5 py-3 border-b border-border-subtle">
                        <div className="flex gap-1.5">
                          {invite.token && (
                            <button
                              onClick={() => copyInviteLink(invite)}
                              className={`w-[26px] h-[26px] rounded-md bg-bg3 border border-border-subtle flex items-center justify-center transition-all cursor-pointer ${
                                copiedId === invite.id
                                  ? 'border-green-500/40 bg-green-500/8 text-green-400'
                                  : 'text-text2 hover:border-border-purple hover:bg-purple-dim hover:text-purple-light'
                              }`}
                              title={copiedId === invite.id ? 'Copiado!' : 'Copiar link de convite'}
                            >
                              {copiedId === invite.id ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                            </button>
                          )}
                          <button
                            onClick={() => resendInvite(invite.email)}
                            disabled={loading}
                            className="w-[26px] h-[26px] rounded-md bg-bg3 border border-border-subtle flex items-center justify-center text-text2 hover:border-border-purple hover:bg-purple-dim hover:text-purple-light transition-all cursor-pointer disabled:opacity-50"
                            title="Reenviar"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => revokeInvite(invite.id)}
                            className="w-[26px] h-[26px] rounded-md bg-bg3 border border-border-subtle flex items-center justify-center text-text2 hover:border-scribia-red/40 hover:bg-scribia-red/8 hover:text-scribia-red transition-all cursor-pointer"
                            title="Revogar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-[13px] text-text3">
              Nenhum convite pendente.
            </div>
          )}
        </div>

        {/* Confirmed speakers */}
        <div className="bg-bg2 border border-border-subtle rounded-[14px] overflow-hidden">
          <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
            <div className="font-heading text-[13px] font-bold text-text flex items-center gap-2">
              Palestrantes confirmados
              <span className="bg-bg3 border border-border-subtle rounded-full px-2.5 py-0.5 text-[11px] text-text2 font-normal font-sans">
                {confirmed.length}
              </span>
            </div>
          </div>
          {confirmed.length > 0 ? (
            <div className="py-2">
              {confirmed.map((speaker) => (
                <div
                  key={speaker.id}
                  className="flex items-center gap-3 px-5 py-3 border-b border-border-subtle last:border-b-0 transition-colors hover:bg-bg3 group"
                >
                  <div className="w-9 h-9 rounded-full bg-purple-dim border border-border-purple flex items-center justify-center text-[12px] font-heading font-extrabold text-purple-light shrink-0">
                    {getInitials(speaker.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-text">
                      {speaker.name}
                    </div>
                    <div className="text-[11px] text-text3 truncate mt-0.5">
                      {speaker.lectureTitle}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Chip variant="green">Ativo</Chip>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === speaker.id ? null : speaker.id)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-text3 opacity-0 group-hover:opacity-100 hover:bg-bg3 hover:text-text2 transition-all cursor-pointer"
                        title="Opcoes"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {menuOpenId === speaker.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-0 top-full mt-1 z-50 bg-bg1 border border-border-subtle rounded-lg shadow-lg py-1 w-40">
                            <button
                              onClick={() => { setMenuOpenId(null); setEditingSpeaker(speaker) }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-text2 hover:bg-bg3 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              Editar
                            </button>
                            {speaker.email && (
                              <button
                                onClick={() => { setMenuOpenId(null); resetSpeakerPassword(speaker.email!, speaker.name) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-text2 hover:bg-bg3 transition-colors cursor-pointer"
                              >
                                <KeyRound className="w-3 h-3" />
                                Enviar link de senha
                              </button>
                            )}
                            <button
                              onClick={() => { setMenuOpenId(null); deleteSpeaker(speaker.id, speaker.name) }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-scribia-red hover:bg-scribia-red/8 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remover
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-[13px] text-text3">
              Nenhum palestrante confirmado.
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingSpeaker && (
        <SpeakerFormModal
          speaker={editingSpeaker}
          eventId={eventId}
          onClose={() => setEditingSpeaker(null)}
          onSaved={() => {
            setEditingSpeaker(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
