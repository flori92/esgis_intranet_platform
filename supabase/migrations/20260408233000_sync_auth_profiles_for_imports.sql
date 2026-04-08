-- ============================================================
-- Migration: Sync authenticated accounts with pre-imported profiles
-- Date: 2026-04-08
-- Description:
--   Permet de rattacher automatiquement un compte Auth à une fiche
--   utilisateur pré-importée existante via l'email, puis de migrer
--   toutes les références UUID de l'ancien profile_id vers auth.uid().
-- ============================================================

create or replace function public.sync_auth_profile(
  p_full_name text default null,
  p_role text default null,
  p_department_id integer default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_auth_id uuid := auth.uid();
  v_auth_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  v_requested_role text := lower(trim(coalesce(p_role, '')));
  v_current_profile public.profiles%rowtype;
  v_legacy_profile public.profiles%rowtype;
  v_old_profile_id uuid;
  v_old_student_id integer;
  v_new_student_id integer;
  v_old_professor_id integer;
  v_new_professor_id integer;
  v_temp_email text;
  fk record;
begin
  if v_auth_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if v_auth_email = '' then
    raise exception 'AUTH_EMAIL_MISSING';
  end if;

  if v_requested_role not in ('', 'student', 'professor', 'admin') then
    v_requested_role := '';
  end if;

  select *
  into v_current_profile
  from public.profiles
  where id = v_auth_id;

  select *
  into v_legacy_profile
  from public.profiles
  where lower(email) = v_auth_email
    and id <> v_auth_id
  order by updated_at desc nulls last, created_at desc nulls last
  limit 1;

  if v_legacy_profile.id is not null then
    v_old_profile_id := v_legacy_profile.id;
    v_temp_email := format(
      'legacy-%s-%s@invalid.local',
      substr(md5(v_auth_email), 1, 10),
      substr(replace(v_old_profile_id::text, '-', ''), 1, 12)
    );

    update public.profiles
    set email = v_temp_email,
        updated_at = now()
    where id = v_old_profile_id;

    select id
    into v_old_student_id
    from public.students
    where profile_id = v_old_profile_id
    limit 1;

    select id
    into v_new_student_id
    from public.students
    where profile_id = v_auth_id
    limit 1;

    if v_old_student_id is not null and v_new_student_id is not null and v_old_student_id <> v_new_student_id then
      for fk in
        select
          ns.nspname as schema_name,
          cls.relname as table_name,
          att.attname as column_name
        from pg_constraint con
        join pg_class cls on cls.oid = con.conrelid
        join pg_namespace ns on ns.oid = cls.relnamespace
        join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
        where con.contype = 'f'
          and con.confrelid = 'public.students'::regclass
          and array_length(con.conkey, 1) = 1
          and array_length(con.confkey, 1) = 1
          and ns.nspname = 'public'
          and cls.relname <> 'students'
      loop
        execute format(
          'update %I.%I set %I = $1 where %I = $2',
          fk.schema_name,
          fk.table_name,
          fk.column_name,
          fk.column_name
        )
        using v_old_student_id, v_new_student_id;
      end loop;

      delete from public.students where id = v_new_student_id;
    end if;

    select id
    into v_old_professor_id
    from public.professors
    where profile_id = v_old_profile_id
    limit 1;

    select id
    into v_new_professor_id
    from public.professors
    where profile_id = v_auth_id
    limit 1;

    if v_old_professor_id is not null and v_new_professor_id is not null and v_old_professor_id <> v_new_professor_id then
      for fk in
        select
          ns.nspname as schema_name,
          cls.relname as table_name,
          att.attname as column_name
        from pg_constraint con
        join pg_class cls on cls.oid = con.conrelid
        join pg_namespace ns on ns.oid = cls.relnamespace
        join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
        where con.contype = 'f'
          and con.confrelid = 'public.professors'::regclass
          and array_length(con.conkey, 1) = 1
          and array_length(con.confkey, 1) = 1
          and ns.nspname = 'public'
          and cls.relname <> 'professors'
      loop
        execute format(
          'update %I.%I set %I = $1 where %I = $2',
          fk.schema_name,
          fk.table_name,
          fk.column_name,
          fk.column_name
        )
        using v_old_professor_id, v_new_professor_id;
      end loop;

      delete from public.professors where id = v_new_professor_id;
    end if;

    if v_current_profile.id is null then
      insert into public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        role,
        department_id,
        is_active,
        created_at,
        updated_at,
        first_name,
        last_name,
        phone,
        address,
        bio,
        birth_date,
        secondary_email,
        cv_url,
        notification_preferences,
        language
      )
      values (
        v_auth_id,
        v_auth_email,
        coalesce(nullif(trim(v_legacy_profile.full_name), ''), nullif(trim(p_full_name), ''), v_auth_email),
        v_legacy_profile.avatar_url,
        coalesce(v_legacy_profile.role, nullif(v_requested_role, ''), 'student'),
        coalesce(v_legacy_profile.department_id, p_department_id),
        coalesce(v_legacy_profile.is_active, true),
        coalesce(v_legacy_profile.created_at, now()),
        now(),
        v_legacy_profile.first_name,
        v_legacy_profile.last_name,
        v_legacy_profile.phone,
        v_legacy_profile.address,
        v_legacy_profile.bio,
        v_legacy_profile.birth_date,
        v_legacy_profile.secondary_email,
        v_legacy_profile.cv_url,
        coalesce(v_legacy_profile.notification_preferences, '{}'::jsonb),
        coalesce(v_legacy_profile.language, 'fr')
      )
      returning * into v_current_profile;
    else
      update public.profiles
      set email = v_auth_email,
          full_name = coalesce(nullif(trim(v_current_profile.full_name), ''), nullif(trim(v_legacy_profile.full_name), ''), nullif(trim(p_full_name), ''), v_auth_email),
          avatar_url = coalesce(v_current_profile.avatar_url, v_legacy_profile.avatar_url),
          role = coalesce(v_current_profile.role, v_legacy_profile.role, nullif(v_requested_role, ''), 'student'),
          department_id = coalesce(v_current_profile.department_id, v_legacy_profile.department_id, p_department_id),
          is_active = coalesce(v_current_profile.is_active, v_legacy_profile.is_active, true),
          first_name = coalesce(v_current_profile.first_name, v_legacy_profile.first_name),
          last_name = coalesce(v_current_profile.last_name, v_legacy_profile.last_name),
          phone = coalesce(v_current_profile.phone, v_legacy_profile.phone),
          address = coalesce(v_current_profile.address, v_legacy_profile.address),
          bio = coalesce(v_current_profile.bio, v_legacy_profile.bio),
          birth_date = coalesce(v_current_profile.birth_date, v_legacy_profile.birth_date),
          secondary_email = coalesce(v_current_profile.secondary_email, v_legacy_profile.secondary_email),
          cv_url = coalesce(v_current_profile.cv_url, v_legacy_profile.cv_url),
          notification_preferences = coalesce(v_current_profile.notification_preferences, v_legacy_profile.notification_preferences, '{}'::jsonb),
          language = coalesce(v_current_profile.language, v_legacy_profile.language, 'fr'),
          updated_at = now()
      where id = v_auth_id
      returning * into v_current_profile;
    end if;

    for fk in
      select
        ns.nspname as schema_name,
        cls.relname as table_name,
        att.attname as column_name
      from pg_constraint con
      join pg_class cls on cls.oid = con.conrelid
      join pg_namespace ns on ns.oid = cls.relnamespace
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
      where con.contype = 'f'
        and con.confrelid = 'public.profiles'::regclass
        and array_length(con.conkey, 1) = 1
        and array_length(con.confkey, 1) = 1
        and ns.nspname = 'public'
        and cls.relname <> 'profiles'
    loop
      execute format(
        'update %I.%I set %I = $1 where %I = $2',
        fk.schema_name,
        fk.table_name,
        fk.column_name,
        fk.column_name
      )
      using v_auth_id, v_old_profile_id;
    end loop;

    delete from public.profiles where id = v_old_profile_id;
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    department_id,
    is_active,
    created_at,
    updated_at,
    notification_preferences,
    language
  )
  values (
    v_auth_id,
    v_auth_email,
    coalesce(nullif(trim(p_full_name), ''), v_auth_email),
    coalesce(nullif(v_requested_role, ''), 'student'),
    p_department_id,
    true,
    now(),
    now(),
    '{}'::jsonb,
    'fr'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(nullif(trim(public.profiles.full_name), ''), excluded.full_name),
      role = coalesce(public.profiles.role, excluded.role),
      department_id = coalesce(public.profiles.department_id, excluded.department_id),
      is_active = coalesce(public.profiles.is_active, excluded.is_active),
      notification_preferences = coalesce(public.profiles.notification_preferences, excluded.notification_preferences),
      language = coalesce(public.profiles.language, excluded.language),
      updated_at = now()
  returning * into v_current_profile;

  update public.allowed_emails
  set is_registered = true,
      updated_at = now()
  where lower(email) = v_auth_email;

  return v_current_profile;
end;
$$;

grant execute on function public.sync_auth_profile(text, text, integer) to authenticated;
