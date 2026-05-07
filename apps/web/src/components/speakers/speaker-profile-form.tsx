'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Save, Check, ArrowLeft, Camera, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  speaker: Record<string, unknown>
}

export function SpeakerProfileForm({ speaker }: Props) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    (speaker.profile_photo_url as string) || (speaker.avatar_url as string) || null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: (speaker.name as string) || '',
    email: (speaker.email as string) || '',
    bio: (speaker.bio as string) || '',
    company: (speaker.company as string) || '',
    role: (speaker.role as string) || '',
    mini_bio: (speaker.mini_bio as string) || '',
    linkedin_url: (speaker.linkedin_url as string) || '',
    lattes_url: (speaker.lattes_url as string) || '',
    orcid: (speaker.orcid as string) || '',
    pronouns: (speaker.pronouns as string) || '',
  })

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato invalido. Use JPG, PNG ou WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('A foto deve ter no maximo 5MB.')
      return
    }

    setUploadingPhoto(true)
    setError(null)

    const speakerId = speaker.id as string
    const ext = file.name.split('.').pop() || 'jpg'
    const filePath = `profile-photos/${speakerId}/photo.${ext}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('speaker-uploads')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError(`Erro ao enviar foto: ${uploadError.message}`)
      setUploadingPhoto(false)
      return
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('speaker-uploads')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Update speaker record
    const { error: updateError } = await supabase
      .from('speakers')
      .update({ profile_photo_url: publicUrl } as never)
      .eq('id', speakerId)

    setUploadingPhoto(false)

    if (updateError) {
      setError(`Erro ao salvar: ${updateError.message}`)
    } else {
      setPhotoUrl(publicUrl)
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handlePhotoRemove() {
    setUploadingPhoto(true)
    setError(null)

    const speakerId = speaker.id as string

    // Remove from storage
    const { error: deleteError } = await supabase.storage
      .from('speaker-uploads')
      .remove([`profile-photos/${speakerId}/photo.jpg`, `profile-photos/${speakerId}/photo.png`, `profile-photos/${speakerId}/photo.webp`])

    if (deleteError) {
      setError(`Erro ao remover: ${deleteError.message}`)
      setUploadingPhoto(false)
      return
    }

    // Clear profile_photo_url
    await supabase
      .from('speakers')
      .update({ profile_photo_url: null } as never)
      .eq('id', speakerId)

    setPhotoUrl(null)
    setUploadingPhoto(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    const { error: err } = await supabase
      .from('speakers')
      .update({
        name: form.name,
        bio: form.bio || null,
        company: form.company || null,
        role: form.role || null,
        mini_bio: form.mini_bio || null,
        linkedin_url: form.linkedin_url || null,
        lattes_url: form.lattes_url || null,
        orcid: form.orcid || null,
        pronouns: form.pronouns || null,
      } as never)
      .eq('id', speaker.id as string)

    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const initials = form.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const inputClass =
    'w-full bg-bg3 border border-border-subtle rounded-lg px-3.5 py-2.5 text-[13px] text-text placeholder:text-text3 outline-none transition-all focus:border-border-purple focus:ring-1 focus:ring-purple/20'
  const labelClass = 'block text-[12px] font-medium text-text2 mb-1.5'

  return (
    <div className="space-y-6">
      <Link
        href="/speaker"
        className="inline-flex items-center gap-1.5 text-[12px] text-text3 hover:text-purple-light transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar ao portal
      </Link>

      {/* Photo Upload Section */}
      <div className="bg-bg2 border border-border-subtle rounded-2xl p-4 sm:p-6">
        <h2 className="font-heading text-[14px] font-bold text-text mb-4">Foto de Perfil</h2>
        <p className="text-[11px] text-text3 mb-4">
          Esta foto aparecera nos cards de compartilhamento (stories) e nos materiais gerados.
        </p>
        <div className="flex items-center gap-5">
          {/* Avatar preview */}
          <div className="relative group">
            {photoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={photoUrl}
                alt={form.name}
                className="w-24 h-24 rounded-full object-cover border-3 border-primary/30 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/15 text-primary flex items-center justify-center text-2xl font-bold border-3 border-primary/20">
                {initials}
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Upload controls */}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-[12px] font-medium hover:bg-primary/20 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              {photoUrl ? 'Trocar foto' : 'Enviar foto'}
            </button>
            {photoUrl && (
              <button
                onClick={handlePhotoRemove}
                disabled={uploadingPhoto}
                className="inline-flex items-center gap-2 text-text3 hover:text-scribia-red px-4 py-2 rounded-xl text-[12px] font-medium disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remover foto
              </button>
            )}
            <p className="text-[10px] text-text3">JPG, PNG ou WebP. Max 5MB.</p>
          </div>
        </div>
      </div>

      {/* Basic Data */}
      <div className="bg-bg2 border border-border-subtle rounded-2xl p-4 sm:p-6">
        <h2 className="font-heading text-[14px] font-bold text-text mb-4">Dados Basicos</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nome *</label>
            <input value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input value={form.email} disabled className={`${inputClass} opacity-60`} />
            <p className="text-[10px] text-text3 mt-1">Email nao pode ser alterado.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Empresa</label>
              <input value={form.company} onChange={e => update('company', e.target.value)} className={inputClass} placeholder="Empresa" />
            </div>
            <div>
              <label className={labelClass}>Cargo</label>
              <input value={form.role} onChange={e => update('role', e.target.value)} className={inputClass} placeholder="Cargo" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Pronomes</label>
            <select value={form.pronouns} onChange={e => update('pronouns', e.target.value)} className={inputClass}>
              <option value="">Selecionar...</option>
              <option value="ela/dela">ela/dela</option>
              <option value="ele/dele">ele/dele</option>
              <option value="elu/delu">elu/delu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Professional Profile */}
      <div className="bg-bg2 border border-border-subtle rounded-2xl p-4 sm:p-6">
        <h2 className="font-heading text-[14px] font-bold text-text mb-1">Perfil Profissional</h2>
        <p className="text-[11px] text-text3 mb-4">Estas informacoes serao incluidas nos livebooks.</p>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass}>Biografia para Livebooks</label>
              <span className={`text-[10px] ${form.mini_bio.length > 750 ? 'text-scribia-red' : 'text-text3'}`}>
                {form.mini_bio.length}/800
              </span>
            </div>
            <textarea
              value={form.mini_bio}
              onChange={e => update('mini_bio', e.target.value)}
              maxLength={800}
              rows={5}
              className={inputClass}
              placeholder="Sua biografia profissional. Sera exibida na secao 'Sobre o Palestrante' dos livebooks gerados."
            />
          </div>
          <div>
            <label className={labelClass}>Bio Curta (resumo)</label>
            <textarea
              value={form.bio}
              onChange={e => update('bio', e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Bio curta para exibicao em listas e cards"
            />
          </div>
        </div>
      </div>

      {/* Links & References */}
      <div className="bg-bg2 border border-border-subtle rounded-2xl p-4 sm:p-6">
        <h2 className="font-heading text-[14px] font-bold text-text mb-4">Redes e Referencias</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>LinkedIn</label>
            <input value={form.linkedin_url} onChange={e => update('linkedin_url', e.target.value)} type="url" className={inputClass} placeholder="https://linkedin.com/in/..." />
          </div>
          <div>
            <label className={labelClass}>Curriculo Lattes</label>
            <input value={form.lattes_url} onChange={e => update('lattes_url', e.target.value)} type="url" className={inputClass} placeholder="http://lattes.cnpq.br/..." />
          </div>
          <div>
            <label className={labelClass}>ORCID</label>
            <input value={form.orcid} onChange={e => update('orcid', e.target.value)} className={inputClass} placeholder="0000-0000-0000-0000" />
          </div>
        </div>
      </div>

      {/* Save button */}
      {error && (
        <div className="bg-scribia-red/8 border border-scribia-red/20 rounded-xl px-4 py-3 text-[12px] text-scribia-red">
          {error}
        </div>
      )}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !form.name}
          className="inline-flex items-center gap-2 bg-purple text-white px-5 py-2.5 rounded-xl text-[13px] font-medium hover:bg-purple-light glow-purple disabled:opacity-50 transition-all cursor-pointer"
        >
          {saving ? (
            <>Salvando...</>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              Salvo
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar
            </>
          )}
        </button>
      </div>
    </div>
  )
}
