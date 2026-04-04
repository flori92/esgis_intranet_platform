-- Script to create missing students and professors tables
-- Execute this in Supabase SQL editor

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_number TEXT UNIQUE,
  entry_year INTEGER,
  level TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Create professors table
CREATE TABLE IF NOT EXISTS public.professors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  employee_number TEXT UNIQUE,
  hire_date DATE,
  specialties TEXT[],
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Add RLS policies for students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own record" ON public.students
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Professors and admins can view all students" ON public.students
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('professor', 'admin')
    )
  );

CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add RLS policies for professors table
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can view their own record" ON public.professors
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Everyone can view professors" ON public.professors
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage professors" ON public.professors
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_student_number ON public.students(student_number);
CREATE INDEX IF NOT EXISTS idx_professors_profile_id ON public.professors(profile_id);
CREATE INDEX IF NOT EXISTS idx_professors_employee_number ON public.professors(employee_number);