'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-browser'
import { ChevronLeft, Palette } from 'lucide-react'
import Link from 'next/link'

const eventSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    description: z.string().optional(),
    start_date: z.string().min(1, 'Data início é obrigatória'),
    end_date: z.string().min(1, 'Data fim é obrigatória'),
    location: z.string().optional(),
    materials_access_days: z.union([z.string(), z.number()]).optional().transform((v) => {
      if (v === undefined || v === '' || v === null) return null
      const n = Number(v)
      return isNaN(n) || n <= 0 ? null : n
    }),
    primary_color: z.string().optional(),
    secondary_color: z.string().optional(),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: 'Data fim deve ser >= data início',
    path: ['end_date'],
  })

type EventFormData = z.input<typeof eventSchema>

export default function NewEventPage() {
  const router = useRouter()
  const supabase = createClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showBranding, setShowBranding] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as never,
  })

  async function onSubmit(data: EventFormData) {
    setServerError(null)

    // Get user directly at submit time — don't rely on hook state
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      setServerError('Usuário não autenticado. Recarregue a página e faça login novamente.')
      console.error('[new-event] auth error:', authError)
      return
    }

    console.log('[new-event] user:', user.id)
    console.log('[new-event] inserting event:', data)

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        name: data.name,
        description: data.description || null,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
        location: data.location || null,
        materials_access_days: data.materials_access_days || null,
        primary_color: data.primary_color || null,
        secondary_color: data.secondary_color || null,
        organizer_id: user.id,
      } as never)
      .select()
      .single()

    if (error) {
      console.error('[new-event] insert error:', error)
      setServerError(`Erro ao criar evento: ${error.message}`)
      return
    }

    console.log('[new-event] created:', event)
    router.push(`/dashboard/events/${(event as { id: string }).id}`)
  }

  const inputClass =
    'w-full bg-bg3 border border-border-subtle rounded-lg px-3.5 py-2.5 text-[13px] text-text placeholder:text-text3 outline-none transition-all focus:border-border-purple focus:ring-2 focus:ring-purple/20'
  const labelClass = 'block text-[12px] font-medium text-text2 mb-1.5'

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-1 text-[13px] text-text3 hover:text-purple-light transition-colors mb-6"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Voltar
      </Link>

      <h1 className="font-heading text-xl sm:text-2xl font-bold text-text mb-5 sm:mb-6">
        Novo Evento
      </h1>

      <div className="bg-bg2 border border-border-subtle rounded-2xl p-4 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
          <div>
            <label className={labelClass}>Nome *</label>
            <input
              {...register('name')}
              className={inputClass}
              placeholder="Nome do evento"
            />
            {errors.name && <p className="text-[11px] text-scribia-red mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Descrição</label>
            <textarea
              {...register('description')}
              rows={3}
              className={inputClass}
              placeholder="Descrição do evento"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Data início *</label>
              <input
                {...register('start_date')}
                type="datetime-local"
                className={inputClass}
              />
              {errors.start_date && (
                <p className="text-[11px] text-scribia-red mt-1">{errors.start_date.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Data fim *</label>
              <input
                {...register('end_date')}
                type="datetime-local"
                className={inputClass}
              />
              {errors.end_date && (
                <p className="text-[11px] text-scribia-red mt-1">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Local</label>
            <input
              {...register('location')}
              className={inputClass}
              placeholder="São Paulo, SP"
            />
          </div>

          <div>
            <label className={labelClass}>Dias de acesso aos materiais</label>
            <input
              {...register('materials_access_days')}
              type="number"
              min={1}
              className={inputClass}
              placeholder="Ex: 30 (vazio = ilimitado)"
            />
            <p className="text-[11px] text-text3 mt-1">
              Após esse período, os participantes não poderão mais acessar os materiais. Deixe vazio para acesso ilimitado.
            </p>
          </div>

          {/* Branding (optional) */}
          <div>
            <button
              type="button"
              onClick={() => setShowBranding(!showBranding)}
              className="group w-full flex items-center gap-3 bg-gradient-to-r from-purple/10 to-purple/5 border border-purple/25 rounded-xl px-4 py-3 hover:from-purple/15 hover:to-purple/10 hover:border-purple/40 transition-all"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple/15 text-purple-light group-hover:bg-purple/25 transition-colors shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-[13px] font-semibold text-text">
                  {showBranding ? 'Ocultar personalização' : 'Personalizar cores do evento'}
                </span>
                <span className="block text-[11px] text-text3">
                  Suas cores aparecerão nos playbooks e live books gerados
                </span>
              </div>
            </button>

            {showBranding && (
              <div className="mt-3 p-5 bg-bg3 border border-purple/15 rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Cor primária</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        defaultValue="#6B4EFF"
                        {...register('primary_color')}
                        className="w-10 h-10 rounded-lg border border-border-subtle cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        {...register('primary_color')}
                        placeholder="#6B4EFF"
                        className="bg-bg2 border border-border-subtle rounded-lg px-3 py-2 text-[13px] text-text w-28 outline-none focus:border-border-purple font-mono"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Cor secundária</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        defaultValue="#00D4A0"
                        {...register('secondary_color')}
                        className="w-10 h-10 rounded-lg border border-border-subtle cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        {...register('secondary_color')}
                        placeholder="#00D4A0"
                        className="bg-bg2 border border-border-subtle rounded-lg px-3 py-2 text-[13px] text-text w-28 outline-none focus:border-border-purple font-mono"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[12px] text-text3">
                  A logo do evento pode ser adicionada após a criação.
                </p>
              </div>
            )}
          </div>

          {serverError && (
            <div className="text-[12px] text-scribia-red bg-scribia-red/8 border border-scribia-red/20 rounded-lg px-3 py-2">
              {serverError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-border-subtle">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-purple text-white text-[13px] font-medium hover:bg-purple-light glow-purple disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Criando...' : 'Criar Evento'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-lg bg-transparent border border-border-subtle text-[13px] text-text2 hover:border-border-purple hover:text-purple-light transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
