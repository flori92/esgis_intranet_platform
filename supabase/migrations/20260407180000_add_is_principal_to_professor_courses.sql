-- Migration: Add is_principal to professor_courses
-- Date: 2026-04-07

BEGIN;

ALTER TABLE public.professor_courses 
ADD COLUMN IF NOT EXISTS is_principal BOOLEAN DEFAULT false;

COMMIT;
