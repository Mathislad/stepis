# F5L — Handoff (reprise de session)

> Doc de passation pour reprendre le développement du projet `f5l/`.
> Lire **en entier** avant de coder. Les "Gotchas" plus bas évitent les pièges déjà rencontrés.

## 1. C'est quoi

**F5L** = plateforme SaaS **multi-tenant** (codename). Marque = **Stepis**. Chaque commerce = un tenant isolé.
Un commerçant se connecte au **dashboard** (thème sombre Apple/iOS) et ses clients voient des **pages publiques** (thème clair).
Le projet est livré par **étapes**, une par "master prompt". Workflow imposé à chaque étape :
1) lire le code existant, 2) **présenter un plan et attendre validation**, 3) construire dans l'ordre,
4) `npm run build` clean (0 warning), 5) **vérif DB locale** (voir §7), 6) runbook.

## 2. Stack réelle (NE PAS downgrader)

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript strict**
- **Tailwind v4** (CSS-first : `@import "tailwindcss"` + `@theme` dans `app/globals.css`, pas de `tailwind.config`)
- **@supabase/ssr 0.10** · **supabase-js 2.107** · Postgres + RLS
- `qrcode` (étape 4). Déploiement visé : Vercel. Brevo (SMS/email). Anthropic (préparé, non utilisé).
- Node 20, npm 10. **Supabase CLI 2.75 installé**. **Postgres 15 local lancé** (Homebrew) → sert aux vérifs.

## 3. Où en est-on

| Étape | Module | État | Routes |
|---|---|---|---|
| 1 | Fondation (16 tables, RLS, auth, PWA, thème) | ✅ **commité** | `/login`, `/`, `/locked` |
| 2 | CRM (contacts/leads/activités) | ✅ **commité** | `/crm`, `/crm/[id]`, `/crm/new`, `/crm/leads` |
| 3 | Site éditable + Capture de leads | ✅ build OK, **NON commité** | `/site`, `/site/edit/[blockKey]`, `/site/offers`, `/p/[slug]` |
| 4 | Carte de fidélité | ✅ build OK, **NON commité** | `/loyalty`, `/loyalty/[cardId]`, `/loyalty/new`, `/loyalty/rewards`, `/carte/[token]` |
| 5 | Agent Fidélisation (campagnes + envoi manuel + cron) | ✅ build OK, **NON commité** | `/loyalty-agent`, `/api/cron/loyalty-agent` |
| 6 | Manager MVP + synthèse IA + validations sensibles | ✅ build OK, **NON commité** | `/manager` |
| 7 | Réputation conforme MVP + durcissement sécurité/SEO | ✅ build OK, **NON commité** | `/reputation`, `/feedback/[requestId]`, `/robots.txt`, `/sitemap.xml` |

**Git** : branche `feat/nextjs-saas-migration`. Dernier commit `248ca62` = étapes 1+2 (66 fichiers).
**Étapes 3, 4, 5, 6 et 7 sont dans le working tree, pas encore commitées.** (Commit seulement si le user le demande — cf. CLAUDE.md.)
Le repo racine contient aussi `stepis_v2/` (site vitrine live, à ne PAS toucher) — `f5l/` est le produit.

## 4. Architecture & conventions (NON négociables)

- **Tout accès données passe par `lib/`** — JAMAIS de Supabase dans une page/composant.
- **Server Components par défaut** ; `"use client"` seulement si interactif. **Mutations = Server Actions** (`lib/<module>/actions.ts`).
- **RLS = isolation** : chaque table métier a `org_id`. La fonction `public.current_org_id()` (SECURITY DEFINER) isole. **On ne filtre jamais `org_id` à la main en lecture, et on n'accepte jamais d'`org_id` venant du client.** Aux écritures, `org_id` est résolu serveur via `getCurrentOrgId()` ou `ctx.org.id`.
- **Gating module** : chaque route dashboard d'un module commence par `const ctx = await requireModule('<key>')` (renvoie un `OrgContext` avec `org`, `userId`, `enabledModules`). Module non activé → `/locked`.
- Clients Supabase : `lib/supabase/server.ts` (RSC/actions, anon+cookies, RLS), `client.ts` (browser), `admin.ts` (service-role, `server-only`, **bypasse la RLS** → réservé aux lectures publiques/anon, **scopé à la main**).
- Middleware = **`proxy.ts`** (convention Next 16, remplace `middleware.ts`). `PUBLIC_PREFIXES` (dans `lib/supabase/middleware.ts`) = `['/login','/auth','/carte','/feedback','/p','/api/cron']`. **Ajouter tout nouveau préfixe public ici.**
- Les routes cron sous `/api/cron/*` sont publiques côté proxy mais doivent être protégées dans le route handler par `Authorization: Bearer $CRON_SECRET`.
- UI dashboard : `components/ui/` (Button, Card, Input, Select, Textarea, Badge, ConfirmButton) + classes CSS `.surface/.btn/.btn-primary/.btn-ghost/.input/.badge` + vars `--bg/--text/--text-2/--muted/--border/--surface/--blue/--green/--red/--violet/--amber`.
- UI publique : thème **clair** dans `app/(public)/layout.tsx` ; composants `components/public/` ou Tailwind clair direct (`text-zinc-*`, `bg-white`…). **Ne pas réutiliser les classes/vars sombres** sur le public.
- **Les route groups `(dashboard)`/`(public)`/`(auth)` n'ajoutent PAS de segment d'URL** : `/crm`, `/site`, `/loyalty` (pas `/dashboard/...`).
- TypeScript strict, **pas de `any`**. Types depuis `types/database.ts`.

## 5. Gotchas (pièges déjà rencontrés — IMPORTANT)

1. **Row types = `type`, pas `interface`** dans `types/database.ts`. Une `interface` n'est pas assignable à `Record<string,unknown>` → supabase-js dégrade **toutes** les lignes en `never`. Chaque table a aussi `Relationships: []`.
2. **`@supabase/ssr` doit être ≥ 0.10** (alignée sur supabase-js 2.107). La 0.5 casse le typage (`never` + cookies `any`).
3. **PAS de `noUncheckedIndexedAccess`** dans tsconfig (ça casse les types supabase).
4. **`Relationships: []` vide → PAS de `select` imbriqué (embed)**. Pour joindre (ex. carte→contact), faire **2 requêtes + jointure JS** (voir `lib/loyalty/cards.ts` `listCards`, ou `getOrgContext`).
5. **Clés d'enum `module_key` EXACTES** (pas d'invention) : `site, crm, lead_capture, loyalty_agent, loyalty_card, reputation, phone, acquisition, admin, manager`. ⚠️ Le module "Site éditable" = **`site`** (pas `site_content`). "Carte de fidélité" = **`loyalty_card`** (pas `loyalty`). "Agent Fidélisation" = **`loyalty_agent`**.
6. **`loyalty_cards.card_token` = `text` (hex)**, pas uuid. Défaut DB `encode(gen_random_bytes(16),'hex')`.
7. **`<img>`** déclenche le warning `@next/next/no-img-element` → ajouter `{/* eslint-disable-next-line @next/next/no-img-element */}` (build doit rester 0 warning).
8. **Next 16** : `params` et `searchParams` des pages sont des **`Promise`** → `const { x } = await params`. `cookies()` est async.
9. `WithDefaults` (dans `types/database.ts`) rend optionnelles les colonnes **à défaut DB ET nullables** (sinon les `Insert` exigent tous les champs nullables).
10. **Migrations** : 0001 fondation, 0002 CRM (`leads.source` + `convert_lead_to_contact`), 0003 site (`organizations.contact_phone/email` + `create_public_lead`), 0004 loyalty_agent (`messages.campaign_id` + `dedupe_key` pour éviter les doublons d'envoi), 0005 reputation (`review_requests`, `reviews`, `private_feedback`), 0006 reputation public feedback (`create_private_feedback_for_request`), 0007 hardening feedback public (`private_feedback.request_id` + unicité par demande + taille message), 0008 hardening lead public (`create_public_lead` valide/borne les entrées), 0009 manager approvals (`manager_action_requests` + statuts/risques + RLS), 0010 manager execution lock (`executing` pour éviter double exécution), 0011 reputation response approvals (`response_draft_generated_at`, `response_approved_at`, `response_approved_by`). **Ne jamais modifier une migration existante** ; en créer une nouvelle `000X_*.sql` idempotente si besoin, et la justifier. Étape 4 n'a **pas** ajouté de migration.

## 6. Données de démo (seed) — pour tester

`supabase/seed.sql` (idempotent). Org : **Boulangerie Démo**, slug **`boulangerie-demo`**, formule **business** (modules activés : site, crm, lead_capture, loyalty_agent, loyalty_card).
- **Login** : `owner@demo.f5l` / `demo1234`
- Contacts : Restaurant Le Voisin (B2B), Marie Dupont (B2C), Léa Martin (source `f5l_acquisition`)
- Leads : Paul Durand (`site_form`), Sophie Bernard (`f5l_acquisition`)
- Site public : `/p/boulangerie-demo` (3 blocs publiés : texte, prix, horaires) + offre active
- Carte fidélité : **`/carte/demo-card-token`** (Marie Dupont, **65 pts**, 3 transactions, paliers Café 50 / Viennoiserie 100 / -10% 200)
- Agent Fidélisation : `/loyalty-agent` (campagnes démo anniversaire SMS, inactivité email, post-achat SMS)

## 7. Commandes & vérif

```bash
cd f5l
npm install
npm run build        # DOIT être clean (typecheck + lint, 0 warning) avant de finir une étape
npm run dev          # http://localhost:3000

# DB (Supabase hébergé) :
supabase db push                          # applique les migrations
psql "$DATABASE_URL" -f supabase/seed.sql # recharge la démo (idempotent)
```

**Vérif DB locale (pattern utilisé à chaque étape, sans Docker)** — Postgres 15 local + shim `auth` :
1. `createdb f5l_verify`
2. Appliquer un shim `auth` (schéma `auth` + `auth.users`/`auth.identities` + `auth.uid()` lisant le GUC `app.user_id` + rôles `anon`/`authenticated`).
3. Appliquer `0001 → ... → 0011 → seed.sql`.
4. Tester en `set role authenticated; set app.user_id='<uuid>'` pour prouver l'**isolation RLS** (un owner B ne voit/modifie rien de l'org A), tester les RPC en `set role anon`.
5. Nettoyer : `dropdb f5l_verify` + `dropuser anon authenticated` + supprimer les fichiers `/tmp/*.sql`.
(Le owner A du seed = `22222222-2222-2222-2222-222222222222`, org A = `11111111-1111-1111-1111-111111111111`.)

## 8. Reste à faire (prochaines étapes)

Modules non construits ou incomplets (gérés par `org_modules`, déjà dans l'enum) :
- **`loyalty_agent`** — Agent Fidélisation : UI construite (`/loyalty-agent`) avec CRUD campagnes, activation, aperçu template, stats, audience estimée, prévisualisation des messages personnalisés, envoi manuel Brevo SMS/email, cron sécurisé `GET /api/cron/loyalty-agent`, logs `messages`, anti-doublon `dedupe_key`, metering mensuel `usage_metering`, limites mensuelles par formule visibles dans l'UI, traces `audit_log`, résumé `daily_digest.loyalty_agent`. Branchement Manager : si le module `manager` est activé pour l'org, les campagnes SMS, WhatsApp ou audiences ≥25 contacts créent une demande `manager_action_requests` au lieu d'envoyer directement ; si Manager n'est pas activé, le comportement direct existant est conservé pour ne pas bloquer les formules Business. Une demande `approved` de type `dispatch_campaign` peut maintenant être exécutée depuis `/manager`, avec statut transitoire `executing`, dispatch réel, audit `action_executed`, puis statut `executed`. À la création d'une demande sensible, notification Brevo best-effort au commerce si coordonnées org disponibles. Reste à construire : WhatsApp réel.
- **`manager`** — Manager construit (`/manager`) : lit `daily_digest`, `audit_log`, `usage_metering`, affiche briefing lisible, résumé du jour, historique, journal des agents et quotas. Synthèse IA optionnelle : bouton "Générer le briefing IA", client Anthropic serveur-only (`lib/anthropic/client.ts`), stockage dans `daily_digest.summary.manager_ai`, audit `manager.ai_briefing`, metering `ai_tokens`, échec best-effort journalisé `ai_briefing_failed`. Requiert `ANTHROPIC_API_KEY` **et** `ANTHROPIC_MODEL`. Validations sensibles : table `manager_action_requests`, liste dans `/manager`, approbation/refus avec audit `action_approved` / `action_rejected`, exécution des actions `dispatch_campaign` et `approve_review_response` approuvées avec verrou `executing`, RLS tenant validée. Le trail Manager écrit aussi `daily_digest.summary.manager` (requested/approved/rejected/executed/failed) en best-effort pour alimenter le briefing. L'Agent Fidélisation dépose déjà des demandes pour les envois sensibles quand Manager est actif ; Réputation dépose des demandes pour valider un brouillon de réponse IA. Reste à construire : branchement Acquisition/Phone quand ces agents déclencheront des actions sensibles.
- **`reputation`** — Réputation conforme MVP construit (`/reputation`) : demandes d'avis envoyées à tous les contacts éligibles (SMS/e-mail via Brevo si `BREVO_API_KEY` configurée), lien public `/feedback/[requestId]`, feedback privé via RPC anon sécurisée et idempotente par demande, suivi avis publics, marquage traité, aucun review gating. Réponses IA : bouton de brouillon Anthropic serveur-only, prompt conforme Google (pas de compensation, pas de pression, pas de demande de modification/suppression d'avis), stockage `reviews.response_draft`, metering `ai_tokens`, audit, puis demande Manager `approve_review_response` si le module `manager` est actif. L'exécution Manager marque le brouillon comme approuvé (`response_approved_at`) mais ne touche pas `responded_at` tant que Google Business API n'est pas branchée. Reste à construire : Google Business API pour importer/publier réellement les réponses approuvées.
- **Sécurité/SEO public** — Dashboard `noindex` par défaut, `/p/[slug]` indexable avec canonical/OpenGraph, `/carte/[token]` et `/feedback/[requestId]` en `noindex`, `robots.txt` restrictif, `sitemap.xml` dynamique des sites publiés quand Supabase service-role est configuré. Cron fidélisation protégé par comparaison constant-time de `CRON_SECRET`.
- **`phone`**, **`acquisition`**, **`admin`** (V1+, `available:false` dans `lib/modules.ts`).
- Tables déjà prêtes mais inexploitées : `messages` (log envois + metering), `usage_metering` (compteurs/marge), `audit_log` (journal inter-agents).

**Pour ajouter un module** (recette, cf. `ARCHITECTURE.md` §5) :
1. Données existantes ? sinon migration `000X_*.sql` (table avec `org_id` + index + RLS 4 policies + trigger `updated_at`) + types dans `types/database.ts`.
2. `lib/<module>/` (data + `actions.ts` avec `requireModule('<key>')` + `revalidatePath`).
3. `app/(dashboard)/<module>/` pages, 1ère ligne `await requireModule('<key>')`.
4. NavLinks : ajouter l'entrée dans `app/(dashboard)/layout.tsx` si `ctx.enabledModules.has('<key>')`.
5. Build clean + vérif DB locale.

## 9. Pour reprendre tout de suite

- Étapes 3, 4 & 5 buildent → **on peut les commiter** si le user le demande. Message suggéré : `feat(f5l): site, fidélité et agent fidélisation`. Commiter **uniquement `f5l/`**, jamais `stepis_v2/`, `.env.local`, `.vercel/`, ni les dossiers parents non liés.
- Prochaine étape la plus logique : brancher Google Business API pour importer les avis réels et publier uniquement les réponses déjà approuvées par le Manager, puis connecter Acquisition/Phone au même workflow d'approbation.
- Mémoire persistante du projet : voir `~/.claude/projects/.../memory/` (f5l-platform, supabase-js-typing-gotchas, stepis-stack-prefs).

### Cron Agent Fidélisation

Variables requises : `CRON_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BREVO_API_KEY`.
Variables optionnelles Manager IA : `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`.
Config Vercel : `vercel.json` lance `/api/cron/loyalty-agent` tous les jours à 07:15 UTC.

Test manuel :
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://<app>/api/cron/loyalty-agent
```

La route parcourt les orgs avec `org_modules.loyalty_agent = true`, charge les campagnes actives, filtre chaque requête admin par `org_id`, écrit `messages` avec `dedupe_key`, envoie Brevo SMS/email, incrémente `usage_metering`, écrit `audit_log`, puis met à jour `daily_digest.summary.loyalty_agent`.

Limites mensuelles actuelles (`lib/usage/limits.ts`) : Starter 150 SMS / 1000 e-mails, Business 400 SMS / 3000 e-mails, Full 900 SMS / 8000 e-mails. Quand une limite est atteinte, l'envoi est journalisé `skipped_limit_reached` sans coût.
