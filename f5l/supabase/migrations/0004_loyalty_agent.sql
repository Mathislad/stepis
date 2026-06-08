-- ============================================================================
-- F5L — Migration 0004 : Agent Fidélisation
-- ----------------------------------------------------------------------------
-- Ajouts strictement nécessaires à l'exécution fiable des campagnes :
--   1. messages.campaign_id : rattache un envoi à une campagne
--   2. messages.dedupe_key  : empêche les doublons lors des runs scheduler
-- Idempotente.
-- ============================================================================

alter table public.messages
  add column if not exists campaign_id uuid references public.campaigns(id) on delete set null,
  add column if not exists dedupe_key text;

create index if not exists messages_campaign_id_idx on public.messages(campaign_id);

create unique index if not exists messages_org_dedupe_key_idx
  on public.messages(org_id, dedupe_key)
  where dedupe_key is not null;

-- ============================================================================
-- Fin migration 0004.
-- ============================================================================
