import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  try {
    const { lectureId } = await req.json()
    if (!lectureId) {
      return NextResponse.json({ error: 'lectureId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: lectureRaw, error: lectureError } = await supabase
      .from('lectures')
      .select('id, event_id, title, summary, topics, speakers:speaker_id(name), events:event_id(name, primary_color, secondary_color)')
      .eq('id', lectureId)
      .single()

    if (lectureError || !lectureRaw) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lecture = lectureRaw as any

    const title = lecture.title ?? 'Palestra'
    const speaker = lecture.speakers?.name ?? ''
    const eventName = lecture.events?.name ?? ''
    const summary = lecture.summary ?? ''
    const topics: string[] = lecture.topics ?? []
    const primaryColor = lecture.events?.primary_color ?? '#6B4EFF'
    const secondaryColor = lecture.events?.secondary_color ?? '#00D4A0'

    // Extract 3 phrases using Gemini
    let phrases: { quote: string; title_phrase: string; insight: string }

    try {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

      const aiPrompt = `Analise o conteúdo desta palestra e extraia 3 frases diferentes para cards de redes sociais.

Título: ${title}
Palestrante: ${speaker}
Resumo: ${summary}
Tópicos: ${topics.join(', ')}

Retorne EXATAMENTE este JSON (sem markdown, sem code blocks):
{
  "quote": "Uma frase impactante e inspiradora dita pelo palestrante (max 120 caracteres)",
  "title_phrase": "Uma frase curta que resume o tema principal da palestra (max 80 caracteres)",
  "insight": "Um insight ou dado surpreendente da palestra (max 100 caracteres)"
}

IMPORTANTE:
- Cada frase deve ser diferente e capturar aspectos distintos da palestra
- Use linguagem direta e impactante para redes sociais
- NÃO use aspas dentro das frases
- Responda APENAS com o JSON, sem texto adicional`

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.8,
          responseMimeType: 'application/json',
        },
      })

      phrases = JSON.parse(result.response.text())
    } catch {
      // Fallback if AI fails
      const snippet = summary.slice(0, 120) || title
      phrases = {
        quote: snippet,
        title_phrase: title.length > 80 ? title.slice(0, 77) + '...' : title,
        insight: topics.length > 0 ? topics.slice(0, 3).join(' · ') : title,
      }
    }

    // Generate 3 SVG cards
    const W = 1080, H = 1080

    const cards = [
      { name: 'card_quote', svg: generateQuoteCard(phrases.quote, speaker, eventName, primaryColor, secondaryColor, W, H) },
      { name: 'card_title', svg: generateTitleCard(phrases.title_phrase, speaker, eventName, title, primaryColor, secondaryColor, W, H) },
      { name: 'card_insight', svg: generateInsightCard(phrases.insight, speaker, eventName, topics, primaryColor, secondaryColor, W, H) },
    ]

    const cardPaths: string[] = []

    for (const card of cards) {
      const path = `${lecture.event_id}/${lecture.id}/${card.name}.svg`
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(path, new TextEncoder().encode(card.svg), {
          contentType: 'image/svg+xml',
          upsert: true,
        })
      if (uploadError) {
        console.error(`Upload error for ${card.name}:`, uploadError)
      }
      cardPaths.push(path)
    }

    await supabase.from('lectures').update({
      card_image_url: cardPaths[0],
      card_images: cardPaths,
    }).eq('id', lecture.id)

    return NextResponse.json({ success: true, cards: cardPaths })
  } catch (e) {
    console.error('Card generation error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// ─── SVG Helpers ────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  return `${parseInt(h.substring(0, 2), 16)},${parseInt(h.substring(2, 4), 16)},${parseInt(h.substring(4, 6), 16)}`
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim())
      current = word
    } else {
      current = current ? current + ' ' + word : word
    }
  }
  if (current) lines.push(current.trim())
  return lines
}

function generateQuoteCard(
  quote: string, speaker: string, event: string,
  primary: string, secondary: string, w: number, h: number,
): string {
  const rgb = hexToRgb(primary)
  const lines = wrapText(quote, 28)
  const quoteY = h / 2 - (lines.length * 52) / 2
  const quoteLines = lines.map((line, i) =>
    `<text x="${w/2}" y="${quoteY + i * 52}" text-anchor="middle" fill="white" font-size="42" font-family="Georgia, serif" font-style="italic" letter-spacing="0.5">${esc(line)}</text>`
  ).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0A0A0F"/>
      <stop offset="50%" stop-color="#111118"/>
      <stop offset="100%" stop-color="#0A0A0F"/>
    </linearGradient>
    <linearGradient id="accent1" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg1)"/>
  <circle cx="${w-120}" cy="120" r="200" fill="rgba(${rgb},0.05)"/>
  <circle cx="100" cy="${h-100}" r="160" fill="rgba(${rgb},0.04)"/>
  <rect x="80" y="80" width="120" height="4" fill="url(#accent1)" rx="2"/>
  <text x="80" y="140" fill="rgba(255,255,255,0.4)" font-size="18" font-family="sans-serif" font-weight="bold" letter-spacing="3">SCRIBIA</text>
  <text x="${w/2}" y="${quoteY - 50}" text-anchor="middle" fill="${primary}" font-size="100" font-family="Georgia, serif" opacity="0.6">"</text>
  ${quoteLines}
  <rect x="80" y="${h - 200}" width="${w - 160}" height="1" fill="rgba(255,255,255,0.1)"/>
  <text x="${w/2}" y="${h - 150}" text-anchor="middle" fill="white" font-size="24" font-family="sans-serif" font-weight="bold">${esc(speaker)}</text>
  <text x="${w/2}" y="${h - 115}" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="18" font-family="sans-serif">${esc(event)}</text>
  <rect x="0" y="${h - 6}" width="${w}" height="6" fill="url(#accent1)"/>
</svg>`
}

function generateTitleCard(
  phrase: string, speaker: string, event: string, fullTitle: string,
  primary: string, secondary: string, w: number, h: number,
): string {
  const rgb = hexToRgb(primary)
  const rgbSec = hexToRgb(secondary)
  const titleLines = wrapText(fullTitle.length > 60 ? phrase : fullTitle, 22)
  const titleY = h / 2 - (titleLines.length * 64) / 2
  const titleText = titleLines.map((line, i) =>
    `<text x="${w/2}" y="${titleY + i * 64}" text-anchor="middle" fill="white" font-size="54" font-family="sans-serif" font-weight="900" letter-spacing="-1">${esc(line)}</text>`
  ).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#0F0A1A"/>
      <stop offset="100%" stop-color="#1A0F2E"/>
    </linearGradient>
    <linearGradient id="accent2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg2)"/>
  <rect x="-100" y="-100" width="500" height="500" rx="250" fill="rgba(${rgb},0.08)" transform="rotate(45, 150, 150)"/>
  <rect x="${w-300}" y="${h-300}" width="500" height="500" rx="250" fill="rgba(${rgbSec},0.06)" transform="rotate(30, ${w-50}, ${h-50})"/>
  <rect x="0" y="0" width="${w}" height="6" fill="url(#accent2)"/>
  <rect x="${w/2 - 80}" y="100" width="160" height="36" rx="18" fill="rgba(${rgb},0.2)" stroke="${primary}" stroke-width="1"/>
  <text x="${w/2}" y="124" text-anchor="middle" fill="${primary}" font-size="14" font-family="sans-serif" font-weight="bold" letter-spacing="2">PALESTRA</text>
  ${titleText}
  ${fullTitle.length <= 60 && phrase !== fullTitle
    ? `<text x="${w/2}" y="${titleY + titleLines.length * 64 + 20}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="22" font-family="sans-serif">${esc(phrase.slice(0, 60))}</text>`
    : ''}
  <rect x="${w/2 - 40}" y="${h - 210}" width="80" height="2" fill="url(#accent2)"/>
  <text x="${w/2}" y="${h - 160}" text-anchor="middle" fill="white" font-size="26" font-family="sans-serif" font-weight="bold">${esc(speaker)}</text>
  <text x="${w/2}" y="${h - 125}" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="18" font-family="sans-serif">${esc(event)}</text>
  <text x="${w/2}" y="${h - 60}" text-anchor="middle" fill="rgba(255,255,255,0.25)" font-size="16" font-family="sans-serif" font-weight="bold" letter-spacing="3">SCRIBIA</text>
</svg>`
}

function generateInsightCard(
  insight: string, speaker: string, event: string, topics: string[],
  primary: string, secondary: string, w: number, h: number,
): string {
  const rgb = hexToRgb(primary)
  const insightLines = wrapText(insight, 30)
  const insightY = h / 2 - 40
  const insightText = insightLines.map((line, i) =>
    `<text x="${w/2}" y="${insightY + i * 48}" text-anchor="middle" fill="white" font-size="38" font-family="sans-serif" font-weight="700">${esc(line)}</text>`
  ).join('\n')

  const topicPills = topics.slice(0, 4)
  const pillWidth = 200
  const pillGap = 16
  const totalPillsWidth = topicPills.length * pillWidth + (topicPills.length - 1) * pillGap
  const pillStartX = (w - totalPillsWidth) / 2
  const pillsY = 180
  const pillsSvg = topicPills.map((topic, i) => {
    const x = pillStartX + i * (pillWidth + pillGap)
    const label = topic.length > 20 ? topic.slice(0, 18) + '...' : topic
    return `<rect x="${x}" y="${pillsY}" width="${pillWidth}" height="36" rx="18" fill="rgba(${rgb},0.15)" stroke="rgba(${rgb},0.3)" stroke-width="1"/>
    <text x="${x + pillWidth/2}" y="${pillsY + 23}" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="14" font-family="sans-serif">${esc(label)}</text>`
  }).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0D0D14"/>
      <stop offset="50%" stop-color="#0F0F1A"/>
      <stop offset="100%" stop-color="#0A0A12"/>
    </linearGradient>
    <linearGradient id="accent3" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg3)"/>
  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
    <rect width="60" height="60" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="0.5"/>
  </pattern>
  <rect width="${w}" height="${h}" fill="url(#grid)"/>
  <rect x="0" y="0" width="${w}" height="4" fill="url(#accent3)"/>
  <text x="${w/2}" y="130" text-anchor="middle" fill="${primary}" font-size="48" opacity="0.8">💡</text>
  ${pillsSvg}
  ${insightText}
  <rect x="${w/2 - 50}" y="${h - 240}" width="100" height="3" fill="url(#accent3)" rx="1.5"/>
  <text x="${w/2}" y="${h - 190}" text-anchor="middle" fill="white" font-size="22" font-family="sans-serif" font-weight="bold">${esc(speaker)}</text>
  <text x="${w/2}" y="${h - 155}" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="16" font-family="sans-serif">${esc(event)}</text>
  <text x="${w/2}" y="${h - 60}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="14" font-family="sans-serif" font-weight="bold" letter-spacing="3">SCRIBIA</text>
  <rect x="0" y="${h - 4}" width="${w}" height="4" fill="url(#accent3)"/>
</svg>`
}
