// Noms des propriétés de la base Notion « Grand Est ». Toute référence à une
// propriété Notion passe par ici : un renommage côté Notion ne touche qu'un fichier.
export const PROPS = {
  nom: "Nom",
  enseigne: "enseigne",
  adresse: "adresse",
  commune: "commune",
  cp: "CP",
  dirigeant: "dirigeant",
  segment: "segment",
  franchiseSuspectee: "franchise_suspectee",
  telephone: "telephone",
  email: "email",
  siteWeb: "site_web",
  telNonTrouve: "tel_non_trouve",
  emailNonTrouve: "email_non_trouve",
  emailType: "Email_type",
  statutActivite: "Statut_activite",
  confiance: "Confiance",
  prospectionActive: "Prospection_active",
  notesIa: "notes_ia",
  siren: "siren",
  effectif: "effectif",
  naf: "naf",
  dateCreation: "date_creation",
  // Ajoutées par scripts/notion-migrate.mjs
  scorePriorite: "score_priorite",
  traiteLe: "traite_le",
  traitePar: "traite_par",
} as const;

export type PropKey = keyof typeof PROPS;
