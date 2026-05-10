import { useEffect } from 'react'
import { PublicHeader } from '@/components/layout/public-header'
import NewHero from '@/components/sections/new/NewHero'
import ProblemSection from '@/components/sections/new/ProblemSection'
import SolutionSection from '@/components/sections/new/SolutionSection'
import HowItWorksNew from '@/components/sections/new/HowItWorksNew'
import FeaturesSection from '@/components/sections/new/FeaturesSection'
import LivebookSection from '@/components/sections/new/LivebookSection'
import BiaSection from '@/components/sections/new/BiaSection'
import MetricsSection from '@/components/sections/new/MetricsSection'
import FAQSectionNew from '@/components/sections/new/FAQSectionNew'
import DemoSection from '@/components/sections/new/DemoSection'
import ContactSection from '@/components/sections/new/ContactSection'
import Footer from '@/components/sections/Footer'

export default function SobrePage() {
  useEffect(() => {
    document.title = 'Scribia — Sistema de processamento inteligente de áudio e texto'
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text">
      <PublicHeader />
      <main>
        <NewHero />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksNew />
        <FeaturesSection />
        <LivebookSection />
        <BiaSection />
        <MetricsSection />
        <FAQSectionNew />
        <DemoSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
