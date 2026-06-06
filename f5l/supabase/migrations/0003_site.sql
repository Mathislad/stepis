-- ============================================================================
-- F5L — Migration 0003 : Site éditable + Capture de leads
-- ----------------------------------------------------------------------------
-- N'ALTÈRE PAS 0001/0002. Ajouts :
--   1. organizations.contact_phone / contact_email (notifications Brevo)
--   2. fonction create_public_lead (capture de lead par un visiteur anon)
-- Idempotente.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Coordonnées de notification du commerçant
-- ──────────────────────────────────────────────────────────────────────────
alter table public.organizations
  add column if not exists contact_phone text,
  add column if not exists contact_email text;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Capture publique d'un lead (visiteur non authentifié)
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER : l'`org_id` est résolu serveur-side à partir du slug ; le
-- visiteur anon ne touche jamais directement la table `leads` (RLS préservée).
-- Le lead est marqué source = 'site_form' (attribution ROI cohérente).
-- ──────────────────────────────────────────────────────────────────────────
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
  v_org_id  uuid;
  v_lead_id uuid;
begin
  select id into v_org_id from public.organizations where slug = p_slug;
  if v_org_id is null then
    raise exception 'ORG_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  insert into public.leads (org_id, name, phone, email, message, source_url, source, status)
  values (v_org_id, p_name, p_phone, p_email, p_message, p_source_url, 'site_form', 'new')
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

revoke all on function public.create_public_lead(text, text, text, text, text, text) from public;
grant execute on function public.create_public_lead(text, text, text, text, text, text) to anon, authenticated;

-- ============================================================================
-- Fin migration 0003.
-- ============================================================================
