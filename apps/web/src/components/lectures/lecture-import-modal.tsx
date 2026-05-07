'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Modal } from '@/components/ui/modal'
import { Upload, Download, AlertCircle, Check, X, FileSpreadsheet, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Speaker {
  id: string
  name: string
  email: string | null
}

interface ParsedLecture {
  title: string
  description: string
  scheduledAt: string
  durationMinutes: number
  speakerName: string
  speakerEmail: string
  speakerCompany: string
  speakerRole: string
  errors: string[]
}

interface LectureImportModalProps {
  eventId: string
  existingSpeakers: Speaker[]
  onClose: () => void
  onImported: () => void
}

function downloadTemplate() {
  const headers = [
    'Título da Palestra',
    'Descrição',
    'Data/Hora (DD/MM/AAAA HH:MM)',
    'Duração (min)',
    'Nome do Palestrante',
    'Email do Palestrante',
    'Empresa',
    'Cargo',
  ]
  const example = [
    'Inteligência Artificial na Educação',
    'Uma visão geral sobre IA aplicada ao ensino',
    '15/06/2026 09:00',
    '60',
    'João Silva',
    'joao@empresa.com',
    'TechCorp',
    'CTO',
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, example])

  // Column widths
  ws['!cols'] = [
    { wch: 35 }, { wch: 45 }, { wch: 25 }, { wch: 14 },
    { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 20 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Programação')
  XLSX.writeFile(wb, 'modelo-programacao-evento.xlsx')
}

function parseDateBR(value: string): string | null {
  // Try DD/MM/YYYY HH:MM format
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/)
  if (match) {
    const [, day, month, year, hour, minute] = match
    const date = new Date(+year, +month - 1, +day, +hour, +minute)
    if (!isNaN(date.getTime())) return date.toISOString()
  }
  // Try ISO or other parseable formats
  const parsed = new Date(value)
  if (!isNaN(parsed.getTime())) return parsed.toISOString()
  return null
}

function parseFile(file: File): Promise<ParsedLecture[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })

        // Skip header row
        const dataRows = rows.slice(1).filter((row) => row.length > 0 && row[0])

        const lectures: ParsedLecture[] = dataRows.map((row, idx) => {
          const errors: string[] = []
          const title = String(row[0] ?? '').trim()
          const description = String(row[1] ?? '').trim()
          const dateStr = String(row[2] ?? '').trim()
          const durationStr = String(row[3] ?? '').trim()
          const speakerName = String(row[4] ?? '').trim()
          const speakerEmail = String(row[5] ?? '').trim()
          const speakerCompany = String(row[6] ?? '').trim()
          const speakerRole = String(row[7] ?? '').trim()

          if (!title) errors.push('Título é obrigatório')

          let scheduledAt = ''
          if (dateStr) {
            const parsed = parseDateBR(dateStr)
            if (parsed) {
              scheduledAt = parsed
            } else {
              errors.push(`Data inválida na linha ${idx + 2}: "${dateStr}"`)
            }
          }

          let durationMinutes = 0
          if (durationStr) {
            durationMinutes = parseInt(durationStr, 10)
            if (isNaN(durationMinutes) || durationMinutes <= 0) {
              errors.push('Duração inválida')
              durationMinutes = 0
            }
          }

          if (speakerEmail && !speakerEmail.includes('@')) {
            errors.push('Email do palestrante inválido')
          }

          return {
            title,
            description,
            scheduledAt,
            durationMinutes,
            speakerName,
            speakerEmail,
            speakerCompany,
            speakerRole,
            errors,
          }
        })

        resolve(lectures)
      } catch {
        reject(new Error('Erro ao ler o arquivo. Verifique se é um Excel (.xlsx) ou CSV válido.'))
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'))
    reader.readAsArrayBuffer(file)
  })
}

export function LectureImportModal({ eventId, existingSpeakers, onClose, onImported }: LectureImportModalProps) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParsedLecture[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setFileName(file.name)
    setParseError(null)
    setParsed(null)
    setImportResult(null)

    try {
      const lectures = await parseFile(file)
      if (lectures.length === 0) {
        setParseError('Nenhuma palestra encontrada no arquivo. Verifique se os dados estão na primeira aba.')
        return
      }
      setParsed(lectures)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Erro ao processar arquivo')
    }
  }

  async function handleImport() {
    if (!parsed) return
    setImporting(true)
    let success = 0
    let failed = 0

    for (const lecture of parsed) {
      if (lecture.errors.length > 0) {
        failed++
        continue
      }

      try {
        // Find or create speaker
        let speakerId: string | null = null

        if (lecture.speakerEmail || lecture.speakerName) {
          // Try to match by email first
          if (lecture.speakerEmail) {
            const existing = existingSpeakers.find(
              (s) => s.email?.toLowerCase() === lecture.speakerEmail.toLowerCase()
            )
            if (existing) {
              speakerId = existing.id
            }
          }

          // If not found by email, try by name
          if (!speakerId && lecture.speakerName) {
            const existing = existingSpeakers.find(
              (s) => s.name.toLowerCase() === lecture.speakerName.toLowerCase()
            )
            if (existing) {
              speakerId = existing.id
            }
          }

          // Create new speaker if not found
          if (!speakerId && lecture.speakerName) {
            const { data: newSpeaker, error: speakerError } = await supabase
              .from('speakers')
              .insert({
                name: lecture.speakerName,
                email: lecture.speakerEmail || null,
                company: lecture.speakerCompany || null,
                role: lecture.speakerRole || null,
              } as never)
              .select('id')
              .single() as { data: { id: string } | null; error: unknown }

            if (!speakerError && newSpeaker) {
              speakerId = newSpeaker.id
              // Add to existingSpeakers to avoid duplicates in the same batch
              existingSpeakers.push({
                id: newSpeaker.id,
                name: lecture.speakerName,
                email: lecture.speakerEmail || null,
              })
            }
          }
        }

        // Create lecture
        const { error: lectureError } = await supabase.from('lectures').insert({
          event_id: eventId,
          title: lecture.title,
          description: lecture.description || null,
          speaker_id: speakerId,
          scheduled_at: lecture.scheduledAt || null,
          duration_seconds: lecture.durationMinutes ? lecture.durationMinutes * 60 : null,
          status: 'scheduled',
        } as never)

        if (lectureError) {
          failed++
        } else {
          success++
        }
      } catch {
        failed++
      }
    }

    setImportResult({ success, failed })
    setImporting(false)

    if (success > 0) {
      setTimeout(() => onImported(), 2000)
    }
  }

  const hasErrors = parsed?.some((l) => l.errors.length > 0)
  const validCount = parsed?.filter((l) => l.errors.length === 0).length ?? 0

  return (
    <Modal title="Importar Programação" onClose={onClose}>
      <div className="space-y-4">
        {/* Instructions */}
        {!parsed && !importResult && (
          <>
            <p className="text-[13px] text-text3">
              Importe todas as palestras do evento de uma vez usando uma planilha Excel ou CSV.
            </p>

            <div className="bg-bg3 border border-border-subtle rounded-xl p-4">
              <p className="text-[12px] text-text2 font-medium mb-2">Como funciona:</p>
              <ol className="text-[12px] text-text3 space-y-1 list-decimal list-inside">
                <li>Baixe o modelo de planilha</li>
                <li>Preencha com os dados das palestras</li>
                <li>Importe o arquivo preenchido</li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1.5 bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-[12.5px] text-text2 hover:border-border-purple hover:text-purple-light transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar modelo Excel
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 bg-purple text-white rounded-lg px-4 py-2.5 text-[12.5px] font-medium hover:bg-purple-light glow-purple transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Importar arquivo
              </button>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileSelected}
            />
          </>
        )}

        {/* Parse error */}
        {parseError && (
          <div className="bg-scribia-red/8 border border-scribia-red/20 rounded-xl px-4 py-3 text-[13px] text-scribia-red flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {parseError}
          </div>
        )}

        {/* Preview */}
        {parsed && !importResult && (
          <>
            <div className="flex items-center gap-2 text-[13px] text-text2">
              <FileSpreadsheet className="w-4 h-4 text-purple-light" />
              <span className="font-medium">{fileName}</span>
              <span className="text-text3">— {parsed.length} palestras encontradas</span>
            </div>

            {hasErrors && (
              <div className="bg-scribia-yellow/8 border border-scribia-yellow/20 rounded-xl px-4 py-3 text-[12px] text-scribia-yellow flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Algumas linhas contém erros e não serão importadas. Corrija o arquivo ou importe apenas as válidas.</span>
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto border border-border-subtle rounded-xl">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-bg3">
                    <th className="text-left px-3 py-2 text-text3 font-normal">#</th>
                    <th className="text-left px-3 py-2 text-text3 font-normal">Título</th>
                    <th className="text-left px-3 py-2 text-text3 font-normal">Palestrante</th>
                    <th className="text-left px-3 py-2 text-text3 font-normal">Data/Hora</th>
                    <th className="text-left px-3 py-2 text-text3 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((lecture, idx) => (
                    <tr
                      key={idx}
                      className={`border-t border-border-subtle ${lecture.errors.length > 0 ? 'bg-scribia-red/4' : ''}`}
                    >
                      <td className="px-3 py-2 text-text3">{idx + 1}</td>
                      <td className="px-3 py-2 text-text">{lecture.title || '—'}</td>
                      <td className="px-3 py-2 text-text3">{lecture.speakerName || '—'}</td>
                      <td className="px-3 py-2 text-text3">
                        {lecture.scheduledAt
                          ? new Date(lecture.scheduledAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {lecture.errors.length > 0 ? (
                          <span className="text-scribia-red flex items-center gap-1" title={lecture.errors.join(', ')}>
                            <X className="w-3 h-3" />
                            Erro
                          </span>
                        ) : (
                          <span className="text-scribia-green flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border-subtle">
              <div className="flex gap-3">
                <button
                  onClick={() => { setParsed(null); setFileName('') }}
                  className="px-4 py-2 rounded-lg bg-transparent border border-border-subtle text-[13px] text-text2 hover:border-border-purple hover:text-purple-light transition-all cursor-pointer"
                >
                  Trocar arquivo
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-transparent border border-border-subtle text-[13px] text-text2 hover:border-border-purple hover:text-purple-light transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
              <button
                onClick={handleImport}
                disabled={importing || validCount === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple text-white text-[13px] font-medium hover:bg-purple-light glow-purple disabled:opacity-50 transition-all cursor-pointer"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Importar {validCount} palestra{validCount !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Result */}
        {importResult && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-xl bg-scribia-green/10 border border-scribia-green/20 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-scribia-green" />
            </div>
            <p className="text-[14px] font-medium text-text mb-1">Importação concluída!</p>
            <p className="text-[13px] text-text3">
              {importResult.success} palestra{importResult.success !== 1 ? 's' : ''} importada{importResult.success !== 1 ? 's' : ''} com sucesso
              {importResult.failed > 0 && `, ${importResult.failed} com erro`}.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
