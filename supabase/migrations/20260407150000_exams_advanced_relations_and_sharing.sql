-- Migration: Advanced Exam Relations and Sharing
-- Date: 2026-04-07
-- Description: Adds shareable links, practice relations, and improved tracking for exams.

BEGIN;

-- 1. Add share_token to exams for direct access
-- This allows teachers to share a unique link with students
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid() NOT NULL;

IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exams_share_token') THEN
    CREATE UNIQUE INDEX idx_exams_share_token ON public.exams(share_token);
END IF;

-- 2. Add hierarchical and practice relations to exams
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS parent_exam_id INTEGER REFERENCES public.exams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_practice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS practice_quiz_id UUID REFERENCES public.practice_quizzes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'evaluation';

-- Add comment for category
COMMENT ON COLUMN public.exams.category IS 'evaluation, training, mock_exam, challenge';

-- 3. Add metadata for student tracking via link in student_exams
ALTER TABLE public.student_exams
ADD COLUMN IF NOT EXISTS joined_via_link BOOLEAN DEFAULT false;

-- 4. View for students to see their exams (past, current, future) with course info
CREATE OR REPLACE VIEW public.student_exams_dashboard AS
SELECT 
    se.id as registration_id,
    e.id as exam_id,
    e.title,
    e.date as exam_date,
    e.duration,
    e.type as exam_type,
    e.category as exam_category,
    e.status as exam_status,
    e.share_token,
    se.student_id,
    s.profile_id as student_profile_id,
    se.status as student_status,
    se.grade,
    se.attendance,
    se.joined_via_link,
    c.name as course_name,
    c.code as course_code,
    p.first_name || ' ' || p.last_name as professor_name
FROM public.student_exams se
JOIN public.exams e ON se.exam_id = e.id
JOIN public.courses c ON e.course_id = c.id
JOIN public.students s ON se.student_id = s.id
JOIN public.professors prof ON e.professor_id = prof.id
JOIN public.profiles p ON prof.profile_id = p.id;

-- 5. Function to join exam via token
-- This function handles the logic of registering a student to an exam using a token
CREATE OR REPLACE FUNCTION public.join_exam_by_token(p_share_token UUID, p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_exam_id INTEGER;
    v_student_id INTEGER;
    v_exam_record RECORD;
    v_existing_registration_id INTEGER;
BEGIN
    -- Get exam by token
    SELECT * INTO v_exam_record FROM public.exams WHERE share_token = p_share_token;
    
    IF v_exam_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Examen non trouvé');
    END IF;

    -- Get student_id from profiles
    SELECT id INTO v_student_id FROM public.students WHERE profile_id = p_profile_id;
    
    IF v_student_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Vous n''êtes pas enregistré en tant qu''étudiant');
    END IF;

    -- Check if already registered
    SELECT id INTO v_existing_registration_id 
    FROM public.student_exams 
    WHERE student_id = v_student_id AND exam_id = v_exam_record.id;

    IF v_existing_registration_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true, 
            'exam_id', v_exam_record.id, 
            'already_registered', true,
            'message', 'Vous êtes déjà inscrit à cet examen'
        );
    END IF;

    -- Register student
    INSERT INTO public.student_exams (student_id, exam_id, joined_via_link, status)
    VALUES (v_student_id, v_exam_record.id, true, 'scheduled');

    RETURN jsonb_build_object(
        'success', true, 
        'exam_id', v_exam_record.id, 
        'new_registration', true,
        'title', v_exam_record.title,
        'message', 'Vous avez rejoint l''examen avec succès'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add policy for public/token access if needed
-- For now, the function is SECURITY DEFINER, so it bypasses RLS for the join operation.
-- We should ensure students can see exams they joined via link.
-- The existing student_read_own_exams policy already covers this because it checks student_exams.

COMMIT;
