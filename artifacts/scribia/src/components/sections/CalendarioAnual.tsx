import { useEffect, useMemo, useState } from 'react'
import { publicGet } from '@/lib/public-fetch'
import { SITE } from '@/utils/constants'
import { Search, CalendarDays, ExternalLink, Send, Check, Loader2, Upload } from 'lucide-react'

// O texto que a pessoa marca para autorizar contato. Fica numa constante
// SO para ser exibido; o que e ENVIADO ao servidor e lido do elemento na
// tela, para nao haver divergencia entre o que ela leu e o que fica
// gravado. Mesmo criterio usado na pagina do RIW.
const TEXTO_CONSENTIMENTO =
  'Autorizo a equipe do ScribIA a entrar em contato comigo sobre este cadastro e sobre como o ScribIA pode atender o meu evento.'

const URL_BUCKET = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/community-event-logos`

// O logo pode vir de dois lugares: arquivo enviado pelo formulario, que
// e so o nome dentro do nosso deposito, ou um endereco completo, quando a
// imagem ja existe em outro lugar do banco. Aceitar os dois evita ter que
// copiar arquivo so para mudar de pasta.
function enderecoDoLogo(caminho: string): string {
  return caminho.startsWith('http') ? caminho : `${URL_BUCKET}/${caminho}`
}

interface EventoCalendario {
  id: string
  name: string
  event_date: string
  event_end_date: string | null
  location: string | null
  url: string
  logo_path: string | null
}

function formatarData(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Congresso quase sempre dura mais de um dia. Mostrar so o primeiro faz
// parecer evento de uma tarde, e quem le nao sabe quando acaba.
function periodo(inicio: string, fim: string | null): string {
  if (!fim || fim === inicio) return formatarData(inicio)
  const a = new Date(`${inicio}T12:00:00`)
  const b = new Date(`${fim}T12:00:00`)
  const mesmoMes = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  if (mesmoMes) {
    return `${a.getDate()} a ${formatarData(fim)}`
  }
  return `${a.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} a ${formatarData(fim)}`
}

function semAcento(v: string): string {
  return v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export default function CalendarioAnual() {
  const [eventos, setEventos] = useState<EventoCalendario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [formAberto, setFormAberto] = useState(false)

  useEffect(() => {
    let montado = true
    const desistir = setTimeout(() => { if (montado) setCarregando(false) }, 8000)
    async function carregar() {
      try {
        const lista = await publicGet<EventoCalendario>(
          'public_community_events?select=id,name,event_date,event_end_date,location,url,logo_path&order=event_date.asc',
        )
        if (montado) setEventos(lista)
      } catch (_) {
        // silencioso: a secao some, o resto da pagina continua
      } finally {
        if (montado) setCarregando(false)
      }
    }
    carregar()
    return () => { montado = false; clearTimeout(desistir) }
  }, [])

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim())
    if (!termo) return eventos
    return eventos.filter((e) => semAcento(e.name).includes(termo))
  }, [eventos, busca])

  return (
    <section className="mt-14 md:mt-20 pt-10 md:pt-14 border-t border-border-subtle">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-2">
        <div>
          <h2 className="font-heading font-extrabold text-text leading-tight tracking-tight text-2xl sm:text-3xl">
            Calendário Anual de Eventos
          </h2>
          <p className="mt-2 text-text2 text-[14px] sm:text-[15px] leading-relaxed max-w-2xl">
            Eventos acadêmicos, científicos e educacionais de todo o país, inclusive os que não
            passam pelo ScribIA. Se você organiza um, cadastre aqui.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormAberto((v) => !v)}
          className="inline-flex items-center justify-center gap-2 bg-purple text-white px-4 py-2.5 rounded-lg text-[13.5px] font-medium hover:bg-purple-light transition-all shrink-0"
        >
          {formAberto ? 'Fechar' : 'Cadastre seu evento'}
        </button>
      </div>

      {formAberto && <FormularioCadastro aoFechar={() => setFormAberto(false)} />}

      <div className="relative mt-6 mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar evento pelo nome"
          className="w-full bg-bg2 border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-[14px] text-text placeholder:text-text3 outline-none transition-all focus:border-border-purple focus:ring-2 focus:ring-purple/20"
        />
      </div>

      {carregando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-bg3 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-10 bg-bg2 border border-dashed border-border-subtle rounded-xl">
          <CalendarDays className="w-7 h-7 text-text3 mx-auto mb-2.5" />
          <p className="text-[13px] text-text3">
            {eventos.length === 0
              ? 'Ainda não há eventos no calendário. Cadastre o seu.'
              : `Nenhum evento com "${busca}".`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtrados.map((ev) => (
              <a
                key={ev.id}
                href={ev.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-bg2 border border-border-subtle rounded-xl p-3.5 hover:border-border-purple transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-bg3 overflow-hidden shrink-0 flex items-center justify-center">
                  {ev.logo_path ? (
                    <img
                      src={enderecoDoLogo(ev.logo_path)}
                      alt={ev.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <CalendarDays className="w-5 h-5 text-text3" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-text leading-snug line-clamp-2 group-hover:text-purple-light transition-colors">
                    {ev.name}
                  </p>
                  <p className="text-[11.5px] text-text3 mt-1">
                    {periodo(ev.event_date, ev.event_end_date)}
                    {ev.location ? ` · ${ev.location}` : ''}
                  </p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-text3 group-hover:text-purple-light transition-colors shrink-0" />
              </a>
            ))}
          </div>
          <p className="text-[11.5px] text-text3 mt-4">
            {filtrados.length === eventos.length
              ? `${eventos.length} ${eventos.length === 1 ? 'evento' : 'eventos'} no calendário`
              : `${filtrados.length} de ${eventos.length}`}
          </p>
        </>
      )}
    </section>
  )
}

function FormularioCadastro({ aoFechar }: { aoFechar: () => void }) {
  const [nome, setNome] = useState('')
  const [data, setData] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [local, setLocal] = useState('')
  const [url, setUrl] = useState('')
  const [orgNome, setOrgNome] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [orgTel, setOrgTel] = useState('')
  const [logo, setLogo] = useState<File | null>(null)
  const [autorizou, setAutorizou] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  const podeEnviar =
    nome.trim().length >= 3 &&
    data !== '' &&
    url.trim() !== '' &&
    orgNome.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(orgEmail) &&
    autorizou

  async function enviar() {
    if (!podeEnviar || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      let logoPayload: { data: string; type: string } | null = null
      if (logo) {
        if (logo.size > 2 * 1024 * 1024) {
          setErro('O logo precisa ter até 2 MB.')
          return
        }
        const buffer = await logo.arrayBuffer()
        let binario = ''
        const bytes = new Uint8Array(buffer)
        for (let i = 0; i < bytes.length; i++) binario += String.fromCharCode(bytes[i])
        logoPayload = { data: btoa(binario), type: logo.type }
      }

      const res = await fetch(`${SITE.appUrl}/api/public/community-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nome,
          event_date: data,
          event_end_date: dataFim || null,
          location: local,
          url,
          organizer_name: orgNome,
          organizer_email: orgEmail,
          organizer_phone: orgTel,
          logo: logoPayload,
          contact_consent: true,
          contact_consent_text: TEXTO_CONSENTIMENTO,
          honeypot,
        }),
      })
      const dados = await res.json()
      if (!res.ok) {
        setErro(dados?.error ?? 'Não foi possível enviar. Tente de novo.')
        return
      }
      setEnviado(true)
    } catch {
      setErro('Não foi possível enviar. Verifique sua conexão.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="mt-5 bg-bg2 border border-border-purple rounded-xl p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-scribia-green shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-medium text-text">Cadastro enviado</p>
            <p className="text-[13px] text-text2 mt-1.5 leading-relaxed">
              Nossa equipe vai conferir se o evento se encaixa no calendário e publicar em
              seguida. Se precisarmos de algo, falamos com você pelo e-mail informado.
            </p>
            <button
              type="button"
              onClick={aoFechar}
              className="text-[13px] text-purple-light hover:underline mt-3"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const campo =
    'w-full bg-bg3 border border-border-subtle rounded-lg px-3.5 py-2.5 text-[14px] text-text placeholder:text-text3 outline-none transition-all focus:border-border-purple focus:ring-2 focus:ring-purple/20'
  const rotulo = 'block text-[12px] font-medium text-text2 mb-1.5'

  return (
    <div className="mt-5 bg-bg2 border border-border-subtle rounded-xl p-5 sm:p-6">
      <p className="text-[14px] font-medium text-text">Cadastre seu evento</p>
      <p className="text-[12.5px] text-text3 mt-1.5 leading-relaxed max-w-2xl">
        O calendário é destinado a eventos de cunho acadêmico, científico e educacional. Não são
        aceitos eventos de entretenimento fora desse escopo. Todo cadastro passa por conferência
        antes de aparecer aqui.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        <div className="sm:col-span-2">
          <label className={rotulo}>Nome do evento</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className={campo} placeholder="Ex: XI Congresso Brasileiro de Enfermagem Obstétrica" />
        </div>
        <div>
          <label className={rotulo}>Começa em</label>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={campo} />
        </div>
        <div>
          <label className={rotulo}>Termina em (se durar mais de um dia)</label>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className={campo} />
        </div>
        <div>
          <label className={rotulo}>Cidade e estado</label>
          <input value={local} onChange={(e) => setLocal(e.target.value)} className={campo} placeholder="Ex: Salvador, BA" />
        </div>
        <div>
          <label className={rotulo}>Site do evento</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className={campo} placeholder="https://" />
        </div>
        <div className="sm:col-span-2">
          <label className={rotulo}>Logo do evento (opcional, até 2 MB)</label>
          <label className="flex items-center gap-2 bg-bg3 border border-border-subtle rounded-lg px-3.5 py-2.5 cursor-pointer hover:border-border-purple transition-colors">
            <Upload className="w-4 h-4 text-text3 shrink-0" />
            <span className="text-[13px] text-text2 truncate">
              {logo ? logo.name : 'Escolher arquivo PNG, JPG, WEBP ou SVG'}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        </div>
        <div>
          <label className={rotulo}>Seu nome</label>
          <input value={orgNome} onChange={(e) => setOrgNome(e.target.value)} className={campo} placeholder="Quem organiza" />
        </div>
        <div>
          <label className={rotulo}>Seu e-mail</label>
          <input type="email" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} className={campo} placeholder="voce@email.com" />
        </div>
        <div className="sm:col-span-2">
          <label className={rotulo}>Seu telefone</label>
          <input value={orgTel} onChange={(e) => setOrgTel(e.target.value)} className={campo} placeholder="(21) 90000-0000" />
        </div>
      </div>

      {/* Armadilha para robo: invisivel para gente, atraente para preenchimento automatico. */}
      <input
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] w-px h-px overflow-hidden"
      />

      <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
        <input
          type="checkbox"
          checked={autorizou}
          onChange={(e) => setAutorizou(e.target.checked)}
          className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--color-purple)]"
        />
        <span className="text-[12.5px] text-text2 leading-relaxed">{TEXTO_CONSENTIMENTO}</span>
      </label>

      <div className="flex items-center gap-3 mt-5">
        <button
          type="button"
          onClick={enviar}
          disabled={!podeEnviar || enviando}
          className="inline-flex items-center gap-1.5 bg-purple text-white rounded-lg px-4 py-2.5 text-[13.5px] font-medium hover:bg-purple-light transition-colors disabled:opacity-50"
        >
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar cadastro
        </button>
        {!autorizou && (
          <span className="text-[12px] text-text3">
            A autorização de contato é necessária para enviar.
          </span>
        )}
      </div>

      {erro && <p className="text-[12.5px] text-scribia-red mt-3">{erro}</p>}
    </div>
  )
}
