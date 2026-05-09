import { Link } from 'wouter'
import { PublicHeader } from '@/components/layout/public-header'
import { Mic, BookOpen, Headphones, FileText, Zap, Users } from 'lucide-react'

const features = [
  {
    icon: Mic,
    title: 'Gravação automática',
    description: 'Cada palestra é capturada e processada automaticamente, sem necessidade de equipamentos especiais.',
  },
  {
    icon: FileText,
    title: 'Transcrição inteligente',
    description: 'IA transcreve o conteúdo com precisão, identificando termos técnicos e nomes de palestrantes.',
  },
  {
    icon: BookOpen,
    title: 'E-book gerado na hora',
    description: 'O conteúdo da palestra vira um e-book estruturado, pronto para download logo após o evento.',
  },
  {
    icon: Headphones,
    title: 'Áudio disponível',
    description: 'Participantes acessam o áudio das palestras quando quiserem, no próprio portal.',
  },
  {
    icon: Zap,
    title: 'Playbook executivo',
    description: 'Além do e-book, geramos um playbook com os principais insights para aplicar no dia a dia.',
  },
  {
    icon: Users,
    title: 'Portal do participante',
    description: 'Cada participante tem acesso exclusivo ao conteúdo dos eventos em que esteve presente.',
  },
]

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 pt-14 md:pt-20 pb-12 text-center animate-fade-up">
        <div className="inline-flex items-center gap-2 bg-purple-dim border border-border-purple rounded-full px-4 py-1.5 text-[12px] text-purple-light font-medium mb-6">
          <Zap className="w-3.5 h-3.5" /> Plataforma de eventos inteligentes
        </div>
        <h1 className="font-heading text-[32px] sm:text-[44px] md:text-[52px] font-extrabold text-text leading-tight tracking-tight">
          Do palco ao material pronto{' '}
          <span className="text-purple-light">em minutos</span>
        </h1>
        <p className="text-[15px] sm:text-[16px] text-text2 mt-5 max-w-2xl mx-auto leading-relaxed">
          O Scribia transforma palestras ao vivo em conteúdo rico e acessível — áudio, transcrição, e-book e playbook —
          entregue automaticamente aos participantes logo após o evento.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link
            href="/eventos"
            className="inline-flex items-center bg-purple text-white px-6 py-3 rounded-xl text-[14px] font-semibold hover:bg-purple-light transition-all shadow-elegant"
          >
            Ver eventos publicados
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center border border-border-subtle text-text2 px-6 py-3 rounded-xl text-[14px] font-medium hover:border-border-purple hover:text-purple-light transition-all"
          >
            Acessar minha conta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="bg-bg2 border border-border-subtle rounded-2xl p-5 hover:border-border-purple transition-colors animate-fade-up"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-dim border border-border-purple flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-purple-light" />
                </div>
                <h3 className="font-heading font-bold text-[15px] text-text mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-text3 leading-relaxed">{f.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 pb-20">
        <div className="bg-gradient-to-br from-purple/20 via-purple-dim to-bg3 border border-border-purple rounded-3xl p-8 sm:p-12 text-center animate-fade-up">
          <h2 className="font-heading text-[24px] sm:text-[30px] font-extrabold text-text mb-3">
            Quer levar o Scribia para o seu evento?
          </h2>
          <p className="text-[14px] text-text2 max-w-lg mx-auto mb-7">
            Entre em contato e saiba como transformar as palestras do seu evento em conteúdo permanente para os participantes.
          </p>
          <a
            href="mailto:contato@scribia.com.br"
            className="inline-flex items-center bg-purple text-white px-8 py-3.5 rounded-xl text-[14px] font-semibold hover:bg-purple-light transition-all shadow-elegant"
          >
            Falar com a equipe
          </a>
        </div>
      </section>

      <footer className="border-t border-border-subtle py-8 text-center">
        <p className="text-[11px] text-text3">© {new Date().getFullYear()} Scribia · Do palco ao material pronto em minutos</p>
      </footer>
    </div>
  )
}
