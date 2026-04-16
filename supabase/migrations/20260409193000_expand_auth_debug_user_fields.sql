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
    jsonb_agg(to_jsonb(i) order by i.created_at asc),
    '[]'::jsonb
  )
  into v_identities
  from auth.identities i
  where i.user_id = v_user.id
     or lower(coalesce(i.email, '')) = v_email;

  return jsonb_build_object(
    'exists', true,
    'id', v_user.id,
    'instance_id', v_user.instance_id,
    'aud', v_user.aud,
    'role', v_user.role,
    'email', v_user.email,
    'phone', v_user.phone,
    'email_confirmed_at', v_user.email_confirmed_at,
    'last_sign_in_at', v_user.last_sign_in_at,
    'created_at', v_user.created_at,
    'updated_at', v_user.updated_at,
    'is_super_admin', v_user.is_super_admin,
    'is_sso_user', v_user.is_sso_user,
    'is_anonymous', v_user.is_anonymous,
    'deleted_at', v_user.deleted_at,
    'raw_app_meta_data', v_user.raw_app_meta_data,
    'raw_user_meta_data', v_user.raw_user_meta_data,
    'identities', v_identities
  );
end;
$$;
