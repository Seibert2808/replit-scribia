import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronRight } from "lucide-react"
import {
  CONTRACT_DEADLINE_DAYS,
  PRICE_UPDATE_NOTICE_DAYS,
  PROPOSAL_RESPONSE_HOURS,
  calculatePaymentSchedule,
  formatPriceBRL,
  getPricingTier,
  getTeamAudioCaptureCost,
  getUpsellBreakeven,
  getUpsellMinimum,
  isNegotiable,
} from "@/lib/pricing.config"

type CaptureTeam = "event" | "scribia"

function parsePositiveInt(value: string): number | null {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) return null
  return n
}

function formatDateBR(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export interface SimulationResult {
  participants: number
  rooms: number
  days: number
  city: string
  uf: string
  eventDate: string
  captureTeam: CaptureTeam
  teamCaptureCost: number
}

interface PricingSimulatorProps {
  onRequestProposal: (result: SimulationResult) => void
}

export function PricingSimulator({ onRequestProposal }: PricingSimulatorProps) {
  const [participants, setParticipants] = useState("200")
  const [rooms, setRooms] = useState("1")
  // Dias de evento: não afeta o pacote nem o upsell, só o custo de captação pela equipe do ScribIA
  // (getTeamAudioCaptureCost é por sala/dia).
  const [days, setDays] = useState("1")
  const [city, setCity] = useState("")
  const [uf, setUf] = useState("RJ")
  const [eventDate, setEventDate] = useState("")
  const [captureTeam, setCaptureTeam] = useState<CaptureTeam>("event")

  const participantsN = parsePositiveInt(participants)
  const roomsN = parsePositiveInt(rooms)
  const daysN = parsePositiveInt(days)

  const result = useMemo(() => {
    if (!participantsN || !roomsN || !daysN) return null

    const tier = getPricingTier(participantsN)
    const negotiable = isNegotiable(participantsN)
    const eventDateObj = eventDate ? new Date(`${eventDate}T00:00:00`) : null
    const schedule = !negotiable && eventDateObj ? calculatePaymentSchedule(eventDateObj, tier.price as number) : null
    const teamCaptureCost = captureTeam === "scribia" ? getTeamAudioCaptureCost(roomsN, daysN) : 0

    return {
      tier,
      negotiable,
      schedule,
      upsellMinimum: getUpsellMinimum(roomsN, participantsN),
      upsellBreakeven: getUpsellBreakeven(participantsN),
      teamCaptureCost,
    }
  }, [participantsN, roomsN, daysN, eventDate, captureTeam])

  const inputsValid = participantsN !== null && roomsN !== null && daysN !== null

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div>
              <Label htmlFor="sim-participants">Participantes</Label>
              <Input
                id="sim-participants"
                type="number"
                min="1"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="sim-rooms">Salas</Label>
              <Input
                id="sim-rooms"
                type="number"
                min="1"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="sim-days">Dias de evento</Label>
              <Input
                id="sim-days"
                type="number"
                min="1"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="sim-city">Cidade do evento</Label>
              <Input
                id="sim-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="sim-uf">UF do evento</Label>
              <Input
                id="sim-uf"
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                maxLength={2}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="max-w-xs">
              <Label htmlFor="sim-date">Data prevista do evento (opcional)</Label>
              <Input
                id="sim-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Quem vai fazer a captação do áudio?</Label>
              <div className="mt-1.5 flex gap-2">
                <Button
                  type="button"
                  variant={captureTeam === "event" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCaptureTeam("event")}
                >
                  A equipe do evento
                </Button>
                <Button
                  type="button"
                  variant={captureTeam === "scribia" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCaptureTeam("scribia")}
                >
                  A equipe do ScribIA
                </Button>
              </div>
            </div>
          </div>

          {!inputsValid && (
            <p className="text-sm text-destructive mb-6">
              Preencha participantes, salas e dias com números inteiros maiores que zero.
            </p>
          )}

          {inputsValid && result && (
            <div className="grid md:grid-cols-2 gap-5">
              {/* Pacote */}
              <Card className="border-primary/30">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-3">Pacote por evento</h3>
                  {result.negotiable ? (
                    <p className="text-2xl font-bold mb-2">A negociar</p>
                  ) : (
                    <p className="text-2xl font-bold mb-2">{formatPriceBRL(result.tier.price as number)}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-3">
                    Faixa: {result.tier.label} participantes.
                  </p>
                  {captureTeam === "event" ? (
                    <p className="text-sm text-muted-foreground mb-3">
                      Captação de áudio pela sua equipe, sem custo adicional.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-3">
                      Captação de áudio pela equipe do ScribIA: + {formatPriceBRL(result.teamCaptureCost)}
                      {" "}(sem transporte; varia conforme a cidade do evento)
                    </p>
                  )}
                  {!result.negotiable && result.schedule && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>30% na assinatura: {formatPriceBRL(result.schedule.signingAmount)}</p>
                      <p>
                        70% em {formatDateBR(result.schedule.beforeEventDueDate)}:{" "}
                        {formatPriceBRL(result.schedule.beforeEventAmount)}
                      </p>
                      <p className="font-medium text-foreground">
                        Contratar até {formatDateBR(result.schedule.contractDeadline)}
                      </p>
                    </div>
                  )}
                  {!result.negotiable && !eventDate && (
                    <p className="text-sm text-muted-foreground">
                      Informe a data prevista do evento para calcular os prazos de pagamento.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Upsell */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-3">Upsell no ingresso</h3>
                  <p className="text-2xl font-bold mb-2">R$ 25,00 <span className="text-sm font-normal text-muted-foreground">por ingresso</span></p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Mínimo por evento: {formatPriceBRL(result.upsellMinimum)}</p>
                    {result.upsellBreakeven !== null && (
                      <p>Equilibra com o pacote em {result.upsellBreakeven} ingressos vendidos com o adicional.</p>
                    )}
                    <p>Você define o preço cobrado do participante.</p>
                    <p>Cobrado após o evento, com a contagem final.</p>
                    {captureTeam === "event" ? (
                      <p>Captação de áudio é da sua equipe.</p>
                    ) : (
                      <p>
                        Captação de áudio pela equipe do ScribIA: + {formatPriceBRL(result.teamCaptureCost)}
                        {" "}(sem transporte; varia conforme a cidade do evento)
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {inputsValid && (
            <p className="text-sm text-muted-foreground mt-6">
              Quer testar antes de decidir? Fale com a gente pelo WhatsApp (21) 99747-8748 sobre o piloto.
            </p>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground max-w-md">
              Valores podem ser atualizados mediante comunicação prévia de {PRICE_UPDATE_NOTICE_DAYS} dias, sem
              efeito sobre negociações em curso. Prazo de resposta da proposta: até {PROPOSAL_RESPONSE_HOURS}h.
              Contratação até {CONTRACT_DEADLINE_DAYS} dias antes do evento.
            </p>
            <Button
              size="lg"
              disabled={!inputsValid}
              onClick={() =>
                participantsN &&
                roomsN &&
                daysN &&
                onRequestProposal({
                  participants: participantsN,
                  rooms: roomsN,
                  days: daysN,
                  city,
                  uf: uf || "RJ",
                  eventDate,
                  captureTeam,
                  teamCaptureCost: result?.teamCaptureCost ?? 0,
                })
              }
              className="group shrink-0"
            >
              <span className="flex items-center gap-2">
                Simular e pedir proposta
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
