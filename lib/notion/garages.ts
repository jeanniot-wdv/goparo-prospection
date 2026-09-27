import { unstable_cache } from "next/cache";
import { computeStats } from "../domain/stats";
import type { GaragesListResponse } from "../types";
import { queryAll, queryDataSource } from "./client";
import { QUEUE_SORTS, buildQueueFilter, type QueueParams } from "./filters";
import { mapPageToGarage } from "./mapper";
import { parisDay } from "./payload";
import { PROPS } from "./schema";

export const STATS_TAG = "garages-stats";
const PAGE_SIZE = 20;

export async function listQueue(params: QueueParams, cursor: string | null): Promise<GaragesListResponse> {
  const data = await queryDataSource({
    filter: buildQueueFilter(params),
    sorts: QUEUE_SORTS,
    page_size: PAGE_SIZE,
    ...(cursor ? { start_cursor: cursor } : {}),
  });
  return {
    garages: data.results.map(mapPageToGarage),
    hasMore: data.has_more,
    nextCursor: data.next_cursor,
  };
}

// Propriétés lues pour les stats : le scan complet (≈ 42 appels) reste léger.
const STATS_PROPS = [
  PROPS.nom,
  PROPS.enseigne,
  PROPS.commune,
  PROPS.cp,
  PROPS.dirigeant,
  PROPS.segment,
  PROPS.effectif,
  PROPS.telephone,
  PROPS.email,
  PROPS.telNonTrouve,
  PROPS.emailNonTrouve,
  PROPS.prospectionActive,
  PROPS.traiteLe,
  PROPS.traitePar,
];

// Seul l'objet agrégé est mis en cache (quelques Ko), pas les 4 000 fiches.
// Invalidé par revalidateTag(STATS_TAG) à chaque écriture, sinon toutes les 10 min.
export const getCachedStats = unstable_cache(
  async () => {
    const pages = await queryAll({}, STATS_PROPS);
    return computeStats(pages.map(mapPageToGarage), parisDay());
  },
  ["garages-stats-v1"],
  { tags: [STATS_TAG], revalidate: 600 },
);
