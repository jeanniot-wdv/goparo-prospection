export type Segment = "structure_employeuse" | "solo_non_employeur";
export type FranchiseSuspectee = "oui" | "non";
export type EmailType = "Pro" | "Personnel" | "Inconnu";
export type StatutActivite = "actif" | "fermé" | "inconnu";
export type Confiance = "haute" | "moyenne" | "faible";
export type ProspectionActive =
  | "À enrichir"
  | "À prospecter"
  | "En cours"
  | "Intéressé"
  | "Client"
  | "Pas intéressé"
  | "Désabonné"
  | "À vérifier (RGPD)";
// Tranche d'effectif INSEE : 00 = 0 salarié, 01 = 1-2, 02 = 3-5, 03 = 6-9, NN = non renseigné.
export type Effectif = "00" | "01" | "02" | "03" | "NN";
export type Operator = "Hiba" | "Romain";
export const OPERATORS: Operator[] = ["Hiba", "Romain"];
// traite_par peut aussi valoir "Automatisation" (écrit par le workflow n8n), qui n'est pas
// un opérateur sélectionnable dans l'app (cf. OperatorPicker) mais doit apparaître dans les
// stats par personne (parOperateur, aujourdhuiParOperateur).
export type TraitePar = Operator | "Automatisation";
export const TRAITE_PAR_VALUES: TraitePar[] = [...OPERATORS, "Automatisation"];

// Trois files de travail : fiches jamais traitées, fiches avec tél. mais sans email,
// et fiches où l'automatisation a trouvé un email personnel à faire valider (RGPD).
export type Queue = "nouveaux" | "a-completer" | "a-verifier-rgpd";
export type Dept = "67" | "57" | "54" | "all";

export interface Garage {
  id: string;
  nom: string;
  enseigne: string;
  adresse: string;
  commune: string;
  cp: number | null;
  dirigeant: string;
  segment: Segment | null;
  franchiseSuspectee: FranchiseSuspectee | null;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  telNonTrouve: boolean;
  emailNonTrouve: boolean;
  siren: string | null;
  effectif: Effectif | null;
  naf: string | null;
  dateCreation: string | null;
  statutActivite: StatutActivite | null;
  prospectionActive: ProspectionActive | null;
  notesIa: string;
  scorePriorite: number | null;
  traiteLe: string | null;
  traitePar: TraitePar | null;
}

export interface GaragesListResponse {
  garages: Garage[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface UpdateGaragePayload {
  telephone?: string;
  email?: string;
  siteWeb?: string;
  telNonTrouve?: boolean;
  emailNonTrouve?: boolean;
  emailType?: EmailType;
  statutActivite?: StatutActivite;
  confiance?: Confiance;
  prospectionActive?: ProspectionActive;
  notesIa?: string;
  // Renseigne traite_le (date du jour, heure de Paris) et traite_par.
  operator?: Operator;
}
