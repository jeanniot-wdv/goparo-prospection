import type { Garage } from "../types";

/**
 * Score de priorité d'un garage. Il est calculé par la formule Notion
 * `score_priorite` (créée par scripts/notion-migrate.mjs), pour que la file
 * puisse être triée côté Notion : la liste est paginée, un tri client ne
 * verrait que la page chargée.
 *
 * Barème :
 *   structure employeuse                 +3
 *   effectif 03 (6-9) / 02 (3-5) / 01 (1-2)  +3 / +2 / +1
 *   enseigne renseignée                   +2
 *   création avant 2024                   +1
 *   création en 2025 ou après             −2
 *
 * Cette fonction est le miroir exact de la formule, pour les tests et pour
 * afficher le détail du score sur le ticket. Toute modification doit être
 * reportée dans PRIORITY_FORMULA (et relancer la migration).
 */
export function computePriority(g: Pick<Garage, "segment" | "effectif" | "enseigne" | "dateCreation">): number {
  let score = 0;
  if (g.segment === "structure_employeuse") score += 3;
  if (g.effectif === "03") score += 3;
  else if (g.effectif === "02") score += 2;
  else if (g.effectif === "01") score += 1;
  if (g.enseigne.trim() !== "") score += 2;
  if (g.dateCreation) {
    const year = Number(g.dateCreation.slice(0, 4));
    if (year < 2024) score += 1;
    else if (year >= 2025) score -= 2;
  }
  return score;
}

// Score maximum atteignable (3 + 3 + 2 + 1), utilisé pour la jauge de la file.
export const PRIORITY_MAX = 9;

export type PriorityTier = "haute" | "moyenne" | "basse";

// 3 paliers pour la pastille de priorité dans la file (score de -2 à 9).
export function priorityTier(score: number): PriorityTier {
  if (score >= 6) return "haute";
  if (score >= 1) return "moyenne";
  return "basse";
}

// Expression Notion (formules 2.0) équivalente à computePriority.
export const PRIORITY_FORMULA = [
  `if(prop("segment") == "structure_employeuse", 3, 0)`,
  `ifs(prop("effectif") == "03", 3, prop("effectif") == "02", 2, prop("effectif") == "01", 1, 0)`,
  `if(empty(prop("enseigne")), 0, 2)`,
  `if(empty(prop("date_creation")), 0, if(year(prop("date_creation")) < 2024, 1, if(year(prop("date_creation")) >= 2025, -2, 0)))`,
].join(" + ");
