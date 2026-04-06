-- Migration: Fix RLS for student and professor auto-creation
-- Date: 2026-04-06

-- 1. Students Table
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Students can view their own record" ON public.students;
DROP POLICY IF EXISTS "Professors and admins can view all students" ON public.students;
DROP POLICY IF EXISTS "students_insert_update_delete_policy" ON public.students;
DROP POLICY IF EXISTS "students_select_policy" ON public.students;

-- Allow students to insert their own record if they have the student role
CREATE POLICY "Allow student self-insertion" ON public.students
  FOR INSERT WITH CHECK (
    auth.uid() = profile_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
  );

-- Allow students to view their own record
CREATE POLICY "Students can view own record" ON public.students
  FOR SELECT USING (profile_id = auth.uid());

-- Allow professors and admins to view all students
CREATE POLICY "Staff can view all students" ON public.students
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('professor', 'admin'))
  );

-- Allow admins full access
CREATE POLICY "Admins full access on students" ON public.students
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- 2. Professors Table
DROP POLICY IF EXISTS "Admins can manage professors" ON public.professors;
DROP POLICY IF EXISTS "Professors can view their own record" ON public.professors;
DROP POLICY IF EXISTS "Everyone can view professors" ON public.professors;
DROP POLICY IF EXISTS "professors_select_policy" ON public.professors;

-- Allow professors to insert their own record if they have the professor role
CREATE POLICY "Allow professor self-insertion" ON public.professors
  FOR INSERT WITH CHECK (
    auth.uid() = profile_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'professor')
  );

-- Allow professors to view their own record
CREATE POLICY "Professors can view own record" ON public.professors
  FOR SELECT USING (profile_id = auth.uid());

-- Allow everyone to view professors list
CREATE POLICY "Everyone can view professors" ON public.professors
  FOR SELECT USING (true);

-- Allow admins full access
CREATE POLICY "Admins full access on professors" ON public.professors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
