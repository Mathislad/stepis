-- ============================================================================
-- F5L — Migration 0002 : module CRM
-- ----------------------------------------------------------------------------
-- N'ALTÈRE PAS 0001. Ajouts strictement nécessaires au CRM :
--   1. colonne `leads.source` (origine du lead → attribution ROI exacte)
--   2. fonction `convert_lead_to_contact` (conversion ATOMIQUE lead → contact)
-- Idempotente (add column if not exists / create or replace).
-- Applicable via `supabase db push` ou collée dans le SQL Editor.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Origine du lead
-- ----------------------------------------------------------------------------
-- Réutilise l'enum `contact_source` de 0001. Permet de tracer d'où vient un
-- lead (formulaire site, campagne d'acquisition F5L, …) pour que le compteur
-- « clients amenés par F5L » reste juste après conversion.
-- Le module de capture de leads (étape ultérieure) renseignera cette valeur.
-- ──────────────────────────────────────────────────────────────────────────
alter table public.leads
  add column if not exists source contact_source not null default 'site_form';

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Conversion atomique lead → contact
-- ----------------------------------------------------------------------------
-- SECURITY INVOKER : la fonction s'exécute avec les droits de l'appelant, donc
-- la RLS s'applique normalement (isolation tenant intacte, aucune élévation).
-- Le corps entier = une seule transaction → atomicité garantie.
-- Garde anti double-conversion : refuse un lead déjà `converted`.
-- La source du contact = la source du lead (mapping d'origine).
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.convert_lead_to_contact(
  p_lead_id uuid,
  p_type    contact_type
)
returns public.contacts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_org     uuid := public.current_org_id();
  v_lead    public.leads;
  v_contact public.contacts;
begin
  -- Lecture scopée à l'org de l'appelant par la RLS.
  select * into v_lead from public.leads where id = p_lead_id;

  if v_lead.id is null then
    raise exception 'LEAD_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  if v_lead.status = 'converted' then
    -- Anti double-conversion : pas de doublon de contact.
    raise exception 'LEAD_ALREADY_CONVERTED' using errcode = 'unique_violation';
  end if;

  insert into public.contacts (org_id, type, name, phone, email, note, source)
  values (
    v_org,
    p_type,
    coalesce(nullif(btrim(v_lead.name), ''), 'Sans nom'),
    v_lead.phone,
    v_lead.email,
    v_lead.message,
    coalesce(v_lead.source, 'site_form')   -- origine du lead → source du contact
  )
  returning * into v_contact;

  update public.leads set status = 'converted' where id = p_lead_id;

  return v_contact;
end;
$$;

revoke all on function public.convert_lead_to_contact(uuid, contact_type) from public;
grant execute on function public.convert_lead_to_contact(uuid, contact_type) to authenticated;

-- ============================================================================
-- Fin migration 0002.
-- ============================================================================
