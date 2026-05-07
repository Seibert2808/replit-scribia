-- Migration: Set database timezone to America/Sao_Paulo
-- Reason: Default UTC causes -3h offset in queries and displays

-- Set the database-level timezone parameter
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';

-- Apply immediately to current session
SET timezone TO 'America/Sao_Paulo';
