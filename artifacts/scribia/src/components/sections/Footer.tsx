import { SITE } from "@/utils/constants";
import { Mail } from "lucide-react";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.594 5.337l-.999 3.648 3.894-1.026zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const Footer = () => {
  return (
    <footer className="border-t border-border-subtle mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-10 md:py-12 grid gap-8 md:gap-10 md:grid-cols-2">
        <div>
          <h3 className="font-heading font-bold text-[13px] uppercase tracking-wider text-text">{SITE.name}</h3>
          <p className="text-[12.5px] leading-relaxed text-text2 mt-3 max-w-md">
            Solução inteligente para transformar conteúdos de eventos em ativos estruturados, ampliando o valor, a continuidade e o potencial de receita para organizadores, palestrantes e patrocinadores.
          </p>
        </div>
        <div className="md:justify-self-end flex flex-col gap-2.5">
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="inline-flex items-center gap-2.5 text-[12.5px] text-text2 hover:text-purple-light transition-colors"
          >
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{SITE.contactEmail}</span>
          </a>
          <a
            href="https://wa.me/5521979269311"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-[12.5px] text-text2 hover:text-purple-light transition-colors"
          >
            <WhatsAppIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span>(21) 97926-9311</span>
          </a>
          <a
            href="https://www.instagram.com/scribia_livebooks/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-[12.5px] text-text2 hover:text-purple-light transition-colors"
          >
            <InstagramIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span>@scribia_livebooks</span>
          </a>
          <div className="mt-3 text-[11px] text-text3">
            © {new Date().getFullYear()} {SITE.name}. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
