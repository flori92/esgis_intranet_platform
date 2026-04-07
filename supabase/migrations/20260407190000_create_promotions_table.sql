-- Migration: Create Promotions table
-- Date: 2026-04-07

BEGIN;

-- 1. Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- Ex: "Informatique de Gestion - L1 - 2025-2026"
    filiere_id INTEGER REFERENCES public.filieres(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL, -- Ex: "2025-2026"
    level TEXT NOT NULL, -- Ex: "L1", "L2", "M1"
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(filiere_id, academic_year, level)
);

-- 2. Add promotion_id to students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL;

-- 3. Add promotion_id to exams (to target a specific promotion)
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promotions are viewable by all authenticated users" 
ON public.promotions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage promotions" 
ON public.promotions FOR ALL TO authenticated USING (check_is_admin());

-- 5. Trigger for updated_at
CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
