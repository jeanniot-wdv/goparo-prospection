import type { Dept, Queue, Segment } from "../types";
import { PROPS } from "./schema";

export interface QueueParams {
  queue: Queue;
  segment: Segment | null;
  hideFranchise: boolean;
  enseigneOnly: boolean;
  dept: Dept;
  q: string;
}

export const DEFAULT_QUEUE_PARAMS: QueueParams = {
  queue: "nouveaux",
  segment: null,
  hideFranchise: true,
  enseigneOnly: false,
  dept: "all",
  q: "",
};

const QUEUES: Queue[] = ["nouveaux", "a-completer", "a-verifier-rgpd"];
const DEPTS: Dept[] = ["67", "57", "54", "all"];
const SEGMENTS: Segment[] = ["structure_employeuse", "solo_non_employeur"];

export function parseQueueParams(search: URLSearchParams): QueueParams {
  const queue = search.get("queue") as Queue;
  const dept = search.get("dept") as Dept;
  const segment = search.get("segment") as Segment;
  return {
    queue: QUEUES.includes(queue) ? queue : DEFAULT_QUEUE_PARAMS.queue,
    segment: SEGMENTS.includes(segment) ? segment : null,
    hideFranchise: search.get("hideFranchise") !== "false",
    enseigneOnly: search.get("enseigneOnly") === "true",
    dept: DEPTS.includes(dept) ? dept : "all",
    q: (search.get("q") ?? "").trim().slice(0, 100),
  };
}

export function toSearchParams(params: QueueParams): URLSearchParams {
  const s = new URLSearchParams();
  s.set("queue", params.queue);
  if (params.segment) s.set("segment", params.segment);
  s.set("hideFranchise", String(params.hideFranchise));
  s.set("enseigneOnly", String(params.enseigneOnly));
  if (params.dept !== "all") s.set("dept", params.dept);
  if (params.q) s.set("q", params.q);
  return s;
}

/**
 * Filtre Notion d'une file. Notion limite l'imbrication à 2 niveaux : un `and`
 * racine qui peut contenir un seul niveau de `or` (la recherche texte).
 *
 * - nouveaux : ni tél. ni email, et aucune case « non trouvé » cochée ;
 * - a-completer : tél. connu, email vide, « À enrichir » et jamais traité dans
 *   l'app (traite_le vide) — une fiche traitée sort donc d'elle-même de la file ;
 * - a-verifier-rgpd : email personnel trouvé par l'automatisation n8n
 *   (Prospection_active = « À vérifier (RGPD) »), à valider par un humain avant
 *   prospection. Contrairement aux deux autres files, `traite_le` n'est pas vide
 *   (l'automatisation l'a déjà posé) : ce n'est pas un critère de sortie ici.
 */
export function buildQueueFilter(params: QueueParams) {
  const and: unknown[] = [];

  if (params.queue === "nouveaux") {
    and.push(
      { property: PROPS.telephone, phone_number: { is_empty: true } },
      { property: PROPS.email, email: { is_empty: true } },
      { property: PROPS.telNonTrouve, checkbox: { equals: false } },
      { property: PROPS.emailNonTrouve, checkbox: { equals: false } },
    );
  } else if (params.queue === "a-verifier-rgpd") {
    and.push({ property: PROPS.prospectionActive, select: { equals: "À vérifier (RGPD)" } });
  } else {
    and.push(
      { property: PROPS.telephone, phone_number: { is_not_empty: true } },
      { property: PROPS.email, email: { is_empty: true } },
      { property: PROPS.prospectionActive, select: { equals: "À enrichir" } },
      { property: PROPS.traiteLe, date: { is_empty: true } },
    );
  }

  if (params.segment) and.push({ property: PROPS.segment, select: { equals: params.segment } });
  if (params.hideFranchise) and.push({ property: PROPS.franchiseSuspectee, select: { does_not_equal: "oui" } });
  if (params.enseigneOnly) and.push({ property: PROPS.enseigne, rich_text: { is_not_empty: true } });

  if (params.dept !== "all") {
    const min = Number(params.dept) * 1000;
    and.push(
      { property: PROPS.cp, number: { greater_than_or_equal_to: min } },
      { property: PROPS.cp, number: { less_than_or_equal_to: min + 999 } },
    );
  }

  if (params.q) {
    and.push({
      or: [
        { property: PROPS.nom, title: { contains: params.q } },
        { property: PROPS.enseigne, rich_text: { contains: params.q } },
        { property: PROPS.commune, rich_text: { contains: params.q } },
      ],
    });
  }

  return { and };
}

// Priorité décroissante, puis ordre alphabétique pour une file stable.
export const QUEUE_SORTS = [
  { property: PROPS.scorePriorite, direction: "descending" },
  { property: PROPS.nom, direction: "ascending" },
];
