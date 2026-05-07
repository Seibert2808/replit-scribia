import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, Palette } from 'lucide-react'

const inputClass = 'w-full bg-bg3 border border-border-subtle rounded-lg px-3.5 py-2.5 text-[13px] text-text placeholder:text-text3 outline-none transition-all focus:border-border-purple focus:ring-2 focus:ring-purple/20'
const labelClass = 'block text-[12px] font-medium text-text2 mb-1.5'

export default function NewEventPage() {
  const [, navigate] = useLocation()
  const [formData, setFormData] = useState({ name: '', description: '', start_date: '', end_date: '', location: '', materials_access_days: '' })
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBranding, setShowBranding] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!formData.name) e.name = 'Nome é obrigatório'
    if (!formData.start_date) e.start_date = 'Data início é obrigatória'
    if (!formData.end_date) e.end_date = 'Data fim é obrigatória'
    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) e.end_date = 'Data fim deve ser >= data início'
    return e
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setErrors({})
    setServerError(null)
    setIsSubmitting(true)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) { setServerError('Usuário não autenticado. Recarregue a página e faça login novamente.'); setIsSubmitting(false); return }

    const { data: event, error } = await supabase.from('events').insert({
      name: formData.name,
      description: formData.description || null,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      location: formData.location || null,
      materials_access_days: formData.materials_access_days ? Number(formData.materials_access_days) : null,
      organizer_id: user.id,
    } as never).select().single()

    if (error) { setServerError(`Erro ao criar evento: ${error.message}`); setIsSubmitting(false); return }
    navigate(`/dashboard/events/${(event as { id: string }).id}`)
  }

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/events" className="inline-flex items-center gap-1 text-[13px] text-text3 hover:text-purple-light transition-colors mb-6">
        <ChevronLeft className="w-3.5 h-3.5" /> Voltar
      </Link>
      <h1 className="font-heading text-xl sm:text-2xl font-bold text-text mb-5 sm:mb-6">Novo Evento</h1>
      <div className="bg-bg2 border border-border-subtle rounded-2xl p-4 sm:p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nome *</label>
            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="Nome do evento" />
            {errors.name && <p className="text-[11px] text-scribia-red mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className={labelClass}>Descrição</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className={inputClass} placeholder="Descrição do evento" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Data início *</label>
              <input value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} type="datetime-local" className={inputClass} />
              {errors.start_date && <p className="text-[11px] text-scribia-red mt-1">{errors.start_date}</p>}
            </div>
            <div>
              <label className={labelClass}>Data fim *</label>
              <input value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} type="datetime-local" className={inputClass} />
              {errors.end_date && <p className="text-[11px] text-scribia-red mt-1">{errors.end_date}</p>}
            </div>
          </div>
          <div>
            <label className={labelClass}>Local</label>
            <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className={inputClass} placeholder="São Paulo, SP" />
          </div>
          <div>
            <label className={labelClass}>Dias de acesso aos materiais</label>
            <input value={formData.materials_access_days} onChange={(e) => setFormData({ ...formData, materials_access_days: e.target.value })} type="number" min={1} className={inputClass} placeholder="Ex: 30 (vazio = ilimitado)" />
          </div>
          <div>
            <button type="button" onClick={() => setShowBranding(!showBranding)} className="group w-full flex items-center gap-3 bg-gradient-to-r from-purple/10 to-purple/5 border border-purple/25 rounded-xl px-4 py-3 hover:from-purple/15 hover:to-purple/10 hover:border-purple/40 transition-all">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple/15 text-purple-light group-hover:bg-purple/25 transition-colors shrink-0"><Palette className="w-5 h-5" /></div>
              <div className="text-left">
                <span className="block text-[13px] font-semibold text-text">{showBranding ? 'Ocultar personalização' : 'Personalizar cores do evento'}</span>
                <span className="block text-[11px] text-text3">Suas cores aparecerão nos playbooks e live books gerados</span>
              </div>
            </button>
          </div>
          {serverError && <div className="text-[12px] text-scribia-red bg-scribia-red/8 border border-scribia-red/20 rounded-lg px-3 py-2">{serverError}</div>}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-border-subtle">
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-lg bg-purple text-white text-[13px] font-medium hover:bg-purple-light disabled:opacity-50 transition-all">
              {isSubmitting ? 'Criando...' : 'Criar Evento'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard/events')} className="px-6 py-2.5 rounded-lg bg-transparent border border-border-subtle text-[13px] text-text2 hover:border-border-purple hover:text-purple-light transition-all">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
