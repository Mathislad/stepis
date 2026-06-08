-- ============================================================================
-- F5L — Migration 0013 : Module Agent Acquisition
-- ----------------------------------------------------------------------------
-- DECISION : nommage `ad_campaigns` (et non `campaigns`) car la table
-- `campaigns` existe déjà dans 0001 pour le module loyalty_agent (séquences
-- de fidélisation). Pas de collision possible.
-- Tables : ad_campaigns, ad_campaign_reports. RLS sur 100%, idempotente.
-- ============================================================================

do $$ begin create type ad_objective       as enum ('visibility','leads','promo');             exception when duplicate_object then null; end $$;
do $$ begin create type ad_platform        as enum ('meta','google','both');                   exception when duplicate_object then null; end $$;
do $$ begin create type ad_campaign_status as enum ('draft','active','paused','completed');    exception when duplicate_object then null; end $$;

create table if not exists public.ad_campaigns (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  title         text not null,
  objective     ad_objective not null,
  platform      ad_platform not null default 'both',
  budget        numeric(10,2) not null default 0,
  duration_days int not null default 30,
  status        ad_campaign_status not null default 'draft',
  ad_copy       text,
  ad_visual_url text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists ad_campaigns_org_id_idx     on public.ad_campaigns(org_id);
create index if not exists ad_campaigns_org_status_idx on public.ad_campaigns(org_id, status);

create table if not exists public.ad_campaign_reports (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  report_date date not null,
  impressions int not null default 0,
  clicks      int not null default 0,
  leads_count int not null default 0,
  spend       numeric(10,2) not null default 0,
  created_at  timestamptz not null default now(),
  unique (campaign_id, report_date)
);
create index if not exists ad_campaign_reports_campaign_idx on public.ad_campaign_reports(campaign_id);
create index if not exists ad_campaign_reports_org_idx      on public.ad_campaign_reports(org_id);

drop trigger if exists set_updated_at on public.ad_campaigns;
create trigger set_updated_at before update on public.ad_campaigns
  for each row execute function public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.ad_campaigns        enable row level security;
alter table public.ad_campaign_reports enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ad_campaigns','ad_campaign_reports'] loop
    execute format('drop policy if exists %I_select on public.%I;', t, t);
    execute format('drop policy if exists %I_insert on public.%I;', t, t);
    execute format('drop policy if exists %I_update on public.%I;', t, t);
    execute format('drop policy if exists %I_delete on public.%I;', t, t);

    execute format('create policy %I_select on public.%I for select to authenticated
       using (org_id = public.current_org_id());', t, t);
    execute format('create policy %I_insert on public.%I for insert to authenticated
       with check (org_id = public.current_org_id());', t, t);
    execute format('create policy %I_update on public.%I for update to authenticated
       using (org_id = public.current_org_id())
       with check (org_id = public.current_org_id());', t, t);
    execute format('create policy %I_delete on public.%I for delete to authenticated
       using (org_id = public.current_org_id());', t, t);
  end loop;
end $$;

-- ============================================================================
-- Fin migration 0013.
-- ============================================================================
