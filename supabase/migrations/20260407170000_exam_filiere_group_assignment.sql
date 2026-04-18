-- Migration: Exam Assignment to Filieres and Groups
-- Date: 2026-04-07

BEGIN;

-- 1. Add assignment columns to exams table
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS filiere_id INTEGER REFERENCES public.filieres(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS student_group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL;

-- 2. Function to automatically sync students based on filiere or group
CREATE OR REPLACE FUNCTION public.sync_exam_students(p_exam_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_filiere_id INTEGER;
    v_group_id UUID;
    v_course_id INTEGER;
    v_student_record RECORD;
BEGIN
    -- Get exam assignment info
    SELECT filiere_id, student_group_id, course_id INTO v_filiere_id, v_group_id, v_course_id
    FROM public.exams WHERE id = p_exam_id;

    -- If assigned to a Filiere
    IF v_filiere_id IS NOT NULL THEN
        FOR v_student_record IN 
            SELECT profile_id
            FROM public.students
            WHERE filiere_id = v_filiere_id
              AND profile_id IS NOT NULL
        LOOP
            INSERT INTO public.student_exams (student_id, exam_id, course_id, status)
            VALUES (v_student_record.profile_id, p_exam_id, v_course_id, 'scheduled')
            ON CONFLICT (student_id, exam_id) DO NOTHING;
        END LOOP;
    END IF;

    -- If assigned to a Group
    IF v_group_id IS NOT NULL THEN
        FOR v_student_record IN 
            SELECT s.profile_id
            FROM public.group_memberships gm
            JOIN public.students s ON s.id = gm.student_id
            WHERE gm.group_id = v_group_id
              AND s.profile_id IS NOT NULL
        LOOP
            INSERT INTO public.student_exams (student_id, exam_id, course_id, status)
            VALUES (v_student_record.profile_id, p_exam_id, v_course_id, 'scheduled')
            ON CONFLICT (student_id, exam_id) DO NOTHING;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger to auto-sync students on exam update/insert
CREATE OR REPLACE FUNCTION public.on_exam_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR 
       (NEW.filiere_id IS DISTINCT FROM OLD.filiere_id) OR 
       (NEW.student_group_id IS DISTINCT FROM OLD.student_group_id) THEN
        PERFORM public.sync_exam_students(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_exam_students ON public.exams;
CREATE TRIGGER trigger_sync_exam_students
AFTER INSERT OR UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.on_exam_assignment_change();

COMMIT;
