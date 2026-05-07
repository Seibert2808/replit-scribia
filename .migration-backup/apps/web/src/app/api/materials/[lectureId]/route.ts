import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// ─── Types ───────────────────────────────────────────────

interface Chapter {
  title: string
  content: string
}

interface ParsedEbook {
  title: string
  subtitle: string
  chapters: Chapter[]
}

// ─── Profile labels ──────────────────────────────────────

const PROFILE_LABELS: Record<string, string> = {
  junior_compact: 'Junior Compacto',
  junior_complete: 'Junior Completo',
  pleno_compact: 'Pleno Compacto',
  pleno_complete: 'Pleno Completo',
  senior_compact: 'Senior Compacto',
  senior_complete: 'Senior Completo',
}

// ─── Markdown parser ─────────────────────────────────────

function parseMarkdownToChapters(md: string): ParsedEbook {
  const lines = md.split('\n')
  let title = 'Material'
  let subtitle = ''
  const chapters: Chapter[] = []
  let currentChapter: Chapter | null = null

  for (const line of lines) {
    const h1 = line.match(/^# (.+)$/)
    const h2 = line.match(/^## (.+)$/)

    if (h1) {
      title = h1[1].replace(/\*\*/g, '')
      continue
    }

    if (h2) {
      if (currentChapter) chapters.push(currentChapter)
      currentChapter = { title: h2[1].replace(/\*\*/g, ''), content: '' }
      continue
    }

    if (currentChapter) {
      currentChapter.content += line + '\n'
    } else {
      if (line.trim() && !line.startsWith('---')) {
        if (line.startsWith('### ')) {
          subtitle = line.replace(/^### /, '').replace(/\*\*/g, '')
        } else {
          currentChapter = { title: 'Introdução', content: line + '\n' }
        }
      }
    }
  }
  if (currentChapter) chapters.push(currentChapter)

  return { title, subtitle, chapters }
}

// ─── Markdown → HTML converter ───────────────────────────

function mdContentToHtml(md: string): string {
  let html = md

  // Escape HTML entities but preserve markdown
  html = html.replace(/&/g, '&amp;')

  // Tables: detect and convert markdown tables
  html = convertTables(html)

  // h3
  html = html.replace(/^### (.+)$/gm, (_m, t) => {
    const clean = t.replace(/\*\*/g, '')
    return `<h3>${clean}</h3>`
  })

  // hr
  html = html.replace(/^---+$/gm, '<hr class="section-divider">')

  // Blockquotes (multi-line support)
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n')

  // Bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Emojis as decorative spans
  html = html.replace(/([\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}])/gu, '<span class="emoji">$1</span>')

  // Checklist items (interactive checkboxes for Live Book)
  let checkIdx = 0
  html = html.replace(/^- \[ \] (.+)$/gm, (_m, text) => {
    const id = `check-${checkIdx++}`
    return `<label class="checklist-item" data-check-id="${id}"><input type="checkbox" class="live-check" id="${id}"><span class="check-label">${text}</span></label>`
  })
  html = html.replace(/^- \[x\] (.+)$/gm, (_m, text) => {
    const id = `check-${checkIdx++}`
    return `<label class="checklist-item checked" data-check-id="${id}"><input type="checkbox" class="live-check" id="${id}" checked><span class="check-label">${text}</span></label>`
  })

  // Numbered list items
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ol-item" value="$1">$2</li>')

  // Unordered list items
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>')

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, (match) => {
    if (match.includes('class="ol-item"')) {
      return `<ol>${match}</ol>`
    }
    return `<ul>${match}</ul>`
  })

  // Paragraphs
  const result: string[] = []
  let inP = false
  for (const line of html.split('\n')) {
    const t = line.trim()
    if (!t) {
      if (inP) { result.push('</p>'); inP = false }
      continue
    }
    const isBlock = /^<(h[1-6]|ul|ol|div|blockquote|table|hr|section)/.test(t) || /^<\/(ul|ol)>/.test(t)
    if (isBlock) {
      if (inP) { result.push('</p>'); inP = false }
      result.push(t)
    } else {
      if (!inP) { result.push('<p>'); inP = true }
      result.push(t)
    }
  }
  if (inP) result.push('</p>')

  return result.join('\n')
}

function convertTables(md: string): string {
  const lines = md.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    // Detect table: line with |, followed by separator line with |---|
    if (lines[i].includes('|') && i + 1 < lines.length && /^\|?[\s-:|]+\|/.test(lines[i + 1])) {
      const headerCells = lines[i].split('|').map(c => c.trim()).filter(Boolean)
      i += 2 // skip header + separator

      let tableHtml = '<table><thead><tr>'
      for (const cell of headerCells) {
        tableHtml += `<th>${cell.replace(/\*\*/g, '')}</th>`
      }
      tableHtml += '</tr></thead><tbody>'

      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean)
        tableHtml += '<tr>'
        for (const cell of cells) {
          tableHtml += `<td>${cell}</td>`
        }
        tableHtml += '</tr>'
        i++
      }
      tableHtml += '</tbody></table>'
      result.push(tableHtml)
    } else {
      result.push(lines[i])
      i++
    }
  }

  return result.join('\n')
}

// ─── HTML Builder ────────────────────────────────────────

interface EventBranding {
  primaryColor: string | null
  secondaryColor: string | null
  logoSignedUrl: string | null
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const h2 = hex.replace('#', '')
  const r = parseInt(h2.substring(0, 2), 16) / 255
  const g = parseInt(h2.substring(2, 4), 16) / 255
  const b = parseInt(h2.substring(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let hue = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) hue = ((b - r) / d + 2) / 6
    else hue = ((r - g) / d + 4) / 6
  }
  return { h: Math.round(hue * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function buildBrandingCssVars(branding: EventBranding): string {
  if (!branding.primaryColor && !branding.secondaryColor) return ''
  const vars: string[] = []
  if (branding.primaryColor) {
    const p = hexToHsl(branding.primaryColor)
    vars.push(`--roxo: ${branding.primaryColor}`)
    vars.push(`--roxo-claro: hsl(${p.h}, ${Math.min(p.s + 10, 100)}%, ${Math.min(p.l + 15, 85)}%)`)
    vars.push(`--roxo-escuro: hsl(${p.h}, ${Math.min(p.s + 5, 100)}%, ${Math.max(p.l - 20, 10)}%)`)
    vars.push(`--roxo-bg: hsl(${p.h}, ${Math.min(p.s, 100)}%, 97%)`)
  }
  if (branding.secondaryColor) {
    const s = hexToHsl(branding.secondaryColor)
    vars.push(`--dourado: ${branding.secondaryColor}`)
    vars.push(`--dourado-claro: hsl(${s.h}, ${Math.min(s.s + 10, 100)}%, ${Math.min(s.l + 15, 85)}%)`)
    vars.push(`--dourado-bg: hsl(${s.h}, ${Math.min(s.s, 100)}%, 97%)`)
  }
  return `:root { ${vars.join('; ')}; }`
}

function buildEbookHtml(
  parsed: ParsedEbook,
  lecture: { title: string; speaker: string; event: string; profileLabel: string },
  type: 'ebook' | 'playbook',
  imageUrls: string[],
  wordCount: number | null,
  branding?: EventBranding,
  lectureId?: string,
  profile?: string | null,
): string {
  const ebookTitle = parsed.title || lecture.title
  const typeLabel = type === 'ebook' ? 'Playbook' : 'Live Book'
  const totalPages = parsed.chapters.length + 3
  let pageNum = 1

  const brandingCss = branding ? buildBrandingCssVars(branding) : ''
  const eventLogoHtml = branding?.logoSignedUrl
    ? `<div class="cover-logos"><img src="${branding.logoSignedUrl}" alt="Logo do evento" class="cover-event-logo"><span class="cover-logos-sep">+</span><img src="/logo-scribia.png" alt="ScribIA" class="cover-logo"></div>`
    : `<img src="/logo-scribia.png" alt="ScribIA" class="cover-logo">`

  const coverImgHtml = imageUrls[0]
    ? `<div class="cover-image"><img src="${imageUrls[0]}" alt="Capa"></div>`
    : ''

  // ── Cover page ──
  const year = new Date().getFullYear()
  const coverPage = `
  <section class="page cover-page">
    ${coverImgHtml || `
    <div class="cover-decoration">
      <div class="cover-circle c1"></div>
      <div class="cover-circle c2"></div>
      <div class="cover-circle c3"></div>
    </div>`}
    <div class="cover-content">
      <div class="cover-tagline">O Segundo Cerebro dos Eventos</div>
      ${eventLogoHtml}
      <div class="cover-divisor"></div>
      <div class="cover-tipo">${typeLabel.toUpperCase()}</div>
      <h1 class="cover-titulo">${ebookTitle}</h1>
      ${parsed.subtitle ? `<p class="cover-subtitulo">${parsed.subtitle}</p>` : ''}
      <div class="cover-tipo-perfil">${lecture.profileLabel}</div>
      <div class="cover-divisor"></div>
      <div class="cover-meta">
        <div class="cover-meta-item">
          <span class="cover-meta-label">Palestrante</span>
          <span class="cover-meta-value">${lecture.speaker}</span>
        </div>
        <div class="cover-meta-item">
          <span class="cover-meta-label">Evento</span>
          <span class="cover-meta-value">${lecture.event}</span>
        </div>
        ${wordCount ? `
        <div class="cover-meta-item">
          <span class="cover-meta-label">Extensao</span>
          <span class="cover-meta-value">~${wordCount.toLocaleString('pt-BR')} palavras</span>
        </div>` : ''}
      </div>
      <div class="cover-footer">
        ${year}
      </div>
    </div>
  </section>`
  pageNum++

  // ── TOC page ──
  const tocItems = parsed.chapters.map((ch, i) => `
    <div class="toc-item">
      <span class="toc-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="toc-title">${ch.title}</span>
      <span class="toc-dots"></span>
      <span class="toc-page">${i + 3}</span>
    </div>`).join('')

  const tocPage = `
  <section class="page">
    <div class="page-header">${ebookTitle}</div>
    <h1 class="toc-heading">Sumário</h1>
    <div class="toc-list">
      ${tocItems}
    </div>
    <div class="page-footer">Página <strong>${pageNum}</strong> de <strong>${totalPages}</strong></div>
  </section>`
  pageNum++

  // ── Chapter pages ──
  const chapterPages = parsed.chapters.map((ch, i) => {
    const chapterHtml = mdContentToHtml(ch.content)
    const chapterImgUrl = imageUrls[i + 1]
    const bannerHtml = chapterImgUrl
      ? `<div class="chapter-banner"><img src="${chapterImgUrl}" alt="${ch.title}"></div>`
      : ''
    const page = `
  <section class="page chapter-page">
    <div class="page-header">${ebookTitle}</div>
    ${bannerHtml}
    <div class="chapter-label">CAPÍTULO ${String(i + 1).padStart(2, '0')}</div>
    <h2 class="chapter-title">${ch.title}</h2>
    <div class="chapter-content">
      ${chapterHtml}
    </div>
    <div class="page-footer">Página <strong>${pageNum}</strong> de <strong>${totalPages}</strong></div>
  </section>`
    pageNum++
    return page
  }).join('')

  // ── Final page ──
  const finalPage = `
  <section class="page final-page">
    <div class="page-header">${ebookTitle}</div>
    <div class="final-content">
      ${branding?.logoSignedUrl
        ? `<div class="final-logos"><img src="${branding.logoSignedUrl}" alt="Logo do evento" class="final-event-logo"><span class="final-logos-sep">+</span><img src="/logo-scribia.png" alt="ScribIA" class="final-logo"></div>`
        : `<img src="/logo-scribia.png" alt="ScribIA" class="final-logo">`}
      <div class="final-tagline-top">Materiais Inteligentes para Eventos</div>
      <h2>Obrigado pela leitura!</h2>
      <div class="final-divider"></div>
      <div class="final-info">
        <p><strong>Palestrante:</strong> ${lecture.speaker}</p>
        <p><strong>Evento:</strong> ${lecture.event}</p>
        <p><strong>Perfil:</strong> ${lecture.profileLabel}</p>
      </div>
      <div class="final-divider"></div>
      <p class="final-tagline">O Segundo Cerebro dos Eventos</p>
      <p class="final-url">www.scribia.app.br</p>
    </div>
    <div class="page-footer">Página <strong>${pageNum}</strong> de <strong>${totalPages}</strong></div>
  </section>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${ebookTitle} | ScribIA</title>
<style>
  :root {
    --roxo: #5B3F9C;
    --roxo-claro: #8B5CF6;
    --roxo-escuro: #2D1B69;
    --roxo-bg: #F5F3FF;
    --dourado: #F59E0B;
    --dourado-claro: #FBBF24;
    --dourado-bg: #FFFBEB;
    --verde: #059669;
    --verde-bg: #ECFDF5;
    --cinza-bg: #F9FAFB;
    --cinza-borda: #E5E7EB;
    --cinza-texto: #6B7280;
    --preto: #1F2937;
    --branco: #FFFFFF;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    font-family: 'Segoe UI', 'Calibri', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--preto);
    background: #E5E7EB;
    line-height: 1.7;
    font-size: 11pt;
  }

  /* ── Page layout ── */
  .page {
    background: var(--branco);
    width: 210mm;
    min-height: 297mm;
    margin: 24px auto;
    padding: 30mm 28mm 35mm;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    position: relative;
    page-break-after: always;
    overflow: hidden;
  }

  .page-header {
    position: absolute;
    top: 14mm;
    left: 28mm;
    right: 28mm;
    text-align: right;
    font-size: 9pt;
    font-weight: 700;
    color: var(--roxo);
    letter-spacing: 0.5px;
    padding-bottom: 5pt;
    border-bottom: 2pt solid var(--dourado);
  }

  .page-footer {
    position: absolute;
    bottom: 14mm;
    left: 28mm;
    right: 28mm;
    text-align: center;
    font-size: 9pt;
    color: var(--cinza-texto);
    padding-top: 5pt;
    border-top: 1pt solid var(--cinza-borda);
  }
  .page-footer strong { color: var(--roxo); }

  /* ── Cover page ── */
  .cover-page {
    padding: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(160deg, var(--roxo-escuro) 0%, var(--roxo) 50%, var(--roxo-claro) 100%);
    color: var(--branco);
  }
  .cover-page .page-header, .cover-page .page-footer { display: none; }

  .cover-decoration {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .cover-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.08;
    background: var(--branco);
  }
  .cover-circle.c1 { width: 500px; height: 500px; top: -150px; right: -100px; }
  .cover-circle.c2 { width: 300px; height: 300px; bottom: -80px; left: -60px; }
  .cover-circle.c3 { width: 180px; height: 180px; top: 40%; left: 60%; }

  .cover-image {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 40%;
    overflow: hidden;
  }
  .cover-image img { width: 100%; height: 100%; object-fit: cover; opacity: 0.3; }

  .cover-content {
    position: relative;
    z-index: 1;
    padding: 60pt 40pt;
    max-width: 85%;
  }
  .cover-tagline {
    font-size: 10pt;
    color: rgba(255,255,255,0.5);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 6pt;
  }
  .cover-logo {
    height: 48pt;
    margin-bottom: 16pt;
    filter: brightness(0) invert(1);
  }
  .cover-tipo {
    font-size: 12pt;
    color: rgba(255,255,255,0.8);
    letter-spacing: 3px;
    font-weight: 700;
    margin-bottom: 14pt;
  }
  .cover-tipo-perfil {
    font-size: 11pt;
    color: var(--dourado-claro);
    letter-spacing: 1px;
    margin-top: 10pt;
    margin-bottom: 10pt;
    font-weight: 600;
  }
  .cover-titulo {
    font-size: 30pt;
    font-weight: 800;
    line-height: 1.15;
    color: var(--branco);
    margin-bottom: 10pt;
  }
  .cover-subtitulo {
    font-size: 14pt;
    color: rgba(255,255,255,0.8);
    font-style: italic;
    margin-bottom: 20pt;
  }
  .cover-divisor {
    width: 80px;
    height: 3px;
    background: var(--dourado);
    margin: 24pt auto;
    border-radius: 2px;
  }
  .cover-meta {
    display: flex;
    justify-content: center;
    gap: 40pt;
    margin-top: 16pt;
    flex-wrap: wrap;
  }
  .cover-meta-item { text-align: center; }
  .cover-meta-label {
    display: block;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--dourado-claro);
    margin-bottom: 4pt;
  }
  .cover-meta-value {
    display: block;
    font-size: 13pt;
    font-weight: 600;
    color: var(--branco);
  }
  .cover-footer {
    margin-top: 50pt;
    font-size: 9pt;
    color: rgba(255,255,255,0.5);
    line-height: 1.5;
  }

  /* ── TOC page ── */
  .toc-heading {
    font-size: 28pt;
    color: var(--roxo);
    font-weight: 800;
    margin-bottom: 8pt;
    padding-bottom: 10pt;
    border-bottom: 3pt solid var(--dourado);
    margin-top: 20pt;
  }
  .toc-list { margin-top: 16pt; }
  .toc-item {
    display: flex;
    align-items: baseline;
    padding: 10pt 0;
    border-bottom: 1px solid var(--cinza-borda);
    font-size: 11pt;
  }
  .toc-num {
    color: var(--dourado);
    font-weight: 800;
    font-size: 13pt;
    width: 36pt;
    flex-shrink: 0;
  }
  .toc-title {
    flex: 1;
    color: var(--preto);
    font-weight: 500;
  }
  .toc-dots {
    flex: 0 0 40pt;
    border-bottom: 2px dotted var(--cinza-borda);
    margin: 0 8pt;
    height: 1em;
  }
  .toc-page {
    color: var(--roxo);
    font-weight: 700;
    width: 24pt;
    text-align: right;
    flex-shrink: 0;
  }

  /* ── Chapter pages ── */
  .chapter-label {
    font-size: 11pt;
    color: var(--dourado);
    font-weight: 800;
    letter-spacing: 2.5px;
    margin-bottom: 6pt;
    margin-top: 14pt;
  }
  .chapter-title {
    font-size: 24pt;
    color: var(--roxo);
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 18pt;
    padding-bottom: 12pt;
    border-bottom: 2pt solid var(--dourado);
  }
  .chapter-banner {
    margin: -10mm -8mm 20pt -8mm;
    width: calc(100% + 16mm);
    max-height: 160px;
    overflow: hidden;
    border-radius: 6px;
  }
  .chapter-banner img {
    width: 100%;
    display: block;
    object-fit: cover;
  }

  .chapter-content { font-size: 11pt; line-height: 1.75; }

  /* ── Typography ── */
  h3 {
    font-size: 15pt;
    color: var(--roxo);
    font-weight: 700;
    margin-top: 20pt;
    margin-bottom: 8pt;
    padding-left: 12pt;
    border-left: 4pt solid var(--dourado);
  }

  p {
    font-size: 11pt;
    margin-bottom: 10pt;
    color: var(--preto);
    text-align: justify;
  }

  strong { color: var(--roxo-escuro); }
  em { color: var(--cinza-texto); }

  /* ── Blockquotes ── */
  blockquote {
    background: var(--roxo-bg);
    border-left: 5pt solid var(--roxo);
    padding: 16pt 20pt;
    margin: 16pt 0;
    border-radius: 0 6px 6px 0;
  }
  blockquote p {
    font-size: 12pt;
    font-style: italic;
    color: var(--roxo);
    line-height: 1.6;
    margin-bottom: 0;
    text-align: left;
  }

  /* ── Lists ── */
  ul, ol {
    margin: 10pt 0 14pt 20pt;
  }
  ul li, ol li {
    font-size: 11pt;
    margin-bottom: 5pt;
    padding-left: 4pt;
    line-height: 1.6;
  }
  ul li::marker { color: var(--roxo); font-size: 12pt; }
  ol li::marker { color: var(--dourado); font-weight: 700; }

  /* ── Checklists (interactive) ── */
  .checklist-item {
    display: flex;
    align-items: flex-start;
    gap: 10pt;
    padding: 8pt 14pt;
    margin: 4pt 0;
    background: var(--cinza-bg);
    border: 1px solid var(--cinza-borda);
    border-radius: 6px;
    font-size: 11pt;
    line-height: 1.5;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    user-select: none;
  }
  .checklist-item:hover {
    border-color: var(--roxo-claro);
  }
  .checklist-item.checked {
    background: var(--verde-bg);
    border-color: var(--verde);
  }
  .checklist-item .live-check {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    margin-top: 2px;
    accent-color: var(--verde);
    cursor: pointer;
  }
  .checklist-item .check-label {
    flex: 1;
  }
  .checklist-item.checked .check-label {
    text-decoration: line-through;
    color: var(--cinza-texto);
  }
  @media print {
    .checklist-item { cursor: default; }
    .checklist-item .live-check { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16pt 0;
    font-size: 10pt;
  }
  thead {
    background: var(--roxo);
    color: var(--branco);
  }
  th {
    padding: 10pt 12pt;
    text-align: left;
    font-weight: 700;
    font-size: 10pt;
    letter-spacing: 0.3px;
  }
  td {
    padding: 9pt 12pt;
    border-bottom: 1px solid var(--cinza-borda);
    font-size: 10pt;
    line-height: 1.5;
  }
  tbody tr:nth-child(even) { background: var(--cinza-bg); }
  tbody tr:hover { background: var(--roxo-bg); }

  /* ── Section divider ── */
  .section-divider {
    border: none;
    height: 2pt;
    background: linear-gradient(to right, var(--dourado), transparent);
    margin: 20pt 0;
  }

  /* ── Emoji ── */
  .emoji { font-size: 14pt; vertical-align: middle; }

  /* ── Final page ── */
  .final-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .final-content {
    text-align: center;
    padding: 40pt 30pt;
  }
  .final-logo {
    height: 42pt;
    margin-bottom: 16pt;
  }
  .final-content h2 {
    font-size: 22pt;
    color: var(--roxo);
    margin-bottom: 12pt;
  }
  .final-content p {
    text-align: center;
    font-size: 11pt;
    color: var(--cinza-texto);
  }
  .final-divider {
    width: 60px;
    height: 3px;
    background: var(--dourado);
    margin: 24pt auto;
    border-radius: 2px;
  }
  .final-info {
    background: var(--cinza-bg);
    border-radius: 8px;
    padding: 16pt 24pt;
    display: inline-block;
    text-align: left;
  }
  .final-info p { margin-bottom: 4pt; color: var(--preto); }
  .final-info strong { color: var(--roxo); }
  .final-tagline-top {
    font-size: 11pt;
    color: var(--cinza-texto);
    letter-spacing: 1px;
    margin-bottom: 16pt;
  }
  .final-tagline {
    margin-top: 8pt;
    font-size: 13pt !important;
    font-weight: 600;
    color: var(--roxo) !important;
  }
  .final-url {
    font-size: 11pt !important;
    color: var(--roxo-claro) !important;
    letter-spacing: 1px;
    font-weight: 600;
  }

  /* ── Progress bar (Live Book) ── */
  .progress-bar {
    position: relative;
    width: 160px;
    height: 36px;
    background: rgba(255,255,255,0.9);
    border-radius: 18px;
    border: 1px solid var(--cinza-borda);
    overflow: hidden;
  }
  .progress-fill {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    background: linear-gradient(135deg, var(--verde), #34d399);
    border-radius: 18px;
    transition: width 0.3s ease;
    width: 0%;
  }
  .progress-text {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 11px;
    font-weight: 600;
    color: var(--preto);
  }

  /* ── Print ── */
  .btn-toolbar {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 1000;
  }
  .btn-action {
    padding: 10px 18px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: transform 0.1s;
  }
  .btn-action:hover { transform: translateY(-1px); }
  .btn-print { background: var(--roxo); color: white; }
  .btn-print:hover { background: var(--roxo-escuro); }

  @media print {
    body { background: white; }
    .page {
      margin: 0;
      box-shadow: none;
      page-break-after: always;
      page-break-inside: avoid;
    }
    .btn-toolbar { display: none; }
    @page { size: A4; margin: 0; }
  }

  /* ── Responsive for screen viewing ── */
  /* ── Event + ScribIA dual logos ── */
  .cover-logos {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12pt;
    margin-bottom: 16pt;
  }
  .cover-event-logo {
    height: 48pt;
    max-width: 160pt;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }
  .cover-logos-sep {
    font-size: 16pt;
    color: rgba(255,255,255,0.4);
    font-weight: 300;
  }
  .final-logos {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12pt;
    margin-bottom: 16pt;
  }
  .final-event-logo {
    height: 42pt;
    max-width: 140pt;
    object-fit: contain;
  }
  .final-logos-sep {
    font-size: 14pt;
    color: var(--cinza-texto);
    font-weight: 300;
  }

  @media screen and (max-width: 800px) {
    .page {
      width: 100%;
      min-height: auto;
      margin: 12px;
      padding: 20mm 16mm 28mm;
    }
    .cover-titulo { font-size: 22pt; }
    .cover-meta { flex-direction: column; gap: 12pt; }
  }
</style>
<style>${brandingCss}</style>
</head>
<body>
<div class="btn-toolbar">
  ${type === 'playbook' ? '<div class="progress-bar"><div class="progress-fill" id="progressFill"></div><span class="progress-text" id="progressText">0%</span></div>' : ''}
  <button class="btn-action btn-print" onclick="window.print()">Exportar como PDF</button>
</div>
${coverPage}
${tocPage}
${chapterPages}
${finalPage}
${type === 'playbook' ? `<script>
(function() {
  var storageKey = 'livebook-${lectureId}-${profile || 'default'}';
  var checks = document.querySelectorAll('.live-check');
  if (!checks.length) return;

  // Load saved state
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch(e) {}

  checks.forEach(function(cb) {
    var id = cb.id;
    if (saved[id] !== undefined) {
      cb.checked = saved[id];
      cb.closest('.checklist-item').classList.toggle('checked', saved[id]);
    }
    cb.addEventListener('change', function() {
      var item = cb.closest('.checklist-item');
      item.classList.toggle('checked', cb.checked);
      saved[id] = cb.checked;
      localStorage.setItem(storageKey, JSON.stringify(saved));
      updateProgress();
    });
  });

  function updateProgress() {
    var total = checks.length;
    var done = document.querySelectorAll('.live-check:checked').length;
    var pct = Math.round((done / total) * 100);
    var fill = document.getElementById('progressFill');
    var text = document.getElementById('progressText');
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = done + '/' + total + ' (' + pct + '%)';
  }
  updateProgress();
})();
</script>` : ''}
</body>
</html>`
}

// ─── API Route ───────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lectureId: string }> }
) {
  const { lectureId } = await params
  const type = (request.nextUrl.searchParams.get('type') ?? 'ebook') as 'ebook' | 'playbook'

  if (!['ebook', 'playbook'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const profile = request.nextUrl.searchParams.get('profile')

  let markdown: string | null = null
  let imagePaths: string[] = []
  let lectureTitle = ''
  let speakerName = 'N/A'
  let eventName = 'N/A'
  let profileLabel = 'Padrão'
  let wordCount: number | null = null
  let eventId: string | null = null

  if (profile) {
    // Multi-profile: read from lecture_materials table
    const { data: material } = await adminClient
      .from('lecture_materials')
      .select('markdown_content, images, word_count')
      .eq('lecture_id', lectureId)
      .eq('profile_type', profile)
      .eq('content_type', type)
      .single()

    const mat = material as { markdown_content: string | null; images: string[] | null; word_count: number | null } | null
    markdown = mat?.markdown_content ?? null
    imagePaths = (mat?.images as string[]) ?? []
    wordCount = mat?.word_count ?? null
    profileLabel = PROFILE_LABELS[profile] || profile

    // Get lecture metadata
    const { data: lecData } = await adminClient
      .from('lectures')
      .select('title, event_id, speakers(name), events(name)')
      .eq('id', lectureId)
      .single()
    const lec = lecData as { title: string; event_id: string; speakers: { name: string } | null; events: { name: string } | null } | null
    lectureTitle = lec?.title ?? ''
    speakerName = lec?.speakers?.name ?? 'N/A'
    eventName = lec?.events?.name ?? 'N/A'
    eventId = lec?.event_id ?? null
  } else {
    // Legacy: read from lectures table columns
    const contentColumn = type === 'ebook' ? 'ebook_content' : 'playbook_content'
    const { data } = await adminClient
      .from('lectures')
      .select(`id, title, event_id, ${contentColumn}, ebook_images, speakers(name), events(name)`)
      .eq('id', lectureId)
      .single()

    const lecture = data as Record<string, unknown> | null
    markdown = (lecture?.[contentColumn] as string) ?? null
    imagePaths = (lecture?.ebook_images as string[]) ?? []
    lectureTitle = (lecture?.title as string) ?? ''
    eventId = (lecture?.event_id as string) ?? null
    const sp = lecture?.speakers as { name: string } | null
    const ev = lecture?.events as { name: string } | null
    speakerName = sp?.name ?? 'N/A'
    eventName = ev?.name ?? 'N/A'
  }

  if (!markdown) {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 })
  }

  // Fetch event branding (colors + logo)
  let eventBranding: EventBranding | undefined
  if (eventId) {
    const { data: evBranding } = await adminClient
      .from('events')
      .select('primary_color, secondary_color, logo_url')
      .eq('id', eventId)
      .single()

    if (evBranding) {
      const ev = evBranding as { primary_color: string | null; secondary_color: string | null; logo_url: string | null }
      let logoSignedUrl: string | null = null
      if (ev.logo_url) {
        const { data: signed } = await adminClient.storage
          .from('materials')
          .createSignedUrl(ev.logo_url, 3600)
        logoSignedUrl = signed?.signedUrl ?? null
      }
      eventBranding = {
        primaryColor: ev.primary_color,
        secondaryColor: ev.secondary_color,
        logoSignedUrl,
      }
    }
  }

  // Generate signed URLs for images
  const imageUrls: string[] = []
  for (const path of imagePaths) {
    if (!path) { imageUrls.push(''); continue }
    const { data: signed } = await adminClient.storage
      .from('materials')
      .createSignedUrl(path, 3600)
    imageUrls.push(signed?.signedUrl ?? '')
  }

  const parsed = parseMarkdownToChapters(markdown)
  const fullHtml = buildEbookHtml(parsed, {
    title: lectureTitle,
    speaker: speakerName,
    event: eventName,
    profileLabel,
  }, type, imageUrls, wordCount, eventBranding, lectureId, profile)

  return new NextResponse(fullHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
