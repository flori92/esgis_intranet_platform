-- Migration: add missing relations and validation_queue table
-- 1) Professors -> Departments FK
ALTER TABLE public.professors
  ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE public.professors
  ADD CONSTRAINT IF NOT EXISTS fk_professors_department
  FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

-- 2) Students -> Departments FK
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE public.students
  ADD CONSTRAINT IF NOT EXISTS fk_students_department
  FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

-- 3) Table validation_queue (used by admin validation UI)
CREATE TABLE IF NOT EXISTS public.validation_queue (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_comment TEXT
);

-- 4) Done
