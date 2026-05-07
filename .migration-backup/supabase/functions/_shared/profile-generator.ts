// Profile generator — generates one material (ebook/playbook) for one profile
// Each invocation is independent: if one fails, others continue.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callAIProvider, generateImage } from './ai-provider.ts'
import { getSpeakerContext, formatSpeakerForPrompt, buildSpeakerSnapshot } from './speaker-context.ts'

type SupabaseClient = ReturnType<typeof createClient>

interface GenerateProfileInput {
  lectureId: string
  profileType: string
  contentType: 'ebook' | 'playbook'
  contentFormat: 'topics' | 'developed'
  includeGlossary: boolean
  includeTimeline: boolean
  includeQuiz: boolean
  includeConnectionMap: boolean
}

interface GenerateProfileResult {
  success: boolean
  profileType: string
  contentType: string
  wordCount?: number
  error?: string
}

const WORD_TARGETS: Record<string, number> = {
  junior_compact: 3500,
  junior_complete: 7000,
  pleno_compact: 3500,
  pleno_complete: 7000,
  senior_compact: 3500,
  senior_complete: 7000,
}

/**
 * Generate one material for a specific profile/content_type combination.
 * Updates lecture_materials row with status, content, word_count, and metadata.
 */
export async function generateProfileMaterial(
  supabase: SupabaseClient,
  input: GenerateProfileInput,
): Promise<GenerateProfileResult> {
  const { lectureId, profileType, contentType, contentFormat } = input

  // 1. Upsert lecture_materials row as 'generating'
  await upsertMaterialStatus(supabase, lectureId, profileType, contentType, 'generating')

  try {
    // 2. Fetch system prompt for this profile/type
    const promptKey = `${contentType}_${profileType}`
    const { data: promptRow } = await supabase
      .from('system_prompts')
      .select('prompt_text')
      .eq('key', promptKey)
      .single()

    if (!promptRow?.prompt_text) {
      throw new Error(`System prompt not found: ${promptKey}`)
    }

    // 3. Fetch lecture data
    const { data: lecture } = await supabase
      .from('lectures')
      .select('title, summary, topics, transcript_text, events(id, name, description)')
      .eq('id', lectureId)
      .single()

    if (!lecture) throw new Error('Lecture not found')
    const lec = lecture as Record<string, unknown>
    const event = lec.events as Record<string, unknown> | null

    // 4. Fetch speaker context
    const speakerCtx = await getSpeakerContext(supabase, lectureId)
    const speakerBio = formatSpeakerForPrompt(speakerCtx)

    // 5. Fill template variables
    const wordTarget = WORD_TARGETS[profileType] || 5000
    const transcript = (lec.transcript_text as string) || ''
    // Limit transcript to ~30k chars to avoid token overflow
    const truncatedTranscript = transcript.length > 30000
      ? transcript.substring(0, 30000) + '\n\n[... transcrição truncada por limite de tamanho ...]'
      : transcript

    const filledPrompt = fillTemplate(promptRow.prompt_text as string, {
      title: (lec.title as string) || '',
      speaker_name: speakerCtx.name,
      speaker_bio: speakerBio,
      event: event?.name as string || '',
      event_audience: (event?.description as string) || 'Público geral',
      summary: (lec.summary as string) || '',
      topics: ((lec.topics as string[]) || []).join(', '),
      transcript: truncatedTranscript,
      content_format: contentFormat === 'topics' ? 'topics' : 'developed',
      word_target: String(wordTarget),
    })

    // 6. Generate content via AI
    const maxTokens = profileType.includes('complete') ? 16384 : 8192
    const markdownContent = await callAIProvider(filledPrompt, {
      maxTokens,
      temperature: 0.7,
    })

    // 7. Count words
    const wordCount = markdownContent.split(/\s+/).filter(Boolean).length

    // 8. Generate images for ebook profiles
    let images: string[] = []
    const eventId = (event?.id as string) || 'no-event'
    if (contentType === 'ebook') {
      images = await generateProfileImages(supabase, lectureId, profileType, markdownContent, eventId)
    }

    // 9. Save completed material
    const speakerSnapshot = buildSpeakerSnapshot(speakerCtx)
    await supabase
      .from('lecture_materials')
      .update({
        markdown_content: markdownContent,
        status: 'completed',
        word_count: wordCount,
        images,
        generation_metadata: {
          prompt_key: promptKey,
          content_format: contentFormat,
          word_target: wordTarget,
          speaker_snapshot: speakerSnapshot,
          generated_at: new Date().toISOString(),
          include_glossary: input.includeGlossary,
          include_timeline: input.includeTimeline,
          include_quiz: input.includeQuiz,
          include_connection_map: input.includeConnectionMap,
        },
      } as never)
      .eq('lecture_id', lectureId)
      .eq('profile_type', profileType)
      .eq('content_type', contentType)

    return { success: true, profileType, contentType, wordCount }

  } catch (err) {
    console.error(`Profile generation failed [${profileType}/${contentType}]:`, err)

    // Mark as failed
    await upsertMaterialStatus(supabase, lectureId, profileType, contentType, 'failed')

    return {
      success: false,
      profileType,
      contentType,
      error: (err as Error).message,
    }
  }
}

/**
 * Upsert a lecture_materials row atomically using ON CONFLICT.
 */
async function upsertMaterialStatus(
  supabase: SupabaseClient,
  lectureId: string,
  profileType: string,
  contentType: string,
  status: string,
) {
  await supabase
    .from('lecture_materials')
    .upsert(
      {
        lecture_id: lectureId,
        profile_type: profileType,
        content_type: contentType,
        status,
      } as never,
      { onConflict: 'lecture_id,profile_type,content_type' }
    )
}

/**
 * Generate images for an ebook profile (cover + chapter images).
 * Returns array of storage paths.
 */
async function generateProfileImages(
  supabase: SupabaseClient,
  lectureId: string,
  profileType: string,
  markdownContent: string,
  eventId: string,
): Promise<string[]> {
  const images: string[] = []

  // Extract chapter titles
  const chapterTitles = markdownContent
    .split('\n')
    .filter((l: string) => l.startsWith('## '))
    .map((l: string) => l.replace(/^## /, '').replace(/\*\*/g, ''))
    .slice(0, 6) // max 6 chapters

  const imageSlots = [
    `Professional educational ebook cover illustration. Modern, clean, abstract design with purple and gold tones, no text, no people faces, geometric shapes.`,
    ...chapterTitles.map((t: string) =>
      `Clean modern illustration for chapter "${t}". Abstract, professional, purple and gold tones, no text, no people faces, minimalist.`
    ),
  ]

  for (let i = 0; i < imageSlots.length; i++) {
    try {
      const imageBase64 = await generateImage(imageSlots[i])
      if (imageBase64) {
        const imgPath = `${eventId}/${lectureId}/${profileType}/img_${i}.png`
        const imgBytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))
        await supabase.storage
          .from('materials')
          .upload(imgPath, imgBytes, { contentType: 'image/png', upsert: true })
        images.push(imgPath)
      } else {
        images.push('')
      }
    } catch {
      images.push('')
    }
  }

  return images
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}

/**
 * Get the ordered list of profile/content_type pairs to generate,
 * based on the generation_configs for a lecture.
 * Returns pairs like: [{ profileType, contentType }, ...]
 */
export async function getGenerationQueue(
  supabase: SupabaseClient,
  lectureId: string,
  clientProfiles?: string[],
): Promise<{
  profiles: string[]
  contentFormat: 'topics' | 'developed'
  includeGlossary: boolean
  includeTimeline: boolean
  includeQuiz: boolean
  includeConnectionMap: boolean
  queue: Array<{ profileType: string; contentType: 'ebook' | 'playbook' }>
}> {
  const { data: config } = await supabase
    .from('generation_configs')
    .select('*')
    .eq('lecture_id', lectureId)
    .single()

  const cfg = config as Record<string, unknown> | null
  const DEFAULT_PROFILES = ['junior_complete', 'pleno_complete']
  // Priority: client-sent profiles > DB config > defaults
  // Use .length check because [] || default returns [] (truthy in JS)
  const dbProfiles = cfg?.selected_profiles as string[] | undefined
  const profiles = (clientProfiles && clientProfiles.length > 0)
    ? clientProfiles
    : (dbProfiles && dbProfiles.length > 0)
      ? dbProfiles
      : DEFAULT_PROFILES
  const contentFormat = (cfg?.content_format as 'topics' | 'developed') || 'developed'
  const includeGlossary = (cfg?.include_glossary as boolean) ?? true
  const includeTimeline = (cfg?.include_timeline as boolean) ?? true
  const includeQuiz = (cfg?.include_quiz as boolean) ?? false
  const includeConnectionMap = (cfg?.include_connection_map as boolean) ?? false

  // Build queue: for each profile, ebook first then playbook
  const queue: Array<{ profileType: string; contentType: 'ebook' | 'playbook' }> = []
  for (const profile of profiles) {
    queue.push({ profileType: profile, contentType: 'ebook' })
    queue.push({ profileType: profile, contentType: 'playbook' })
  }

  return { profiles, contentFormat, includeGlossary, includeTimeline, includeQuiz, includeConnectionMap, queue }
}
