import { useEffect, useState } from "react"
import { Link } from "wouter"
import { publicGet } from "@/lib/public-fetch"
import { Calendar, MapPin } from "lucide-react"

// Mesma fonte de dados e mesmo filtro de "status=active" da pagina /eventos
// (src/pages/public/events.tsx), so que mostrando o que ja aconteceu (end_date
// no passado) em vez do que ainda vai acontecer. Pedido do plano de mudancas
// do site de 09/11/2026, secao 5.12.
interface PublicEvent {
  id: string
  name: string
  start_date: string
  end_date: string
  location: string | null
  cover_image_url: string | null
  organizer_name: string
}

const DEMO_EVENT_ID = "ea692433-bfa8-483e-b9da-82dda6fc13d1"

// Evento de teste da Sabrina (ScribIA 4me) — nunca deve aparecer em nenhuma
// listagem publica, so existe para ela testar o produto.
const TEST_EVENT_ID = "f5ee143d-71f9-400b-aef6-58851b3e7f42"

function soODia(iso: string): string {
  return iso.slice(0, 10)
}

function formatDateLong(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

export function EventosRealizados() {
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    publicGet<PublicEvent>(
      `public_events?status=eq.active&id=not.in.(${DEMO_EVENT_ID},${TEST_EVENT_ID})&select=id,name,start_date,end_date,location,cover_image_url,organizer_name&order=end_date.desc`,
    )
      .then((list) => {
        if (mounted) setEvents(list)
      })
      .catch(() => {
        /* sem eventos a secao nao aparece */
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const hoje = new Date().toISOString().slice(0, 10)
  const realizados = events
    .filter((e) => soODia(e.end_date || e.start_date) < hoje)
    .sort((a, b) => (a.end_date < b.end_date ? 1 : -1))

  if (!loading && realizados.length === 0) return null

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Eventos que já usaram o ScribIA</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            O conteúdo destes eventos continua disponível para quem participou.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[2/1] bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {realizados.map((ev) => (
              <Link
                key={ev.id}
                href={`/eventos/${ev.id}`}
                className="group block rounded-2xl overflow-hidden ring-1 ring-border hover:ring-primary/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-[2/1] overflow-hidden bg-muted">
                  {ev.cover_image_url ? (
                    <img
                      src={ev.cover_image_url}
                      alt={ev.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-primary/20" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    {ev.organizer_name && (
                      <p className="text-[10px] text-white/70 uppercase tracking-widest mb-1 truncate">
                        {ev.organizer_name}
                      </p>
                    )}
                    <h3 className="font-bold text-white text-sm leading-snug line-clamp-2">{ev.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-white/80 text-[11px]">
                        <Calendar className="w-3 h-3" />
                        {formatDateLong(ev.start_date)}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1 text-white/70 text-[11px] truncate">
                          <MapPin className="w-3 h-3" />
                          {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
