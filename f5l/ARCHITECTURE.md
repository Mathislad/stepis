# Architecture F5L — Fondation multi-tenant

Ce document explique **le modèle multi-tenant**, **la stratégie RLS**, **les
conventions de code**, et **comment brancher un nouveau module** aux prochaines
étapes.

---

## 1. Modèle multi-tenant

Un **tenant = une organisation** (`organizations`), c.-à-d. un commerce client de
Stepis. **Toute table métier porte une colonne `org_id`** (FK vers
`organizations.id`, `on delete cascade`). L'isolation entre tenants n'est PAS
gérée dans le code applicatif : elle est **forcée par la base** via Row Level
Security. Même un bug applicatif ne peut pas faire fuiter les données d'une autre
org tant que l'on utilise le client serveur/browser (clé ANON).

### Le pont auth ↔ tenant : `profiles`

```
auth.users (Supabase Auth)        profiles                organizations
   id (uuid)  ───────────────►  id = auth.uid()  ──► org_id ──► id
                                role (owner|staff)
```

À la connexion, Supabase pose un JWT ; `auth.uid()` est disponible côté Postgres.
La ligne `profiles` correspondante donne l'`org_id` de l'utilisateur.

### Formules & modules

- `organizations.formula` ∈ `starter | business | full`.
- `org_modules` (unique `org_id` + `module_key`) porte le flag `enabled` et un
  `config` jsonb par module. C'est la **source de vérité de l'activation**.
- `lib/modules.ts` ne contient que de la **métadonnée d'affichage** (libellés,
  ordre, formule minimale indicative) — jamais la logique d'autorisation.

---

## 2. Stratégie RLS

### La fonction clé : `current_org_id()`

```sql
create function public.current_org_id() returns uuid
language sql stable security definer set search_path = public
as $$ select org_id from public.profiles where id = auth.uid() $$;
```

- **`security definer`** : la fonction lit `profiles` **en contournant la RLS**.
  C'est ce qui **évite la récursion** : si la policy de `profiles` appelait une
  fonction qui relit `profiles` sous RLS, on bouclerait. Ici, non.
- **`stable`** : le planner met le résultat en cache pour la durée de la requête
  (1 seul lookup, pas un par ligne).
- Exécution accordée à `authenticated` uniquement.

### Le contrat de policy (identique sur 14 tables métier)

```sql
-- SELECT / INSERT / UPDATE / DELETE
using      (org_id = public.current_org_id())   -- SELECT/UPDATE/DELETE
with check (org_id = public.current_org_id())   -- INSERT/UPDATE
```

Généré en boucle dans la migration (section 6.3) pour rester DRY et cohérent.

### Cas particuliers

| Table           | Règle                                                                 |
|-----------------|-----------------------------------------------------------------------|
| `organizations` | SELECT si `id = current_org_id()` ; UPDATE réservé au rôle `owner`.    |
| `profiles`      | SELECT sa ligne **ou** celles de son org ; INSERT/UPDATE sa ligne seule. |
| `loyalty_cards` | **Aucune** policy publique. Lecture client final via RPC dédiée ↓.    |

### Accès public maîtrisé — carte de fidélité

Le client final consulte sa carte **sans login** (QR/lien). Au lieu d'ouvrir une
policy `SELECT` publique (qui exposerait `org_id`, `contact_id`…), on expose une
**RPC `SECURITY DEFINER` minimale** :

```sql
get_loyalty_card_by_token(p_token) → (points int, rewards jsonb)
```

Elle ne renvoie **que** les points et les paliers actifs — accordée à `anon`.
Page : `app/carte/[token]/page.tsx`.

### Le rôle `service_role`

`lib/supabase/admin.ts` (garde `import "server-only"`) crée un client
**service-role qui contourne la RLS**. Réservé à des opérations serveur
privilégiées et **scopées manuellement** à une org (provisioning d'un tenant,
webhooks Brevo/Anthropic, écriture de metering). Jamais importé côté navigateur.

---

## 3. Conventions de code

- **TypeScript strict**, pas de `any`. `noUncheckedIndexedAccess` activé.
- **Server Components par défaut** ; `"use client"` seulement si nécessaire
  (formulaires interactifs, hooks, service worker).
- **Tout accès données passe par `lib/`** — jamais d'appel Supabase brut dans un
  composant de page. Trois clients :
  - `lib/supabase/server.ts` → RSC / Route Handlers / Server Actions (ANON + cookies, RLS active)
  - `lib/supabase/client.ts` → composants navigateur (ANON, RLS active)
  - `lib/supabase/admin.ts`  → service-role, serveur uniquement
- **Nommage anglais** pour le code ; **commentaires français** acceptés.
- **UI** : thème sombre, coins arrondis, bordures translucides, police système
  Apple. Primitives sobres dans `components/ui/` ; pas de librairie lourde.

### Arborescence

```
app/
  (auth)/login/         page de connexion
  (dashboard)/          shell protégé + accueil (route "/")
  locked/               écran « module verrouillé »
  carte/[token]/        carte de fidélité publique (RPC)
  auth/callback/        échange de code (confirmation e-mail / lien magique)
  manifest.ts           manifest PWA
components/
  ui/                   Button, Card, Input
  auth/                 LoginForm
  pwa/                  RegisterSW
lib/
  supabase/             server | client | admin | middleware (helper updateSession)
  auth/                 context (getOrgContext) | require-module | actions
  modules.ts            registre d'affichage des modules
  env.ts · utils.ts
types/database.ts       types alignés sur la migration
supabase/
  migrations/0001_foundation.sql
  seed.sql · config.toml
proxy.ts                refresh session + protection des routes (convention Next 16)
```

---

## 4. Authentification & gardes

- **Login** : `LoginForm` (client) → `signIn` Server Action → `signInWithPassword`
  pose la session en cookie → redirection.
- **Proxy** (`proxy.ts` → `lib/supabase/middleware.ts`, convention Next 16 qui
  remplace `middleware`) : rafraîchit la session à chaque requête et **redirige
  les non-connectés** vers `/login`
  (sauf préfixes publics `/login`, `/auth`, `/carte`).
- **Gardes de page** (`lib/auth/require-module.ts`) :
  - `requireAuth()` → exige une session, sinon `/login`.
  - `requireModule("crm")` → exige le module activé, sinon `/locked?module=crm`.

---

## 5. Brancher un nouveau module (étapes suivantes)

Exemple : ajouter le module **CRM**.

1. **Données** — les tables existent déjà (`contacts`, `activities`, `leads`) avec
   RLS. Si un nouveau module a besoin d'une table, créer une **nouvelle migration**
   `supabase/migrations/000X_<module>.sql` : table avec `org_id`, index, trigger
   `updated_at`, puis **activer RLS + 4 policies** sur le contrat standard
   (copier le bloc de la section 6.3). Ajouter aussi les types dans
   `types/database.ts` (ou régénérer).

2. **Activation** — ajouter/mettre à jour la ligne `org_modules` (`module_key`,
   `enabled`) pour les orgs concernées. La `module_key` doit exister dans l'enum
   `module_key` (migration) **et** dans `lib/modules.ts`.

3. **Routes** — créer le dossier sous `app/(dashboard)/crm/…`. **Première ligne**
   de chaque page protégée :

   ```ts
   const ctx = await requireModule("crm");
   ```

   → gère seul l'auth, l'isolation tenant et le verrouillage de module.

4. **Accès données** — créer `lib/crm/…` (lectures/écritures via
   `createClient()`), jamais d'appel Supabase direct dans la page.

5. **UI** — composer avec `components/ui/` et le thème ; ajouter une entrée de
   navigation si besoin.

Aucune logique d'isolation à réécrire : `org_id = current_org_id()` s'applique
automatiquement à toute requête du nouveau module.

---

## 6. Modules livrés (à jour)

| Module | Clé `module_key` | Migration | `lib/` | Routes |
|---|---|---|---|---|
| Site éditable + capture leads | `site` · `lead_capture` | 0003, 0008 | `lib/site` | `/site`, `/p/[slug]` |
| CRM | `crm` | 0002 | `lib/crm` | `/crm`, `/crm/[id]`, `/crm/leads`, `/crm/new` |
| Carte de fidélité | `loyalty_card` | (utilise 0001) | `lib/loyalty` | `/loyalty`, `/loyalty/[id]`, `/loyalty/new`, `/loyalty/rewards`, `/carte/[token]` |
| Agent Fidélisation | `loyalty_agent` | 0004 | `lib/loyalty-agent` | `/loyalty-agent`, `/api/cron/loyalty-agent` |
| Manager | `manager` | 0009, 0010 | `lib/manager` | `/manager` |
| Réputation | `reputation` | 0005, 0006, 0007, 0011 | `lib/reputation` | `/reputation`, `/feedback/[id]` |
| Téléphone | `phone` | 0012 | `lib/telephone` (+ stub `lib/vapi`) | `/telephone`, `/telephone/[id]`, `/telephone/settings` |
| Acquisition | `acquisition` | 0013 | `lib/acquisition` (+ stubs `lib/ads/meta`, `lib/ads/google`) | `/acquisition`, `/acquisition/[id]`, `/acquisition/new` |
| Administratif | `admin` | 0014 | `lib/admin` (+ stubs `lib/signature/yousign`, `lib/accounting/pennylane`) | `/admin`, `/admin/[id]`, `/admin/new` |

### Tables ajoutées par module

- **0012** : `calls`, `phone_settings`
- **0013** : `ad_campaigns`, `ad_campaign_reports` *(décision : `ad_campaigns` pour éviter la collision avec `campaigns` du module Fidélisation)*
- **0014** : `documents`, `payment_reminders`

### RPC publiques

- `current_org_id()` — fondation (0001).
- `get_loyalty_card_by_token(token)` — fondation (0001).
- `convert_lead_to_contact(lead_id, type)` — CRM (0002).
- `create_public_lead(slug, …)` — étape 3, durci en 0008.
- `create_private_feedback_for_request(request_id, rating, message)` — réputation (0006, durci en 0007).

### Exception encadrée

- `app/auth/callback/route.ts` appelle directement `supabase.auth.exchangeCodeForSession()` (chemin Supabase imposé). Tout autre accès données passe par `lib/`.

### Stubs d'intégrations externes (gracieux)

Tous les stubs retournent `{ configured: false, message: ... }` tant que la clé d'env correspondante est absente, sans jamais propager d'exception :

- `lib/brevo/{client,notify}` — SMS + email (présent et actif si clé).
- `lib/anthropic/client` — IA (Manager, génération de copy publicitaire).
- `lib/vapi/client` — téléphonie IA.
- `lib/ads/{meta,google}` — Meta Ads, Google Ads.
- `lib/signature/yousign` — signature électronique.
- `lib/accounting/pennylane` — comptabilité.
