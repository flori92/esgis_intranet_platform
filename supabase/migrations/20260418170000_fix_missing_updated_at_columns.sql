-- Fix missing updated_at columns for tables with update_timestamp triggers
-- Reported error: record "new" has no field "updated_at" in student_alerts

-- 1. Fix student_alerts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_alerts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.student_alerts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 2. Fix professor_dashboards (has last_updated but trigger expects updated_at)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professor_dashboards' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.professor_dashboards ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 3. Ensure the trigger function is resilient (optional but safer)
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- We use a dynamic approach or just assume columns exist after this fix
  -- But to be absolutely safe against future missing columns:
  BEGIN
    NEW.updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    -- If updated_at doesn't exist, just continue
    NULL;
  END;
  RETURN NEW;
END;
$$;
