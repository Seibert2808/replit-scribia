/**
 * Fonte única de valores comerciais do ScribIA (pacote por evento, upsell, piloto, pagamento e renovação).
 * Todas as páginas e o simulador de preço devem ler deste arquivo — nenhum valor monetário direto em componentes.
 * Decisões fechadas em 09/11/2026 (responsável: Sabrina Lins Seibert).
 */

export const PRICING_EFFECTIVE_DATE = "2026-11-09";

/** Reajustes de valor exigem aviso prévio de 30 dias e não afetam negociações já em curso. */
export const PRICE_UPDATE_NOTICE_DAYS = 30;

export interface PricingTier {
  label: string;
  minParticipants: number;
  maxParticipants: number | null;
  /** Valor do pacote em reais. null = acima de 1.000 participantes, "a negociar". */
  price: number | null;
}

export const PRICING_TIERS: PricingTier[] = [
  { label: "Até 100", minParticipants: 1, maxParticipants: 100, price: 2500 },
  { label: "101 a 250", minParticipants: 101, maxParticipants: 250, price: 6500 },
  { label: "251 a 500", minParticipants: 251, maxParticipants: 500, price: 11000 },
  { label: "501 a 1.000", minParticipants: 501, maxParticipants: 1000, price: 20000 },
  { label: "Acima de 1.000", minParticipants: 1001, maxParticipants: null, price: null },
];

// TODO(confirmar): ainda existe um degrau no início da faixa de 251 participantes (cerca de R$26,00 por
// participante no teto da faixa anterior, contra cerca de R$44,00 por participante no início desta faixa).
// Revisão pendente (plano de mudanças do site, 09/11/2026, seção 2.1).

export const PAYMENT_SCHEDULE = {
  signingPercent: 30,
  beforeEventPercent: 70,
  beforeEventDays: 15,
};

/** Prazo real de urgência: contratação até 15 dias antes do evento. */
export const CONTRACT_DEADLINE_DAYS = 15;

// TODO(confirmar): se a contratação ocorrer exatamente no limite de 15 dias antes do evento, o pagamento
// vira 100% à vista na assinatura. Ainda não confirmado por Sabrina (plano de 09/11/2026, seção 2.2).

/**
 * Captação de áudio: por padrão é feita pela equipe do próprio evento (ou qualquer pessoa autorizada),
 * gravando no celular e enviando o arquivo — sem custo adicional, em qualquer UF. Vale tanto para o
 * pacote por evento quanto para o upsell no ingresso (decisão de 10/11/2026).
 *
 * Se o organizador preferir que a equipe do ScribIA faça a captação, isso é um serviço à parte, cotado
 * na proposta com a fórmula abaixo (decisão de 10/11/2026) — não é um valor incluso automaticamente.
 */
export const TEAM_AUDIO_CAPTURE = {
  firstRoomPerDay: 800,
  additionalRoomPerDay: 500,
};

/** Valor do serviço de captação de áudio pela equipe do ScribIA (opcional, cotado à parte na proposta). */
export function getTeamAudioCaptureCost(rooms: number, days: number): number {
  if (rooms < 1 || days < 1) return 0;
  const perDay = TEAM_AUDIO_CAPTURE.firstRoomPerDay + Math.max(0, rooms - 1) * TEAM_AUDIO_CAPTURE.additionalRoomPerDay;
  return perDay * days;
}

export const UPSELL = {
  perTicket: 25,
  minPerRoom: 1000,
  /** Cobrado do organizador após o evento, com a contagem final de ingressos (decisão de 10/11/2026). */
  billedAfterEvent: true,
  /** O organizador define livremente o preço do adicional cobrado do participante (decisão de 10/11/2026). */
  participantPriceSetByOrganizer: true,
};

export const PILOT = {
  price: 1000,
  rooms: 1,
  maxTalks: 10,
  maxTalkMinutes: 40,
  audioCaptureIncludedUFs: ["RJ", "SP"] as const,
  /** Abatido integralmente do pacote caso o organizador contrate o evento completo. */
  deductibleFromPackage: true,
  /** Prazo para converter o piloto em pacote completo, a partir da data do evento piloto (decisão de 10/11/2026). */
  conversionDeadlineDays: 30,
};

export const RENEWAL = {
  /** Quem renova mantém o preço, só para a próxima edição (decisão de 10/11/2026). */
  priceLocked: true,
  scope: "next_edition" as const,
};

/** Prazo de resposta depois que o organizador pede proposta pelo simulador (decisão de 10/11/2026). */
export const PROPOSAL_RESPONSE_HOURS = 24;

/** Retorna a faixa de preço (pacote por evento) correspondente ao número de participantes. */
export function getPricingTier(participants: number): PricingTier {
  const tier = PRICING_TIERS.find(
    (t) =>
      participants >= t.minParticipants &&
      (t.maxParticipants === null || participants <= t.maxParticipants),
  );
  if (!tier) {
    throw new Error(`Nenhuma faixa de preço encontrada para ${participants} participantes`);
  }
  return tier;
}

/** true quando a faixa exige proposta negociada (acima de 1.000 participantes). */
export function isNegotiable(participants: number): boolean {
  return getPricingTier(participants).price === null;
}

/**
 * Valor mínimo do upsell por sala, limitado ao valor do pacote da faixa do evento.
 * Faixas "a negociar" (acima de 1.000 participantes) não têm valor de pacote para limitar o mínimo.
 */
export function getUpsellMinimum(rooms: number, participants: number): number {
  const rawMinimum = rooms * UPSELL.minPerRoom;
  const tier = getPricingTier(participants);
  if (tier.price === null) {
    return rawMinimum;
  }
  return Math.min(rawMinimum, tier.price);
}

/** Número de ingressos pagos (com o adicional) que faz o upsell igualar o pacote da faixa. */
export function getUpsellBreakeven(participants: number): number | null {
  const tier = getPricingTier(participants);
  if (tier.price === null) {
    return null;
  }
  return tier.price / UPSELL.perTicket;
}

export interface PaymentSchedule {
  signingAmount: number;
  beforeEventAmount: number;
  beforeEventDueDate: Date;
  contractDeadline: Date;
}

/** Calcula valores e datas de pagamento (30% na assinatura, 70% 15 dias antes do evento) a partir da data do evento. */
export function calculatePaymentSchedule(eventDate: Date, packagePrice: number): PaymentSchedule {
  const beforeEventDueDate = new Date(eventDate);
  beforeEventDueDate.setDate(beforeEventDueDate.getDate() - PAYMENT_SCHEDULE.beforeEventDays);

  const contractDeadline = new Date(eventDate);
  contractDeadline.setDate(contractDeadline.getDate() - CONTRACT_DEADLINE_DAYS);

  return {
    signingAmount: (packagePrice * PAYMENT_SCHEDULE.signingPercent) / 100,
    beforeEventAmount: (packagePrice * PAYMENT_SCHEDULE.beforeEventPercent) / 100,
    beforeEventDueDate,
    contractDeadline,
  };
}

/** Valor a pagar ao converter o piloto em pacote completo (pacote da faixa menos o piloto já pago). */
export function getPilotConversionDue(participants: number): number {
  const tier = getPricingTier(participants);
  if (tier.price === null) {
    throw new Error(
      "Conversão de piloto para pacote acima de 1.000 participantes depende de proposta negociada",
    );
  }
  return tier.price - PILOT.price;
}

/** true quando a UF do piloto tem captação de áudio inclusa (RJ ou SP). */
export function isPilotAudioCaptureIncluded(uf: string): boolean {
  return (PILOT.audioCaptureIncludedUFs as readonly string[]).includes(uf.toUpperCase());
}

/** Data-limite para converter o piloto em pacote completo, a partir da data do evento piloto. */
export function getPilotConversionDeadline(pilotEventDate: Date): Date {
  const deadline = new Date(pilotEventDate);
  deadline.setDate(deadline.getDate() + PILOT.conversionDeadlineDays);
  return deadline;
}

/** Formata um valor em reais no padrão pt-BR (R$ 2.500,00). */
export function formatPriceBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
