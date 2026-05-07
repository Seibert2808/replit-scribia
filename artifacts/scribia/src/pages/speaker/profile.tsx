import { useEffect, useState } from 'react'
import { Redirect } from 'wouter'
import { supabase } from '@/lib/supabase'
import { SpeakerSidebar } from '@/components/layout/speaker-sidebar'
import { Save } from 'lucide-react'

interface SpeakerProfile {
  id: string; name: string; email: string | null; bio: string | null
  company: string | null; role: string | null; mini_bio: string | null
  formation: string | null; linkedin_url: string | null; pronouns: string | null
}

const inputClass = 'w-full bg-bg3 border border-border-subtle rounded-lg px-3.5 py-2.5 text-[13px] text-text placeholder:text-text3 outline-none transition-all focus:border-border-purple focus:ring-2 focus:ring-purple/20'
const labelClass = 'block text-[12px] font-medium text-text2 mb-1.5'

export default function SpeakerProfilePage() {
  const [speakerName, setSpeakerName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [profile, setProfile] = useState<SpeakerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSpeakerName('__unauthorized__'); setLoading(false); return }
      const { data } = await supabase.from('speakers').select('id, name, email, bio, company, role, mini_bio, formation, linkedin_url, pronouns, profile_photo_url, avatar_url').eq('user_id', user.id).single()
      if (data) {
        const s = data as SpeakerProfile & { profile_photo_url: string | null; avatar_url: string | null }
        setSpeakerName(s.name)
        setAvatarUrl(s.profile_photo_url || s.avatar_url)
        setProfile(s)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setError(null)
    setSaving(true)
    const { error } = await supabase.from('speakers').update({ name: profile.name, bio: profile.bio, company: profile.company, role: profile.role, mini_bio: profile.mini_bio, formation: profile.formation, linkedin_url: profile.linkedin_url, pronouns: profile.pronouns } as never).eq('id', profile.id)
    if (error) { setError(error.message); setSaving(false); return }
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  function update(field: keyof SpeakerProfile, value: string) {
    setProfile((p) => p ? { ...p, [field]: value } : p)
  }

  if (speakerName === '__unauthorized__') return <Redirect to="/login" />

  return (
    <div className="min-h-screen bg-bg">
      <SpeakerSidebar userName={speakerName || 'Palestrante'} avatarUrl={avatarUrl} />
      <main className="lg:pl-64 pt-14 lg:pt-0 p-4 sm:p-6 md:p-8 min-h-screen">
        <div className="max-w-2xl">
          <div className="mb-6">
            <h1 className="font-heading text-[22px] font-extrabold text-text">Meu Perfil</h1>
            <p className="text-[13px] text-text3 mt-1">Suas informações profissionais serão incluídas nos livebooks gerados.</p>
          </div>
          {loading ? (
            <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-bg3 rounded-xl animate-pulse" />)}</div>
          ) : profile ? (
            <form onSubmit={handleSave} className="bg-bg2 border border-border-subtle rounded-2xl p-4 sm:p-6 space-y-4">
              <div>
                <label className={labelClass}>Nome *</label>
                <input value={profile.name} onChange={(e) => update('name', e.target.value)} required className={inputClass} placeholder="Seu nome completo" />
              </div>
              <div>
                <label className={labelClass}>Empresa / Instituição</label>
                <input value={profile.company ?? ''} onChange={(e) => update('company', e.target.value)} className={inputClass} placeholder="Nome da empresa" />
              </div>
              <div>
                <label className={labelClass}>Cargo / Função</label>
                <input value={profile.role ?? ''} onChange={(e) => update('role', e.target.value)} className={inputClass} placeholder="Ex: CEO, Pesquisador, Professor" />
              </div>
              <div>
                <label className={labelClass}>Pronomes</label>
                <input value={profile.pronouns ?? ''} onChange={(e) => update('pronouns', e.target.value)} className={inputClass} placeholder="Ex: ele/dele, ela/dela" />
              </div>
              <div>
                <label className={labelClass}>Mini bio (para publicidade)</label>
                <textarea value={profile.mini_bio ?? ''} onChange={(e) => update('mini_bio', e.target.value)} rows={2} className={inputClass} placeholder="Bio curta para divulgação do evento" />
              </div>
              <div>
                <label className={labelClass}>Bio completa</label>
                <textarea value={profile.bio ?? ''} onChange={(e) => update('bio', e.target.value)} rows={4} className={inputClass} placeholder="Sua biografia profissional" />
              </div>
              <div>
                <label className={labelClass}>Formação</label>
                <input value={profile.formation ?? ''} onChange={(e) => update('formation', e.target.value)} className={inputClass} placeholder="Formação acadêmica" />
              </div>
              <div>
                <label className={labelClass}>LinkedIn</label>
                <input value={profile.linkedin_url ?? ''} onChange={(e) => update('linkedin_url', e.target.value)} className={inputClass} placeholder="https://linkedin.com/in/..." />
              </div>
              {error && <div className="text-[12px] text-scribia-red bg-scribia-red/8 border border-scribia-red/20 rounded-lg px-3 py-2">{error}</div>}
              <div className="pt-3 border-t border-border-subtle">
                <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-purple text-white text-[13px] font-medium hover:bg-purple-light disabled:opacity-50 transition-all">
                  <Save className="w-3.5 h-3.5" />
                  {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar perfil'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-16 bg-bg2 border border-border-subtle rounded-xl">
              <p className="text-text2">Perfil de palestrante não encontrado.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
