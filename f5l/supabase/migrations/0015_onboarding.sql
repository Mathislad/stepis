-- ============================================================================
-- F5L — Migration 0015 : Onboarding & Réglages
-- ----------------------------------------------------------------------------
-- Ajouts :
--   1. invitations : table pour inviter des collaborateurs (staff)
--   2. subscriptions : suivi minimal de l'abonnement Stripe (stub V1)
--   3. RPC public.lookup_invitation(token) — récupère l'org cible (signup)
-- Aucune modification des migrations antérieures.
-- ============================================================================

-- ── Enum statut souscription (utilisé par la table subscriptions ci-dessous)
do $$ begin create type subscription_status as enum ('trialing','active','past_due','canceled','incomplete'); exception when duplicate_object then null; end $$;

-- ── 1. invitations ─────────────────────────────────────────────────────────
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  email       text not null,
  role        profile_role not null default 'staff',
  token       text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by  uuid references auth.users(id) on delete set null,
  accepted    boolean not null default false,
  expires_at  timestamptz not null default (now() + interval '14 days'),
  created_at  timestamptz not null default now()
);
create index if not exists invitations_org_id_idx     on public.invitations(org_id);
create index if not exists invitations_email_org_idx  on public.invitations(org_id, email);

alter table public.invitations enable row level security;

drop policy if exists invitations_select on public.invitations;
drop policy if exists invitations_insert on public.invitations;
drop policy if exists invitations_update on public.invitations;
drop policy if exists invitations_delete on public.invitations;

create policy invitations_select on public.invitations
  for select to authenticated using (org_id = public.current_org_id());
create policy invitations_insert on public.invitations
  for insert to authenticated with check (org_id = public.current_org_id());
create policy invitations_update on public.invitations
  for update to authenticated
    using (org_id = public.current_org_id())
    with check (org_id = public.current_org_id());
create policy invitations_delete on public.invitations
  for delete to authenticated using (org_id = public.current_org_id());

-- ── 2. subscriptions (suivi minimal Stripe) ────────────────────────────────
create table if not exists public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null unique references public.organizations(id) on delete cascade,
  formula               formula not null default 'starter',
  status                subscription_status not null default 'trialing',
  stripe_customer_id    text,
  stripe_subscription_id text,
  current_period_end    timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists subscriptions_org_id_idx on public.subscriptions(org_id);

drop trigger if exists set_updated_at on public.subscriptions;
create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;
drop policy if exists subscriptions_select on public.subscriptions;
drop policy if exists subscriptions_insert on public.subscriptions;
drop policy if exists subscriptions_update on public.subscriptions;
drop policy if exists subscriptions_delete on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select to authenticated using (org_id = public.current_org_id());
create policy subscriptions_insert on public.subscriptions
  for insert to authenticated with check (org_id = public.current_org_id());
create policy subscriptions_update on public.subscriptions
  for update to authenticated
    using (org_id = public.current_org_id())
    with check (org_id = public.current_org_id());
create policy subscriptions_delete on public.subscriptions
  for delete to authenticated using (org_id = public.current_org_id());

-- ── 3. RPC : lookup_invitation (public, avant signup) ──────────────────────
-- Permet à la page d'inscription par invitation de pré-remplir l'e-mail et
-- d'afficher le nom de l'organisation. Ne retourne RIEN si le token est
-- invalide / expiré / déjà accepté.
create or replace function public.lookup_invitation(p_token text)
returns table (
  email     text,
  org_name  text,
  role      profile_role
)
language sql
stable
security definer
set search_path = public
as $$
  select i.email, o.name as org_name, i.role
  from public.invitations i
  join public.organizations o on o.id = i.org_id
  where i.token = p_token
    and i.accepted = false
    and i.expires_at > now();
$$;
revoke all on function public.lookup_invitation(text) from public;
grant execute on function public.lookup_invitation(text) to anon, authenticated;

-- ── 4. RPC : accept_invitation (utilisateur connecté après signup) ─────────
-- Crée le profile dans l'org cible et marque l'invitation acceptée.
-- L'utilisateur doit déjà être créé via Supabase Auth.
create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_inv   public.invitations;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  select * into v_inv
  from public.invitations
  where token = p_token
    and accepted = false
    and expires_at > now();
  if v_inv.id is null then
    raise exception 'INVITATION_INVALID' using errcode = 'no_data_found';
  end if;

  -- Crée le profile si pas déjà présent.
  insert into public.profiles (id, org_id, full_name, role)
  values (v_uid, v_inv.org_id, null, v_inv.role)
  on conflict (id) do update set org_id = excluded.org_id, role = excluded.role;

  update public.invitations
  set accepted = true
  where id = v_inv.id;

  return v_inv.org_id;
end;
$$;
revoke all on function public.accept_invitation(text) from public;
grant execute on function public.accept_invitation(text) to authenticated;

-- ============================================================================
-- Fin migration 0015.
-- ============================================================================
