-- ============================================================================
-- F5L — Migration de fondation (Étape 1)
-- Plateforme SaaS multi-tenant : chaque commerce = un tenant isolé par `org_id`.
-- ----------------------------------------------------------------------------
-- Idempotente : ré-exécutable sans erreur (enums via DO/exception, tables via
-- IF NOT EXISTS, policies via DROP ... IF EXISTS puis CREATE).
-- Applicable via `supabase db push` OU collée dans le SQL Editor du Dashboard.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- 0. Extensions
-- ──────────────────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;      -- gen_random_uuid()

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Types ENUM (idempotents)
-- ──────────────────────────────────────────────────────────────────────────
do $$ begin create type formula         as enum ('starter','business','full'); exception when duplicate_object then null; end $$;
do $$ begin create type profile_role    as enum ('owner','staff'); exception when duplicate_object then null; end $$;
do $$ begin create type module_key      as enum (
  'site','crm','lead_capture','loyalty_agent','loyalty_card',
  'reputation','phone','acquisition','admin','manager'
); exception when duplicate_object then null; end $$;
do $$ begin create type contact_type    as enum ('b2b','b2c'); exception when duplicate_object then null; end $$;
do $$ begin create type contact_source  as enum ('f5l_acquisition','manual','site_form','loyalty','other'); exception when duplicate_object then null; end $$;
do $$ begin create type pipeline_status as enum ('lead','qualified','proposal','won','lost'); exception when duplicate_object then null; end $$;
do $$ begin create type lead_status     as enum ('new','contacted','converted','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type activity_type   as enum ('call','email','sms','note','quote','visit'); exception when duplicate_object then null; end $$;
do $$ begin create type block_type      as enum ('text','image','offer','price','hours'); exception when duplicate_object then null; end $$;
do $$ begin create type loyalty_reason  as enum ('earn','redeem','adjust'); exception when duplicate_object then null; end $$;
do $$ begin create type campaign_trigger as enum ('birthday','inactive','post_purchase','seasonal'); exception when duplicate_object then null; end $$;
do $$ begin create type channel         as enum ('sms','email','whatsapp'); exception when duplicate_object then null; end $$;
do $$ begin create type usage_metric    as enum ('sms','email','ai_tokens','call_minutes'); exception when duplicate_object then null; end $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Trigger générique `updated_at`
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Tables
-- ──────────────────────────────────────────────────────────────────────────

-- 3.1 organizations — racine du tenant
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  sector     text,
  formula    formula not null default 'starter',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.2 profiles — pont auth.users ↔ tenant
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  org_id     uuid not null references public.organizations(id) on delete cascade,
  full_name  text,
  role       profile_role not null default 'owner',
  created_at timestamptz not null default now()
);
create index if not exists profiles_org_id_idx on public.profiles(org_id);

-- 3.3 org_modules — activation / verrouillage des modules par org
create table if not exists public.org_modules (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  module_key module_key not null,
  enabled    boolean not null default false,
  config     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, module_key)
);
create index if not exists org_modules_org_id_idx on public.org_modules(org_id);

-- 3.4 contacts — CRM B2B + B2C
create table if not exists public.contacts (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  type            contact_type not null,
  name            text not null,
  phone           text,
  email           text,
  address         text,
  note            text,
  source          contact_source not null default 'manual',
  -- B2B
  sector          text,
  last_contact_at timestamptz,
  potential_value numeric(12,2),
  pipeline_status pipeline_status,
  -- B2C
  recurrence      text,
  last_visit_at   timestamptz,
  birthday        date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists contacts_org_id_idx          on public.contacts(org_id);
create index if not exists contacts_org_type_idx        on public.contacts(org_id, type);
create index if not exists contacts_org_pipeline_idx    on public.contacts(org_id, pipeline_status);

-- 3.5 leads — captures brutes du site avant qualification
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  name       text,
  phone      text,
  email      text,
  message    text,
  source_url text,
  status     lead_status not null default 'new',
  created_at timestamptz not null default now()
);
create index if not exists leads_org_id_idx     on public.leads(org_id);
create index if not exists leads_org_status_idx on public.leads(org_id, status);

-- 3.6 activities — journal d'activité par contact
create table if not exists public.activities (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  type       activity_type not null,
  content    text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists activities_org_id_idx     on public.activities(org_id);
create index if not exists activities_contact_id_idx on public.activities(contact_id);

-- 3.7 site_content — CMS-lite du site éditable
create table if not exists public.site_content (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  block_key  text not null,
  block_type block_type not null,
  content    jsonb not null default '{}'::jsonb,
  position   int not null default 0,
  published  boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (org_id, block_key)
);
create index if not exists site_content_org_id_idx on public.site_content(org_id);

-- 3.8 offers — offres / promos
create table if not exists public.offers (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  title       text not null,
  description text,
  discount    text,
  valid_from  date,
  valid_until date,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists offers_org_id_idx on public.offers(org_id);

-- 3.9 loyalty_cards — carte de fidélité par contact
create table if not exists public.loyalty_cards (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  points     int not null default 0,
  card_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists loyalty_cards_org_id_idx     on public.loyalty_cards(org_id);
create index if not exists loyalty_cards_contact_id_idx on public.loyalty_cards(contact_id);

-- 3.10 loyalty_transactions — scans / points
create table if not exists public.loyalty_transactions (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  card_id      uuid not null references public.loyalty_cards(id) on delete cascade,
  delta_points int not null,
  reason       loyalty_reason not null,
  created_at   timestamptz not null default now()
);
create index if not exists loyalty_tx_org_id_idx  on public.loyalty_transactions(org_id);
create index if not exists loyalty_tx_card_id_idx on public.loyalty_transactions(card_id);

-- 3.11 loyalty_rewards — paliers de récompense
create table if not exists public.loyalty_rewards (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  label           text not null,
  points_required int not null,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists loyalty_rewards_org_id_idx on public.loyalty_rewards(org_id);

-- 3.12 campaigns — séquences de fidélisation
create table if not exists public.campaigns (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  trigger    campaign_trigger not null,
  channel    channel not null,
  template   jsonb not null default '{}'::jsonb,
  active     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists campaigns_org_id_idx on public.campaigns(org_id);

-- 3.13 messages — log des envois (Brevo) : historique + metering
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  contact_id  uuid references public.contacts(id) on delete set null,
  channel     channel not null,
  provider_id text,
  status      text,
  cost_units  numeric(12,4) not null default 0,
  sent_at     timestamptz not null default now()
);
create index if not exists messages_org_id_idx     on public.messages(org_id);
create index if not exists messages_contact_id_idx on public.messages(contact_id);

-- 3.14 usage_metering — compteurs par org (contrôle de marge)
create table if not exists public.usage_metering (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  period     date not null,                    -- premier jour du mois
  metric     usage_metric not null,
  quantity   numeric(14,4) not null default 0,
  updated_at timestamptz not null default now(),
  unique (org_id, period, metric)
);
create index if not exists usage_metering_org_id_idx on public.usage_metering(org_id);

-- 3.15 daily_digest — résumé quotidien du Manager
create table if not exists public.daily_digest (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  digest_date date not null,
  summary     jsonb not null default '{}'::jsonb,   -- { actions, results, alerts }
  created_at  timestamptz not null default now(),
  unique (org_id, digest_date)
);
create index if not exists daily_digest_org_id_idx on public.daily_digest(org_id);

-- 3.16 audit_log — journal inter-agents
create table if not exists public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  agent      text not null,
  action     text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_org_id_idx on public.audit_log(org_id);

-- ──────────────────────────────────────────────────────────────────────────
-- 4. Triggers updated_at (sur les tables qui portent la colonne)
-- ──────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','org_modules','contacts','site_content',
    'loyalty_cards','campaigns','usage_metering'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 5. Contexte tenant : current_org_id()
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER → lit `profiles` en contournant la RLS, ce qui évite la
-- récursion (une policy sur profiles ne se rappelle pas elle-même).
-- STABLE → le planner peut mettre le résultat en cache pour la requête.
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid();
$$;
revoke all on function public.current_org_id() from public;
grant execute on function public.current_org_id() to authenticated;

-- ──────────────────────────────────────────────────────────────────────────
-- 6. RLS — activation sur 100% des tables
-- ──────────────────────────────────────────────────────────────────────────
alter table public.organizations        enable row level security;
alter table public.profiles             enable row level security;
alter table public.org_modules          enable row level security;
alter table public.contacts             enable row level security;
alter table public.leads                enable row level security;
alter table public.activities           enable row level security;
alter table public.site_content         enable row level security;
alter table public.offers               enable row level security;
alter table public.loyalty_cards        enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.loyalty_rewards      enable row level security;
alter table public.campaigns            enable row level security;
alter table public.messages             enable row level security;
alter table public.usage_metering       enable row level security;
alter table public.daily_digest         enable row level security;
alter table public.audit_log            enable row level security;

-- ── 6.1 organizations : membres lisent leur org ; owner peut modifier ──────
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select to authenticated
  using (id = public.current_org_id());

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update to authenticated
  using (id = public.current_org_id()
         and exists (select 1 from public.profiles p
                     where p.id = auth.uid() and p.role = 'owner'))
  with check (id = public.current_org_id());

-- ── 6.2 profiles : sa propre ligne + celles de son org ; édite la sienne ───
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or org_id = public.current_org_id());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── 6.3 Tables métier : isolation stricte par org_id ───────────────────────
-- Toutes appliquent le même contrat : org_id = current_org_id() sur CRUD.
do $$
declare t text;
begin
  foreach t in array array[
    'org_modules','contacts','leads','activities','site_content','offers',
    'loyalty_cards','loyalty_transactions','loyalty_rewards','campaigns',
    'messages','usage_metering','daily_digest','audit_log'
  ] loop
    execute format('drop policy if exists %I_select on public.%I;', t, t);
    execute format('drop policy if exists %I_insert on public.%I;', t, t);
    execute format('drop policy if exists %I_update on public.%I;', t, t);
    execute format('drop policy if exists %I_delete on public.%I;', t, t);

    execute format(
      'create policy %I_select on public.%I for select to authenticated
         using (org_id = public.current_org_id());', t, t);
    execute format(
      'create policy %I_insert on public.%I for insert to authenticated
         with check (org_id = public.current_org_id());', t, t);
    execute format(
      'create policy %I_update on public.%I for update to authenticated
         using (org_id = public.current_org_id())
         with check (org_id = public.current_org_id());', t, t);
    execute format(
      'create policy %I_delete on public.%I for delete to authenticated
         using (org_id = public.current_org_id());', t, t);
  end loop;
end $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 7. Accès public LECTURE SEULE de la carte de fidélité par card_token
-- ----------------------------------------------------------------------------
-- Le client final consulte sa carte sans login (QR / lien). On n'ouvre PAS de
-- policy large : une fonction SECURITY DEFINER renvoie uniquement les points et
-- les paliers de l'org, jamais le contact ni d'autres données tenant.
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.get_loyalty_card_by_token(p_token text)
returns table (points int, rewards jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.points,
    coalesce(
      (select jsonb_agg(jsonb_build_object('label', r.label, 'points_required', r.points_required)
                        order by r.points_required)
         from public.loyalty_rewards r
        where r.org_id = c.org_id and r.active),
      '[]'::jsonb
    ) as rewards
  from public.loyalty_cards c
  where c.card_token = p_token;
$$;
revoke all on function public.get_loyalty_card_by_token(text) from public;
grant execute on function public.get_loyalty_card_by_token(text) to anon, authenticated;

-- ============================================================================
-- Fin de la migration de fondation.
-- ============================================================================
