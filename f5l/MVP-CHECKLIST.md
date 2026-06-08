# F5L - Checklist MVP

## Rouge - Obligatoire avant la premiere demo

### Supabase (15 min)
- [ ] Creer un projet sur supabase.com.
- [ ] Copier Project URL dans `.env.local` -> `NEXT_PUBLIC_SUPABASE_URL`.
- [ ] Copier Anon Key dans `.env.local` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Copier Service Role Key dans `.env.local` -> `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Remplacer les valeurs `placeholder` du `.env.local`.
- [ ] Lier le projet : `npx supabase link --project-ref <REF>`.
- [ ] Appliquer les migrations : `npx supabase db push`.
- [ ] Charger le seed : SQL Editor Supabase -> coller `supabase/seed.sql` -> Run.
- [ ] Lancer : `npm run dev`.
- [ ] Tester : `owner@demo.f5l` / `demo1234`.
- [ ] Verifier : `/` affiche les metriques Acquisition, `/prospects` affiche les leads, `/campagnes` affiche la campagne demo, `/ma-page` permet de voir `/p/boulangerie-demo`.

### Demo locale sans crash (5 min)
- [ ] Verifier que `.env.local` existe.
- [ ] Si Supabase n'est pas configure, ouvrir `http://localhost:3000/setup`.
- [ ] Confirmer que `/setup` affiche les etapes au lieu d'une erreur 500.
- [ ] Remplir les vraies variables Supabase avant toute demo client.

### Landing page et capture (10 min)
- [ ] Aller sur `/ma-page`.
- [ ] Verifier le titre, la promesse, le CTA, le telephone et l'e-mail.
- [ ] Ouvrir `/p/boulangerie-demo`.
- [ ] Envoyer un formulaire test.
- [ ] Verifier que le lead apparait dans `/prospects`.
- [ ] Verifier que la source du lead est lisible (page, Meta Ads, Google Ads ou publicite F5L).

### Campagnes Acquisition (10 min)
- [ ] Aller dans `/campagnes`.
- [ ] Creer une campagne test avec objectif "Plus d'appels et de demandes".
- [ ] Verifier le budget, la duree et l'estimation de prospects.
- [ ] Tester le bouton "Generer par IA" avec Anthropic non configure : un fallback doit apparaitre.
- [ ] Verifier que la campagne creee apparait dans le dashboard.

### Brevo - notifications lead (10 min)
- [ ] Creer un compte Brevo.
- [ ] Generer une cle API -> `BREVO_API_KEY`.
- [ ] Verifier l'expediteur e-mail dans Brevo -> `BREVO_SENDER_EMAIL`.
- [ ] Optionnel : activer les credits SMS -> `BREVO_SMS_SENDER`.
- [ ] Refaire un formulaire sur `/p/boulangerie-demo`.
- [ ] Verifier que le prospect apparait dans `/prospects` et que la notification arrive.

### Deploiement Vercel (10 min)
- [ ] Connecter le repo GitHub sur vercel.com.
- [ ] Root directory : `f5l`.
- [ ] Copier les variables de `.env.local` dans Vercel.
- [ ] Deployer.
- [ ] Verifier `/setup`, `/login`, `/`, `/campagnes`, `/prospects`, `/ma-page`.
- [ ] Mettre `NEXT_PUBLIC_APP_URL` a l'URL Vercel finale.

## Jaune - Recommande avant le premier client payant

### Domaine personnalise
- [ ] Acheter ou choisir un domaine.
- [ ] Configurer le domaine dans Vercel.
- [ ] Mettre a jour `NEXT_PUBLIC_APP_URL`.
- [ ] Verifier que `/p/<slug-client>` est accessible en HTTPS.

### Offre commerciale F5L Acquisition
- [ ] Preparer une offre simple : setup + abonnement mensuel.
- [ ] Definir ce qui est inclus : landing page, campagnes, suivi prospects, reporting.
- [ ] Definir ce qui n'est pas encore inclus : fidelisation, reputation, telephone IA, admin, manager.
- [ ] Preparer 3 exemples de resultats attendus : leads, CPL, rendez-vous.

### Stripe - facturation (20 min)
- [ ] Creer un compte Stripe.
- [ ] Creer les produits/prix Acquisition Starter, Business, Full.
- [ ] Copier les Price IDs dans `.env.local`.
- [ ] Copier la cle secrete -> `STRIPE_SECRET_KEY`.
- [ ] Configurer le webhook : `https://ton-domaine/api/webhooks/stripe`.
- [ ] Copier le secret webhook -> `STRIPE_WEBHOOK_SECRET`.
- [ ] Remplacer les stubs dans `lib/stripe/client.ts` par le SDK Stripe officiel.
- [ ] Tester un checkout depuis `/settings/billing`.

### Tracking publicitaire
- [ ] Creer un Meta Business Manager.
- [ ] Creer un compte Google Ads.
- [ ] Installer le Pixel Meta sur les landing pages.
- [ ] Installer Google Tag Manager ou Google Ads conversion tracking.
- [ ] Noter les conversions importantes : formulaire envoye, clic telephone, demande de devis.

## Vert - Plus tard

### Meta Ads
- [ ] Creer une app Meta Marketing API.
- [ ] Obtenir un token d'acces.
- [ ] Brancher `lib/ads/meta.ts`.
- [ ] Envoyer les conversions via Conversions API.

### Google Ads
- [ ] Activer Google Ads API dans Google Cloud.
- [ ] Brancher `lib/ads/google.ts`.
- [ ] Synchroniser les couts et conversions.

### Modules apres validation marche
- [ ] Fidelisation.
- [ ] Reputation.
- [ ] Telephone IA.
- [ ] Carte fidelite.
- [ ] Administratif.
- [ ] Manager IA.
