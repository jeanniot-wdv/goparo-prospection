export type Segment = "structure_employeuse" | "solo_non_employeur";
export type FranchiseSuspectee = "oui" | "non";

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
  telNonTrouve?: boolean;
  emailNonTrouve?: boolean;
}
