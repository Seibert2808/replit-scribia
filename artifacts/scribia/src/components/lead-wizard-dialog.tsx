import { useState, type ReactNode } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, Send, CheckCircle2 } from "lucide-react"

const WHATSAPP_NUMBER = "5521997478748"

interface FormData {
  eventName: string
  eventDate: string
  city: string
  state: string
  participants: string
  organizerName: string
  email: string
  whatsapp: string
  meetingDateTime: string
  otherInfo: string
}

const INITIAL_DATA: FormData = {
  eventName: "",
  eventDate: "",
  city: "",
  state: "",
  participants: "",
  organizerName: "",
  email: "",
  whatsapp: "",
  meetingDateTime: "",
  otherInfo: "",
}

interface Step {
  question: string
  hint?: string
  render: (data: FormData, set: (patch: Partial<FormData>) => void) => ReactNode
  validate: (data: FormData) => boolean
}

const STEPS: Step[] = [
  {
    question: "Qual o nome do seu evento?",
    hint: "Pode ser o nome oficial ou um nome de trabalho.",
    validate: (d) => d.eventName.trim().length >= 2,
    render: (d, set) => (
      <Input autoFocus value={d.eventName} onChange={(e) => set({ eventName: e.target.value })} placeholder="Ex: SIAPARTO 2026" />
    ),
  },
  {
    question: "Qual a data provável do evento?",
    hint: "Não precisa ser definitiva — uma estimativa já ajuda.",
    validate: (d) => d.eventDate.trim().length >= 4,
    render: (d, set) => (
      <Input autoFocus type="date" value={d.eventDate} onChange={(e) => set({ eventDate: e.target.value })} />
    ),
  },
  {
    question: "Em qual cidade e estado?",
    validate: (d) => d.city.trim().length >= 2 && d.state.trim().length >= 2,
    render: (d, set) => (
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
        <Input autoFocus value={d.city} onChange={(e) => set({ city: e.target.value })} placeholder="Cidade" />
        <Input value={d.state} onChange={(e) => set({ state: e.target.value })} placeholder="UF" maxLength={2} />
      </div>
    ),
  },
  {
    question: "Qual a média esperada de participantes?",
    hint: "Estimativa do público total do evento.",
    validate: (d) => Number(d.participants) > 0,
    render: (d, set) => (
      <Input autoFocus type="number" min="1" value={d.participants} onChange={(e) => set({ participants: e.target.value })} placeholder="Ex: 500" />
    ),
  },
  {
    question: "Qual o seu nome?",
    validate: (d) => d.organizerName.trim().length >= 2,
    render: (d, set) => (
      <Input autoFocus value={d.organizerName} onChange={(e) => set({ organizerName: e.target.value })} placeholder="Seu nome completo" />
    ),
  },
  {
    question: "Seu melhor e-mail?",
    validate: (d) => /\S+@\S+\.\S+/.test(d.email),
    render: (d, set) => (
      <Input autoFocus type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} placeholder="voce@email.com" />
    ),
  },
  {
    question: "Seu WhatsApp para contato?",
    hint: "Com DDD. Pode incluir +55 se preferir.",
    validate: (d) => d.whatsapp.replace(/\D/g, "").length >= 10,
    render: (d, set) => (
      <Input autoFocus type="tel" value={d.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="(21) 99999-9999" />
    ),
  },
  {
    question: "Qual o melhor dia e horário para uma reunião?",
    hint: "Vamos confirmar por WhatsApp depois.",
    validate: (d) => d.meetingDateTime.trim().length >= 4,
    render: (d, set) => (
      <Input autoFocus type="datetime-local" value={d.meetingDateTime} onChange={(e) => set({ meetingDateTime: e.target.value })} />
    ),
  },
  {
    question: "Quer compartilhar mais alguma coisa? (opcional)",
    hint: "Patrocinadores, dúvidas, contexto do evento, qualquer informação útil.",
    validate: () => true,
    render: (d, set) => (
      <Textarea autoFocus rows={5} value={d.otherInfo} onChange={(e) => set({ otherInfo: e.target.value })} placeholder="Outras informações para a equipe Scribia..." />
    ),
  },
]

function formatBRDate(iso: string): string {
  if (!iso) return ""
  if (iso.includes("T")) {
    const [date, time] = iso.split("T")
    const [y, m, d] = date.split("-")
    return `${d}/${m}/${y} às ${time}`
  }
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function buildWhatsappMessage(d: FormData): string {
  return [
    "Olá Scribia! Tenho interesse em levar o ScribIA para meu evento.",
    "",
    "*Sobre o evento:*",
    `• Nome: ${d.eventName}`,
    `• Data: ${formatBRDate(d.eventDate)}`,
    `• Local: ${d.city}/${d.state}`,
    `• Participantes esperados: ${d.participants}`,
    "",
    "*Sobre mim:*",
    `• Nome: ${d.organizerName}`,
    `• E-mail: ${d.email}`,
    `• WhatsApp: ${d.whatsapp}`,
    "",
    `*Melhor dia/hora p/ conversar:* ${formatBRDate(d.meetingDateTime)}`,
    d.otherInfo ? `\n*Outras informações:*\n${d.otherInfo}` : "",
  ].filter(Boolean).join("\n")
}

interface LeadWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadWizardDialog({ open, onOpenChange }: LeadWizardDialogProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(INITIAL_DATA)
  const [sent, setSent] = useState(false)

  const set = (patch: Partial<FormData>) => setData((d) => ({ ...d, ...patch }))
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const canAdvance = current.validate(data)

  function handleNext() {
    if (!canAdvance) return
    if (isLast) {
      const text = encodeURIComponent(buildWhatsappMessage(data))
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener,noreferrer")
      setSent(true)
      return
    }
    setStep((s) => s + 1)
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1))
  }

  function handleClose(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setTimeout(() => {
        setStep(0)
        setData(INITIAL_DATA)
        setSent(false)
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {sent ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-scribia-green/15 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-scribia-green" />
            </div>
            <h2 className="font-heading text-xl font-bold text-text mb-2">Mensagem aberta no WhatsApp!</h2>
            <p className="text-[13.5px] text-text2 leading-relaxed">
              Se a janela do WhatsApp não abriu automaticamente, verifique se seu navegador bloqueou pop-ups.
              Você pode fechar este diálogo — assim que enviarmos uma mensagem, a equipe Scribia entrará em contato.
            </p>
            <Button onClick={() => handleClose(false)} className="mt-6" size="lg">Fechar</Button>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="h-1 bg-bg3">
              <div
                className="h-full bg-purple transition-all duration-300"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            <div className="p-6 sm:p-8">
              <div className="text-[11px] uppercase tracking-widest text-text3 font-semibold mb-3">
                Pergunta {step + 1} de {STEPS.length}
              </div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-text leading-snug mb-1">
                {current.question}
              </h2>
              {current.hint && (
                <p className="text-[12.5px] text-text3 mb-5 leading-relaxed">{current.hint}</p>
              )}

              <div className="mb-6">
                {current.render(data, set)}
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!canAdvance}
                  size="lg"
                  className="gap-1.5"
                >
                  {isLast ? (
                    <>
                      Enviar via WhatsApp <Send className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Próximo <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
