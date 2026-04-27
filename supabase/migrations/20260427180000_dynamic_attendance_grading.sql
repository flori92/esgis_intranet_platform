-- Migration: Dynamic Attendance Grading for Course 9 (Virtualisation)
-- Date: 2026-04-27
-- Author: Gemini CLI

-- 1. Create or Update the grading function
CREATE OR REPLACE FUNCTION update_attendance_grade()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id INTEGER;
    v_presence_count INTEGER;
    v_grade NUMERIC;
BEGIN
    -- Determine the student ID
    IF (TG_OP = 'DELETE') THEN
        v_student_id := OLD.student_id;
    ELSE
        v_student_id := NEW.student_id;
    END IF;

    -- Calculate presence for Course 9 (Virtualisation) with Professor 3 (Floriace FAVI)
    -- treating 'present' and 'excused' as present.
    SELECT COUNT(*) INTO v_presence_count
    FROM attendances
    WHERE student_id = v_student_id 
    AND session_id IN (SELECT id FROM course_sessions WHERE course_id = 9 AND professor_id = 3)
    AND status IN ('present', 'excused');

    -- Apply the custom non-linear scale (7 sessions total)
    v_grade := CASE
        WHEN v_presence_count >= 7 THEN 10.0
        WHEN v_presence_count = 6 THEN 8.5
        WHEN v_presence_count = 5 THEN 7.0
        WHEN v_presence_count = 4 THEN 5.0
        WHEN v_presence_count = 3 THEN 4.0
        WHEN v_presence_count = 2 THEN 3.0
        WHEN v_presence_count = 1 THEN 1.0
        ELSE 0.0
    END;

    -- Update the grades table
    UPDATE grades 
    SET value = v_grade, updated_at = NOW()
    WHERE student_id = v_student_id 
    AND course_id = 9 
    AND professor_id = 3 
    AND evaluation_type = 'Note de Présence';

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the trigger to the attendances table
DROP TRIGGER IF EXISTS trg_update_attendance_grade ON attendances;
CREATE TRIGGER trg_update_attendance_grade
AFTER INSERT OR UPDATE OR DELETE ON attendances
FOR EACH ROW EXECUTE FUNCTION update_attendance_grade();

-- 3. Ensure the session for 2026-04-28 exists (Idempotent insert)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM course_sessions WHERE date::date = '2026-04-28' AND course_id = 9) THEN
        INSERT INTO course_sessions (course_id, professor_id, date, duration, room, level_code, department_id, status)
        VALUES (9, 3, '2026-04-28 17:00:00+00', 180, 'En ligne/Présentiel', 'M1', 7, 'completed');
    END IF;
END $$;

-- 4. Initialize grades if they don't exist (Unpublished)
INSERT INTO grades (student_id, course_id, professor_id, evaluation_type, value, max_value, evaluation_date, is_published, coefficient)
SELECT 
    s.id, 
    9, 
    3, 
    'Note de Présence', 
    0, -- Initialized to 0, will be updated by trigger or calculation below
    10.00,
    '2026-04-27',
    false,
    1.00
FROM students s
JOIN student_courses sc ON s.id = sc.student_entity_id
WHERE sc.course_id = 9
ON CONFLICT (student_id, course_id, evaluation_type, professor_id) DO NOTHING;

-- 5. Force a recalculation for all students in the course
UPDATE grades g
SET value = CASE
    WHEN stats.total_present >= 7 THEN 10.0
    WHEN stats.total_present = 6 THEN 8.5
    WHEN stats.total_present = 5 THEN 7.0
    WHEN stats.total_present = 4 THEN 5.0
    WHEN stats.total_present = 3 THEN 4.0
    WHEN stats.total_present = 2 THEN 3.0
    WHEN stats.total_present = 1 THEN 1.0
    ELSE 0.0
END
FROM (
    SELECT 
        s.id as student_id,
        COUNT(CASE WHEN a.status IN ('present', 'excused') THEN 1 END) as total_present
    FROM students s
    JOIN student_courses sc ON s.id = sc.student_entity_id
    LEFT JOIN attendances a ON s.id = a.student_id AND a.session_id IN (SELECT id FROM course_sessions WHERE course_id = 9 AND professor_id = 3)
    WHERE sc.course_id = 9
    GROUP BY s.id
) stats
WHERE g.student_id = stats.student_id 
AND g.course_id = 9 
AND g.professor_id = 3 
AND g.evaluation_type = 'Note de Présence';
