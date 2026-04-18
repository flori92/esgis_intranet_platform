-- Cleanup test students and data to match exactly 40 students assigned to Floriace FAVI
-- Students to remove: Floriace HELMUT (id: 2) and Marie Koné (id: 6)

-- 1. Remove related data for these students
DELETE FROM public.grades WHERE student_id IN (2, 6);
DELETE FROM public.attendances WHERE student_id IN (2, 6);
DELETE FROM public.student_courses WHERE student_entity_id IN (2, 6);
DELETE FROM public.student_exams WHERE student_id IN (
    SELECT profile_id FROM public.students WHERE id IN (2, 6)
);
DELETE FROM public.course_activity_progress WHERE student_id IN (2, 6);
DELETE FROM public.student_performance_analytics WHERE student_id IN (2, 6);

-- 2. Remove from students table
DELETE FROM public.students WHERE id IN (2, 6);

-- 3. Remove from profiles (optional, but cleaner if they are test accounts)
-- DELETE FROM public.profiles WHERE full_name IN ('Floriace HELMUT', 'Marie Koné');
