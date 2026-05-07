'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Check, X } from 'lucide-react'

interface PendingRequest {
  id: string
  lecture_id: string
  lecture_title: string
  speaker_name: string
  request_type: string
  current_value: string
  requested_value: string
  reason: string | null
  created_at: string
}

interface PendingRequestsProps {
  requests: PendingRequest[]
}

export function PendingRequests({ requests: initialRequests }: PendingRequestsProps) {
  const [requests, setRequests] = useState(initialRequests)
  const [responding, setResponding] = useState<string | null>(null)
  const [response, setResponse] = useState('')

  if (requests.length === 0) return null

  async function handleAction(requestId: string, status: 'approved' | 'rejected') {
    setResponding(requestId)
    const supabase = createClient()

    await supabase
      .from('lecture_change_requests')
      .update({
        status,
        organizer_response: response.trim() || null,
      } as never)
      .eq('id', requestId)

    setRequests((prev) => prev.filter((r) => r.id !== requestId))
    setResponding(null)
    setResponse('')
  }

  return (
    <div className="bg-bg2 border border-border-subtle rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm font-bold text-text">
          Solicitacoes de Palestrantes
        </h3>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-scribia-yellow/10 text-scribia-yellow">
          {requests.length} pendente{requests.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {requests.map((req) => (
          <div key={req.id} className="bg-bg3 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[12px] font-medium text-text">{req.speaker_name}</span>
                <span className="text-[11px] text-text3 ml-2">
                  {req.request_type === 'title_change' ? 'Titulo' : 'Descricao'}
                </span>
              </div>
              <span className="text-[10px] text-text3">
                {new Date(req.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {/* Diff */}
            <div className="space-y-1 mb-3">
              <div className="text-[11px]">
                <span className="text-text3">Atual:</span>{' '}
                <span className="text-text2 bg-red-500/5 px-1 rounded">{req.current_value.slice(0, 80)}</span>
              </div>
              <div className="text-[11px]">
                <span className="text-text3">Novo:</span>{' '}
                <span className="text-text2 bg-scribia-green/5 px-1 rounded">{req.requested_value.slice(0, 80)}</span>
              </div>
              {req.reason && (
                <div className="text-[11px] text-text3 italic">Motivo: {req.reason}</div>
              )}
            </div>

            {/* Actions */}
            {responding === req.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Resposta ao palestrante (opcional)"
                  className="w-full bg-bg2 border border-border-subtle rounded px-2 py-1.5 text-[12px] text-text focus:outline-none focus:border-primary/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(req.id, 'approved')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-scribia-green text-white rounded text-[11px] font-medium hover:bg-scribia-green/90"
                  >
                    <Check className="w-3 h-3" /> Aprovar
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'rejected')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded text-[11px] font-medium hover:bg-red-500/90"
                  >
                    <X className="w-3 h-3" /> Rejeitar
                  </button>
                  <button
                    onClick={() => { setResponding(null); setResponse('') }}
                    className="px-3 py-1.5 text-text3 text-[11px] hover:text-text2"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setResponding(req.id)}
                className="text-[12px] text-primary hover:text-primary/80 transition-colors"
              >
                Responder
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
