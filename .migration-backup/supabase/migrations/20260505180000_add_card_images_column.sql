-- Add card_images JSONB column to store multiple card paths (3 cards per lecture)
-- Backwards compatible: card_image_url still holds the first card path

ALTER TABLE public.lectures
  ADD COLUMN IF NOT EXISTS card_images JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.lectures.card_images IS 'Array of storage paths for generated social media cards (quote, title, insight)';
