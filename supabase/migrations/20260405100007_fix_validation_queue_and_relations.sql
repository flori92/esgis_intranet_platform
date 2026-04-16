-- Migration: add missing relations and validation_queue table
-- 1) Professors -> Departments FK
ALTER TABLE public.professors
  ADD COLUMN IF NOT EXISTS department_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_professors_department'
  ) THEN
    ALTER TABLE public.professors
      ADD CONSTRAINT fk_professors_department
      FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2) Students -> Departments FK
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS department_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_students_department'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT fk_students_department
      FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Table validation_queue (used by admin validation UI)
CREATE TABLE IF NOT EXISTS public.validation_queue (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES public.students(id) ON DELETE SET NULL,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_comment TEXT
);

-- 4) Done
