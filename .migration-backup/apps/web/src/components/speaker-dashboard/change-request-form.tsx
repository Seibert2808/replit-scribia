'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface ChangeRequestFormProps {
  lectureId: string
  speakerId: string
  currentTitle: string
  currentDescription: string | null
  hasPendingTitleRequest: boolean
  hasPendingDescriptionRequest: boolean
}

export function ChangeRequestForm({
  lectureId,
  speakerId,
  currentTitle,
  currentDescription,
  hasPendingTitleRequest,
  hasPendingDescriptionRequest,
}: ChangeRequestFormProps) {
  const [editingField, setEditingField] = useState<'title' | 'description' | null>(null)
  const [newValue, setNewValue] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(requestType: 'title_change' | 'description_change') {
    if (!newValue.trim()) return
    setSaving(true)
    setSuccess(null)

    const supabase = createClient()
    const currentValue = requestType === 'title_change' ? currentTitle : (currentDescription ?? '')

    const { error } = await supabase.from('lecture_change_requests').insert({
      lecture_id: lectureId,
      speaker_id: speakerId,
      request_type: requestType,
      current_value: currentValue,
      requested_value: newValue.trim(),
      reason: reason.trim() || null,
    } as never)

    setSaving(false)
    if (!error) {
      setSuccess('Solicitacao enviada! O organizador sera notificado.')
      setEditingField(null)
      setNewValue('')
      setReason('')
    }
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="bg-scribia-green/10 text-scribia-green px-4 py-3 rounded-lg text-[13px]">
          {success}
        </div>
      )}

      {/* Current title */}
      <div>
        <label className="text-[11px] text-text3 uppercase tracking-wide">Titulo atual</label>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-text font-medium">{currentTitle}</p>
          {hasPendingTitleRequest ? (
            <span className="text-[11px] text-scribia-yellow">Solicitacao pendente</span>
          ) : (
            <button
              onClick={() => { setEditingField('title'); setNewValue(currentTitle) }}
              className="text-[12px] text-primary hover:text-primary/80 transition-colors"
            >
              Solicitar alteracao
            </button>
          )}
        </div>
      </div>

      {/* Current description */}
      <div>
        <label className="text-[11px] text-text3 uppercase tracking-wide">Descricao atual</label>
        <div className="flex items-start justify-between mt-1">
          <p className="text-sm text-text2 max-w-md">{currentDescription || 'Sem descricao'}</p>
          {hasPendingDescriptionRequest ? (
            <span className="text-[11px] text-scribia-yellow">Solicitacao pendente</span>
          ) : (
            <button
              onClick={() => { setEditingField('description'); setNewValue(currentDescription ?? '') }}
              className="text-[12px] text-primary hover:text-primary/80 transition-colors shrink-0"
            >
              Solicitar alteracao
            </button>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editingField && (
        <div className="bg-bg3 rounded-lg p-4 space-y-3">
          <label className="text-[12px] font-medium text-text">
            {editingField === 'title' ? 'Novo titulo' : 'Nova descricao'}
          </label>
          {editingField === 'title' ? (
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full bg-bg2 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
            />
          ) : (
            <textarea
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              rows={3}
              className="w-full bg-bg2 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50 resize-none"
            />
          )}
          <div>
            <label className="text-[12px] text-text3">Motivo (opcional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Corrigir titulo para o nome oficial da palestra"
              className="w-full bg-bg2 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/50 mt-1"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSubmit(editingField === 'title' ? 'title_change' : 'description_change')}
              disabled={saving || !newValue.trim()}
              className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Enviando...' : 'Enviar solicitacao'}
            </button>
            <button
              onClick={() => { setEditingField(null); setNewValue(''); setReason('') }}
              className="px-4 py-2 bg-bg2 border border-border-subtle text-text2 rounded-lg text-[13px] hover:bg-bg3 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
