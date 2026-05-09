import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Lead = {
  nome: string;
  email: string;
  organizacao?: string;
};

const STORAGE_KEY = "scribia_leads";

const LeadCapture = () => {
  const { register, handleSubmit, reset } = useForm<Lead>();

  const onSubmit = async (data: Lead) => {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const leads = Array.isArray(existing) ? existing : [];
      const next = [...leads, { ...data, createdAt: new Date().toISOString() }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      // Dispara webhook n8n (CORS-friendly: application/x-www-form-urlencoded)
      const params = new URLSearchParams({
        nome: data.nome,
        email: data.email,
        organizacao: data.organizacao || "",
        source: "lead_form",
        timestamp: new Date().toISOString(),
        page: window.location.href,
      });

      console.log("Enviando webhook para n8n (form-encoded):", params.toString());
      await fetch("https://sabrinaseibert.app.n8n.cloud/webhook-test/interesse_site", {
        method: "POST",
        body: params,
      });

      toast.success("Recebemos sua solicitação. Em breve entraremos em contato!");
      reset();
    } catch (e) {
      console.error("Erro ao enviar webhook:", e);
      toast("Não foi possível enviar agora. Tente novamente.");
    }
  };

  return (
    <section id="lead" className="py-16 md:py-24 bg-gradient-to-b from-secondary/10 to-background">
      <div className="container mx-auto max-w-3xl">
        <div className="rounded-xl border bg-card shadow-sm p-6 md:p-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">Leve o Scribia para o seu próximo evento</h2>
          <p className="text-center text-muted-foreground mb-8">Agenda 2025 com vaga para apenas 10 eventos. Garanta agora o ScribIA e surpreenda os participantes do seu evento!</p>
          <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-3 gap-4">
            <Input aria-label="Nome" placeholder="Seu nome" required {...register("nome", { required: true })} />
            <Input aria-label="Email" placeholder="Seu email" type="email" required {...register("email", { required: true })} />
            <Input aria-label="Organização" placeholder="Instituição/Organização (opcional)" {...register("organizacao")} />
            <div className="md:col-span-3 flex justify-center pt-2">
              <Button type="submit" variant="cta" size="lg" className="hover-scale">
                Solicitar Demonstração Gratuita
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default LeadCapture;
