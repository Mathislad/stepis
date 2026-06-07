# F5L — Guide de mise en route

> Cette doc liste **exactement** ce qu'il faut faire pour mettre F5L en route
> en local, puis brancher progressivement les APIs réelles. Le code marche
> sans aucune clé externe — tout est en **stub gracieux**.

---

## 1. Mise en route locale (~10 min)

### 1.1 — Créer un projet Supabase cloud (gratuit)
1. Aller sur https://supabase.com → Sign up → New project.
2. Région : Europe (Paris ou Francfort).
3. Récupérer 3 valeurs dans **Settings → API** :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 1.2 — Configurer `.env.local`
```bash
cp .env.example .env.local
# Éditer .env.local et remplir les 3 variables Supabase + CRON_SECRET.
# Les autres peuvent rester vides — l'app fonctionne sans.
```

### 1.3 — Appliquer les migrations
```bash
supabase link --project-ref <VOTRE-REF>    # depuis le dashboard Supabase
supabase db push                            # applique les 15 migrations
```

### 1.4 — Charger le seed (Boulangerie Démo)
Coller le contenu de `supabase/seed.sql` dans le SQL Editor du Dashboard
Supabase, OU :
```bash
psql "$DATABASE_URL" -f supabase/seed.sql
```

### 1.5 — Lancer
```bash
npm install
npm run dev
# → http://localhost:3000
# → Login: owner@demo.f5l / demo1234
```

Ou créer un nouveau compte via `/signup` — la formule sera appliquée en
mode démo tant que Stripe n'est pas branché.

---

## 2. Branchements optionnels

Tout est en stub gracieux : l'app fonctionne sans ces clés. Brancher au
fur et à mesure des besoins.

### Brevo (envois SMS + e-mails)
Sans clé → les envois sont loggés en console (`[brevo] BREVO_API_KEY absente`).
```bash
BREVO_API_KEY=xkeysib-…              # https://app.brevo.com/settings/keys/api
BREVO_SENDER_EMAIL=no-reply@…        # adresse vérifiée DKIM/SPF dans Brevo
BREVO_SENDER_NAME=F5L
BREVO_SMS_SENDER=F5L                  # 11 caractères max
```

Concerne : capture de lead (notif au commerçant), envoi lien carte fidélité,
campagnes Agent Fidélisation, relances factures, demandes d'avis.

### Anthropic (IA — Manager, génération copy publicitaire)
Sans clé → fallback statique (templates simples).
```bash
ANTHROPIC_API_KEY=sk-ant-…
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
```

Concerne : synthèse quotidienne Manager, génération de textes publicitaires,
ébauches de réponses aux avis Google.

### Stripe (facturation réelle)
Sans clé → les changements de formule s'appliquent en mode démo (état
`trialing`, modules activés, mais aucun paiement réel).
```bash
STRIPE_SECRET_KEY=sk_live_…           # https://dashboard.stripe.com/apikeys
STRIPE_WEBHOOK_SECRET=whsec_…          # webhook /api/webhooks/stripe
STRIPE_PRICE_STARTER=price_…           # un price ID par formule
STRIPE_PRICE_BUSINESS=price_…
STRIPE_PRICE_FULL=price_…
```

**TODO branchement** : `lib/stripe/client.ts` — remplacer les corps de
fonctions par des appels au SDK officiel ; `app/api/webhooks/stripe/route.ts`
— vérifier la signature et router selon `event.type`.

### Vapi (téléphonie IA)
Stub — sans clé, le module Téléphone fonctionne en lecture seulement.
```bash
VAPI_API_KEY=…
```

### Meta Ads / Google Ads
Stubs — le module Acquisition fonctionne en mode brouillon sans clés.
```bash
META_ADS_TOKEN=…
GOOGLE_ADS_TOKEN=…
```

### Yousign + Pennylane
Stubs — bouton « Envoyer pour signature » affiche un message tant que
non configurés.
```bash
YOUSIGN_API_KEY=…
PENNYLANE_API_KEY=…
```

---

## 3. Déploiement Vercel

### 3.1 — Connecter le repo
1. Vercel Dashboard → Import Project → sélectionner `stepis`.
2. Root directory : `f5l`.
3. Framework preset : Next.js.

### 3.2 — Configurer les env vars Vercel
Copier toutes les variables de `.env.local` vers Vercel → Settings →
Environment Variables, en remplaçant `NEXT_PUBLIC_APP_URL` par l'URL réelle.

### 3.3 — Configurer le cron (Agent Fidélisation)
Dans `vercel.json` (déjà présent), ajouter ou vérifier :
```json
{
  "crons": [
    { "path": "/api/cron/loyalty-agent", "schedule": "0 9 * * *" }
  ]
}
```
Le route handler vérifie déjà `Authorization: Bearer $CRON_SECRET`.

### 3.4 — Webhook Stripe
Dans Stripe Dashboard → Developers → Webhooks → Add endpoint :
- URL : `https://votre-domaine.com/api/webhooks/stripe`
- Events : `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`.
- Copier le signing secret dans `STRIPE_WEBHOOK_SECRET`.

---

## 4. Comptes & onboarding

### Signup d'un nouveau commerçant
URL publique `/signup` :
- Crée user Supabase Auth + org + profile owner + org_modules selon formule.
- Mode démo (sans Stripe) → souscription créée en `trialing`.

### Invitation d'un collaborateur
Dashboard → Réglages → Mon équipe → entrer e-mail + rôle.
- Crée une ligne `invitations` avec un token (14 jours).
- Sans Brevo → copier le lien d'invitation à la main et le transmettre.
- Avec Brevo → l'e-mail partira automatiquement (à brancher dans
  `lib/settings/actions.ts::inviteMemberAction`).

Le destinataire clique sur le lien → `/accept-invitation/[token]` →
soit log soit signup → profile créé dans la bonne org.

---

## 5. Architecture des stubs (ne rien casser)

Tous les helpers d'API externes suivent le même contrat :

```ts
export function xxxStatus() {
  if (!process.env.XXX_API_KEY) return { configured: false, message: "…" };
  return { configured: true, message: "…" };
}
```

Les server actions appellent ces helpers et :
- **Si configuré** : exécutent l'appel réel, gèrent les erreurs.
- **Sinon** : continuent en mode démo (loggent, journalisent la transaction
  dans Postgres, mais ne propagent jamais d'exception bloquante).

→ Le code de page / composant peut afficher un badge « non configuré »
en interrogeant le `status()` correspondant.

---

## 6. Données de démo (rappel)

Après seed, l'org **Boulangerie Démo** est prête :
- Login : `owner@demo.f5l` / `demo1234`
- Site public : `/p/boulangerie-demo`
- Carte fidélité publique : `/carte/demo-card-token`
- Formule : `business`
- Modules activés : site, crm, lead_capture, loyalty_card, loyalty_agent,
  manager + phone, acquisition, admin (ajoutés en Phase 1 du travail
  autonome).
