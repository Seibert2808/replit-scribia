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
  UPSELL,
  calculatePaymentSchedule,
  formatPriceBRL,
  getPricingTier,
  getTeamAudioCaptureCost,
  getUpsellBreakeven,
  getUpsellMinimum,
  isNegotiable,
} from "@/lib/pricing.config"

type CaptureTeam = "event" | "scribia"
type PricingModel = "organizer" | "upsell"

function parsePositiveInt(value: string): number | null {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) return null
  return n
}

/** Como parsePositiveInt, mas aceita zero — é o estado inicial, antes do organizador preencher nada. */
function parseNonNegativeInt(value: string): number | null {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0) return null
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
  const [pricingModel, setPricingModel] = useState<PricingModel>("organizer")
  // Pedido dela em 18/11/2026: o popup abre com 0 participantes, sem valor nenhum
  // pré-calculado — assustava o organizador ver um preço antes de preencher nada.
  const [participants, setParticipants] = useState("0")
  const [rooms, setRooms] = useState("1")
  // Dias de evento: não afeta o pacote nem o upsell, só o custo de captação pela equipe do ScribIA
  // (getTeamAudioCaptureCost é por sala/dia).
  const [days, setDays] = useState("1")
  const [city, setCity] = useState("")
  const [uf, setUf] = useState("RJ")
  const [eventDate, setEventDate] = useState("")
  const [captureTeam, setCaptureTeam] = useState<CaptureTeam>("event")

  const participantsN = parseNonNegativeInt(participants)
  const roomsN = parsePositiveInt(rooms)
  const daysN = parsePositiveInt(days)

  const result = useMemo(() => {
    if (participantsN === null || !roomsN || !daysN) return null

    const teamCaptureCost = captureTeam === "scribia" ? getTeamAudioCaptureCost(roomsN, daysN) : 0

    // Com 0 participantes ainda não há faixa nem total: só mostra R$ 0,00, sem
    // "faixa" nem observações, porque nenhuma delas faz sentido ainda.
    if (participantsN === 0) {
      return { empty: true as const, teamCaptureCost }
    }

    if (pricingModel === "organizer") {
      const tier = getPricingTier(participantsN)
      const negotiable = isNegotiable(participantsN)
      const eventDateObj = eventDate ? new Date(`${eventDate}T00:00:00`) : null
      const schedule = !negotiable && eventDateObj ? calculatePaymentSchedule(eventDateObj, tier.price as number) : null
      const total = negotiable ? null : (tier.price as number) + teamCaptureCost

      return {
        empty: false as const,
        pricingModel: "organizer" as const,
        tier,
        negotiable,
        schedule,
        total,
        teamCaptureCost,
      }
    }

    const upsellMinimum = getUpsellMinimum(roomsN, participantsN)
    const upsellBreakeven = getUpsellBreakeven(participantsN)
    const total = upsellMinimum + teamCaptureCost

    return {
      empty: false as const,
      pricingModel: "upsell" as const,
      upsellMinimum,
      upsellBreakeven,
      total,
      teamCaptureCost,
    }
  }, [pricingModel, participantsN, roomsN, daysN, eventDate, captureTeam])

  const inputsValid = participantsN !== null && roomsN !== null && daysN !== null

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardContent className="p-6 md:p-8">
          {/* Tipo de contratação: a primeira escolha, porque define o resto do formulário. */}
          <div className="mb-6">
            <Label>Como você quer contratar o ScribIA?</Label>
            <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant={pricingModel === "organizer" ? "default" : "outline"}
                onClick={() => setPricingModel("organizer")}
                className="h-auto min-h-10 whitespace-normal text-center leading-snug py-2"
              >
                ScribIA contratado pela organização
              </Button>
              <Button
                type="button"
                variant={pricingModel === "upsell" ? "default" : "outline"}
                onClick={() => setPricingModel("upsell")}
                className="h-auto min-h-10 whitespace-normal text-center leading-snug py-2"
              >
                ScribIA oferecido como upsell para os participantes
              </Button>
            </div>
          </div>

          {/* Labels com altura fixa (min-h + items-end): "Estimativa de público" quebra em
              duas linhas e "Salas" não, então sem isso os campos ficavam desalinhados. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="sim-participants" className="min-h-[2.5rem] flex items-end">
                {pricingModel === "organizer" ? "Participantes" : "Estimativa de público"}
              </Label>
              <Input
                id="sim-participants"
                type="number"
                min="0"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="sim-rooms" className="min-h-[2.5rem] flex items-end">Salas</Label>
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
              <Label htmlFor="sim-days" className="min-h-[2.5rem] flex items-end">Dias de evento</Label>
              <Input
                id="sim-days"
                type="number"
                min="1"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          {pricingModel === "organizer" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="sim-city" className="min-h-[2.5rem] flex items-end">Cidade do evento</Label>
                <Input
                  id="sim-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="sim-uf" className="min-h-[2.5rem] flex items-end">UF do evento</Label>
                <Input
                  id="sim-uf"
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  maxLength={2}
                  className="mt-1.5"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {pricingModel === "organizer" && (
              <div>
                <Label htmlFor="sim-date" className="min-h-[2.5rem] flex items-end">Data prevista do evento (opcional)</Label>
                <Input
                  id="sim-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            )}

            <div>
              <Label className="min-h-[2.5rem] flex items-end">Quem vai fazer a captação do áudio?</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
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
              Preencha participantes, salas e dias com números inteiros (participantes pode ser 0).
            </p>
          )}

          {inputsValid && result && (
            <Card className="border-primary/30">
              <CardContent className="p-5">
                {/* O valor vem primeiro, já somado (pacote/upsell + captação quando for o caso). As
                    observações de cada tipo vêm depois, nunca antes do número. */}
                {result.empty ? (
                  <>
                    <h3 className="font-semibold mb-3">Valor estimado</h3>
                    <p className="text-2xl font-bold mb-2">{formatPriceBRL(0)}</p>
                    <p className="text-sm text-muted-foreground">
                      Informe a estimativa de participantes para calcular o valor.
                    </p>
                  </>
                ) : result.pricingModel === "organizer" ? (
                  <>
                    <h3 className="font-semibold mb-3">Pacote por evento</h3>
                    {result.negotiable ? (
                      <p className="text-2xl font-bold mb-2">A negociar</p>
                    ) : (
                      <p className="text-2xl font-bold mb-2">{formatPriceBRL(result.total as number)}</p>
                    )}

                    <div className="text-sm text-muted-foreground space-y-1 mt-3">
                      {!result.negotiable && (
                        <p>Faixa: {result.tier.label} participantes ({formatPriceBRL(result.tier.price as number)}).</p>
                      )}
                      {captureTeam === "event" ? (
                        <p>Captação de áudio pela sua equipe, sem custo adicional.</p>
                      ) : (
                        <p>
                          Inclui captação de áudio pela equipe do ScribIA: {formatPriceBRL(result.teamCaptureCost)}
                          {" "}(sem transporte; varia conforme a cidade do evento).
                        </p>
                      )}
                      {!result.negotiable && result.schedule && (
                        <>
                          <p>30% na assinatura: {formatPriceBRL(result.schedule.signingAmount)}</p>
                          <p>
                            70% em {formatDateBR(result.schedule.beforeEventDueDate)}:{" "}
                            {formatPriceBRL(result.schedule.beforeEventAmount)}
                          </p>
                          <p className="font-medium text-foreground">
                            Contratar até {formatDateBR(result.schedule.contractDeadline)}
                          </p>
                        </>
                      )}
                      {!result.negotiable && !eventDate && (
                        <p>Informe a data prevista do evento para calcular os prazos de pagamento.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold mb-3">Mínimo do upsell no ingresso</h3>
                    <p className="text-2xl font-bold mb-2">{formatPriceBRL(result.total)}</p>

                    <div className="text-sm text-muted-foreground space-y-1 mt-3">
                      <p>
                        Esse valor é a garantia mínima; conforme os ingressos com o adicional forem vendidos,
                        o valor arrecadado é abatido dele.
                      </p>
                      <p>R$ {UPSELL.perTicket.toFixed(2).replace(".", ",")} por ingresso com o adicional.</p>
                      {result.upsellBreakeven !== null && (
                        <p>Equilibra com o pacote em {result.upsellBreakeven} ingressos vendidos com o adicional.</p>
                      )}
                      <p>Você define o preço cobrado do participante.</p>
                      <p>Cobrado após o evento, com a contagem final.</p>
                      {captureTeam === "event" ? (
                        <p>Captação de áudio é da sua equipe.</p>
                      ) : (
                        <p>
                          Inclui captação de áudio pela equipe do ScribIA: {formatPriceBRL(result.teamCaptureCost)}
                          {" "}(sem transporte; varia conforme a cidade do evento).
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground max-w-md">
              Valores podem ser atualizados mediante comunicação prévia de {PRICE_UPDATE_NOTICE_DAYS} dias, sem
              efeito sobre negociações em curso. Prazo de resposta da proposta: até {PROPOSAL_RESPONSE_HOURS}h.
              Contratação até {CONTRACT_DEADLINE_DAYS} dias antes do evento.
            </p>
            <Button
              size="lg"
              disabled={!inputsValid || !participantsN}
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
                  teamCaptureCost: result && !result.empty ? result.teamCaptureCost : 0,
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
