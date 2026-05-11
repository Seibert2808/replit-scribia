import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { PublicHeader } from "@/components/layout/public-header"
import Hero from "@/components/sections/Hero"
import ProblemSolution from "@/components/sections/ProblemSolution"
import HowItWorks from "@/components/sections/HowItWorks"
import Benefits from "@/components/sections/Benefits"
import SocialProof from "@/components/sections/SocialProof"
import FAQ from "@/components/sections/FAQ"
import Footer from "@/components/sections/Footer"
import { LeadWizardDialog } from "@/components/lead-wizard-dialog"
import { ChevronRight } from "lucide-react"

export default function ParticipantesLandingPage() {
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    document.title = "Scribia — Sistema de processamento inteligente de áudio e texto"
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text">
      <PublicHeader />

      <main className="px-4 sm:px-8 md:px-14 lg:px-16">
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <Benefits />

        {/* CTA — substituto de FreeTrial/PricingPlans (que dependiam de Edge Function) */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Quer experimentar o ScribIA no seu próximo evento?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Conte para a gente sobre o evento e seu interesse. Em minutos uma conversa pelo WhatsApp para entender como o Scribia pode ampliar a experiência do seu público.
              </p>
              <Button size="lg" onClick={() => setWizardOpen(true)} className="group px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                <span className="flex items-center gap-2">
                  Quero falar com o ScribIA
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </div>
          </div>
        </section>

        <SocialProof />
        <FAQ />
      </main>

      <Footer />

      <LeadWizardDialog open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  )
}
