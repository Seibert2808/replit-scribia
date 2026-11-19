import { describe, expect, it } from "vitest";
import {
  calculatePaymentSchedule,
  getPilotConversionDeadline,
  getPilotConversionDue,
  getPricingTier,
  getTeamAudioCaptureCost,
  getUpsellBreakeven,
  getUpsellMinimum,
  isNegotiable,
  isPilotAudioCaptureIncluded,
  PILOT,
  PROPOSAL_RESPONSE_HOURS,
  RENEWAL,
  UPSELL,
} from "./pricing.config";

describe("faixas do pacote por evento", () => {
  it("até 100 participantes custa R$ 2.500,00", () => {
    expect(getPricingTier(100).price).toBe(2500);
    expect(getPricingTier(1).price).toBe(2500);
  });

  it("101 a 250 participantes custa R$ 6.500,00", () => {
    expect(getPricingTier(101).price).toBe(6500);
    expect(getPricingTier(250).price).toBe(6500);
  });

  it("251 a 500 participantes custa R$ 11.000,00", () => {
    expect(getPricingTier(251).price).toBe(11000);
    expect(getPricingTier(500).price).toBe(11000);
  });

  it("501 a 1.000 participantes custa R$ 20.000,00", () => {
    expect(getPricingTier(501).price).toBe(20000);
    expect(getPricingTier(1000).price).toBe(20000);
  });

  it("acima de 1.000 participantes é a negociar", () => {
    expect(getPricingTier(1001).price).toBeNull();
    expect(isNegotiable(1001)).toBe(true);
    expect(isNegotiable(1000)).toBe(false);
  });
});

describe("upsell no ingresso", () => {
  it("5 salas e 100 participantes: mínimo limitado ao pacote da faixa (R$ 2.500,00, não R$ 5.000,00)", () => {
    expect(getUpsellMinimum(5, 100)).toBe(2500);
  });

  it("3 salas e 400 participantes: mínimo de R$ 3.000,00 e equilíbrio com o pacote em 440 ingressos", () => {
    expect(getUpsellMinimum(3, 400)).toBe(3000);
    expect(getUpsellBreakeven(400)).toBe(440);
  });

  it("pontos de equilíbrio batem com a tabela do plano (R$2.500=100, R$6.500=260, R$11.000=440, R$20.000=800)", () => {
    expect(getUpsellBreakeven(100)).toBe(100);
    expect(getUpsellBreakeven(250)).toBe(260);
    expect(getUpsellBreakeven(500)).toBe(440);
    expect(getUpsellBreakeven(1000)).toBe(800);
  });

  it("sem teto no valor variável acima do ponto de equilíbrio (não limitado por este helper)", () => {
    // getUpsellBreakeven só informa o ponto de equilíbrio; o valor total acima dele pode superar o pacote
    // livremente — não há cálculo de teto aqui porque o plano define que não existe teto.
    expect(getUpsellBreakeven(100)).toBeLessThan(10000);
  });

  it("faixa acima de 1.000 participantes (a negociar) não limita o mínimo por sala", () => {
    expect(getUpsellMinimum(5, 1500)).toBe(5000);
    expect(getUpsellBreakeven(1500)).toBeNull();
  });
});

describe("condições de pagamento (30% na assinatura, 70% 15 dias antes do evento)", () => {
  it("calcula os valores e as datas a partir da data do evento", () => {
    const eventDate = new Date("2027-03-31T00:00:00Z");
    const schedule = calculatePaymentSchedule(eventDate, 11000);

    expect(schedule.signingAmount).toBe(3300);
    expect(schedule.beforeEventAmount).toBe(7700);
    expect(schedule.beforeEventDueDate.toISOString().slice(0, 10)).toBe("2027-03-16");
    expect(schedule.contractDeadline.toISOString().slice(0, 10)).toBe("2027-03-16");
  });
});

describe("piloto", () => {
  it("custa R$ 1.000,00 para 1 sala, até 10 palestras de 40 minutos", () => {
    expect(PILOT.price).toBe(1000);
    expect(PILOT.rooms).toBe(1);
    expect(PILOT.maxTalks).toBe(10);
    expect(PILOT.maxTalkMinutes).toBe(40);
  });

  it("é abatido integralmente do pacote ao converter para o evento completo", () => {
    expect(getPilotConversionDue(100)).toBe(2500 - 1000);
    expect(getPilotConversionDue(400)).toBe(11000 - 1000);
  });

  it("conversão acima de 1.000 participantes não tem valor de pacote fixo para abater", () => {
    expect(() => getPilotConversionDue(1500)).toThrow();
  });

  it("captação de áudio inclusa apenas em RJ e SP", () => {
    expect(isPilotAudioCaptureIncluded("RJ")).toBe(true);
    expect(isPilotAudioCaptureIncluded("SP")).toBe(true);
    expect(isPilotAudioCaptureIncluded("MG")).toBe(false);
    expect(isPilotAudioCaptureIncluded("rj")).toBe(true);
  });

  it("prazo de 30 dias após o evento piloto para converter em pacote completo", () => {
    const pilotEventDate = new Date("2027-05-01T00:00:00Z");
    const deadline = getPilotConversionDeadline(pilotEventDate);
    expect(deadline.toISOString().slice(0, 10)).toBe("2027-05-31");
  });
});

describe("captação de áudio pela equipe do ScribIA (serviço à parte)", () => {
  it("1 sala, 1 dia custa R$ 800,00", () => {
    expect(getTeamAudioCaptureCost(1, 1)).toBe(800);
  });

  it("3 salas, 1 dia custa R$ 1.800,00 (800 + 2 x 500)", () => {
    expect(getTeamAudioCaptureCost(3, 1)).toBe(1800);
  });

  it("2 salas, 3 dias custa R$ 3.900,00 ((800 + 500) x 3)", () => {
    expect(getTeamAudioCaptureCost(2, 3)).toBe(3900);
  });

  it("captação pela equipe do próprio evento não tem custo adicional (0 salas contratadas com o ScribIA)", () => {
    expect(getTeamAudioCaptureCost(0, 1)).toBe(0);
  });
});

describe("upsell: cobrança e preço ao participante", () => {
  it("é cobrado do organizador após o evento, com a contagem final de ingressos", () => {
    expect(UPSELL.billedAfterEvent).toBe(true);
  });

  it("o organizador define livremente o preço cobrado do participante", () => {
    expect(UPSELL.participantPriceSetByOrganizer).toBe(true);
  });
});

describe("renovação", () => {
  it("preço travado vale só para a próxima edição", () => {
    expect(RENEWAL.priceLocked).toBe(true);
    expect(RENEWAL.scope).toBe("next_edition");
  });
});

describe("prazo de resposta da proposta", () => {
  it("é de até 24 horas", () => {
    expect(PROPOSAL_RESPONSE_HOURS).toBe(24);
  });
});
