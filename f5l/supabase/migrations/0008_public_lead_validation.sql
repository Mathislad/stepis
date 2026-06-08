-- ============================================================================
-- F5L — Migration 0008 : Validation serveur des leads publics
-- ----------------------------------------------------------------------------
-- La capture de lead est exposée à anon via RPC SECURITY DEFINER. On borne les
-- entrées au niveau Postgres pour que le formulaire ne soit pas la seule ligne
-- de défense.
-- ============================================================================

create or replace function public.create_public_lead(
  p_slug       text,
  p_name       text,
  p_phone      text,
  p_email      text,
  p_message    text,
  p_source_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id     uuid;
  v_lead_id    uuid;
  v_name       text := btrim(coalesce(p_name, ''));
  v_phone      text := btrim(coalesce(p_phone, ''));
  v_email      text := nullif(btrim(coalesce(p_email, '')), '');
  v_message    text := nullif(btrim(coalesce(p_message, '')), '');
  v_source_url text := nullif(btrim(coalesce(p_source_url, '')), '');
begin
  if nullif(btrim(coalesce(p_slug, '')), '') is null then
    raise exception 'INVALID_SLUG' using errcode = '22023';
  end if;
  if v_name = '' or char_length(v_name) > 120 then
    raise exception 'INVALID_NAME' using errcode = '22023';
  end if;
  if v_phone = '' or char_length(v_phone) > 40 then
    raise exception 'INVALID_PHONE' using errcode = '22023';
  end if;
  if v_email is not null and char_length(v_email) > 180 then
    raise exception 'INVALID_EMAIL' using errcode = '22023';
  end if;
  if v_message is not null and char_length(v_message) > 1200 then
    raise exception 'MESSAGE_TOO_LONG' using errcode = '22023';
  end if;
  if v_source_url is not null and char_length(v_source_url) > 500 then
    v_source_url := left(v_source_url, 500);
  end if;

  select id into v_org_id from public.organizations where slug = btrim(p_slug);
  if v_org_id is null then
    raise exception 'ORG_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  insert into public.leads (org_id, name, phone, email, message, source_url, source, status)
  values (v_org_id, v_name, v_phone, v_email, v_message, v_source_url, 'site_form', 'new')
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

revoke all on function public.create_public_lead(text, text, text, text, text, text) from public;
grant execute on function public.create_public_lead(text, text, text, text, text, text) to anon, authenticated;

-- ============================================================================
-- Fin migration 0008.
-- ============================================================================
