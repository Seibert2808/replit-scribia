import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, CheckCircle2 } from "lucide-react"

const WHATSAPP_NUMBER = "5521997478748"

function buildWhatsappMessage(name: string, email: string): string {
  return [
    "Olá, Scribia! 👋",
    "",
    "Gostaria de ver uma demonstração de como a plataforma funciona no meu evento.",
    "",
    "*Meus dados:*",
    `• Nome: ${name.trim()}`,
    `• E-mail: ${email.trim()}`,
    "",
    "Podem me explicar os próximos passos?",
  ].join("\n")
}

interface DemoRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DemoRequestDialog({ open, onOpenChange }: DemoRequestDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  const nameOk = name.trim().length >= 2
  const emailOk = /\S+@\S+\.\S+/.test(email)
  const canSend = nameOk && emailOk

  function handleSend() {
    if (!canSend) {
      setShowErrors(true)
      return
    }
    const text = encodeURIComponent(buildWhatsappMessage(name, email))
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener,noreferrer")
    setSent(true)
  }

  function handleClose(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setTimeout(() => {
        setName("")
        setEmail("")
        setSent(false)
        setShowErrors(false)
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {sent ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-scribia-green/15 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-scribia-green" />
            </div>
            <h2 className="font-heading text-xl font-bold text-text mb-2">Mensagem aberta no WhatsApp!</h2>
            <p className="text-[13.5px] text-text2 leading-relaxed">
              Se a janela do WhatsApp não abriu automaticamente, verifique se seu navegador bloqueou pop-ups.
              Assim que recebermos sua mensagem, criamos seu acesso ao evento de demonstração.
            </p>
            <Button onClick={() => handleClose(false)} className="mt-6" size="lg">Fechar</Button>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-text leading-snug mb-1">
              Ver uma demonstração
            </h2>
            <p className="text-[12.5px] text-text3 mb-5 leading-relaxed">
              Deixe seu nome e e-mail. Criamos seu acesso ao evento de demonstração e seguimos a conversa pelo WhatsApp.
            </p>

            <div className="space-y-3 mb-6">
              <div className="space-y-1">
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
                {showErrors && !nameOk && (
                  <p className="text-[12px] text-destructive">Digite seu nome.</p>
                )}
              </div>
              <div className="space-y-1">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend() }}
                />
                {showErrors && !emailOk && (
                  <p className="text-[12px] text-destructive">Digite um e-mail válido.</p>
                )}
              </div>
            </div>

            <Button onClick={handleSend} size="lg" className="w-full gap-1.5">
              Continuar no WhatsApp <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
