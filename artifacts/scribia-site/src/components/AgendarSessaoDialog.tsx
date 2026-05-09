import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "5521979269311";

interface AgendarSessaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatWhatsApp = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const AgendarSessaoDialog = ({ open, onOpenChange }: AgendarSessaoDialogProps) => {
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    email: "",
    whatsapp: "",
  });

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const whatsappDigits = formData.whatsapp.replace(/\D/g, "");

    if (!formData.nome.trim()) {
      toast.error("Por favor, preencha seu nome");
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      toast.error("Email inválido");
      return false;
    }
    if (whatsappDigits.length < 10 || whatsappDigits.length > 11) {
      toast.error("WhatsApp deve ter 10 ou 11 dígitos");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const text = `Olá! Quero agendar uma Sessão Estratégica do ScribIA.

*Nome:* ${formData.nome.trim()}
*Empresa:* ${formData.empresa.trim() || "—"}
*Email:* ${formData.email.trim()}
*WhatsApp:* ${formData.whatsapp}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Abrindo WhatsApp para você enviar sua solicitação.");
    setFormData({ nome: "", empresa: "", email: "", whatsapp: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quero agendar uma Sessão</DialogTitle>
          <DialogDescription>Preencha os dados abaixo para agendar sua sessão estratégica</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="sessao-nome">Nome Completo *</Label>
            <Input
              id="sessao-nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="sessao-empresa">Empresa</Label>
            <Input
              id="sessao-empresa"
              value={formData.empresa}
              onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="sessao-email">Email *</Label>
            <Input
              id="sessao-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              maxLength={255}
            />
          </div>
          <div>
            <Label htmlFor="sessao-whatsapp">WhatsApp *</Label>
            <Input
              id="sessao-whatsapp"
              type="tel"
              value={formData.whatsapp}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  whatsapp: formatWhatsApp(e.target.value),
                })
              }
              placeholder="(11) 99999-9999"
              required
              maxLength={15}
            />
          </div>
          <Button type="submit" className="w-full">
            Enviar via WhatsApp
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AgendarSessaoDialog;
