create extension if not exists pgcrypto;

create table if not exists public.exam_questions (
  id serial primary key,
  exam_id integer not null references public.exams(id) on delete cascade,
  question_number integer not null,
  question_text text not null,
  question_type text not null,
  points numeric(10,2) not null,
  options jsonb,
  correct_answer text,
  rubric text,
  created_at timestamptz not null default now()
);

alter table public.exam_questions enable row level security;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exam_questions'
      and column_name = 'created_at'
  ) then
    alter table public.exam_questions
      add column created_at timestamptz not null default now();
  end if;
end
$$;

create unique index if not exists exam_questions_exam_id_question_number_uidx
  on public.exam_questions (exam_id, question_number);

create index if not exists exam_questions_exam_id_idx
  on public.exam_questions (exam_id);

create table if not exists public.exam_grades (
  id uuid primary key default gen_random_uuid(),
  student_exam_id integer not null references public.student_exams(id) on delete cascade,
  question_id integer not null references public.exam_questions(id) on delete cascade,
  points_earned numeric(10,2) not null,
  feedback text,
  graded_at timestamptz not null default now(),
  graded_by integer not null references public.professors(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exam_grades enable row level security;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exam_grades'
      and column_name = 'created_at'
  ) then
    alter table public.exam_grades
      add column created_at timestamptz not null default now();
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exam_grades'
      and column_name = 'updated_at'
  ) then
    alter table public.exam_grades
      add column updated_at timestamptz not null default now();
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exam_grades'
      and column_name = 'graded_at'
  ) then
    alter table public.exam_grades
      add column graded_at timestamptz not null default now();
  end if;
end
$$;

do $$
declare
  graded_by_type text;
begin
  select c.udt_name
  into graded_by_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'exam_grades'
    and c.column_name = 'graded_by';

  if graded_by_type is null then
    alter table public.exam_grades
      add column graded_by integer;
  elsif graded_by_type <> 'int4' then
    alter table public.exam_grades
      add column if not exists graded_by_new integer;

    update public.exam_grades eg
    set graded_by_new = p.id
    from public.professors p
    where p.profile_id::text = eg.graded_by::text;

    if exists (
      select 1
      from public.exam_grades
      where graded_by is not null
        and graded_by_new is null
    ) then
      raise exception 'Impossible de convertir exam_grades.graded_by vers professors.id sans perte de donnees';
    end if;

    alter table public.exam_grades drop constraint if exists exam_grades_graded_by_fkey;
    alter table public.exam_grades drop column graded_by;
    alter table public.exam_grades rename column graded_by_new to graded_by;
  end if;

  alter table public.exam_grades alter column graded_by set not null;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'exam_grades_graded_by_fkey'
      and conrelid = 'public.exam_grades'::regclass
  ) then
    alter table public.exam_grades
      add constraint exam_grades_graded_by_fkey
      foreign key (graded_by) references public.professors(id) on delete cascade;
  end if;
end
$$;

create unique index if not exists exam_grades_student_exam_id_question_id_uidx
  on public.exam_grades (student_exam_id, question_id);

create index if not exists exam_grades_student_exam_id_idx
  on public.exam_grades (student_exam_id);

drop policy if exists admin_all_exam_questions on public.exam_questions;
drop policy if exists professor_crud_own_exam_questions on public.exam_questions;
drop policy if exists exam_questions_admin_all on public.exam_questions;
drop policy if exists exam_questions_professor_manage on public.exam_questions;
drop policy if exists exam_questions_student_read on public.exam_questions;

create policy exam_questions_admin_all
  on public.exam_questions
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

create policy exam_questions_professor_manage
  on public.exam_questions
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.exams e
      where e.id = exam_questions.exam_id
        and e.professor_id = auth.uid()
    )
    or exists (
      select 1
      from public.exams e
      join public.professor_courses pc on pc.course_id = e.course_id
      where e.id = exam_questions.exam_id
        and pc.professor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.exams e
      where e.id = exam_questions.exam_id
        and e.professor_id = auth.uid()
    )
    or exists (
      select 1
      from public.exams e
      join public.professor_courses pc on pc.course_id = e.course_id
      where e.id = exam_questions.exam_id
        and pc.professor_id = auth.uid()
    )
  );

create policy exam_questions_student_read
  on public.exam_questions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.student_exams se
      where se.exam_id = exam_questions.exam_id
        and se.student_id = auth.uid()
    )
  );

drop policy if exists admin_all_exam_grades on public.exam_grades;
drop policy if exists professor_crud_own_exam_grades on public.exam_grades;
drop policy if exists student_read_own_exam_grades on public.exam_grades;
drop policy if exists exam_grades_admin_all on public.exam_grades;
drop policy if exists exam_grades_professor_manage on public.exam_grades;
drop policy if exists exam_grades_student_read on public.exam_grades;

create policy exam_grades_admin_all
  on public.exam_grades
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

create policy exam_grades_professor_manage
  on public.exam_grades
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.student_exams se
      join public.exams e on e.id = se.exam_id
      where se.id = exam_grades.student_exam_id
        and e.professor_id = auth.uid()
    )
    or exists (
      select 1
      from public.student_exams se
      join public.exams e on e.id = se.exam_id
      join public.professor_courses pc on pc.course_id = e.course_id
      where se.id = exam_grades.student_exam_id
        and pc.professor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.student_exams se
      join public.exams e on e.id = se.exam_id
      where se.id = exam_grades.student_exam_id
        and e.professor_id = auth.uid()
    )
    or exists (
      select 1
      from public.student_exams se
      join public.exams e on e.id = se.exam_id
      join public.professor_courses pc on pc.course_id = e.course_id
      where se.id = exam_grades.student_exam_id
        and pc.professor_id = auth.uid()
    )
  );

create policy exam_grades_student_read
  on public.exam_grades
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.student_exams se
      where se.id = exam_grades.student_exam_id
        and se.student_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';
