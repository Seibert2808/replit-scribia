import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { LeadWizardDialog } from "@/components/lead-wizard-dialog"
import { PricingSimulator, type SimulationResult } from "./pricing-simulator"

// Popup de "Simular preço e pedir proposta", pra usar direto na Home (e em
// qualquer outro lugar) sem precisar navegar pra /quero-no-meu-evento.
// Mesmo fluxo de lá: simulador de preço -> wizard de lead -> WhatsApp.
// Pedido dela em 18/11/2026: o botão "QUERO O SCRIBIA NO MEU EVENTO!" tem
// que abrir isso em vez de levar pra outra página.
interface EstimateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EstimateDialog({ open, onOpenChange }: EstimateDialogProps) {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardSeed, setWizardSeed] = useState<
    Partial<{
      eventDate: string
      participants: string
      city: string
      state: string
      rooms: string
      days: string
      captureTeam: "" | "event" | "scribia"
      teamCaptureCost: string
    }>
  >({})

  function handleRequestProposal(result: SimulationResult) {
    setWizardSeed({
      participants: String(result.participants),
      city: result.city,
      state: result.uf,
      eventDate: result.eventDate,
      rooms: String(result.rooms),
      days: String(result.days),
      captureTeam: result.captureTeam,
      teamCaptureCost: String(result.teamCaptureCost),
    })
    // Fecha o popup do simulador e abre o wizard por cima: os dois nunca
    // ficam abertos ao mesmo tempo.
    onOpenChange(false)
    setWizardOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Simule o preço do ScribIA no seu evento</DialogTitle>
            <DialogDescription>
              Em poucos cliques você vê a faixa de preço e já pede a proposta pelo WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <PricingSimulator onRequestProposal={handleRequestProposal} />
        </DialogContent>
      </Dialog>

      <LeadWizardDialog open={wizardOpen} onOpenChange={setWizardOpen} initialData={wizardSeed} />
    </>
  )
}
