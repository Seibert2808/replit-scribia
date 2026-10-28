import { useEffect, useState } from 'react'
import { SITE } from '@/utils/constants'

// Prova social da landing do palestrante: quem ja cedeu palestra para a
// Vitrine, puxado do app via /api/public/palestrantes-destaque, ja que
// esse dado so existe la (o site nao tem acesso direto ao banco).

interface PalestranteDestaque {
  id: string
  nome: string
  cargo: string | null
  empresa: string | null
  foto: string | null
  palestra: string
  evento: string | null
  ano: number | null
}

function iniciais(nome: string): string {
  return nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

function PalestranteCard({ p }: { p: PalestranteDestaque }) {
  return (
    <a
      href={`${SITE.appUrl}/vitrine`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl border border-border bg-card p-5 hover:border-purple-light/50 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="flex items-center gap-3">
        {p.foto ? (
          <img
            src={p.foto}
            alt={p.nome}
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-dim/50 text-sm font-bold text-purple-light">
            {iniciais(p.nome)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{p.nome}</p>
          {(p.cargo || p.empresa) && (
            <p className="truncate text-xs text-muted-foreground">
              {[p.cargo, p.empresa].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-foreground line-clamp-2">
        {p.palestra}
      </p>
      {p.evento && (
        <p className="mt-2 text-xs text-muted-foreground">
          {p.evento}{p.ano ? ` · ${p.ano}` : ''}
        </p>
      )}
    </a>
  )
}

export function PalestrantesDestaque() {
  const [palestrantes, setPalestrantes] = useState<PalestranteDestaque[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch(`${SITE.appUrl}/api/public/palestrantes-destaque`)
      .then((r) => {
        if (!r.ok) throw new Error(`status ${r.status}`)
        return r.json()
      })
      .then((data: PalestranteDestaque[]) => {
        if (mounted) setPalestrantes(data)
      })
      .catch(() => {
        if (mounted) setErro(true)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  // Sem rastro visivel quando nao ha nada ainda, ou quando o app esta
  // fora do ar: a secao de eventos acima ja sustenta a pagina sozinha.
  if (!loading && (erro || palestrantes.length === 0)) return null

  return (
    <section>
      <div className="mb-4 animate-fade-up">
        <h2 className="font-heading font-extrabold leading-tight tracking-tight text-2xl sm:text-3xl">
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #725EA8, #698DC5)' }}
          >
            Palestrantes em destaque no ScribIA
          </span>
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
          Quem já cedeu a palestra para a Vitrine, e continua rendendo depois do evento.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="h-36 animate-pulse rounded-2xl bg-card" />
          <div className="h-36 animate-pulse rounded-2xl bg-card" />
          <div className="h-36 animate-pulse rounded-2xl bg-card" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {palestrantes.map((p) => <PalestranteCard key={p.id} p={p} />)}
        </div>
      )}
    </section>
  )
}
