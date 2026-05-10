import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { supabase } from '@/lib/supabase'
import { PublicHeader } from '@/components/layout/public-header'
import Footer from '@/components/sections/Footer'
import { ArrowRight, Sparkles } from 'lucide-react'

interface Organizer {
  id: string
  slug: string
  display_name: string
  description: string | null
  logo_url: string | null
  brand_color: string | null
  is_official: boolean
  event_count: number
}

function OrganizerCard({ org, featured = false }: { org: Organizer; featured?: boolean }) {
  return (
    <Link
      href={`/o/${org.slug}`}
      className={`group bg-bg2 border rounded-xl p-5 transition-all animate-fade-up ${
        featured
          ? 'border-border-purple shadow-elegant hover:shadow-glow'
          : 'border-border-subtle hover:border-border-purple'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-lg bg-purple-dim border border-border-purple flex items-center justify-center font-heading font-bold text-purple-light shrink-0 overflow-hidden"
          style={org.brand_color ? { borderColor: `${org.brand_color}55` } : undefined}
        >
          {org.logo_url ? (
            <img src={org.logo_url} alt={org.display_name} className="w-full h-full object-cover" />
          ) : (
            <span>{org.display_name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="font-heading font-bold text-[15px] text-text truncate">{org.display_name}</div>
            {org.is_official && (
              <span title="Organizador oficial do ScribIA">
                <Sparkles className="w-3.5 h-3.5 text-purple-light shrink-0" />
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-text3">
            {org.event_count} {org.event_count === 1 ? 'evento' : 'eventos'}
          </div>
        </div>
      </div>
      {org.description && (
        <p className="text-[12.5px] text-text2 line-clamp-2 leading-relaxed">{org.description}</p>
      )}
      <div className="flex items-center gap-1 mt-4 text-[12px] text-purple-light font-medium group-hover:gap-2 transition-all">
        Ver página <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  )
}

export default function PublicOrganizersPage() {
  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: orgsData } = await supabase
        .from('organizer_profiles')
        .select('id, slug, display_name, description, logo_url, brand_color, is_official')
        .order('display_name', { ascending: true })

      const orgs = (orgsData ?? []) as Array<Omit<Organizer, 'event_count'>>
      const orgIds = orgs.map((o) => o.id)

      let counts: Record<string, number> = {}
      if (orgIds.length > 0) {
        const { data: countData } = await supabase
          .from('events')
          .select('organizer_id')
          .in('status', ['active', 'completed'])
          .in('organizer_id', orgIds)
        counts = ((countData ?? []) as Array<{ organizer_id: string }>).reduce<Record<string, number>>((acc, e) => {
          acc[e.organizer_id] = (acc[e.organizer_id] ?? 0) + 1
          return acc
        }, {})
      }

      const enriched: Organizer[] = orgs.map((o) => ({ ...o, event_count: counts[o.id] ?? 0 }))
      setOrganizers(enriched)
      setLoading(false)
    }
    load()
  }, [])

  const officials = organizers.filter((o) => o.is_official)
  const others = organizers.filter((o) => !o.is_official && o.event_count > 0)

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 pt-10 md:pt-14 pb-4">
        <h1 className="font-heading text-[28px] sm:text-[34px] md:text-[40px] font-extrabold text-text leading-tight tracking-tight animate-fade-up">
          Organizadores
        </h1>
        <p className="text-[13.5px] sm:text-[14.5px] text-text2 mt-2 max-w-2xl leading-relaxed animate-fade-up">
          Quem publica eventos e palestras no Scribia.
        </p>
      </section>

      {/* Officials */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-2">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.8px] text-purple-light font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Organizadores oficiais do ScribIA
            </div>
            <p className="text-[12.5px] text-text3 mt-1">Parceiros que estão sempre conosco</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-bg3 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : officials.length === 0 ? (
          <div className="text-center py-10 bg-bg2 border border-dashed border-border-subtle rounded-xl">
            <p className="text-[13px] text-text3">Em breve organizadores oficiais.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {officials.map((org) => (
              <OrganizerCard key={org.id} org={org} featured />
            ))}
          </div>
        )}
      </section>

      {/* Others */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 pt-10 md:pt-14 pb-16">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-heading text-[20px] sm:text-[22px] font-bold text-text">Todos os organizadores</h2>
            <p className="text-[12.5px] text-text3 mt-0.5">
              {others.length > 0
                ? `${others.length} ${others.length === 1 ? 'organizador' : 'organizadores'} com eventos publicados`
                : 'Nenhum outro organizador com eventos ainda'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-bg3 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : others.length === 0 ? (
          <div className="text-center py-10 bg-bg2 border border-dashed border-border-subtle rounded-xl">
            <p className="text-[13px] text-text3">Ainda não há outros organizadores publicados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {others.map((org) => <OrganizerCard key={org.id} org={org} />)}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
