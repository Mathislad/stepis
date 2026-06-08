# F5L Acquisition - Handoff

> Reprise de session apres pivot strategique de juin 2026.

## Direction produit

F5L n'est plus priorise comme "SaaS IA tout-en-un" pour la V1.

La V1 vendable est **F5L Acquisition** :

- apporter plus de prospects,
- generer plus d'appels / rendez-vous / devis,
- prouver la valeur avec le cout par lead et les conversions,
- apprendre le marche avant de construire les modules longs.

Question de priorisation :

> Cette fonctionnalite aide-t-elle directement a obtenir ou conserver un client ?

Si non, backlog.

## Stack

- Next.js 16, React 19, TypeScript strict.
- Tailwind v4.
- Supabase SSR 0.10, supabase-js 2.x.
- RLS par `org_id = current_org_id()`.
- Proxy Next 16 dans `proxy.ts`.
- Stubs gracieux pour Brevo, Anthropic, Stripe, Meta Ads, Google Ads, Vapi,
  Yousign, Pennylane.

## Routes V1 actives

- `/` : dashboard acquisition.
- `/prospects` : leads/prospects.
- `/prospects/[contactId]`.
- `/prospects/nouveau`.
- `/campagnes` : campagnes publicitaires.
- `/campagnes/nouvelle`.
- `/campagnes/[campaignId]`.
- `/ma-page` : landing page.
- `/p/[slug]` : page publique.
- `/settings/*`.
- `/setup` : aide de configuration si Supabase manque.

## Modules non prioritaires

Ces modules restent dans le code et la vision long terme, mais ne doivent pas
etre vendus comme operationnels en V1 :

- fidelisation,
- reputation,
- carte fidelite,
- telephone IA,
- administratif,
- manager IA.

Ils doivent apparaitre comme "bientot disponible" si visibles.

## Gotchas techniques

- Ne jamais accepter `org_id` depuis le client.
- Acces donnees via `lib/`, pas de Supabase direct dans les pages, sauf exception
  auth callback documentee.
- Next 16 : `params`, `searchParams` et `cookies()` sont async.
- Les `Relationships: []` vides interdisent les embeds Supabase : faire deux
  requetes + jointure JS.
- Les types de lignes dans `types/database.ts` restent des `type`, pas des
  `interface`.
- Les placeholders `.env.local` doivent afficher `/setup`, pas provoquer un 500.

## Verification obligatoire

Avant de finir une passe :

```bash
npm run typecheck
npm run lint
npm run build
```

Pour tester la resilience locale :

```bash
npm run dev
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/setup
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Avec placeholders, `/setup` doit retourner `200` et `/` doit rediriger vers
`/setup`.

## Donnees demo

Apres migrations + seed :

- org : Boulangerie Demo,
- login : `owner@demo.f5l` / `demo1234`,
- landing page : `/p/boulangerie-demo`,
- modules actifs V1 : `site`, `crm`, `lead_capture`, `acquisition`.

## Prochaine suite logique

1. Valider `/setup` et le demarrage local sans Supabase reel.
2. Brancher une vraie instance Supabase demo.
3. Tester le parcours client complet : `/ma-page` -> `/p/boulangerie-demo` ->
   formulaire -> `/prospects` -> `/campagnes`.
4. Brancher Brevo pour les notifications de nouveau prospect.
5. Ensuite seulement : Meta/Google tracking et integration Ads reelle.
