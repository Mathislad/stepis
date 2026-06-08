-- ============================================================================
-- F5L — Migration 0005 : Réputation conforme
-- ----------------------------------------------------------------------------
-- Module d'e-réputation sans review gating :
--   1. review_requests   : sollicitations envoyées à tous les clients
--   2. reviews           : avis publics suivis / réponses proposées
--   3. private_feedback  : retours privés parallèles, sans filtrer l'avis public
-- Idempotente.
-- ============================================================================

do $$ begin create type review_request_status as enum ('queued','sent','opened','clicked','failed'); exception when duplicate_object then null; end $$;
do $$ begin create type review_source as enum ('google','private','manual'); exception when duplicate_object then null; end $$;
do $$ begin create type review_sentiment as enum ('positive','neutral','negative','unknown'); exception when duplicate_object then null; end $$;

create table if not exists public.review_requests (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  contact_id  uuid references public.contacts(id) on delete set null,
  channel     channel not null,
  status      review_request_status not null default 'queued',
  request_url text,
  dedupe_key  text,
  sent_at     timestamptz,
  created_at  timestamptz not null default now(),
  unique (org_id, dedupe_key)
);
create index if not exists review_requests_org_id_idx on public.review_requests(org_id);
create index if not exists review_requests_contact_id_idx on public.review_requests(contact_id);

create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  contact_id      uuid references public.contacts(id) on delete set null,
  source          review_source not null default 'google',
  rating          int check (rating between 1 and 5),
  author_name     text,
  content         text,
  sentiment       review_sentiment not null default 'unknown',
  public_url      text,
  response_draft  text,
  responded_at    timestamptz,
  received_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
create index if not exists reviews_org_id_idx on public.reviews(org_id);
create index if not exists reviews_contact_id_idx on public.reviews(contact_id);

create table if not exists public.private_feedback (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  contact_id  uuid references public.contacts(id) on delete set null,
  rating      int check (rating between 1 and 5),
  message     text,
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists private_feedback_org_id_idx on public.private_feedback(org_id);
create index if not exists private_feedback_contact_id_idx on public.private_feedback(contact_id);

alter table public.review_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.private_feedback enable row level security;

do $$
declare t text;
begin
  foreach t in array array['review_requests','reviews','private_feedback'] loop
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

-- ============================================================================
-- Fin migration 0005.
-- ============================================================================
