'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { ChevronLeft, Check, X, Zap, Archive, Clock, Palette, Upload, Image, Trash2, Pencil, MapPin, Calendar } from 'lucide-react'

interface EventData {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  location: string | null
  status: string
  cover_image_url: string | null
  materials_access_days: number | null
  primary_color: string | null
  secondary_color: string | null
  logo_url: string | null
}

export function EventHeader({ event }: { event: EventData }) {
  const router = useRouter()
  const supabase = createClient()
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showBranding, setShowBranding] = useState(false)
  const [primaryColor, setPrimaryColor] = useState(event.primary_color || '#6B4EFF')
  const [secondaryColor, setSecondaryColor] = useState(event.secondary_color || '#00D4A0')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [editingDates, setEditingDates] = useState(false)
  const [startDate, setStartDate] = useState(event.start_date.split('T')[0])
  const [endDate, setEndDate] = useState(event.end_date.split('T')[0])

  async function saveColor(field: 'primary_color' | 'secondary_color', value: string) {
    await supabase.from('events').update({ [field]: value } as never).eq('id', event.id)
    router.refresh()
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `${event.id}/branding/logo.${ext}`
      await supabase.storage.from('materials').upload(path, file, {
        contentType: file.type,
        upsert: true,
      })
      await supabase.from('events').update({ logo_url: path } as never).eq('id', event.id)
      router.refresh()
    } finally {
      setUploadingLogo(false)
    }
  }

  async function removeLogo() {
    if (!event.logo_url) return
    await supabase.storage.from('materials').remove([event.logo_url])
    await supabase.from('events').update({ logo_url: null } as never).eq('id', event.id)
    router.refresh()
  }

  async function saveField(field: string) {
    let value: string | number | null = editValue
    if (field === 'materials_access_days') {
      const n = Number(editValue)
      value = editValue === '' || isNaN(n) || n <= 0 ? null : n
    }
    await supabase
      .from('events')
      .update({ [field]: value } as never)
      .eq('id', event.id)
    setEditing(null)
    router.refresh()
  }

  async function activateEvent() {
    await supabase.from('events').update({ status: 'active' } as never).eq('id', event.id)
    router.refresh()
  }

  async function archiveEvent() {
    if (!confirm('Tem certeza que deseja arquivar este evento?')) return
    await supabase.from('events').update({ status: 'archived' } as never).eq('id', event.id)
    router.push('/dashboard')
  }

  async function deleteEvent() {
    if (!confirm('Tem certeza que deseja EXCLUIR este evento? Esta ação é irreversível e removerá todas as palestras, participantes e materiais associados.')) return
    if (!confirm('Confirmar exclusão definitiva do evento "' + event.name + '"?')) return

    // Delete storage files (logo, branding)
    if (event.logo_url) {
      await supabase.storage.from('materials').remove([event.logo_url])
    }
    // Remove event materials folder
    const { data: files } = await supabase.storage.from('materials').list(event.id)
    if (files && files.length > 0) {
      const paths = files.map((f) => `${event.id}/${f.name}`)
      await supabase.storage.from('materials').remove(paths)
    }

    await supabase.from('events').delete().eq('id', event.id)
    router.push('/dashboard')
  }

  async function saveDates() {
    await supabase
      .from('events')
      .update({ start_date: startDate, end_date: endDate } as never)
      .eq('id', event.id)
    setEditingDates(false)
    router.refresh()
  }

  function startEdit(field: string, currentValue: string) {
    setEditing(field)
    setEditValue(currentValue || '')
  }

  return (
    <div className="mb-7 md:mb-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-[13px] text-text3 hover:text-purple-light transition-colors mb-4"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Voltar aos eventos
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          {editing === 'name' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="font-heading text-xl sm:text-2xl font-bold text-text bg-transparent border-b-2 border-purple outline-none flex-1 min-w-0"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveField('name')}
              />
              <button
                onClick={() => saveField('name')}
                className="p-1.5 rounded-lg bg-purple-dim text-purple-light hover:bg-purple/20 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-lg bg-bg3 text-text3 hover:text-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h1
              className="font-heading text-xl sm:text-2xl font-bold text-text cursor-pointer hover:text-purple-light transition-colors break-words"
              onClick={() => startEdit('name', event.name)}
              title="Clique para editar"
            >
              {event.name}
            </h1>
          )}

          {editing === 'description' ? (
            <div className="mt-3">
              <textarea
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value)
                  // Auto-resize
                  const el = e.target
                  el.style.height = 'auto'
                  el.style.height = el.scrollHeight + 'px'
                }}
                ref={(el) => {
                  if (el) {
                    el.style.height = 'auto'
                    el.style.height = el.scrollHeight + 'px'
                  }
                }}
                className="w-full bg-bg2 border border-purple/30 rounded-xl p-4 text-text text-[13px] leading-relaxed outline-none focus:border-purple/60 resize-none transition-colors"
                autoFocus
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => saveField('description')}
                  className="inline-flex items-center gap-1.5 bg-purple-dim text-purple-light rounded-lg px-4 py-1.5 text-[12px] font-medium hover:bg-purple/20 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="inline-flex items-center gap-1.5 text-[12px] text-text3 hover:text-text rounded-lg px-4 py-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p
              className="mt-2 text-[13px] text-text2 leading-relaxed cursor-pointer hover:text-purple-light transition-colors"
              onClick={() => startEdit('description', event.description || '')}
              title="Clique para editar descrição"
            >
              {event.description || 'Adicionar descrição...'}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-text3">
            {editingDates ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-3.5 h-3.5 text-text3" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-bg3 border border-border-subtle rounded-lg px-2 py-1 text-[12px] text-text outline-none focus:border-border-purple"
                />
                <span>—</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-bg3 border border-border-subtle rounded-lg px-2 py-1 text-[12px] text-text outline-none focus:border-border-purple"
                />
                <button
                  onClick={saveDates}
                  className="p-1 rounded-lg bg-purple-dim text-purple-light hover:bg-purple/20 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setEditingDates(false)
                    setStartDate(event.start_date.split('T')[0])
                    setEndDate(event.end_date.split('T')[0])
                  }}
                  className="p-1 rounded-lg bg-bg3 text-text3 hover:text-text transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span
                className="inline-flex items-center gap-1 cursor-pointer hover:text-purple-light transition-colors"
                onClick={() => setEditingDates(true)}
                title="Clique para editar datas"
              >
                <Calendar className="w-3.5 h-3.5" />
                {new Date(event.start_date).toLocaleDateString('pt-BR')} —{' '}
                {new Date(event.end_date).toLocaleDateString('pt-BR')}
                <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100" />
              </span>
            )}
            {editing === 'location' ? (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-text3" />
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="bg-bg3 border border-border-subtle rounded-lg px-2 py-1 text-[12px] text-text outline-none focus:border-border-purple"
                  placeholder="Local do evento"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveField('location')}
                />
                <button
                  onClick={() => saveField('location')}
                  className="p-1 rounded-lg bg-purple-dim text-purple-light hover:bg-purple/20 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="p-1 rounded-lg bg-bg3 text-text3 hover:text-text transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span
                className="inline-flex items-center gap-1 cursor-pointer hover:text-purple-light transition-colors"
                onClick={() => startEdit('location', event.location || '')}
                title="Clique para editar local"
              >
                <MapPin className="w-3.5 h-3.5" />
                {event.location || 'Adicionar local...'}
              </span>
            )}
          </div>

          {/* Materials access days */}
          <div className="mt-4">
            {editing === 'materials_access_days' ? (
              <div className="flex items-center gap-3 bg-bg3 border border-border-subtle rounded-xl px-4 py-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-500/15 text-teal-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    type="number"
                    min={1}
                    placeholder="Vazio = ilimitado"
                    className="bg-bg2 border border-border-subtle rounded-lg px-3 py-2 text-[13px] text-text outline-none focus:border-border-purple w-44"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && saveField('materials_access_days')}
                  />
                  <span className="text-[13px] text-text3">dias</span>
                </div>
                <button
                  onClick={() => saveField('materials_access_days')}
                  className="p-2 rounded-lg bg-purple-dim text-purple-light hover:bg-purple/20 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="p-2 rounded-lg bg-bg3 text-text3 hover:text-text transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEdit('materials_access_days', event.materials_access_days?.toString() || '')}
                className="group flex items-center gap-3 bg-bg3 border border-border-subtle rounded-xl px-4 py-3 hover:border-teal-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-500/15 text-teal-400 group-hover:bg-teal-500/25 transition-colors shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-[13px] font-semibold text-text">
                    {event.materials_access_days
                      ? `${event.materials_access_days} dias de acesso`
                      : 'Acesso ilimitado'}
                  </span>
                  <span className="block text-[11px] text-text3">
                    {event.materials_access_days
                      ? 'Clique para alterar o período de acesso aos materiais'
                      : 'Participantes podem acessar materiais sem limite de tempo'}
                  </span>
                </div>
              </button>
            )}
          </div>
          {/* Branding section */}
          <div className="mt-5">
            <button
              onClick={() => setShowBranding(!showBranding)}
              className="group w-full sm:w-auto flex items-center gap-3 bg-gradient-to-r from-purple/10 to-purple/5 border border-purple/25 rounded-xl px-4 py-3 hover:from-purple/15 hover:to-purple/10 hover:border-purple/40 transition-all"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple/15 text-purple-light group-hover:bg-purple/25 transition-colors">
                <Palette className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-[13px] font-semibold text-text">
                  {showBranding ? 'Ocultar personalização' : 'Personalizar cores e logo'}
                </span>
                <span className="block text-[11px] text-text3">
                  Defina a identidade visual dos seus materiais
                </span>
              </div>
            </button>

            {showBranding && (
              <div className="mt-3 p-5 bg-bg3 border border-purple/15 rounded-xl space-y-5">
                <div className="flex flex-wrap gap-6">
                  {/* Primary color */}
                  <div>
                    <label className="block text-[13px] text-text2 font-medium mb-2">Cor primária</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border-subtle cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="bg-bg2 border border-border-subtle rounded-lg px-3 py-2 text-[13px] text-text w-24 outline-none focus:border-border-purple font-mono"
                        maxLength={7}
                      />
                      <button
                        onClick={() => saveColor('primary_color', primaryColor)}
                        className="p-2 rounded-lg bg-purple-dim text-purple-light hover:bg-purple/20 transition-colors"
                        title="Salvar cor primária"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Secondary color */}
                  <div>
                    <label className="block text-[13px] text-text2 font-medium mb-2">Cor secundária</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border-subtle cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="bg-bg2 border border-border-subtle rounded-lg px-3 py-2 text-[13px] text-text w-24 outline-none focus:border-border-purple font-mono"
                        maxLength={7}
                      />
                      <button
                        onClick={() => saveColor('secondary_color', secondaryColor)}
                        className="p-2 rounded-lg bg-purple-dim text-purple-light hover:bg-purple/20 transition-colors"
                        title="Salvar cor secundária"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Logo upload */}
                <div>
                  <label className="block text-[13px] text-text2 font-medium mb-2">Logo do evento</label>
                  {event.logo_url ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-bg2 border border-border-subtle rounded-lg px-4 py-2.5">
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image className="w-4 h-4 text-purple-light" />
                        <span className="text-[13px] text-text2">Logo carregada</span>
                      </div>
                      <button
                        onClick={removeLogo}
                        className="p-2 rounded-lg bg-scribia-red/10 text-scribia-red hover:bg-scribia-red/20 transition-colors"
                        title="Remover logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 bg-bg2 border border-border-subtle rounded-lg px-4 py-2.5 cursor-pointer hover:border-border-purple transition-colors">
                      <Upload className="w-4 h-4 text-text3" />
                      <span className="text-[13px] text-text2">
                        {uploadingLogo ? 'Enviando...' : 'Enviar logo (PNG ou JPG)'}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) uploadLogo(file)
                        }}
                        disabled={uploadingLogo}
                      />
                    </label>
                  )}
                  <p className="text-[12px] text-text3 mt-1.5">
                    Aparece nos playbooks e live books junto com a marca ScribIA
                  </p>
                </div>

                {/* Preview strip */}
                <div>
                  <span className="block text-[12px] text-text3 mb-2">Preview das cores nos materiais:</span>
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-24 rounded-md shadow-sm" style={{ backgroundColor: primaryColor }} />
                    <div className="h-6 w-16 rounded-md shadow-sm" style={{ backgroundColor: secondaryColor }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {event.status === 'draft' && (
            <button
              onClick={activateEvent}
              className="inline-flex items-center gap-1.5 bg-scribia-green/10 border border-scribia-green/30 text-scribia-green rounded-lg px-4 py-2 text-[13px] font-medium hover:bg-scribia-green/20 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Ativar Evento
            </button>
          )}
          <button
            onClick={archiveEvent}
            className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-500 rounded-lg px-4 py-2 text-[13px] font-medium hover:bg-amber-500/20 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            Arquivar
          </button>
          <button
            onClick={deleteEvent}
            className="inline-flex items-center gap-1.5 bg-scribia-red/10 border border-scribia-red/25 text-scribia-red rounded-lg px-4 py-2 text-[13px] font-medium hover:bg-scribia-red/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
