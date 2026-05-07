// Speaker context — fetches and formats speaker data for prompt injection

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SpeakerContext {
  name: string
  mini_bio: string
  formation: string
  expertise_tags: string
  featured_publications: string
  role: string
  company: string
}

/**
 * Fetch speaker data for a lecture and format it for prompt injection.
 * Falls back to legacy `bio` field if `mini_bio` is empty.
 * Returns a placeholder if no bio data is available.
 */
export async function getSpeakerContext(
  supabase: ReturnType<typeof createClient>,
  lectureId: string,
): Promise<SpeakerContext> {
  const { data: lecture } = await supabase
    .from('lectures')
    .select('speaker_id')
    .eq('id', lectureId)
    .single()

  if (!lecture?.speaker_id) {
    return emptyContext()
  }

  const { data: speaker } = await supabase
    .from('speakers')
    .select('name, bio, mini_bio, formation, expertise_tags, featured_publications, role, company')
    .eq('id', lecture.speaker_id)
    .single()

  if (!speaker) {
    return emptyContext()
  }

  const s = speaker as Record<string, unknown>

  // Bio: prefer mini_bio, fallback to bio, then placeholder
  let bio = (s.mini_bio as string) || (s.bio as string) || ''
  if (!bio.trim()) {
    bio = 'Informacoes do palestrante nao disponiveis'
  }

  // Formation: JSONB array of { curso, instituicao, ano }
  let formationStr = ''
  const formation = s.formation as Array<{ curso?: string; instituicao?: string; ano?: string }> | null
  if (formation && formation.length > 0) {
    formationStr = formation
      .map(f => [f.curso, f.instituicao, f.ano].filter(Boolean).join(' - '))
      .join('; ')
  }

  // Expertise tags
  const tags = s.expertise_tags as string[] | null
  const tagsStr = tags?.length ? tags.join(', ') : ''

  // Publications
  const pubs = s.featured_publications as string[] | null
  const pubsStr = pubs?.length ? pubs.join('; ') : ''

  return {
    name: (s.name as string) || 'N/A',
    mini_bio: bio,
    formation: formationStr,
    expertise_tags: tagsStr,
    featured_publications: pubsStr,
    role: (s.role as string) || '',
    company: (s.company as string) || '',
  }
}

/**
 * Format speaker context as a string block for prompt injection.
 */
export function formatSpeakerForPrompt(ctx: SpeakerContext): string {
  const parts = [`Nome: ${ctx.name}`]
  if (ctx.role || ctx.company) {
    parts.push(`Cargo/Instituicao: ${[ctx.role, ctx.company].filter(Boolean).join(' - ')}`)
  }
  parts.push(`Bio: ${ctx.mini_bio}`)
  if (ctx.formation) parts.push(`Formacao: ${ctx.formation}`)
  if (ctx.expertise_tags) parts.push(`Areas de expertise: ${ctx.expertise_tags}`)
  if (ctx.featured_publications) parts.push(`Publicacoes: ${ctx.featured_publications}`)
  return parts.join('\n')
}

function emptyContext(): SpeakerContext {
  return {
    name: 'N/A',
    mini_bio: 'Informacoes do palestrante nao disponiveis',
    formation: '',
    expertise_tags: '',
    featured_publications: '',
    role: '',
    company: '',
  }
}

/**
 * Build a snapshot of speaker data for generation_metadata.
 */
export function buildSpeakerSnapshot(ctx: SpeakerContext): Record<string, string> {
  return {
    name: ctx.name,
    mini_bio: ctx.mini_bio,
    formation: ctx.formation,
    expertise_tags: ctx.expertise_tags,
  }
}
