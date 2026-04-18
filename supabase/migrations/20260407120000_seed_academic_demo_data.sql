-- Migration: Seed academic demo data
-- Created: 2026-04-07
-- Already applied directly to production database.
-- This file documents the seed operations for version control.

-- 1. Professor entity for prof.esgis (profile_id = 04540b2a-...)
INSERT INTO professors (profile_id, employee_number, hire_date, specialties, status, department_id)
SELECT '04540b2a-27cf-44a9-bcd5-c97e3465c0c8', 'PROF-001', '2020-09-01',
       ARRAY['Informatique','Algorithmique'], 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM professors WHERE profile_id = '04540b2a-27cf-44a9-bcd5-c97e3465c0c8')
  AND EXISTS (SELECT 1 FROM profiles WHERE id = '04540b2a-27cf-44a9-bcd5-c97e3465c0c8')
  AND EXISTS (SELECT 1 FROM departments WHERE id = 1);

-- 2. Student entities already existed (auto-created by auth hook)

-- 3. Courses (8 L2 Informatique courses)
INSERT INTO courses (name, code, description, department_id, credits, semester, level) SELECT 'Algorithmique et Structures de Données', 'INFO201', 'Algorithmique', 1, 4, 1, 'L2' WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code='INFO201') AND EXISTS (SELECT 1 FROM departments WHERE id = 1);
INSERT INTO courses (name, code, description, department_id, credits, semester, level) SELECT 'Programmation Orientée Objet', 'INFO202', 'Java et POO', 1, 4, 1, 'L2' WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code='INFO202') AND EXISTS (SELECT 1 FROM departments WHERE id = 1);
INSERT INTO courses (name, code, description, department_id, credits, semester, level) SELECT 'Bases de Données', 'INFO203', 'SQL et modélisation', 1, 3, 1, 'L2' WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code='INFO203') AND EXISTS (SELECT 1 FROM departments WHERE id = 1);
INSERT INTO courses (name, code, description, department_id, credits, semester, level) SELECT 'Réseaux Informatiques', 'INFO204', 'Protocoles réseau', 1, 3, 1, 'L2' WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code='INFO204') AND EXISTS (SELECT 1 FROM departments WHERE id = 1);
INSERT INTO courses (name, code, description, department_id, credits, semester, level) SELECT 'Développement Web', 'INFO205', 'HTML CSS JS', 1, 3, 2, 'L2' WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code='INFO205') AND EXISTS (SELECT 1 FROM departments WHERE id = 1);
INSERT INTO courses (name, code, description, department_id, credits, semester, level) SELECT 'Mathématiques Discrètes', 'MATH201', 'Logique et combinatoire', 1, 3, 1, 'L2' WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code='MATH201') AND EXISTS (SELECT 1 FROM departments WHERE id = 1);
INSERT INTO courses (name, code, description, department_id, credits, semester, level) SELECT 'Anglais Professionnel', 'LANG201', 'Anglais technique', 1, 2, 1, 'L2' WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code='LANG201') AND EXISTS (SELECT 1 FROM departments WHERE id = 1);
INSERT INTO courses (name, code, description, department_id, credits, semester, level) SELECT 'Gestion de Projets IT', 'INFO206', 'Agile et gestion de projet', 1, 2, 2, 'L2' WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code='INFO206') AND EXISTS (SELECT 1 FROM departments WHERE id = 1);

-- 4. Professor-course assignments (professor_id is UUID = profile_id)
INSERT INTO professor_courses (professor_id, course_id, academic_year)
SELECT '04540b2a-27cf-44a9-bcd5-c97e3465c0c8'::uuid, c.id, '2025-2026'
FROM courses c
WHERE c.code IN ('INFO201','INFO202','INFO203','INFO204','INFO205','MATH201','LANG201','INFO206')
  AND EXISTS (SELECT 1 FROM profiles WHERE id = '04540b2a-27cf-44a9-bcd5-c97e3465c0c8')
  AND NOT EXISTS (SELECT 1 FROM professor_courses pc WHERE pc.professor_id = '04540b2a-27cf-44a9-bcd5-c97e3465c0c8' AND pc.course_id = c.id);

-- 5. Student enrollments (student_id is UUID = profile_id)
-- Marie Koné
INSERT INTO student_courses (student_id, course_id, academic_year, status, student_entity_id, semester)
SELECT 'e00fe335-73a1-40ba-b341-e3dfee0456b2', c.id, '2025-2026', 'enrolled', s.id, c.semester
FROM courses c CROSS JOIN students s
WHERE s.profile_id = 'e00fe335-73a1-40ba-b341-e3dfee0456b2'
  AND c.code IN ('INFO201','INFO202','INFO203','INFO204','INFO205','MATH201','LANG201','INFO206')
  AND NOT EXISTS (SELECT 1 FROM student_courses sc WHERE sc.student_id = 'e00fe335-73a1-40ba-b341-e3dfee0456b2' AND sc.course_id = c.id);

-- Floriace HELMUT
INSERT INTO student_courses (student_id, course_id, academic_year, status, student_entity_id, semester)
SELECT '9ed9e5d9-0536-4ad3-8461-b06834dbaf69', c.id, '2025-2026', 'enrolled', s.id, c.semester
FROM courses c CROSS JOIN students s
WHERE s.profile_id = '9ed9e5d9-0536-4ad3-8461-b06834dbaf69'
  AND c.code IN ('INFO201','INFO202','INFO203','MATH201','LANG201')
  AND NOT EXISTS (SELECT 1 FROM student_courses sc WHERE sc.student_id = '9ed9e5d9-0536-4ad3-8461-b06834dbaf69' AND sc.course_id = c.id);

-- 6. Course sessions (upcoming + past)
INSERT INTO course_sessions (course_id, professor_id, date, duration, room, status, department_id, level_code)
SELECT c.id, p.id, d.dt, d.dur, d.room, d.st, 1, 'L2'
FROM (VALUES
  ('INFO201', NOW() + INTERVAL '1 day 08:00', 120, 'Salle A101', 'scheduled'),
  ('INFO202', NOW() + INTERVAL '1 day 10:30', 90, 'Salle B202', 'scheduled'),
  ('INFO203', NOW() + INTERVAL '2 day 08:00', 120, 'Labo Info 1', 'scheduled'),
  ('INFO204', NOW() + INTERVAL '2 day 14:00', 90, 'Salle C103', 'scheduled'),
  ('MATH201', NOW() + INTERVAL '3 day 08:00', 120, 'Amphi A', 'scheduled'),
  ('LANG201', NOW() + INTERVAL '3 day 10:30', 90, 'Salle D201', 'scheduled'),
  ('INFO205', NOW() + INTERVAL '4 day 08:00', 120, 'Labo Info 2', 'scheduled'),
  ('INFO206', NOW() + INTERVAL '4 day 14:00', 90, 'Salle B105', 'scheduled'),
  ('INFO201', NOW() + INTERVAL '8 day 08:00', 120, 'Salle A101', 'scheduled'),
  ('INFO202', NOW() + INTERVAL '8 day 10:30', 90, 'Salle B202', 'scheduled'),
  ('INFO201', NOW() - INTERVAL '7 day' + TIME '08:00', 120, 'Salle A101', 'completed'),
  ('INFO202', NOW() - INTERVAL '7 day' + TIME '10:30', 90, 'Salle B202', 'completed'),
  ('INFO203', NOW() - INTERVAL '6 day' + TIME '08:00', 120, 'Labo Info 1', 'completed'),
  ('MATH201', NOW() - INTERVAL '4 day' + TIME '08:00', 120, 'Amphi A', 'completed'),
  ('LANG201', NOW() - INTERVAL '4 day' + TIME '10:30', 90, 'Salle D201', 'completed')
) AS d(code, dt, dur, room, st)
JOIN courses c ON c.code = d.code
CROSS JOIN professors p
WHERE p.profile_id = '04540b2a-27cf-44a9-bcd5-c97e3465c0c8';

-- 7. Grades for Marie Koné (9 grades)
INSERT INTO grades (student_id, course_id, professor_id, evaluation_type, coefficient, value, max_value, comment, evaluation_date, is_published, published_at)
SELECT s.id, c.id, p.id, g.eval_type, g.coeff, g.val, 20, g.cmt, g.eval_date::date, true, NOW() - INTERVAL '2 days'
FROM (VALUES
  ('INFO201', 'Controle Continu', 1.0, 14.5, 'Bon travail en algorithmique', '2026-03-15'),
  ('INFO201', 'Examen Partiel', 2.0, 12.0, 'Correcte mais manque de rigueur', '2026-03-28'),
  ('INFO202', 'Controle Continu', 1.0, 16.0, 'Excellente maitrise de la POO', '2026-03-12'),
  ('INFO202', 'TP Note', 1.0, 15.0, 'Projet Java bien structure', '2026-03-20'),
  ('INFO203', 'Controle Continu', 1.0, 13.0, 'Requetes SQL correctes', '2026-03-18'),
  ('INFO204', 'Controle Continu', 1.0, 11.5, 'Concepts reseau acquis', '2026-03-22'),
  ('MATH201', 'Controle Continu', 1.0, 15.5, 'Tres bonne logique propositionnelle', '2026-03-10'),
  ('MATH201', 'Examen Partiel', 2.0, 14.0, 'Bonne performance en combinatoire', '2026-03-25'),
  ('LANG201', 'Controle Continu', 1.0, 13.5, 'Bon niveau anglais technique', '2026-03-14')
) AS g(code, eval_type, coeff, val, cmt, eval_date)
JOIN courses c ON c.code = g.code
CROSS JOIN students s CROSS JOIN professors p
WHERE s.profile_id = 'e00fe335-73a1-40ba-b341-e3dfee0456b2'
  AND p.profile_id = '04540b2a-27cf-44a9-bcd5-c97e3465c0c8'
  AND NOT EXISTS (SELECT 1 FROM grades gr WHERE gr.student_id = s.id AND gr.course_id = c.id AND gr.evaluation_type = g.eval_type);

-- 8. Grades for Floriace HELMUT (5 grades)
INSERT INTO grades (student_id, course_id, professor_id, evaluation_type, coefficient, value, max_value, comment, evaluation_date, is_published, published_at)
SELECT s.id, c.id, p.id, g.eval_type, g.coeff, g.val, 20, g.cmt, g.eval_date::date, true, NOW() - INTERVAL '2 days'
FROM (VALUES
  ('INFO201', 'Controle Continu', 1.0, 16.0, 'Excellent travail', '2026-03-15'),
  ('INFO202', 'Controle Continu', 1.0, 17.5, 'Maitrise remarquable de la POO', '2026-03-12'),
  ('INFO203', 'Controle Continu', 1.0, 14.0, 'Bon niveau en SQL', '2026-03-18'),
  ('MATH201', 'Controle Continu', 1.0, 12.5, 'Resultats corrects en logique', '2026-03-10'),
  ('LANG201', 'Controle Continu', 1.0, 15.0, 'Tres bon niveau anglais', '2026-03-14')
) AS g(code, eval_type, coeff, val, cmt, eval_date)
JOIN courses c ON c.code = g.code
CROSS JOIN students s CROSS JOIN professors p
WHERE s.profile_id = '9ed9e5d9-0536-4ad3-8461-b06834dbaf69'
  AND p.profile_id = '04540b2a-27cf-44a9-bcd5-c97e3465c0c8'
  AND NOT EXISTS (SELECT 1 FROM grades gr WHERE gr.student_id = s.id AND gr.course_id = c.id AND gr.evaluation_type = g.eval_type);
