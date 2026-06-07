# F5L Acquisition

F5L Acquisition est le MVP vendable de Stepis : un systeme simple pour aider
une entreprise locale a transformer un budget marketing en prospects, rendez-vous,
devis et clients.

Le SaaS complet reste la vision long terme, mais la V1 est volontairement
centree sur :

- landing page locale,
- capture de prospects,
- suivi des prospects,
- campagnes Meta / Google en mode brouillon,
- reporting simple : leads, cout par lead, conversion.

## Stack

- Next.js 16, React 19, TypeScript strict
- Tailwind CSS v4
- Supabase Auth + Postgres + RLS
- Brevo, Anthropic, Stripe, Meta Ads et Google Ads en stubs gracieux
- Deploiement vise : Vercel

## Demarrage rapide

```bash
npm install
cp .env.example .env.local
npm run dev
```

Avec les placeholders, l'application demarre et redirige vers `/setup`.
Pour utiliser le dashboard, remplir les variables Supabase dans `.env.local`,
puis appliquer les migrations et le seed.

```bash
npx supabase link --project-ref <REF>
npx supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql
```

Compte demo apres seed :

| Champ | Valeur |
|---|---|
| E-mail | `owner@demo.f5l` |
| Mot de passe | `demo1234` |

Routes principales :

- `/` : tableau de bord acquisition
- `/prospects` : leads et suivi commercial
- `/campagnes` : campagnes publicitaires
- `/ma-page` : landing page
- `/p/boulangerie-demo` : page publique demo
- `/setup` : aide de configuration si Supabase manque

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de developpement |
| `npm run build` | Build de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sans emission |
| `npm run db:push` | Applique les migrations Supabase |
| `npm run db:reset` | Reset local Supabase |

## Priorite produit

Toute nouvelle fonctionnalite doit repondre a une question :

> Est-ce que cela aide directement F5L a obtenir ou conserver un client pour
> l'entreprise locale ?

Si oui : priorite haute. Sinon : backlog.

Modules non prioritaires en V1 : fidelisation, reputation, carte fidelite,
telephone IA, administratif, manager IA. Ils peuvent apparaitre comme
"bientot disponible", mais ne doivent pas etre vendus comme operationnels.

## Docs utiles

- [SETUP.md](./SETUP.md) : mise en route locale et deploiement
- [MVP-CHECKLIST.md](./MVP-CHECKLIST.md) : checklist demo/client
- [ARCHITECTURE.md](./ARCHITECTURE.md) : conventions multi-tenant/RLS
