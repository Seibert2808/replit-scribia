'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-browser'
import { Modal } from '@/components/ui/modal'
import { Send, CheckCircle, AlertCircle, KeyRound, MailCheck } from 'lucide-react'

const speakerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  bio: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  mini_bio: z.string().max(800, 'Máximo 800 caracteres').optional(),
  linkedin_url: z.string().url('URL inválida').optional().or(z.literal('')),
  pronouns: z.string().optional(),
})

type SpeakerFormData = z.infer<typeof speakerSchema>

interface SpeakerFormModalProps {
  speaker?: {
    id: string; name: string; email: string | null; bio: string | null;
    company: string | null; role: string | null; mini_bio?: string | null;
    linkedin_url?: string | null; pronouns?: string | null;
  }
  eventId?: string
  onClose: () => void
  onSaved: (speakerId?: string) => void
}

export function SpeakerFormModal({ speaker, eventId, onClose, onSaved }: SpeakerFormModalProps) {
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [accountMsg, setAccountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [accountLoading, setAccountLoading] = useState(false)
  const isEditing = !!speaker

  const [showProfessional, setShowProfessional] = useState(!!speaker?.mini_bio || !!speaker?.linkedin_url)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<SpeakerFormData>({
    resolver: zodResolver(speakerSchema),
    defaultValues: speaker ? {
      name: speaker.name,
      email: speaker.email ?? '',
      bio: speaker.bio ?? '',
      company: speaker.company ?? '',
      role: speaker.role ?? '',
      mini_bio: speaker.mini_bio ?? '',
      linkedin_url: speaker.linkedin_url ?? '',
      pronouns: speaker.pronouns ?? '',
    } : {},
  })
  const miniBioValue = watch('mini_bio') ?? ''

  async function sendSpeakerInvite(email: string, speakerName: string) {
    if (!eventId) return

    setInviteStatus('sending')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setInviteStatus('failed')
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
        speaker_name: speakerName,
        origin: window.location.origin,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      setInviteStatus('sent')
      if (result.invite_token) {
        setInviteLink(`${window.location.origin}/auth/set-password?token=${result.invite_token}`)
      }
    } else {
      setInviteStatus('failed')
    }
  }

  async function onSubmit(data: SpeakerFormData) {
    setError(null)
    const payload = {
      name: data.name,
      email: data.email || null,
      bio: data.bio || null,
      company: data.company || null,
      role: data.role || null,
      mini_bio: data.mini_bio || null,
      linkedin_url: data.linkedin_url || null,
      pronouns: data.pronouns || null,
    }

    if (isEditing) {
      const { error } = await supabase.from('speakers').update(payload as never).eq('id', speaker.id)
      if (error) { setError(error.message); return }
      onSaved()
    } else {
      const { data: newSpeaker, error } = await supabase.from('speakers').insert(payload as never).select().single()
      if (error) { setError(error.message); return }

      // Auto-send invitation if email provided and event context exists
      if (data.email && eventId) {
        await sendSpeakerInvite(data.email, data.name)
      } else {
        onSaved((newSpeaker as { id: string })?.id)
      }
    }
  }

  const inputClass =
    'w-full bg-bg3 border border-border-subtle rounded-lg px-3.5 py-2.5 text-[13px] text-text placeholder:text-text3 outline-none transition-all focus:border-border-purple focus:ring-1 focus:ring-purple/20'
  const labelClass = 'block text-[12px] font-medium text-text2 mb-1.5'

  return (
    <Modal title={isEditing ? 'Editar Palestrante' : 'Novo Palestrante'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelClass}>Nome *</label>
          <input {...register('name')} className={inputClass} placeholder="Nome completo" />
          {errors.name && <p className="text-[11px] text-scribia-red mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input {...register('email')} type="email" className={inputClass} placeholder="nome@empresa.com" />
          {errors.email && <p className="text-[11px] text-scribia-red mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Bio</label>
          <textarea {...register('bio')} rows={2} className={inputClass} placeholder="Breve biografia" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Empresa</label>
            <input {...register('company')} className={inputClass} placeholder="Empresa" />
          </div>
          <div>
            <label className={labelClass}>Cargo</label>
            <input {...register('role')} className={inputClass} placeholder="Cargo" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Pronomes</label>
          <select {...register('pronouns')} className={inputClass}>
            <option value="">Selecionar...</option>
            <option value="ela/dela">ela/dela</option>
            <option value="ele/dele">ele/dele</option>
            <option value="elu/delu">elu/delu</option>
          </select>
        </div>

        {/* Professional Profile Section */}
        <div className="border-t border-border-subtle pt-3">
          <button
            type="button"
            onClick={() => setShowProfessional(!showProfessional)}
            className="text-[12px] text-purple-light hover:text-purple transition-colors cursor-pointer"
          >
            {showProfessional ? '- Ocultar' : '+ Mostrar'} Perfil Profissional
          </button>
          {showProfessional && (
            <div className="mt-3 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass}>Biografia para Livebooks</label>
                  <span className={`text-[10px] ${miniBioValue.length > 750 ? 'text-scribia-red' : 'text-text3'}`}>
                    {miniBioValue.length}/800
                  </span>
                </div>
                <textarea
                  {...register('mini_bio')}
                  rows={4}
                  className={inputClass}
                  placeholder="Biografia profissional que sera incluida nos livebooks gerados a partir das palestras deste palestrante."
                />
                {errors.mini_bio && <p className="text-[11px] text-scribia-red mt-1">{errors.mini_bio.message}</p>}
                <p className="text-[10px] text-text3 mt-1">
                  Esta bio sera usada automaticamente nos livebooks. Se vazia, sera usado o campo Bio acima.
                </p>
              </div>

              <div>
                <label className={labelClass}>LinkedIn</label>
                <input {...register('linkedin_url')} type="url" className={inputClass} placeholder="https://linkedin.com/in/..." />
                {errors.linkedin_url && <p className="text-[11px] text-scribia-red mt-1">{errors.linkedin_url.message}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Account Management (edit mode only) */}
        {isEditing && speaker.email && (
          <div className="border-t border-border-subtle pt-3 space-y-3">
            <p className="text-[12px] font-medium text-text2">Conta do Palestrante</p>

            {/* Set password */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className={labelClass}>Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Minimo 6 caracteres"
                />
              </div>
              <button
                type="button"
                disabled={accountLoading || newPassword.length < 6}
                onClick={async () => {
                  setAccountLoading(true)
                  setAccountMsg(null)
                  try {
                    const res = await fetch('/api/manage-speaker-account', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: speaker.email, action: 'set-password', password: newPassword }),
                    })
                    const data = await res.json()
                    if (res.ok) {
                      setAccountMsg({ type: 'success', text: 'Senha definida!' })
                      setNewPassword('')
                    } else {
                      setAccountMsg({ type: 'error', text: data.error })
                    }
                  } catch { setAccountMsg({ type: 'error', text: 'Erro ao definir senha' }) }
                  setAccountLoading(false)
                }}
                className="px-3 py-2.5 rounded-lg bg-purple text-white text-[12px] font-medium hover:bg-purple-light disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
              >
                <KeyRound className="w-3 h-3" />
                Definir
              </button>
            </div>

            {/* Confirm email + send reset link */}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={accountLoading}
                onClick={async () => {
                  setAccountLoading(true)
                  setAccountMsg(null)
                  try {
                    const res = await fetch('/api/manage-speaker-account', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: speaker.email, action: 'confirm-email' }),
                    })
                    const data = await res.json()
                    if (res.ok) {
                      setAccountMsg({ type: 'success', text: 'Email confirmado!' })
                    } else {
                      setAccountMsg({ type: 'error', text: data.error })
                    }
                  } catch { setAccountMsg({ type: 'error', text: 'Erro ao confirmar email' }) }
                  setAccountLoading(false)
                }}
                className="flex-1 px-3 py-2 rounded-lg bg-bg3 border border-border-subtle text-[12px] text-text2 hover:border-border-purple hover:text-purple-light disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                <MailCheck className="w-3 h-3" />
                Confirmar Email
              </button>
              <button
                type="button"
                disabled={accountLoading}
                onClick={async () => {
                  setAccountLoading(true)
                  setAccountMsg(null)
                  try {
                    const res = await fetch('/api/reset-speaker-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: speaker.email }),
                    })
                    const data = await res.json()
                    if (res.ok) {
                      setAccountMsg({ type: 'success', text: data.message })
                    } else {
                      setAccountMsg({ type: 'error', text: data.error })
                    }
                  } catch { setAccountMsg({ type: 'error', text: 'Erro ao enviar link' }) }
                  setAccountLoading(false)
                }}
                className="flex-1 px-3 py-2 rounded-lg bg-bg3 border border-border-subtle text-[12px] text-text2 hover:border-border-purple hover:text-purple-light disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                Enviar Link de Senha
              </button>
            </div>

            {accountMsg && (
              <div className={`text-[11px] rounded-lg px-3 py-2 ${accountMsg.type === 'success' ? 'text-green-400 bg-green-500/8 border border-green-500/20' : 'text-scribia-red bg-scribia-red/8 border border-scribia-red/20'}`}>
                {accountMsg.text}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-[11px] text-scribia-red">{error}</p>}

        {/* Invite status feedback */}
        {inviteStatus === 'sending' && (
          <div className="flex items-center gap-2 bg-purple-dim border border-border-purple rounded-lg px-3 py-2 text-[12px] text-purple-light">
            <Send className="w-3.5 h-3.5 animate-pulse" />
            Enviando convite por email...
          </div>
        )}
        {inviteStatus === 'sent' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-green-500/8 border border-green-500/20 rounded-lg px-3 py-2 text-[12px] text-green-400">
              <CheckCircle className="w-3.5 h-3.5" />
              Convite enviado! O palestrante recebera um email para criar a senha.
            </div>
            {inviteLink && (
              <div className="bg-bg3 border border-border-subtle rounded-lg px-3 py-2">
                <p className="text-[11px] text-text3 mb-1.5">Se o email nao chegar, copie e envie este link:</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteLink}
                    className="flex-1 bg-bg1 border border-border-subtle rounded px-2 py-1 text-[11px] text-text2 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(inviteLink); }}
                    className="px-2.5 py-1 rounded bg-purple text-white text-[11px] hover:bg-purple-light transition-all shrink-0"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {inviteStatus === 'failed' && (
          <div className="flex items-center gap-2 bg-scribia-red/8 border border-scribia-red/20 rounded-lg px-3 py-2 text-[12px] text-scribia-red">
            <AlertCircle className="w-3.5 h-3.5" />
            Falha ao enviar convite. O palestrante foi criado, envie o convite manualmente pela secao acima.
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={() => { if (inviteStatus === 'sent') { onSaved() } else { onClose() } }}
            className="px-4 py-2 rounded-lg bg-transparent border border-border-subtle text-[13px] text-text2 hover:border-border-purple hover:text-purple-light transition-all"
          >
            {inviteStatus === 'sent' ? 'Fechar' : 'Cancelar'}
          </button>
          {inviteStatus !== 'sent' && (
            <button
              type="submit"
              disabled={isSubmitting || inviteStatus === 'sending'}
              className="px-4 py-2 rounded-lg bg-purple text-white text-[13px] font-medium hover:bg-purple-light glow-purple disabled:opacity-50 transition-all"
            >
              {isSubmitting || inviteStatus === 'sending' ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar e Convidar'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
