import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callAIProvider, transcribeAudioFromBytes, uploadToGeminiFiles, deleteGeminiFile, getGeminiApiKey, getGeminiModel, generateImage } from '../_shared/ai-provider.ts'
import { generateProfileMaterial, getGenerationQueue } from '../_shared/profile-generator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessRequest {
  lecture_id: string
  steps?: ('transcribe' | 'summarize' | 'ebook' | 'playbook' | 'ebook_images' | 'generate_profile')[]
  chunk_start?: number
  chunk_end?: number
  // Multi-profile params (for generate_profile step)
  profile_type?: string
  content_type?: 'ebook' | 'playbook'
  selected_profiles?: string[]
}

// Default prompts (used when DB prompts are not available)
const DEFAULT_PROMPTS: Record<string, string> = {
  summary_chunk: `Resuma este trecho de uma palestra em 1-2 parágrafos e liste os tópicos abordados neste trecho.

Título da palestra: {{title}}

Trecho:
{{transcript}}

Responda em JSON:
{
  "partial_summary": "resumo deste trecho...",
  "partial_topics": ["tópico 1", "tópico 2", ...]
}`,
  summary_final: `Você recebeu resumos parciais de diferentes trechos de uma palestra. Consolide tudo em um resumo final coeso.

Título da palestra: {{title}}

Resumos parciais:
{{partial_summaries}}

Tópicos encontrados:
{{partial_topics}}

Gere o resumo final consolidado em JSON:
{
  "summary": "resumo completo de 3-5 parágrafos...",
  "topics": ["tópico 1", "tópico 2", ...] (5-10 tópicos únicos, sem repetições)
}`,
  ebook: `Crie um e-book educacional baseado no resumo e topicos da palestra abaixo. NAO invente informacoes.

Titulo: {{title}}
Palestrante: {{speaker}}
Evento: {{event}}

Resumo: {{summary}}

Topicos: {{topics}}

Estrutura do e-book em Markdown:
1. Titulo principal (# heading) e subtitulo com palestrante/evento
2. Sumario numerado
3. Introducao (2-3 paragrafos)
4. 3-6 capitulos (## heading), cada um com conteudo e pontos-chave ao final
5. Conclusao
6. Sobre o palestrante

Regras:
- Use Markdown: # ## ### para titulos, **negrito**, *italico*, > para citacoes, - para listas
- Use --- para separar secoes
- NAO use emojis
- Tom profissional e acessivel, portugues brasileiro
- 2000-4000 palavras
- NUNCA invente dados ou citacoes`,
  playbook: `Crie um playbook pratico e acionavel baseado nesta palestra.

Titulo: {{title}}
Palestrante: {{speaker}}

Resumo: {{summary}}

Topicos: {{topics}}

Estrutura em Markdown:
1. Titulo (# Playbook: titulo)
2. Contexto (1 paragrafo)
3. 5-10 acoes praticas, cada uma com:
   - ## Acao N: titulo
   - Descricao e por que eh importante
   - ### Como implementar (checklist com - [ ] itens)
4. ## Metricas de Sucesso (lista)
5. ## Timeline Sugerida (semanas)

Regras:
- Use Markdown: # ## ### **negrito** *italico* - [ ] checklists
- NAO use emojis
- Tom profissional e acessivel, portugues brasileiro`,
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}

function wrapInHtmlTemplate(content: string, title: string, type: 'ebook' | 'playbook'): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - ${type === 'ebook' ? 'E-book' : 'Playbook'} | ScribIA</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --primary: #6b5bb5;
    --primary-light: #9a7dc7;
    --bg: hsl(250 30% 98%);
    --card: #ffffff;
    --text: hsl(249 30% 12%);
    --text2: hsl(249 15% 40%);
    --text3: hsl(249 10% 55%);
    --border: hsl(250 20% 90%);
    --green: #00D4A0;
    --yellow: #FFB830;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.7;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 24px;
  }
  .cover {
    text-align: center;
    padding: 80px 40px;
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    color: white;
    border-radius: 16px;
    margin-bottom: 48px;
  }
  .cover h1 {
    font-size: 2.2em;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 16px;
  }
  .cover .subtitle {
    font-size: 1.1em;
    font-weight: 600;
    opacity: 0.9;
    margin-bottom: 8px;
  }
  .cover .meta {
    font-size: 0.85em;
    opacity: 0.7;
  }
  .toc {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 32px;
    margin-bottom: 40px;
  }
  .toc h2 {
    font-size: 1.3em;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 16px;
  }
  .toc ul { list-style: none; }
  .toc li { padding: 8px 0; border-bottom: 1px solid var(--border); }
  .toc li:last-child { border-bottom: none; }
  .toc a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s;
  }
  .toc a:hover { opacity: 0.7; }
  .chapter, .conclusion, .about, .action, .metrics, .timeline {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 32px;
    margin-bottom: 24px;
  }
  h2 {
    font-size: 1.4em;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--border);
  }
  h3 {
    font-size: 1.1em;
    font-weight: 600;
    color: var(--text);
    margin: 24px 0 12px;
  }
  p { margin-bottom: 16px; color: var(--text2); }
  blockquote {
    border-left: 4px solid var(--primary);
    background: hsl(249 30% 96%);
    padding: 16px 20px;
    border-radius: 0 8px 8px 0;
    margin: 16px 0;
    font-style: italic;
    color: var(--text2);
  }
  ul, ol {
    padding-left: 24px;
    margin-bottom: 16px;
    color: var(--text2);
  }
  li { margin-bottom: 8px; }
  strong { color: var(--text); font-weight: 600; }
  .key-points {
    background: hsl(249 30% 96%);
    border-radius: 8px;
    padding: 20px 24px;
    margin-top: 24px;
  }
  .key-points h3 {
    color: var(--primary);
    margin-top: 0;
    font-size: 0.95em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .key-points ul { margin-bottom: 0; }
  .checklist { list-style: none; padding-left: 0; }
  .checklist li {
    padding: 10px 16px;
    background: hsl(249 30% 96%);
    border-radius: 8px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .checklist input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--primary);
  }
  .timeline-item {
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 12px;
  }
  .timeline-item:last-child { border-bottom: none; }
  .timeline-item strong {
    color: var(--primary);
    white-space: nowrap;
    min-width: 120px;
  }
  .footer {
    text-align: center;
    padding: 40px;
    color: var(--text3);
    font-size: 0.8em;
  }
  .footer .brand {
    font-weight: 700;
    color: var(--primary);
  }
  @media print {
    body { padding: 0; max-width: 100%; }
    .cover { page-break-after: always; }
    .chapter, .action { page-break-inside: avoid; }
  }
</style>
</head>
<body>
${content}
<div class="footer">
  <p>Gerado por <span class="brand">ScribIA</span> &mdash; Transforme palestras em conhecimento</p>
</div>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Auth check
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const { lecture_id, steps = ['transcribe', 'summarize', 'ebook', 'playbook'], chunk_start, chunk_end, profile_type, content_type, selected_profiles }: ProcessRequest = await req.json()

    // Fetch lecture
    const { data: lecture, error: lectureErr } = await supabase
      .from('lectures')
      .select('*, events(id, name)')
      .eq('id', lecture_id)
      .single()

    if (lectureErr || !lecture) {
      return jsonResponse({ error: 'Lecture not found' }, 404)
    }

    const eventId = lecture.event_id

    // Load custom prompts from DB
    const { data: dbPrompts } = await supabase
      .from('system_prompts')
      .select('key, prompt_text')

    const promptMap: Record<string, string> = { ...DEFAULT_PROMPTS }
    if (dbPrompts) {
      for (const p of dbPrompts as Array<{ key: string; prompt_text: string }>) {
        promptMap[p.key] = p.prompt_text
      }
    }

    // Update status
    await updateLecture(supabase, lecture_id, { status: 'processing', processing_progress: 0 })

    const results: Record<string, string> = {}

    // ========================
    // STEP 1: Transcribe audio (chunked — client sends chunk_start/chunk_end)
    // ========================
    if (steps.includes('transcribe')) {
      // List audio files from storage
      const { data: audioFiles } = await supabase.storage
        .from('audio-files')
        .list(`${eventId}/${lecture_id}`)

      const AUDIO_EXTENSIONS = ['.wav', '.webm', '.mp3', '.m4a', '.ogg', '.mp4', '.mpeg']
      const getMimeType = (filename: string): string => {
        const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase()
        const mimeMap: Record<string, string> = {
          '.wav': 'audio/wav', '.webm': 'audio/webm', '.mp3': 'audio/mp3',
          '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.mp4': 'audio/mp4',
          '.mpeg': 'audio/mpeg',
        }
        return mimeMap[ext] ?? 'audio/wav'
      }

      // Check for uploaded single file (final.webm) or recorded chunks (chunk_*.wav)
      const allAudio = (audioFiles ?? [])
        .filter((f: { name: string }) => {
          const lower = f.name.toLowerCase()
          if (lower === 'merged.mp3') return false
          return AUDIO_EXTENSIONS.some(ext => lower.endsWith(ext))
        })
        .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))

      if (allAudio.length === 0) {
        return jsonResponse({ error: 'No audio files found for this lecture' }, 400)
      }

      const uploadedFile = allAudio.find((f: { name: string }) => f.name.startsWith('final.'))

      // Update audio_path if not set
      await updateLecture(supabase, lecture_id, {
        audio_path: `${eventId}/${lecture_id}`,
      })

      const MAX_INLINE_SIZE = 15 * 1024 * 1024 // 15MB

      // --- LARGE UPLOADED FILE: 2-phase flow (upload → transcribe) ---
      if (uploadedFile) {
        const filePath = `${eventId}/${lecture_id}/${uploadedFile.name}`
        const mimeType = getMimeType(uploadedFile.name)
        const start = chunk_start ?? 0

        if (start === 0) {
          // Phase 1: Download file and check size
          console.log(`Downloading uploaded file: ${uploadedFile.name}...`)
          const { data: audioData } = await supabase.storage
            .from('audio-files')
            .download(filePath)

          if (!audioData) {
            return jsonResponse({ error: 'Failed to download audio file' }, 500)
          }

          const audioBytes = new Uint8Array(await audioData.arrayBuffer())
          console.log(`File size: ${(audioBytes.length / 1024 / 1024).toFixed(1)}MB`)

          if (audioBytes.length <= MAX_INLINE_SIZE) {
            // Small file: transcribe inline in one call
            console.log('Small file, transcribing inline...')
            const text = await transcribeAudioFromBytes(
              audioBytes, mimeType,
              'Transcreva este áudio em português brasileiro. Retorne apenas o texto transcrito, sem timestamps ou formatação extra.',
            )
            await updateLecture(supabase, lecture_id, {
              transcript_text: text,
              processing_progress: 25,
            })
            results.transcribe = 'ok'
          } else {
            // Large file: upload to Gemini Files API, save URI, return partial
            console.log('Large file, uploading to Gemini Files API...')
            const apiKey = await getGeminiApiKey()
            const { fileUri, fileName } = await uploadToGeminiFiles(audioBytes, mimeType, apiKey)
            console.log(`Gemini file ready: ${fileName}`)

            // Store Gemini file info temporarily
            await updateLecture(supabase, lecture_id, {
              summary_partials: { _gemini_file_uri: fileUri, _gemini_file_name: fileName, _gemini_mime_type: mimeType },
              processing_progress: 10,
            })

            return jsonResponse({
              success: true,
              partial: true,
              next_chunk_start: 1,
              total_chunks: 2,
              results: { transcribe: 'partial' },
            })
          }
        } else if (start === 1) {
          // Phase 2: Transcribe using stored Gemini file URI
          const { data: lectureData } = await supabase
            .from('lectures')
            .select('summary_partials')
            .eq('id', lecture_id)
            .single()

          const geminiInfo = lectureData?.summary_partials as any
          if (!geminiInfo?._gemini_file_uri) {
            return jsonResponse({ error: 'No Gemini file URI found — restart transcription' }, 400)
          }

          const apiKey = await getGeminiApiKey()
          const model = await getGeminiModel()

          console.log(`Transcribing via Gemini Files API: ${geminiInfo._gemini_file_name}...`)

          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [
                      { fileData: { mimeType: geminiInfo._gemini_mime_type, fileUri: geminiInfo._gemini_file_uri } },
                      { text: 'Transcreva este áudio em português brasileiro. Retorne apenas o texto transcrito, sem timestamps ou formatação extra.' },
                    ],
                  }],
                }),
              },
            )
            const data = await res.json()
            if (!res.ok) throw new Error(`Gemini API error: ${JSON.stringify(data)}`)
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

            await updateLecture(supabase, lecture_id, {
              transcript_text: text,
              summary_partials: null, // cleanup temp data
              processing_progress: 25,
            })
          } finally {
            // Cleanup Gemini file
            await deleteGeminiFile(geminiInfo._gemini_file_name, apiKey)
          }

          results.transcribe = 'ok'
        }
      } else {
        // --- RECORDED CHUNKS: existing flow (1 chunk per call) ---
        const chunks = allAudio
        const start = chunk_start ?? 0
        const end = Math.min(chunk_end ?? chunks.length, chunks.length)
        const totalChunks = chunks.length
        const isPartialBatch = (end < totalChunks)

        const { data: existing } = await supabase
          .from('lectures')
          .select('transcript_text')
          .eq('id', lecture_id)
          .single()
        let currentTranscript = (start > 0 && existing?.transcript_text) ? existing.transcript_text : ''

        for (let i = start; i < end; i++) {
          const chunkPath = `${eventId}/${lecture_id}/${chunks[i].name}`
          const { data: audioData } = await supabase.storage
            .from('audio-files')
            .download(chunkPath)

          if (!audioData) continue

          const audioBytes = new Uint8Array(await audioData.arrayBuffer())
          const mimeType = getMimeType(chunks[i].name)

          console.log(`Transcribing ${chunks[i].name} (${(audioBytes.length / 1024 / 1024).toFixed(1)}MB, ${mimeType})...`)

          const chunkText = await transcribeAudioFromBytes(
            audioBytes, mimeType,
            'Transcreva este áudio em português brasileiro. Retorne apenas o texto transcrito, sem timestamps ou formatação extra.',
          )

          currentTranscript += (currentTranscript ? ' ' : '') + chunkText
          const progress = Math.round((i + 1) / totalChunks * 25)
          await updateLecture(supabase, lecture_id, { processing_progress: progress })
        }

        await updateLecture(supabase, lecture_id, {
          transcript_text: currentTranscript,
          processing_progress: isPartialBatch ? Math.round(end / totalChunks * 25) : 25,
        })

        if (isPartialBatch) {
          return jsonResponse({
            success: true,
            partial: true,
            next_chunk_start: end,
            total_chunks: totalChunks,
            results: { transcribe: 'partial' },
          })
        }

        results.transcribe = 'ok'
      }
    }

    // ========================
    // STEP 2: Generate summary + topics (chunked — processes transcript in blocks)
    // ========================
    if (steps.includes('summarize')) {
      await updateLecture(supabase, lecture_id, { processing_progress: 30 })

      const { data: updated } = await supabase
        .from('lectures')
        .select('transcript_text, title, summary_partials')
        .eq('id', lecture_id)
        .single()

      const transcript = (updated as { transcript_text: string | null })?.transcript_text
      if (!transcript) {
        results.summarize = 'skipped - no transcript'
      } else {
        const title = (updated as { title: string }).title
        const CHUNK_SIZE = 8000 // chars per chunk
        const totalChunks = Math.ceil(transcript.length / CHUNK_SIZE)
        const chunkIndex = chunk_start ?? 0

        if (totalChunks <= 1) {
          // Short transcript — single call, direct final summary
          const summaryPrompt = fillTemplate(promptMap.summary_final, {
            title,
            partial_summaries: transcript,
            partial_topics: '',
          })
          const summaryText = await callAIProvider(summaryPrompt, {
            temperature: 0.3,
            jsonMode: true,
          })
          const summaryData = JSON.parse(summaryText)
          await updateLecture(supabase, lecture_id, {
            summary: summaryData.summary,
            topics: summaryData.topics,
            processing_progress: 50,
          })
          results.summarize = 'ok'
        } else if (chunkIndex < totalChunks) {
          // Process one chunk at a time
          const chunkText = transcript.substring(chunkIndex * CHUNK_SIZE, (chunkIndex + 1) * CHUNK_SIZE)
          const chunkPrompt = fillTemplate(promptMap.summary_chunk, {
            title,
            transcript: chunkText,
          })
          const chunkResult = await callAIProvider(chunkPrompt, {
            temperature: 0.3,
            jsonMode: true,
          })
          const chunkData = JSON.parse(chunkResult)

          // Accumulate partial summaries in DB
          const existing = (updated as any).summary_partials ?? []
          const partials = [...existing, {
            summary: chunkData.partial_summary,
            topics: chunkData.partial_topics,
          }]
          await updateLecture(supabase, lecture_id, {
            summary_partials: partials,
            processing_progress: 30 + Math.round(((chunkIndex + 1) / totalChunks) * 15),
          })

          if (chunkIndex + 1 < totalChunks) {
            // Tell client to continue with next chunk
            return jsonResponse({
              success: true,
              partial: true,
              step: 'summarize',
              next_chunk_start: chunkIndex + 1,
              total_chunks: totalChunks,
              results: { summarize: 'partial' },
            })
          }

          // All chunks done — consolidate into final summary
          const allSummaries = partials.map((p: any) => p.summary).join('\n\n')
          const allTopics = partials.flatMap((p: any) => p.topics).join(', ')
          const finalPrompt = fillTemplate(promptMap.summary_final, {
            title,
            partial_summaries: allSummaries,
            partial_topics: allTopics,
          })
          const finalText = await callAIProvider(finalPrompt, {
            temperature: 0.3,
            jsonMode: true,
          })
          const finalData = JSON.parse(finalText)
          await updateLecture(supabase, lecture_id, {
            summary: finalData.summary,
            topics: finalData.topics,
            summary_partials: null, // cleanup
            processing_progress: 50,
          })
          results.summarize = 'ok'
        }
      }
    }

    // ========================
    // STEP 3: Generate E-book
    // ========================
    if (steps.includes('ebook')) {
      await updateLecture(supabase, lecture_id, { processing_progress: 55 })

      const { data: forEbook } = await supabase
        .from('lectures')
        .select('title, summary, topics, speakers(name), events(name)')
        .eq('id', lecture_id)
        .single()

      const d = forEbook as any
      if (d?.summary) {
        const ebookPrompt = fillTemplate(promptMap.ebook, {
          title: d.title ?? '',
          speaker: d.speakers?.name ?? 'N/A',
          event: d.events?.name ?? 'N/A',
          summary: d.summary ?? '',
          topics: (d.topics ?? []).join(', '),
        })

        const ebookContent = await callAIProvider(ebookPrompt, {
          maxTokens: 3000,
          temperature: 0.7,
        })

        await updateLecture(supabase, lecture_id, { processing_progress: 70 })

        // Save markdown content directly to DB (HTML rendering done at serve-time)
        await updateLecture(supabase, lecture_id, {
          ebook_content: ebookContent,
          ebook_url: 'generated',
          processing_progress: 75,
        })

        results.ebook = 'ok'
      }
    }

    // ========================
    // STEP 3b: Generate E-book images (one per call, client loops)
    // ========================
    if (steps.includes('ebook_images')) {
      const { data: forImages } = await supabase
        .from('lectures')
        .select('title, ebook_content, topics, ebook_images')
        .eq('id', lecture_id)
        .single()

      const im = forImages as any
      if (im?.ebook_content) {
        // Extract chapter titles from markdown (## headings)
        const chapterTitles = (im.ebook_content as string)
          .split('\n')
          .filter((l: string) => l.startsWith('## '))
          .map((l: string) => l.replace(/^## /, '').replace(/\*\*/g, ''))

        // Image slots: cover + one per chapter
        const imageSlots = [
          `Professional educational ebook cover illustration about "${im.title}". Modern, clean, abstract design with purple and gold tones, no text, no people faces, geometric shapes and icons representing knowledge and education.`,
          ...chapterTitles.map((t: string) =>
            `Clean modern illustration for an ebook chapter about "${t}". Abstract, professional, purple and gold tones, no text, no people faces, minimalist design.`
          ),
        ]

        const imageIndex = chunk_start ?? 0
        const existingImages: string[] = im.ebook_images ?? []

        if (imageIndex < imageSlots.length) {
          console.log(`Generating image ${imageIndex + 1}/${imageSlots.length}...`)
          const imageBase64 = await generateImage(imageSlots[imageIndex])

          if (imageBase64) {
            // Upload to storage
            const imgPath = `${eventId}/${lecture_id}/ebook_img_${imageIndex}.png`
            const imgBytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))
            await supabase.storage
              .from('materials')
              .upload(imgPath, imgBytes, { contentType: 'image/png', upsert: true })

            // Store path in array
            existingImages[imageIndex] = imgPath
          } else {
            existingImages[imageIndex] = '' // failed, skip
          }

          await updateLecture(supabase, lecture_id, { ebook_images: existingImages })

          if (imageIndex + 1 < imageSlots.length) {
            return jsonResponse({
              success: true,
              partial: true,
              step: 'ebook_images',
              next_chunk_start: imageIndex + 1,
              total_chunks: imageSlots.length,
              results: { ebook_images: 'partial' },
            })
          }
        }

        results.ebook_images = 'ok'
      }
    }

    // ========================
    // STEP 4: Generate Playbook
    // ========================
    if (steps.includes('playbook')) {
      await updateLecture(supabase, lecture_id, { processing_progress: 80 })

      const { data: forPlaybook } = await supabase
        .from('lectures')
        .select('title, summary, topics, speakers(name)')
        .eq('id', lecture_id)
        .single()

      const p = forPlaybook as any
      if (p?.summary) {
        const playbookPrompt = fillTemplate(promptMap.playbook, {
          title: p.title ?? '',
          speaker: p.speakers?.name ?? 'N/A',
          summary: p.summary ?? '',
          topics: (p.topics ?? []).join(', '),
        })

        const playbookContent = await callAIProvider(playbookPrompt, {
          maxTokens: 3000,
          temperature: 0.5,
        })

        // Save markdown content directly to DB (HTML rendering done at serve-time)
        await updateLecture(supabase, lecture_id, {
          playbook_content: playbookContent,
          playbook_url: 'generated',
          processing_progress: 95,
        })

        results.playbook = 'ok'
      }
    }

    // ========================
    // STEP 5: Generate multi-profile material (one per invocation)
    // Client sends: { step: 'generate_profile', profile_type, content_type }
    // Returns: { success, next_profile_type, next_content_type } or { success, done: true }
    // ========================
    if (steps.includes('generate_profile')) {
      const VALID_PROFILES = ['junior_compact', 'junior_complete', 'pleno_compact', 'pleno_complete', 'senior_compact', 'senior_complete']
      const VALID_CONTENT_TYPES = ['ebook', 'playbook']

      // Get generation queue to know config and what comes next
      // Pass client-sent profiles to override DB config
      const genQueue = await getGenerationQueue(supabase, lecture_id, selected_profiles)

      if (profile_type && content_type) {
        if (!VALID_PROFILES.includes(profile_type) || !VALID_CONTENT_TYPES.includes(content_type)) {
          return jsonResponse({ error: `Invalid profile_type or content_type: ${profile_type}/${content_type}` }, 400)
        }
        // Generate the requested profile/type
        const result = await generateProfileMaterial(supabase, {
          lectureId: lecture_id,
          profileType: profile_type,
          contentType: content_type,
          contentFormat: genQueue.contentFormat,
          includeGlossary: genQueue.includeGlossary,
          includeTimeline: genQueue.includeTimeline,
          includeQuiz: genQueue.includeQuiz,
          includeConnectionMap: genQueue.includeConnectionMap,
        })

        // Find current position in queue and determine next
        const currentIdx = genQueue.queue.findIndex(
          q => q.profileType === profile_type && q.contentType === content_type
        )
        const nextItem = currentIdx >= 0 ? genQueue.queue[currentIdx + 1] : undefined

        // Calculate progress
        const completedCount = currentIdx + 1
        const totalCount = genQueue.queue.length
        const progress = Math.round((completedCount / totalCount) * 100)
        await updateLecture(supabase, lecture_id, { processing_progress: progress })

        if (nextItem) {
          return jsonResponse({
            success: result.success,
            partial: true,
            step: 'generate_profile',
            profile_result: result,
            next_profile_type: nextItem.profileType,
            next_content_type: nextItem.contentType,
            completed: completedCount,
            total: totalCount,
          })
        }

        // All profiles done
        await updateLecture(supabase, lecture_id, {
          status: 'completed',
          processing_progress: 100,
        })

        return jsonResponse({
          success: result.success,
          done: true,
          step: 'generate_profile',
          profile_result: result,
          completed: totalCount,
          total: totalCount,
        })
      }

      // No specific profile requested — return the queue for the client to iterate
      return jsonResponse({
        success: true,
        step: 'generate_profile',
        queue: genQueue.queue,
        total: genQueue.queue.length,
      })
    }

    // Mark as completed (legacy flow)
    await updateLecture(supabase, lecture_id, {
      status: 'completed',
      processing_progress: 100,
    })

    return jsonResponse({ success: true, results })

  } catch (err) {
    console.error('Process error:', err)
    // Ensure status is updated to failed so it doesn't stay stuck at processing
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      const body = await req.clone().json().catch(() => ({}))
      if (body.lecture_id) {
        await updateLecture(supabase, body.lecture_id, { status: 'failed' })
      }
    } catch { /* best effort */ }
    return jsonResponse({ error: (err as Error).message }, 500)
  }
})

async function updateLecture(supabase: any, lectureId: string, updates: Record<string, any>) {
  await supabase
    .from('lectures')
    .update(updates)
    .eq('id', lectureId)
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
