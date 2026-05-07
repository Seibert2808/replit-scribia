-- Rename material names in system_prompts table
-- ebook → "Playbook", playbook → "Live Book"
-- Internal keys remain unchanged (ebook, playbook)

UPDATE public.system_prompts SET name = 'Playbook' WHERE key = 'ebook';
UPDATE public.system_prompts SET name = 'Live Book' WHERE key = 'playbook';

-- Update profile prompt names
UPDATE public.system_prompts SET name = 'Playbook Junior Compacto' WHERE key = 'ebook_junior_compact';
UPDATE public.system_prompts SET name = 'Playbook Junior Completo' WHERE key = 'ebook_junior_complete';
UPDATE public.system_prompts SET name = 'Playbook Pleno Compacto' WHERE key = 'ebook_pleno_compact';
UPDATE public.system_prompts SET name = 'Playbook Pleno Completo' WHERE key = 'ebook_pleno_complete';
UPDATE public.system_prompts SET name = 'Playbook Senior Compacto' WHERE key = 'ebook_senior_compact';
UPDATE public.system_prompts SET name = 'Playbook Senior Completo' WHERE key = 'ebook_senior_complete';

UPDATE public.system_prompts SET name = 'Live Book Junior Compacto' WHERE key = 'playbook_junior_compact';
UPDATE public.system_prompts SET name = 'Live Book Junior Completo' WHERE key = 'playbook_junior_complete';
UPDATE public.system_prompts SET name = 'Live Book Pleno Compacto' WHERE key = 'playbook_pleno_compact';
UPDATE public.system_prompts SET name = 'Live Book Pleno Completo' WHERE key = 'playbook_pleno_complete';
UPDATE public.system_prompts SET name = 'Live Book Senior Compacto' WHERE key = 'playbook_senior_compact';
UPDATE public.system_prompts SET name = 'Live Book Senior Completo' WHERE key = 'playbook_senior_complete';
