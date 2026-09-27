import type { UpdateGaragePayload } from "../types";

// Cf. tableau de mise à jour de Prospection_active (point 5 du brief) :
// un email saisi (seul ou avec tél.) ferme le cas en "À prospecter".
export const EMAIL_SAISI_PROPS: UpdateGaragePayload = {
  emailType: "Pro",
  statutActivite: "inconnu",
  confiance: "haute",
  prospectionActive: "À prospecter",
  notesIa: "Ajouté manuellement par l'équipe",
};

// Téléphone saisi seul, email confirmé introuvable.
export const TEL_SEUL_EMAIL_NON_TROUVE_PROPS: UpdateGaragePayload = {
  emailType: "Inconnu",
  statutActivite: "inconnu",
  confiance: "haute",
  prospectionActive: "À enrichir",
  notesIa: "Téléphone ajouté manuellement ; email non trouvé",
};

// Recherche faite, rien trouvé.
export const AUCUNE_COORDONNEE_PROPS: UpdateGaragePayload = {
  telNonTrouve: true,
  emailNonTrouve: true,
  prospectionActive: "À enrichir",
  notesIa: "Recherche manuelle effectuée, aucune coordonnée trouvée",
};

// Garage fermé : la fiche reste dans Notion (pas d'archivage) mais sort des files.
export const FERME_PROPS: UpdateGaragePayload = {
  statutActivite: "fermé",
  prospectionActive: "Pas intéressé",
  telNonTrouve: true,
  emailNonTrouve: true,
};

/**
 * Sortie d'une fiche. Remplace les anciennes fenêtres « Email trouvé ? » /
 * « Téléphone trouvé ? » en gardant leur sémantique :
 * - « Oui, trouvé » = rester sur la fiche pour le saisir → aucune sortie proposée
 *   pour ce cas, l'opérateur complète simplement l'emplacement ;
 * - « Non » = `email-introuvable` / `tel-introuvable` : on coche la case
 *   `_non_trouve` correspondante et on ferme le cas.
 */
export type ExitKind =
  | "complet" // tél. + email
  | "email-introuvable" // tél. seul, email cherché sans succès
  | "tel-introuvable" // email seul, tél. cherché sans succès
  | "aucune" // rien trouvé
  | "ferme" // garage fermé définitivement
  | "passer"; // on laisse la fiche pour plus tard, sans la marquer traitée

export interface Saisie {
  telephone?: string;
  email?: string;
  siteWeb?: string;
}

export interface FicheState {
  // Coordonnées déjà présentes dans Notion (file « À compléter » : tél. connu).
  telephoneExistant: string | null;
  emailExistant: string | null;
  saisie: Saisie;
}

export function hasTel(state: FicheState) {
  return Boolean(state.saisie.telephone || state.telephoneExistant);
}

export function hasEmail(state: FicheState) {
  return Boolean(state.saisie.email || state.emailExistant);
}

// Sorties proposées selon ce qui est connu ; la première est l'action principale.
export function availableExits(state: FicheState): ExitKind[] {
  const tel = hasTel(state);
  const email = hasEmail(state);
  if (tel && email) return ["complet"];
  if (tel) return ["email-introuvable", "passer"];
  if (email) return ["tel-introuvable", "passer"];
  return ["aucune", "passer"];
}

function saisieProps(saisie: Saisie): UpdateGaragePayload {
  const out: UpdateGaragePayload = {};
  if (saisie.telephone) out.telephone = saisie.telephone;
  if (saisie.email) out.email = saisie.email;
  if (saisie.siteWeb) out.siteWeb = saisie.siteWeb;
  return out;
}

/**
 * Construit l'unique PATCH envoyé à la sortie d'une fiche, ou `null` s'il n'y a
 * rien à écrire. `passer` n'enregistre que le site web éventuel, sans marquer
 * la fiche comme traitée (elle reste dans la file).
 */
export function resolveExit(kind: ExitKind, state: FicheState): UpdateGaragePayload | null {
  const saisie = saisieProps(state.saisie);
  switch (kind) {
    case "complet":
      return { ...saisie, ...EMAIL_SAISI_PROPS };
    case "email-introuvable":
      return { ...saisie, emailNonTrouve: true, ...TEL_SEUL_EMAIL_NON_TROUVE_PROPS };
    case "tel-introuvable":
      return { ...saisie, telNonTrouve: true, ...EMAIL_SAISI_PROPS };
    case "aucune":
      return { ...saisie, ...AUCUNE_COORDONNEE_PROPS };
    case "ferme":
      return { ...FERME_PROPS };
    case "passer":
      return saisie.siteWeb ? { siteWeb: saisie.siteWeb } : null;
  }
}

// Seules les sorties qui ferment le cas sont tracées (traite_le / traite_par).
export function isTracked(kind: ExitKind) {
  return kind !== "passer";
}

export const EXIT_LABELS: Record<ExitKind, string> = {
  complet: "Terminer",
  "email-introuvable": "Email introuvable",
  "tel-introuvable": "Tél. introuvable",
  aucune: "Aucune coordonnée",
  ferme: "Fermé",
  passer: "Passer",
};
