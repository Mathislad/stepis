/**
 * Catalogue des modules « bientôt disponibles ». Source de vérité unique
 * pour la sidebar + les pages /bientot/[moduleKey].
 *
 * NB : ce fichier appartient à la couche présentation (pas d'accès DB).
 */

export interface ComingSoonModule {
  key: string;
  label: string;
  icon: string;
  /** Une phrase d'accroche commerciale (2-3 phrases). */
  pitch: string;
  /** Bénéfices listés à l'utilisateur final. */
  benefits: string[];
  /** Couleur d'accent (token CSS). */
  accent: "blue" | "violet" | "green" | "amber" | "red";
}

export const COMING_SOON: Record<string, ComingSoonModule> = {
  "loyalty-agent": {
    key: "loyalty-agent",
    label: "Fidélisation",
    icon: "✦",
    pitch:
      "Gardez vos clients. Cartes de fidélité digitales, SMS d'anniversaire, offres personnalisées automatiques — tout part tout seul, vous gardez le contrôle.",
    benefits: [
      "Séquences automatiques (anniversaire, inactivité, post-achat)",
      "SMS + email envoyés au bon moment",
      "Vous validez chaque template avant le 1er envoi",
    ],
    accent: "violet",
  },
  phone: {
    key: "phone",
    label: "Téléphone IA",
    icon: "☏",
    pitch:
      "Ne ratez plus jamais un appel. Un assistant vocal répond pendant que vous travaillez, prend les rendez-vous et vous envoie un résumé par SMS.",
    benefits: [
      "Assistant vocal IA 24/7 sur votre numéro pro",
      "Résumé de chaque appel par SMS",
      "Prise de rendez-vous automatique",
    ],
    accent: "blue",
  },
  reputation: {
    key: "reputation",
    label: "Réputation",
    icon: "★",
    pitch:
      "Gérez vos avis Google automatiquement. Réponses IA suggérées, suivi de votre note, alertes en temps réel sur les avis négatifs.",
    benefits: [
      "Réponse IA proposée à chaque nouvel avis",
      "Alerte si avis négatif (vous gardez la main)",
      "Suivi de votre note Google dans le temps",
    ],
    accent: "amber",
  },
  loyalty: {
    key: "loyalty",
    label: "Carte fidélité",
    icon: "▥",
    pitch:
      "Fidélisez sans carte plastique. Un QR code, des points, des récompenses — vos clients adorent et vous gardez vos données.",
    benefits: [
      "Carte digitale scannable au comptoir",
      "Points, paliers, récompenses paramétrables",
      "Vue client : ses points + ses récompenses débloquées",
    ],
    accent: "green",
  },
  admin: {
    key: "admin",
    label: "Documents",
    icon: "▤",
    pitch:
      "Devis, factures, contrats — générés en un clic, signés électroniquement, relancés automatiquement quand le paiement tarde.",
    benefits: [
      "Devis / factures en un clic",
      "Signature électronique intégrée",
      "Relances de paiement automatisées",
    ],
    accent: "blue",
  },
  manager: {
    key: "manager",
    label: "Manager IA",
    icon: "♛",
    pitch:
      "Votre assistant personnel. Un résumé chaque matin de tout ce qui s'est passé hier dans votre activité, des alertes pour les actions importantes.",
    benefits: [
      "Briefing quotidien par IA",
      "Détection des priorités du jour",
      "Approbation des actions sensibles",
    ],
    accent: "red",
  },
};

export const COMING_SOON_ORDER = [
  "loyalty-agent",
  "phone",
  "reputation",
  "loyalty",
  "admin",
  "manager",
] as const;
