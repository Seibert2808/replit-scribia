-- Event Branding: cores e logo customizáveis por evento
-- Aparecem nos ebooks/playbooks junto com a marca ScribIA

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#6B4EFF',
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#00D4A0',
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Permitir upload de logos no bucket materials (já aceita PNG/JPEG)
-- Path convention: {event_id}/branding/logo.png
COMMENT ON COLUMN public.events.primary_color IS 'Cor primária do evento (hex). Usada como accent nos ebooks/playbooks.';
COMMENT ON COLUMN public.events.secondary_color IS 'Cor secundária do evento (hex). Usada como accent secundário nos ebooks/playbooks.';
COMMENT ON COLUMN public.events.logo_url IS 'URL/path da logo do evento no storage. Exibida nos ebooks junto com a logo ScribIA.';
