-- Add seniority_level to lecture_access so participants can choose their level per lecture
-- Values: junior, pleno, senior (NULL = not yet chosen)
-- Existing "users_update_own_access" RLS policy already allows participants to update their own rows

ALTER TABLE lecture_access
ADD COLUMN seniority_level TEXT
CHECK (seniority_level IN ('junior', 'pleno', 'senior'));
