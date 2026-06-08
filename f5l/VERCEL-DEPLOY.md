# F5L Acquisition - Deploiement Vercel

## Root directory

Le projet Vercel doit utiliser `f5l` comme root directory.

Important : Vercel ne lit pas un champ `root` dans `vercel.json`. Le root se
configure dans Vercel Dashboard -> Project -> Settings -> General -> Root
Directory, ou bien en CLI en deployant depuis ce dossier :

```bash
cd /Users/mathisladouceur_/Desktop/dev/stepis/f5l
vercel deploy . --prod --yes --project stepis
```

Etat verifie le 2026-06-07 :

- `vercel.json` existe dans `f5l/`.
- `vercel.json` contient le cron `/api/cron/loyalty-agent`.
- Le projet Vercel `stepis` existe.
- Le projet Vercel `stepis` avait `Root Directory = .` au moment de l'audit.
- Le deploiement CLI depuis `f5l/` fonctionne et publie bien l'app.
- Pour les deploiements Git automatiques, changer ce setting a `f5l` dans le
  Dashboard Vercel.

Production actuelle :

- Alias production : `https://stepis.vercel.app`
- Dernier inspect : `https://vercel.com/mathislads-projects/stepis/DbEh7u3uyG5cFevHAXz6QazfKcbc`

## Variables a copier depuis `.env.local`

Obligatoires pour que l'app ne redirige pas vers `/setup` :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`

Persistées en production Vercel le 2026-06-07 :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `BREVO_SMS_SENDER`

Optionnelles mais prevues :

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `BREVO_SMS_SENDER`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_BUSINESS`
- `STRIPE_PRICE_FULL`
- `VAPI_API_KEY`
- `META_ADS_TOKEN`
- `GOOGLE_ADS_TOKEN`
- `YOUSIGN_API_KEY`
- `PENNYLANE_API_KEY`

## Commandes de validation locale

```bash
cd /Users/mathisladouceur_/Desktop/dev/stepis/f5l
npm run lint
npm run typecheck
npm run build
```

## Commandes Vercel CLI

Connexion :

```bash
vercel whoami
```

Inspection du projet :

```bash
vercel project inspect stepis
```

Ajout interactif des variables en production :

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production --project stepis
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --project stepis
vercel env add SUPABASE_SERVICE_ROLE_KEY production --project stepis
vercel env add NEXT_PUBLIC_APP_URL production --project stepis
vercel env add CRON_SECRET production --project stepis
vercel env add BREVO_API_KEY production --project stepis
vercel env add BREVO_SENDER_EMAIL production --project stepis
vercel env add BREVO_SENDER_NAME production --project stepis
vercel env add BREVO_SMS_SENDER production --project stepis
vercel env add ANTHROPIC_API_KEY production --project stepis
vercel env add ANTHROPIC_MODEL production --project stepis
vercel env add STRIPE_SECRET_KEY production --project stepis
vercel env add STRIPE_WEBHOOK_SECRET production --project stepis
vercel env add STRIPE_PRICE_STARTER production --project stepis
vercel env add STRIPE_PRICE_BUSINESS production --project stepis
vercel env add STRIPE_PRICE_FULL production --project stepis
vercel env add VAPI_API_KEY production --project stepis
vercel env add META_ADS_TOKEN production --project stepis
vercel env add GOOGLE_ADS_TOKEN production --project stepis
vercel env add YOUSIGN_API_KEY production --project stepis
vercel env add PENNYLANE_API_KEY production --project stepis
```

Deploiement production depuis `f5l/` :

```bash
vercel deploy . --prod --yes --project stepis
```

Deploiement production avec envs injectees depuis `.env.local` sans les afficher :

```bash
set -a
source .env.local
set +a
PROD_URL="https://stepis.vercel.app"
vercel deploy . --prod --yes --project stepis \
  --build-env NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-env NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-env SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --build-env NEXT_PUBLIC_APP_URL="$PROD_URL" \
  --env NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --env NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --env SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --env NEXT_PUBLIC_APP_URL="$PROD_URL" \
  --env CRON_SECRET="$CRON_SECRET" \
  --env BREVO_SENDER_EMAIL="$BREVO_SENDER_EMAIL" \
  --env BREVO_SENDER_NAME="$BREVO_SENDER_NAME" \
  --env BREVO_SMS_SENDER="$BREVO_SMS_SENDER"
```

Si `NEXT_PUBLIC_APP_URL` n'est pas encore connu, faire un premier deploiement,
copier l'URL de production retournee, mettre cette URL dans Vercel env
`NEXT_PUBLIC_APP_URL`, puis redeployer.
