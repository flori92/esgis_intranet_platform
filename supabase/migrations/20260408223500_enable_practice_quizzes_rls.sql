alter table public.practice_quizzes enable row level security;
alter table public.practice_quiz_attempts enable row level security;

drop policy if exists practice_quizzes_admin_all on public.practice_quizzes;
drop policy if exists practice_quizzes_professor_manage on public.practice_quizzes;
drop policy if exists practice_quizzes_student_read on public.practice_quizzes;

create policy practice_quizzes_admin_all
  on public.practice_quizzes
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

create policy practice_quizzes_professor_manage
  on public.practice_quizzes
  for all
  to authenticated
  using (
    practice_quizzes.professeur_id = auth.uid()
    or exists (
      select 1
      from public.professor_courses pc
      where pc.course_id = practice_quizzes.course_id
        and pc.professor_id = auth.uid()
    )
  )
  with check (
    practice_quizzes.professeur_id = auth.uid()
    or exists (
      select 1
      from public.professor_courses pc
      where pc.course_id = practice_quizzes.course_id
        and pc.professor_id = auth.uid()
    )
  );

create policy practice_quizzes_student_read
  on public.practice_quizzes
  for select
  to authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.student_courses sc
      where sc.course_id = practice_quizzes.course_id
        and sc.student_id = auth.uid()
        and coalesce(sc.status, 'enrolled') = 'enrolled'
    )
  );

drop policy if exists practice_quiz_attempts_admin_all on public.practice_quiz_attempts;
drop policy if exists practice_quiz_attempts_professor_read on public.practice_quiz_attempts;
drop policy if exists practice_quiz_attempts_student_manage on public.practice_quiz_attempts;

create policy practice_quiz_attempts_admin_all
  on public.practice_quiz_attempts
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

create policy practice_quiz_attempts_professor_read
  on public.practice_quiz_attempts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.practice_quizzes pq
      where pq.id = practice_quiz_attempts.quiz_id
        and (
          pq.professeur_id = auth.uid()
          or exists (
            select 1
            from public.professor_courses pc
            where pc.course_id = pq.course_id
              and pc.professor_id = auth.uid()
          )
        )
    )
  );

create policy practice_quiz_attempts_student_manage
  on public.practice_quiz_attempts
  for all
  to authenticated
  using (
    practice_quiz_attempts.student_id = auth.uid()
  )
  with check (
    practice_quiz_attempts.student_id = auth.uid()
    and exists (
      select 1
      from public.practice_quizzes pq
      join public.student_courses sc on sc.course_id = pq.course_id
      where pq.id = practice_quiz_attempts.quiz_id
        and sc.student_id = auth.uid()
        and coalesce(sc.status, 'enrolled') = 'enrolled'
    )
  );

notify pgrst, 'reload schema';
