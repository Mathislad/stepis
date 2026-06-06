-- ============================================================================
-- F5L — Seed de démonstration (tenant unique, formule « business »)
-- Idempotent : ré-exécutable (ON CONFLICT / WHERE NOT EXISTS).
-- ----------------------------------------------------------------------------
-- Owner de démo :  owner@demo.f5l  /  demo1234
-- Carte publique :  /carte/demo-card-token
-- ----------------------------------------------------------------------------
-- NB : la création de l'utilisateur auth cible le schéma `auth` courant de
-- Supabase (colonne `provider_id` requise sur auth.identities). Si votre
-- instance refuse l'insert auth, créez l'utilisateur via le Dashboard avec
-- l'id ci-dessous, puis ré-exécutez ce fichier (le reste est indépendant).
-- ============================================================================

-- ── 1. Utilisateur auth (owner) ─────────────────────────────────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated', 'authenticated',
  'owner@demo.f5l',
  crypt('demo1234', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
  '', '', '', ''
) on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222',
  jsonb_build_object('sub', '22222222-2222-2222-2222-222222222222', 'email', 'owner@demo.f5l'),
  'email', '22222222-2222-2222-2222-222222222222',
  now(), now(), now()
) on conflict do nothing;

-- ── 2. Organisation (tenant) ────────────────────────────────────────────────
insert into public.organizations (id, name, slug, sector, formula)
values (
  '11111111-1111-1111-1111-111111111111',
  'Boulangerie Démo', 'boulangerie-demo', 'Boulangerie', 'business'
) on conflict (id) do nothing;

-- ── 3. Profil owner (pont auth ↔ tenant) ────────────────────────────────────
insert into public.profiles (id, org_id, full_name, role)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Camille Démo', 'owner'
) on conflict (id) do nothing;

-- ── 4. Modules (activation selon formule « business ») ──────────────────────
insert into public.org_modules (org_id, module_key, enabled) values
  ('11111111-1111-1111-1111-111111111111', 'site',          true),
  ('11111111-1111-1111-1111-111111111111', 'crm',           true),
  ('11111111-1111-1111-1111-111111111111', 'lead_capture',  true),
  ('11111111-1111-1111-1111-111111111111', 'loyalty_agent', true),
  ('11111111-1111-1111-1111-111111111111', 'loyalty_card',  true),
  ('11111111-1111-1111-1111-111111111111', 'reputation',    false),
  ('11111111-1111-1111-1111-111111111111', 'phone',         false),
  ('11111111-1111-1111-1111-111111111111', 'acquisition',   false),
  ('11111111-1111-1111-1111-111111111111', 'admin',         false),
  ('11111111-1111-1111-1111-111111111111', 'manager',       false)
on conflict (org_id, module_key) do nothing;

-- ── 5. Contacts (B2B + B2C) ─────────────────────────────────────────────────
insert into public.contacts (id, org_id, type, name, phone, email, source, sector, pipeline_status, potential_value)
values (
  '33333333-3333-3333-3333-333333333331',
  '11111111-1111-1111-1111-111111111111',
  'b2b', 'Restaurant Le Voisin', '+33600000001', 'contact@levoisin.fr',
  'manual', 'Restauration', 'qualified', 1200.00
) on conflict (id) do nothing;

insert into public.contacts (id, org_id, type, name, phone, email, source, recurrence, birthday)
values (
  '33333333-3333-3333-3333-333333333332',
  '11111111-1111-1111-1111-111111111111',
  'b2c', 'Marie Dupont', '+33600000002', 'marie@example.fr',
  'loyalty', 'weekly', '1990-05-12'
) on conflict (id) do nothing;

-- ── 6. Carte de fidélité (rattachée au contact B2C) ─────────────────────────
insert into public.loyalty_cards (id, org_id, contact_id, points, card_token)
values (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333332',
  120, 'demo-card-token'
) on conflict (id) do nothing;

insert into public.loyalty_transactions (org_id, card_id, delta_points, reason)
select '11111111-1111-1111-1111-111111111111',
       '44444444-4444-4444-4444-444444444444', 120, 'earn'
where not exists (
  select 1 from public.loyalty_transactions
  where card_id = '44444444-4444-4444-4444-444444444444'
);

-- ── 7. Paliers de récompense ────────────────────────────────────────────────
insert into public.loyalty_rewards (org_id, label, points_required, active)
select '11111111-1111-1111-1111-111111111111', v.label, v.pts, true
from (values
  ('Café offert', 50),
  ('Viennoiserie offerte', 100),
  ('-10% sur la commande', 200)
) as v(label, pts)
where not exists (
  select 1 from public.loyalty_rewards r
  where r.org_id = '11111111-1111-1111-1111-111111111111' and r.label = v.label
);

-- ── 8. Offre + campagne de fidélisation (exemples) ──────────────────────────
insert into public.offers (org_id, title, description, discount, active)
select '11111111-1111-1111-1111-111111111111',
       'Offre de bienvenue', '-15% sur votre première commande', '-15%', true
where not exists (
  select 1 from public.offers
  where org_id = '11111111-1111-1111-1111-111111111111' and title = 'Offre de bienvenue'
);

insert into public.campaigns (org_id, trigger, channel, template, active)
select '11111111-1111-1111-1111-111111111111', 'birthday', 'sms',
       '{"text": "Joyeux anniversaire {{name}} ! Un cadeau vous attend en boutique."}'::jsonb,
       true
where not exists (
  select 1 from public.campaigns
  where org_id = '11111111-1111-1111-1111-111111111111'
    and trigger = 'birthday' and channel = 'sms'
);

-- ── 9. Données de démo CRM (étape 2) ────────────────────────────────────────
-- Un contact déjà attribué à F5L → le compteur ROI affiche ≥ 1 dès le départ.
insert into public.contacts (org_id, type, name, phone, email, source, recurrence)
select '11111111-1111-1111-1111-111111111111', 'b2c', 'Léa Martin',
       '+33600000003', 'lea.martin@example.fr', 'f5l_acquisition', 'mensuelle'
where not exists (
  select 1 from public.contacts
  where org_id = '11111111-1111-1111-1111-111111111111' and name = 'Léa Martin'
);

-- Deux leads entrants à convertir : un formulaire site, un d'acquisition F5L.
-- À la conversion, contacts.source suivra leads.source (ROI exact).
insert into public.leads (org_id, name, phone, email, message, source_url, source, status)
select '11111111-1111-1111-1111-111111111111', 'Paul Durand', '+33600000004',
       'paul.durand@example.fr', 'Bonjour, je voudrais un devis pour 50 baguettes.',
       'https://boulangerie-demo.fr/contact', 'site_form', 'new'
where not exists (
  select 1 from public.leads
  where org_id = '11111111-1111-1111-1111-111111111111' and email = 'paul.durand@example.fr'
);

insert into public.leads (org_id, name, phone, email, message, source_url, source, status)
select '11111111-1111-1111-1111-111111111111', 'Sophie Bernard', '+33600000005',
       'sophie.bernard@example.fr', 'Vu votre pub, intéressée par vos pâtisseries.',
       'https://ads.f5l.fr/campagne-printemps', 'f5l_acquisition', 'new'
where not exists (
  select 1 from public.leads
  where org_id = '11111111-1111-1111-1111-111111111111' and email = 'sophie.bernard@example.fr'
);
