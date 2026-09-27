import { OPERATORS, type Garage, type Operator, type ProspectionActive } from "../types";

export const ZONE_DEPTS = ["54", "55", "57", "67", "68", "88"];
export const FUNNEL_ORDER: (ProspectionActive | "(vide)")[] = [
  "À enrichir",
  "À vérifier (RGPD)",
  "À prospecter",
  "En cours",
  "Intéressé",
  "Client",
  "Pas intéressé",
  "Désabonné",
  "(vide)",
];
const RHYTHM_WINDOW_DAYS = 14;

export interface Rate {
  key: string;
  label: string;
  traites: number;
  avecEmail: number;
  avecTel: number;
}

export interface DayActivity {
  date: string;
  total: number;
  parOperateur: Record<Operator, number>;
}

export interface GarageRef {
  id: string;
  nom: string;
  commune: string;
  cp: number | null;
}

export interface Stats {
  generatedAt: string;
  total: number;
  traites: number;
  restants: number;
  aCompleter: number;
  avecEmail: number;
  avecTel: number;
  // Traités sans traite_le : fiches traitées avant le suivi (première version de l'app).
  avantSuivi: number;
  parOperateur: Record<Operator, number>;
  parJour: DayActivity[];
  // Fiches par jour d'activité sur les 14 derniers jours (null sans activité récente).
  rythme: number | null;
  finEstimee: string | null;
  parDept: { dept: string; total: number; traites: number }[];
  parSegment: Rate[];
  parEffectif: Rate[];
  entonnoir: { statut: string; count: number }[];
  qualite: {
    cpHorsZone: GarageRef[];
    sansCp: number;
    sansDirigeant: number;
    doublonsTel: { telephone: string; garages: GarageRef[] }[];
  };
}

// Même définition que la file « nouveaux », sans les filtres d'affichage.
export function isNouveau(g: Garage) {
  return !g.telephone && !g.email && !g.telNonTrouve && !g.emailNonTrouve;
}

export function isACompleter(g: Garage) {
  return Boolean(g.telephone) && !g.email && g.prospectionActive === "À enrichir" && !g.traiteLe;
}

export function deptOf(cp: number | null): string | null {
  if (cp === null || cp < 1000 || cp > 99999) return null;
  return String(cp).padStart(5, "0").slice(0, 2);
}

// Chiffres seuls, format national (+33 3 88… → 0388…), pour repérer les doublons.
export function phoneKey(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.startsWith("33") && digits.length === 11) return "0" + digits.slice(2);
  return digits;
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Ajoute n jours ouvrés (lundi-vendredi) à une date AAAA-MM-JJ.
export function addWorkingDays(day: string, n: number): string {
  let current = day;
  let left = n;
  while (left > 0) {
    current = addDays(current, 1);
    const wd = new Date(`${current}T12:00:00Z`).getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return current;
}

const ref = (g: Garage): GarageRef => ({ id: g.id, nom: g.enseigne || g.nom, commune: g.commune, cp: g.cp });

function rates(traites: Garage[], keyOf: (g: Garage) => string, labels: Record<string, string>): Rate[] {
  const map = new Map<string, Rate>();
  for (const key of Object.keys(labels)) map.set(key, { key, label: labels[key], traites: 0, avecEmail: 0, avecTel: 0 });
  for (const g of traites) {
    const key = keyOf(g);
    const r = map.get(key) ?? { key, label: labels[key] ?? key, traites: 0, avecEmail: 0, avecTel: 0 };
    r.traites++;
    if (g.email) r.avecEmail++;
    if (g.telephone) r.avecTel++;
    map.set(key, r);
  }
  return [...map.values()];
}

export const SEGMENT_LABELS: Record<string, string> = {
  structure_employeuse: "Employeuse",
  solo_non_employeur: "Solo",
  "": "Non renseigné",
};

export const EFFECTIF_LABELS: Record<string, string> = {
  "03": "6-9 sal.",
  "02": "3-5 sal.",
  "01": "1-2 sal.",
  "00": "0 sal.",
  NN: "Non renseigné",
};

export function computeStats(garages: Garage[], today: string, now: Date = new Date()): Stats {
  const traites = garages.filter((g) => !isNouveau(g));
  const parOperateur = Object.fromEntries(OPERATORS.map((o) => [o, 0])) as Record<Operator, number>;

  const days = new Map<string, DayActivity>();
  for (const g of garages) {
    if (!g.traiteLe) continue;
    const date = g.traiteLe.slice(0, 10);
    const day = days.get(date) ?? {
      date,
      total: 0,
      parOperateur: Object.fromEntries(OPERATORS.map((o) => [o, 0])) as Record<Operator, number>,
    };
    day.total++;
    if (g.traitePar) {
      day.parOperateur[g.traitePar] = (day.parOperateur[g.traitePar] ?? 0) + 1;
      parOperateur[g.traitePar] = (parOperateur[g.traitePar] ?? 0) + 1;
    }
    days.set(date, day);
  }
  const parJour = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));

  const windowStart = addDays(today, -(RHYTHM_WINDOW_DAYS - 1));
  const recent = parJour.filter((d) => d.date >= windowStart && d.date <= today);
  const rythme = recent.length > 0 ? recent.reduce((s, d) => s + d.total, 0) / recent.length : null;
  const restants = garages.filter(isNouveau).length;
  const finEstimee = rythme ? addWorkingDays(today, Math.ceil(restants / rythme)) : null;

  const deptMap = new Map<string, { dept: string; total: number; traites: number }>();
  for (const g of garages) {
    const dept = deptOf(g.cp) ?? "?";
    const d = deptMap.get(dept) ?? { dept, total: 0, traites: 0 };
    d.total++;
    if (!isNouveau(g)) d.traites++;
    deptMap.set(dept, d);
  }

  const funnelCounts = new Map<string, number>();
  for (const g of garages) {
    const key = g.prospectionActive ?? "(vide)";
    funnelCounts.set(key, (funnelCounts.get(key) ?? 0) + 1);
  }
  const entonnoir = [
    ...FUNNEL_ORDER.map((statut) => ({ statut, count: funnelCounts.get(statut) ?? 0 })),
    ...[...funnelCounts.entries()]
      .filter(([statut]) => !FUNNEL_ORDER.includes(statut as ProspectionActive))
      .map(([statut, count]) => ({ statut, count })),
  ];

  const byPhone = new Map<string, Garage[]>();
  for (const g of garages) {
    if (!g.telephone) continue;
    const key = phoneKey(g.telephone);
    byPhone.set(key, [...(byPhone.get(key) ?? []), g]);
  }

  return {
    generatedAt: now.toISOString(),
    total: garages.length,
    traites: traites.length,
    restants,
    aCompleter: garages.filter(isACompleter).length,
    avecEmail: garages.filter((g) => g.email).length,
    avecTel: garages.filter((g) => g.telephone).length,
    avantSuivi: traites.filter((g) => !g.traiteLe).length,
    parOperateur,
    parJour,
    rythme,
    finEstimee,
    parDept: [...deptMap.values()].sort((a, b) => b.total - a.total),
    parSegment: rates(traites, (g) => g.segment ?? "", SEGMENT_LABELS),
    parEffectif: rates(traites, (g) => g.effectif ?? "NN", EFFECTIF_LABELS),
    entonnoir,
    qualite: {
      cpHorsZone: garages.filter((g) => {
        const dept = deptOf(g.cp);
        return dept !== null && !ZONE_DEPTS.includes(dept);
      }).map(ref),
      sansCp: garages.filter((g) => deptOf(g.cp) === null).length,
      sansDirigeant: garages.filter((g) => g.dirigeant.trim() === "").length,
      doublonsTel: [...byPhone.entries()]
        .filter(([, gs]) => gs.length > 1)
        .map(([, gs]) => ({ telephone: gs[0].telephone as string, garages: gs.map(ref) }))
        .sort((a, b) => b.garages.length - a.garages.length),
    },
  };
}

// Sortie envoyée à Notion pendant la session, pour corriger des stats en cache.
export interface SessionEvent {
  at: string; // ISO
  day: string; // AAAA-MM-JJ, heure de Paris
  operator: Operator | null;
  fromNouveaux: boolean;
  fromACompleter: boolean;
  addedEmail: boolean;
  addedTel: boolean;
}

export interface LiveStats {
  total: number;
  traites: number;
  restants: number;
  aCompleter: number;
  tauxEmail: number | null;
  tauxTel: number | null;
  aujourdhui: number;
  aujourdhuiParOperateur: Record<Operator, number>;
  rythme: number | null;
  finEstimee: string | null;
}

/**
 * Stats affichées = stats en cache (jusqu'à 10 min de retard, revalidation
 * « max ») + sorties de la session envoyées après leur calcul.
 */
export function applySession(stats: Stats, events: SessionEvent[], today: string): LiveStats {
  const after = events.filter((e) => e.at > stats.generatedAt);
  const nouveauxTraites = after.filter((e) => e.fromNouveaux).length;
  const traites = stats.traites + nouveauxTraites;
  const avecEmail = stats.avecEmail + after.filter((e) => e.addedEmail).length;
  const avecTel = stats.avecTel + after.filter((e) => e.addedTel).length;

  const jour = stats.parJour.find((d) => d.date === today);
  const aujourdhuiParOperateur = Object.fromEntries(
    OPERATORS.map((o) => [o, (jour?.parOperateur[o] ?? 0) + after.filter((e) => e.day === today && e.operator === o).length]),
  ) as Record<Operator, number>;
  const aujourdhui = (jour?.total ?? 0) + after.filter((e) => e.day === today).length;
  const restants = Math.max(0, stats.restants - nouveauxTraites);

  return {
    total: stats.total,
    traites,
    restants,
    aCompleter: Math.max(0, stats.aCompleter - after.filter((e) => e.fromACompleter).length),
    tauxEmail: traites > 0 ? avecEmail / traites : null,
    tauxTel: traites > 0 ? avecTel / traites : null,
    aujourdhui,
    aujourdhuiParOperateur,
    rythme: stats.rythme,
    finEstimee: stats.rythme ? addWorkingDays(today, Math.ceil(restants / stats.rythme)) : null,
  };
}
