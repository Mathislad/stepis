-- ============================================================================
-- F5L — Migration 0009 : Validations Manager
-- ----------------------------------------------------------------------------
-- Fondation du workflow d'approbation : les agents peuvent déposer une action
-- sensible, le Manager la rend visible, puis un owner/staff autorisé approuve
-- ou refuse. Aucune action impactante ne part sans validation explicite.
-- ============================================================================

do $$ begin create type manager_action_status as enum ('pending','approved','rejected','executed','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type manager_action_risk as enum ('low','medium','high'); exception when duplicate_object then null; end $$;

create table if not exists public.manager_action_requests (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  agent        text not null,
  action       text not null,
  risk         manager_action_risk not null default 'medium',
  status       manager_action_status not null default 'pending',
  payload      jsonb not null default '{}'::jsonb,
  requested_by uuid references auth.users(id) on delete set null,
  reviewed_by  uuid references auth.users(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists manager_action_requests_org_id_idx
  on public.manager_action_requests(org_id);
create index if not exists manager_action_requests_status_idx
  on public.manager_action_requests(org_id, status, created_at desc);

alter table public.manager_action_requests enable row level security;

drop policy if exists manager_action_requests_select on public.manager_action_requests;
drop policy if exists manager_action_requests_insert on public.manager_action_requests;
drop policy if exists manager_action_requests_update on public.manager_action_requests;
drop policy if exists manager_action_requests_delete on public.manager_action_requests;

create policy manager_action_requests_select
  on public.manager_action_requests for select to authenticated
  using (org_id = public.current_org_id());

create policy manager_action_requests_insert
  on public.manager_action_requests for insert to authenticated
  with check (org_id = public.current_org_id());

create policy manager_action_requests_update
  on public.manager_action_requests for update to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy manager_action_requests_delete
  on public.manager_action_requests for delete to authenticated
  using (org_id = public.current_org_id());

drop trigger if exists set_updated_at on public.manager_action_requests;
create trigger set_updated_at before update on public.manager_action_requests
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Fin migration 0009.
-- ============================================================================
