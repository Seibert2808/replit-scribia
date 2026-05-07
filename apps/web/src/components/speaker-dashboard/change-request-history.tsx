'use client'

import { cn } from '@/lib/utils'

interface ChangeRequest {
  id: string
  request_type: string
  requested_value: string
  status: string
  reason: string | null
  organizer_response: string | null
  created_at: string
}

interface ChangeRequestHistoryProps {
  requests: ChangeRequest[]
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-scribia-yellow/10 text-scribia-yellow' },
  approved: { label: 'Aprovado', className: 'bg-scribia-green/10 text-scribia-green' },
  rejected: { label: 'Rejeitado', className: 'bg-red-500/10 text-red-500' },
}

export function ChangeRequestHistory({ requests }: ChangeRequestHistoryProps) {
  if (requests.length === 0) return null

  return (
    <div>
      <h4 className="text-[12px] text-text3 uppercase tracking-wide mb-3">Historico de solicitacoes</h4>
      <div className="space-y-2">
        {requests.map((req) => {
          const cfg = statusConfig[req.status] ?? statusConfig.pending
          return (
            <div key={req.id} className="bg-bg3 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-text2 font-medium">
                  {req.request_type === 'title_change' ? 'Titulo' : 'Descricao'}
                </span>
                <div className="flex items-center gap-2">
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', cfg.className)}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-text3">
                    {new Date(req.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <p className="text-[12px] text-text3 truncate">
                Solicitado: &ldquo;{req.requested_value.slice(0, 100)}{req.requested_value.length > 100 ? '...' : ''}&rdquo;
              </p>
              {req.organizer_response && (
                <p className="text-[11px] text-text3 mt-1 italic">
                  Resposta: {req.organizer_response}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
