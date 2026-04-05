-- Migration: Fix schema constraints for students table
-- Date: 2026-04-05
-- Description: 
--   1. Drops NOT NULL from entry_year to match current form
--   2. Drops restrictive CHECK constraints on level and status
--      to avoid "Licence 1" vs "L1" or "active" vs "actif" conflicts.

-- Drop NOT NULL from entry_year
ALTER TABLE public.students ALTER COLUMN entry_year DROP NOT NULL;

-- Drop constraints if they exist
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_level_check;
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check;

-- Optional: Re-add more flexible constraints if needed later, 
-- but for now, we prioritize functionality.
