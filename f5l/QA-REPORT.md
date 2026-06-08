# F5L Acquisition - Rapport QA courant

Date : 2026-06-07.

## Etat avant correction

- `npm run build` : OK.
- `npm run typecheck` : OK.
- `npm run lint` : KO.
- `.env.local` : manquant.
- Dev server : demarrait, mais `/`, `/login` et `/setup` retournaient `500`.
- Cause runtime : `proxy.ts` appelait Supabase via `requireEnv()` avant toute
  page, donc une configuration Supabase absente empechait meme d'afficher une
  page d'aide.
- `MVP-CHECKLIST.md` : manquant.

## Correctifs appliques

- Ajout de `app/setup/page.tsx`.
- Ajout de `/setup` aux prefixes publics du proxy.
- Ajout de `hasSupabaseBrowserEnv()` / `hasSupabaseServiceEnv()` dans `lib/env.ts`.
- Redirection vers `/setup` quand Supabase est absent ou placeholder.
- Creation d'un `.env.local` de developpement avec placeholders non committes.
- Nettoyage lint sur `app/error.tsx`, webhook Stripe et stubs externes.
- Recentrage des formules et modules sur F5L Acquisition V1.
- Ajout de `MVP-CHECKLIST.md`.
- Mise a jour de `README.md` et `SETUP.md`.

## Gates verifies

Resultats de cette passe :

- `npm run typecheck` : OK.
- `npm run lint` : OK.
- `npm run build` : OK.
- `npm run dev` : OK.
- `GET /setup` avec placeholders : `200`.
- `GET /` avec placeholders : `307 -> /setup`.
- `GET /login` avec placeholders : `307 -> /setup`.

## Perimetre produit valide

F5L V1 = Acquisition :

- dashboard ROI,
- prospects,
- campagnes Meta / Google en mode brouillon,
- landing page,
- capture de leads,
- reporting simple.

Modules non prioritaires : fidelisation, reputation, carte fidelite, telephone
IA, administratif, manager IA. Ils restent en "bientot disponible" jusqu'a
validation commerciale.
