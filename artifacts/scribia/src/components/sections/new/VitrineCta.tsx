import { Link } from "wouter"
import { ArrowRight, PlayCircle } from "lucide-react"
import { GRADIENTE_MARCA } from "@/utils/paleta"

// Pedido dela em 29/10/2026: um botao entre os Beneficios e a BIA,
// convidando quem esta so lendo a experimentar a Vitrine como
// participante. Leva direto pra criacao de conta.
export default function VitrineCta() {
  return (
    <section className="py-10 md:py-14 text-center">
      <Link
        href="/register"
        className="group inline-flex items-center gap-3 rounded-2xl px-7 py-5 text-base sm:text-lg font-bold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_55px_hsla(260,85%,65%,0.6)]"
        style={{ background: GRADIENTE_MARCA }}
      >
        <PlayCircle className="h-6 w-6 shrink-0" />
        Experimente como participante a Vitrine ScribIA!
        <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>
    </section>
  )
}
