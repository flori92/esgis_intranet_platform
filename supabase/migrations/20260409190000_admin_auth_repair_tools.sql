create extension if not exists pgcrypto;

create or replace function public.admin_get_auth_user_by_email(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_user auth.users%rowtype;
  v_identities jsonb := '[]'::jsonb;
begin
  if not public.check_is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if v_email = '' then
    raise exception 'EMAIL_REQUIRED';
  end if;

  select *
  into v_user
  from auth.users
  where lower(email) = v_email
  order by created_at desc nulls last
  limit 1;

  if v_user.id is null then
    return jsonb_build_object(
      'exists', false,
      'email', v_email
    );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', i.id,
        'provider', i.provider,
        'provider_id', i.provider_id,
        'user_id', i.user_id,
        'created_at', i.created_at,
        'updated_at', i.updated_at
      )
      order by i.created_at asc
    ),
    '[]'::jsonb
  )
  into v_identities
  from auth.identities i
  where i.user_id = v_user.id
     or lower(coalesce(i.provider_id, '')) = v_email;

  return jsonb_build_object(
    'exists', true,
    'id', v_user.id,
    'email', v_user.email,
    'email_confirmed_at', v_user.email_confirmed_at,
    'last_sign_in_at', v_user.last_sign_in_at,
    'created_at', v_user.created_at,
    'updated_at', v_user.updated_at,
    'raw_app_meta_data', v_user.raw_app_meta_data,
    'raw_user_meta_data', v_user.raw_user_meta_data,
    'identities', v_identities
  );
end;
$$;

grant execute on function public.admin_get_auth_user_by_email(text) to authenticated;

create or replace function public.admin_repair_email_auth_account(
  p_email text,
  p_user_id uuid,
  p_password text,
  p_role text default 'student',
  p_full_name text default null,
  p_first_name text default null,
  p_last_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_role text := lower(trim(coalesce(p_role, 'student')));
  v_user auth.users%rowtype;
begin
  if not public.check_is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if v_email = '' then
    raise exception 'EMAIL_REQUIRED';
  end if;

  if p_user_id is null then
    raise exception 'USER_ID_REQUIRED';
  end if;

  if coalesce(p_password, '') = '' then
    raise exception 'PASSWORD_REQUIRED';
  end if;

  if v_role not in ('student', 'professor', 'admin', 'super_admin') then
    v_role := 'student';
  end if;

  select *
  into v_user
  from auth.users
  where id = p_user_id
     or lower(email) = v_email
  order by case when id = p_user_id then 0 else 1 end, created_at desc nulls last
  limit 1;

  if v_user.id is null then
    insert into auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    )
    values (
      p_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_strip_nulls(
        jsonb_build_object(
          'email', v_email,
          'full_name', coalesce(nullif(trim(p_full_name), ''), v_email),
          'first_name', nullif(trim(coalesce(p_first_name, '')), ''),
          'last_name', nullif(trim(coalesce(p_last_name, '')), ''),
          'role', v_role,
          'email_verified', true,
          'phone_verified', false,
          'sub', p_user_id::text
        )
      )
    )
    returning *
    into v_user;
  else
    update auth.users
    set email = v_email,
        encrypted_password = crypt(p_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now(),
        raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_strip_nulls(
          jsonb_build_object(
            'email', v_email,
            'full_name', coalesce(nullif(trim(p_full_name), ''), v_email),
            'first_name', nullif(trim(coalesce(p_first_name, '')), ''),
            'last_name', nullif(trim(coalesce(p_last_name, '')), ''),
            'role', v_role,
            'email_verified', true,
            'phone_verified', false,
            'sub', coalesce(v_user.id, p_user_id)::text
          )
        )
    where id = v_user.id
    returning *
    into v_user;
  end if;

  if not exists (
    select 1
    from auth.identities
    where user_id = v_user.id
      and provider = 'email'
  ) then
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_user.id,
      jsonb_strip_nulls(
        jsonb_build_object(
          'sub', v_user.id::text,
          'email', v_email,
          'full_name', coalesce(nullif(trim(p_full_name), ''), v_email),
          'first_name', nullif(trim(coalesce(p_first_name, '')), ''),
          'last_name', nullif(trim(coalesce(p_last_name, '')), ''),
          'role', v_role,
          'email_verified', true,
          'phone_verified', false
        )
      ),
      'email',
      v_email,
      now(),
      now(),
      now()
    );
  end if;

  update public.profiles
  set email = v_email,
      full_name = coalesce(nullif(trim(p_full_name), ''), full_name, v_email),
      first_name = coalesce(nullif(trim(coalesce(p_first_name, '')), ''), first_name),
      last_name = coalesce(nullif(trim(coalesce(p_last_name, '')), ''), last_name),
      role = v_role,
      is_active = true,
      updated_at = now()
  where id = p_user_id;

  update public.allowed_emails
  set is_registered = true,
      updated_at = now()
  where lower(email) = v_email;

  return public.admin_get_auth_user_by_email(v_email);
end;
$$;

grant execute on function public.admin_repair_email_auth_account(text, uuid, text, text, text, text, text) to authenticated;
