export type Segment = "structure_employeuse" | "solo_non_employeur";
export type FranchiseSuspectee = "oui" | "non";
export type EmailType = "Pro" | "Personnel" | "Inconnu";
export type StatutActivite = "actif" | "fermé" | "inconnu";
export type Confiance = "haute" | "moyenne" | "faible";
export type ProspectionActive = "À prospecter" | "À enrichir" | "Pas intéressé" | "À vérifier (RGPD)";

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
}
