# F5L — Rapport UX Phase 5

## Persona testée

**Marie**, 47 ans, boulangère à Roanne, non technique, iPhone, Business 299 €/mois.
Son assistant F5L a tout configuré en 5 jours. Elle ouvre l'app pour la première fois.

## Parcours évalués

### Scénario 1 : « Je veux voir mon site »

**Avant** : `/site` montrait « Mon site » et un bouton ghost discret « Voir mon site ↗ ».
**Constat** : Marie ne sait pas si le « site » qu'elle voit est ce que voient ses clients.
**Corrections** :
- Bouton transformé en **primary bleu** « Voir mon site **en vrai** ↗ » → CTA évident.
- « Blocs de contenu » → **« Sections de votre site »**.
- « Blocs publiés » → **« Sections visibles »**.
- Statuts « Publié/Brouillon » → **« Visible/Masqué »** (Badge + bouton de bascule « Masquer / Rendre visible »).

### Scénario 2 : « Quelqu'un m'a contacté »

**Avant** : badge bleu « Nouveau » sur le lead, mais pas de section dédiée à l'accueil.
**Corrections** :
- Le **Today View** affiche le compteur **« Nouvelles demandes »** en bleu (accentué) si > 0, cliquable vers `/crm/leads`.
- Bloc « Dernières demandes » (3 plus récentes) visible dès l'accueil.
- Renommages : « Leads » → **« Demandes de contact »** partout (titre, métadonnées, navigation).
- États vides « Aucun lead » → **« Aucune demande pour l'instant »**, message expliquant que les demandes viendront du site.
- Messages de conversion repris : « La conversion a échoué » → **« Impossible de transformer cette demande »**.

### Scénario 3 : « Je veux créer un devis »

**Avant** : `/admin/new` proposait un formulaire avec un type-select en haut.
**Constat** : le formulaire est clair et guidé. Champs : type (devis/facture/contrat), titre, destinataire (nom/téléphone/e-mail), montant, échéance.
**Pas de correction nécessaire** — le flux est déjà adapté (Marie clique « Devis » → remplit 4 champs → bouton « Créer le document »).
**Petits ajustements** : labels homogènes avec le reste de l'app (`« Mes documents »` dans la nav).

### Scénario 4 : « Je veux ajouter des points à un client »

**Avant** : `/loyalty` montrait la liste des cartes avec un `QuickPoints` (montant + boutons +/−).
**Constat** : flux déjà à **2 clics** :
1. Cliquer dans `Mes clients` ou directement sur la liste fidélité.
2. Sur la ligne du client : entrer le nombre + cliquer **+** (ou **−**).
**Pas de correction nécessaire** — un boulanger au comptoir peut créditer en moins de 3 secondes.

### Scénario 5 : « Je regarde mon résumé du jour »

**Avant** : Manager présentait un encart « Digest prêt ».
**Constat** : « Digest » est un mot inconnu pour Marie.
**Corrections** :
- Sur le Today View, l'encart Manager est titré **« Résumé du jour — [date] »** (depuis Phase 3).
- Pas d'occurrence visible de « digest » dans les libellés utilisateur — le terme reste interne au code.

## Problèmes UX corrigés (récapitulatif)

| Avant | Après | Lieu |
|---|---|---|
| CRM | **Mes clients** | `/crm`, nav sidebar, tabbar mobile |
| Leads | **Demandes de contact** | `/crm/leads`, nav, badges, états vides |
| Acquisition | **Publicité** | `/acquisition`, nav sidebar, tabbar mobile |
| Admin | **Mes documents** | `/admin`, nav sidebar |
| Pipeline | **Étape** | Formulaire contact pro |
| B2B / B2C | **Professionnel / Particulier** | Formulaire, stats CRM, fiche contact |
| Conversion / Convertir | **Transformer en client** | Page demandes de contact, messages d'erreur |
| Digest | **Résumé du jour** | Page d'accueil, Manager |
| Blocs publiés / Brouillon | **Sections visibles / Masquées** | Page site, liste des blocs |
| Dépublier / Publier | **Masquer / Rendre visible** | Boutons de bascule des blocs |
| Voir mon site ↗ (ghost) | **Voir mon site en vrai ↗ (primary)** | Header `/site` |
| Pas de bannière au premier accès | **WelcomeBanner** | Dashboard si 0 contacts/leads/appels |

## Décisions terminologiques conservées

- **Campagne** : garde le terme, connu en commerce.
- **Devis / Facture / Contrat** : termes natifs, pas de changement.
- **Relance** : terme courant pour les rappels de paiement.
- **CRM** dans le code et les types — uniquement masqué dans l'interface utilisateur.

## Composant nouveau

**`WelcomeBanner`** (`components/dashboard/WelcomeBanner.tsx`) — bannière visible au premier passage si l'org n'a aucun contact, lead ou appel. Affiche 1 à 3 étapes de démarrage selon les modules activés (personnaliser le site, ajouter ses clients, configurer les paliers fidélité). Apparait/disparaît automatiquement.

## Recommandations pour V2 (hors périmètre nuit)

1. **Tutoriel interactif** au premier login (3 étapes guidées) — actuellement remplacé par la `WelcomeBanner` statique, qui est déjà 80 % de la valeur.
2. **Notifications push PWA** quand un lead arrive — la PWA est déjà installable, manque le service worker push.
3. **Mode « Comptoir »** pour la carte de fidélité — UI tactile grosse, scan QR depuis la caméra du téléphone (`getUserMedia` + lib QR), idéal pour ajouter des points sans entrer dans le menu complet.
4. **Onboarding par secteur** — détecter `org.sector = "Boulangerie"` et proposer des templates de blocs site (« Notre baguette tradition », « Nos viennoiseries du dimanche »).
5. **Aperçu en direct du site** côté éditeur (split-screen blocs ↔ rendu) — actuellement il faut ouvrir un nouvel onglet.
6. **Messages d'aide contextuels** (?) à côté des champs un peu techniques (ex. « Étape », « source »).

## Couverture

- **5 scénarios** principaux évalués (site, leads, devis, fidélité, résumé).
- **9 modules** parcourus, terminologie revue.
- **0 régression** technique (build clean après tous les renommages).
