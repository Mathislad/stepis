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

-- ── 6. Carte de fidélité (rattachée au contact B2C) — 65 pts (étape 4) ──────
insert into public.loyalty_cards (id, org_id, contact_id, points, card_token)
values (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333332',
  65, 'demo-card-token'
) on conflict (id) do nothing;

-- 3 transactions, somme = 65 : +30 et +50 (gains), -15 (rachat).
insert into public.loyalty_transactions (org_id, card_id, delta_points, reason)
select '11111111-1111-1111-1111-111111111111',
       '44444444-4444-4444-4444-444444444444', v.delta, v.reason::loyalty_reason
from (values (30, 'earn'), (50, 'earn'), (-15, 'redeem')) as v(delta, reason)
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
       '{
          "name": "Anniversaire client",
          "subject": null,
          "body": "Joyeux anniversaire {{prenom}} ! Un cadeau vous attend à la Boulangerie Démo.",
          "offer": "Viennoiserie offerte",
          "inactiveDays": null
        }'::jsonb,
       true
where not exists (
  select 1 from public.campaigns
  where org_id = '11111111-1111-1111-1111-111111111111'
    and trigger = 'birthday' and channel = 'sms'
);

update public.campaigns
set template = '{
  "name": "Anniversaire client",
  "subject": null,
  "body": "Joyeux anniversaire {{prenom}} ! Un cadeau vous attend à la Boulangerie Démo.",
  "offer": "Viennoiserie offerte",
  "inactiveDays": null
}'::jsonb
where org_id = '11111111-1111-1111-1111-111111111111'
  and trigger = 'birthday'
  and channel = 'sms'
  and not (template ? 'body');

insert into public.campaigns (org_id, trigger, channel, template, active)
select '11111111-1111-1111-1111-111111111111', 'inactive', 'email',
       '{
          "name": "Relance client inactif",
          "subject": "Votre boulangerie vous garde une douceur",
          "body": "Bonjour {{prenom}}, cela fait un moment que nous ne vous avons pas vu. Passez cette semaine et profitez de votre offre fidélité.",
          "offer": "-10% sur votre prochain passage",
          "inactiveDays": 30
        }'::jsonb,
       true
where not exists (
  select 1 from public.campaigns
  where org_id = '11111111-1111-1111-1111-111111111111'
    and trigger = 'inactive' and channel = 'email'
);

insert into public.campaigns (org_id, trigger, channel, template, active)
select '11111111-1111-1111-1111-111111111111', 'post_purchase', 'sms',
       '{
          "name": "Merci après passage",
          "subject": null,
          "body": "Merci {{prenom}} pour votre passage ! Votre carte fidélité a été mise à jour.",
          "offer": null,
          "inactiveDays": null
        }'::jsonb,
       false
where not exists (
  select 1 from public.campaigns
  where org_id = '11111111-1111-1111-1111-111111111111'
    and trigger = 'post_purchase' and channel = 'sms'
);

-- Démo réputation conforme (module désactivé sur Business, données prêtes si activé).
insert into public.review_requests (org_id, contact_id, channel, status, dedupe_key, sent_at)
select '11111111-1111-1111-1111-111111111111',
       '33333333-3333-3333-3333-333333333332',
       'sms', 'sent', 'sms:33333333-3333-3333-3333-333333333332:demo', now()
where not exists (
  select 1 from public.review_requests
  where org_id = '11111111-1111-1111-1111-111111111111'
    and dedupe_key = 'sms:33333333-3333-3333-3333-333333333332:demo'
);

insert into public.reviews (org_id, contact_id, source, rating, author_name, content, sentiment, response_draft)
select '11111111-1111-1111-1111-111111111111',
       '33333333-3333-3333-3333-333333333332',
       'google', 5, 'Marie Dupont',
       'Très bonne boulangerie, accueil chaleureux.',
       'positive',
       'Merci Marie pour votre avis, à très vite à la boulangerie !'
where not exists (
  select 1 from public.reviews
  where org_id = '11111111-1111-1111-1111-111111111111'
    and author_name = 'Marie Dupont'
);

insert into public.private_feedback (org_id, contact_id, rating, message, handled)
select '11111111-1111-1111-1111-111111111111',
       '33333333-3333-3333-3333-333333333332',
       3, 'La file était un peu longue samedi matin.', false
where not exists (
  select 1 from public.private_feedback
  where org_id = '11111111-1111-1111-1111-111111111111'
    and message = 'La file était un peu longue samedi matin.'
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

-- ── 10. Site éditable de démo (étape 3) ─────────────────────────────────────
-- Coordonnées de notification du commerçant (Brevo).
update public.organizations
set contact_phone = '+33123456789',
    contact_email = 'demo@stepis.fr'
where id = '11111111-1111-1111-1111-111111111111';

-- Blocs de contenu publiés → /p/boulangerie-demo non vide.
insert into public.site_content (org_id, block_key, block_type, content, position, published) values
  ('11111111-1111-1111-1111-111111111111', 'welcome', 'text',
   '{"title":"Bienvenue à la Boulangerie Démo","body":"Pain frais cuit sur place, viennoiseries maison et accueil chaleureux au cœur du quartier. Passez nous voir !"}'::jsonb,
   0, true),
  ('11111111-1111-1111-1111-111111111111', 'prix-baguette', 'price',
   '{"label":"Baguette tradition","amount":"1,30","unit":"€"}'::jsonb,
   1, true),
  ('11111111-1111-1111-1111-111111111111', 'horaires', 'hours',
   '{"days":[{"label":"Lundi","open":"07:00","close":"19:30","closed":false},{"label":"Mardi","open":"07:00","close":"19:30","closed":false},{"label":"Mercredi","open":"07:00","close":"19:30","closed":false},{"label":"Jeudi","open":"07:00","close":"19:30","closed":false},{"label":"Vendredi","open":"07:00","close":"19:30","closed":false},{"label":"Samedi","open":"07:00","close":"19:30","closed":false},{"label":"Dimanche","open":"08:00","close":"13:00","closed":false}]}'::jsonb,
   2, true)
on conflict (org_id, block_key) do nothing;

-- ── 11. Modules nouveaux (étapes Phase 1) ────────────────────────────────────
-- Active phone/acquisition/admin pour l'org démo.
insert into public.org_modules (org_id, module_key, enabled) values
  ('11111111-1111-1111-1111-111111111111', 'phone',       true),
  ('11111111-1111-1111-1111-111111111111', 'acquisition', true),
  ('11111111-1111-1111-1111-111111111111', 'admin',       true)
on conflict (org_id, module_key) do update set enabled = excluded.enabled;

-- Téléphone — un message vocal et un appel manqué.
insert into public.calls (org_id, caller_phone, caller_name, summary, status, duration_seconds)
select '11111111-1111-1111-1111-111111111111', '+33700000010', 'Numéro inconnu',
       'Recherche d''une baguette tradition pour mariage samedi.', 'voicemail', 28
where not exists (select 1 from public.calls
  where org_id = '11111111-1111-1111-1111-111111111111' and caller_phone = '+33700000010');

insert into public.calls (org_id, caller_phone, caller_name, summary, status, duration_seconds)
select '11111111-1111-1111-1111-111111111111', '+33700000011', null,
       'Appel manqué — aucun message.', 'missed', 0
where not exists (select 1 from public.calls
  where org_id = '11111111-1111-1111-1111-111111111111' and caller_phone = '+33700000011');

-- Paramètres téléphone par défaut.
insert into public.phone_settings (org_id, greeting_message, transfer_number, auto_sms_on_miss)
values ('11111111-1111-1111-1111-111111111111',
        'Bonjour, vous êtes bien à la Boulangerie Démo. Laissez votre message après le bip, nous vous rappelons très vite.',
        '+33123456789', true)
on conflict (org_id) do nothing;

-- Acquisition — une campagne active avec un rapport.
insert into public.ad_campaigns (id, org_id, title, objective, platform, budget, duration_days, status, ad_copy)
select 'aaaaaaaa-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
       'Promo printemps — viennoiseries', 'promo', 'both', 150.00, 21, 'active',
       'Profitez de -15% sur nos viennoiseries cette semaine à la Boulangerie Démo.'
where not exists (select 1 from public.ad_campaigns
  where id = 'aaaaaaaa-1111-1111-1111-111111111111');

insert into public.ad_campaign_reports (org_id, campaign_id, report_date, impressions, clicks, leads_count, spend)
select '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111',
       current_date - 1, 1240, 87, 6, 22.50
where not exists (select 1 from public.ad_campaign_reports
  where campaign_id = 'aaaaaaaa-1111-1111-1111-111111111111' and report_date = current_date - 1);

-- Admin — un devis et une facture.
insert into public.documents (id, org_id, doc_type, title, recipient_name, recipient_email, recipient_phone, amount, due_date, status)
select 'bbbbbbbb-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
       'devis', 'Devis 50 baguettes — mariage Dupont',
       'Jean Dupont', 'jean@example.fr', '+33700000020', 65.00, current_date + 14, 'sent'
where not exists (select 1 from public.documents
  where id = 'bbbbbbbb-1111-1111-1111-111111111111');

insert into public.documents (id, org_id, doc_type, title, recipient_name, recipient_email, recipient_phone, amount, due_date, status)
select 'cccccccc-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
       'facture', 'Facture mensuelle Restaurant Le Voisin',
       'Restaurant Le Voisin', 'contact@levoisin.fr', '+33600000001', 480.00, current_date - 7, 'sent'
where not exists (select 1 from public.documents
  where id = 'cccccccc-1111-1111-1111-111111111111');
