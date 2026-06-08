-- ============================================================================
-- F5L — Migration 0012 : Module Agent Téléphonique
-- ----------------------------------------------------------------------------
-- Tables : calls (journal des appels), phone_settings (config par org).
-- RLS sur 100% des tables, idempotente.
-- ============================================================================

-- ── Enums ──────────────────────────────────────────────────────────────────
do $$ begin create type call_status as enum ('missed','answered','voicemail'); exception when duplicate_object then null; end $$;

-- ── Table : calls ──────────────────────────────────────────────────────────
create table if not exists public.calls (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations(id) on delete cascade,
  caller_phone     text,
  caller_name      text,
  summary          text,
  recording_url    text,
  status           call_status not null default 'missed',
  duration_seconds int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists calls_org_id_idx     on public.calls(org_id);
create index if not exists calls_org_status_idx on public.calls(org_id, status, created_at desc);

-- ── Table : phone_settings ─────────────────────────────────────────────────
create table if not exists public.phone_settings (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null unique references public.organizations(id) on delete cascade,
  greeting_message    text not null default 'Bonjour, vous êtes bien chez nous. Laissez votre message après le bip.',
  transfer_number     text,
  active_hours        jsonb not null default '{"days":[]}'::jsonb,
  auto_sms_on_miss    boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists phone_settings_org_id_idx on public.phone_settings(org_id);

-- ── updated_at triggers ─────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['calls','phone_settings'] loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format('create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.calls          enable row level security;
alter table public.phone_settings enable row level security;

do $$
declare t text;
begin
  foreach t in array array['calls','phone_settings'] loop
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
-- Fin migration 0012.
-- ============================================================================
