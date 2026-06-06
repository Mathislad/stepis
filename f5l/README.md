# F5L — Plateforme (Étape 1 : Fondation)

Console SaaS multi-tenant de **Stepis** : chaque commerce client est un **tenant
isolé**. Cette étape ne livre que la **fondation** (base de données, RLS, auth,
garde de modules, conventions). Les modules (CRM, site, fidélisation, carte…)
se brancheront dessus aux étapes suivantes.

> Codename produit : **F5L**. Marque : **Stepis**. Ce dossier est indépendant du
> site vitrine (`../stepis_v2`).

## Stack

- **Next.js 16** (App Router, TypeScript strict, Server Components par défaut)
- **Supabase** — Postgres + Auth + Row Level Security + Storage
- **Tailwind CSS v4** (thème sombre « Apple / iOS »)
- **Brevo** (SMS/email) et **Anthropic** (IA) — *emplacements préparés, non implémentés*
- Déploiement visé : **Vercel**

## Prérequis

- Node ≥ 20, npm ≥ 10
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase --version`)
- Un projet Supabase (hébergé) **ou** Docker pour la stack locale

## Démarrage rapide

```bash
# 1. Dépendances
npm install

# 2. Variables d'environnement
cp .env.example .env.local        # puis renseigner les clés Supabase

# 3. Base de données — au choix :

#   A) Projet Supabase hébergé (recommandé)
supabase link --project-ref <VOTRE-REF>
supabase db push                  # applique supabase/migrations/*
#   → puis charger le seed : coller supabase/seed.sql dans le SQL Editor
#     (ou: psql "$DATABASE_URL" -f supabase/seed.sql)

#   B) Stack Supabase locale (Docker)
supabase start                    # démarre Postgres + Auth + Studio
supabase db reset                 # applique migrations + seed.sql automatiquement

# 4. Lancer l'app
npm run dev                       # http://localhost:3000
```

### Connexion de démo

| Champ        | Valeur                 |
|--------------|------------------------|
| E-mail       | `owner@demo.f5l`       |
| Mot de passe | `demo1234`             |

Carte de fidélité publique (sans login) : `/carte/demo-card-token`

## Scripts

| Commande            | Effet                                              |
|---------------------|----------------------------------------------------|
| `npm run dev`       | Serveur de développement                           |
| `npm run build`     | Build de production                                |
| `npm run start`     | Sert le build                                      |
| `npm run lint`      | ESLint                                             |
| `npm run typecheck` | `tsc --noEmit`                                      |
| `npm run db:push`   | `supabase db push` (migrations → projet lié)       |
| `npm run db:reset`  | `supabase db reset` (recrée la base locale + seed) |

## Régénérer les types (optionnel)

Les types vivent dans `types/database.ts` (maintenus à la main pour l'Étape 1).
Pour les régénérer depuis la base réelle :

```bash
supabase gen types typescript --linked > types/database.ts
```

## Architecture (résumé)

```
Navigateur ──► proxy.ts ──────► refresh session + protection des routes
                                   │
   app/(auth)/login ──────────────┤  signIn() Server Action (lib/auth/actions)
                                   │
   app/(dashboard)/* ─────────────┤  requireAuth() / requireModule()
        │                          │       │
        │                          │       └─► getOrgContext() (lib/auth/context)
        │                          │                 │
        └─ tout accès données ─────┴────► lib/supabase (server | client | admin)
                                                       │
                                              Supabase Postgres
                                          (RLS : org_id = current_org_id())
```

Détails du modèle multi-tenant, de la stratégie RLS et de l'ajout d'un module :
voir **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

## Sécurité

- RLS active sur **100 %** des tables ; isolation par `org_id`.
- Service-role réservé au serveur (`lib/supabase/admin.ts`, garde `server-only`).
- En-têtes de sécurité (CSP, HSTS, etc.) dans `next.config.ts`.
- Accès public de la carte de fidélité **uniquement** via la RPC
  `get_loyalty_card_by_token` (aucune policy publique large).
