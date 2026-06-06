-- ============================================================================
-- F5L — Migration 0014 : Module Agent Admin
-- ----------------------------------------------------------------------------
-- Tables : documents (devis/factures/contrats), payment_reminders.
-- DECISION : `recipient_phone` ajouté (le prompt mentionnait l'envoi SMS de
-- relance, donc on prévoit la colonne dès la migration). RLS sur 100%.
-- ============================================================================

do $$ begin create type document_type    as enum ('devis','facture','contrat');                                          exception when duplicate_object then null; end $$;
do $$ begin create type document_status  as enum ('draft','sent','signed','paid','overdue','cancelled');                exception when duplicate_object then null; end $$;
do $$ begin create type reminder_channel as enum ('sms','email');                                                       exception when duplicate_object then null; end $$;

create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  doc_type        document_type not null,
  title           text not null,
  recipient_name  text,
  recipient_email text,
  recipient_phone text,
  content         jsonb not null default '{}'::jsonb,
  amount          numeric(12,2),
  due_date        date,
  status          document_status not null default 'draft',
  signed_at       timestamptz,
  signature_url   text,
  file_url        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists documents_org_id_idx          on public.documents(org_id);
create index if not exists documents_org_type_status_idx on public.documents(org_id, doc_type, status);

create table if not exists public.payment_reminders (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  document_id     uuid not null references public.documents(id) on delete cascade,
  reminder_number int not null,
  channel         reminder_channel not null,
  sent_at         timestamptz not null default now()
);
create index if not exists payment_reminders_document_idx on public.payment_reminders(document_id);
create index if not exists payment_reminders_org_idx      on public.payment_reminders(org_id);

drop trigger if exists set_updated_at on public.documents;
create trigger set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

alter table public.documents         enable row level security;
alter table public.payment_reminders enable row level security;

do $$
declare t text;
begin
  foreach t in array array['documents','payment_reminders'] loop
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
-- Fin migration 0014.
-- ============================================================================
