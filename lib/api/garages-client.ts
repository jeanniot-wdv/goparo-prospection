import type { Stats } from "../domain/stats";
import { toSearchParams, type QueueParams } from "../notion/filters";
import type { GaragesListResponse, Operator, UpdateGaragePayload } from "../types";

// Appels HTTP côté navigateur vers les routes /api. Seul point d'entrée réseau du client.

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Erreur ${res.status}`);
  return data as T;
}

export async function fetchQueue(params: QueueParams, cursor: string | null, signal?: AbortSignal) {
  const search = toSearchParams(params);
  if (cursor) search.set("cursor", cursor);
  return json<GaragesListResponse>(await fetch(`/api/garages?${search.toString()}`, { signal }));
}

// keepalive : la requête survit à la fermeture de l'onglet (envoi des écritures différées).
export async function patchGarage(id: string, payload: UpdateGaragePayload, keepalive = false) {
  return json<unknown>(
    await fetch(`/api/garages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive,
    }),
  );
}

// « Fermé définitivement » : DELETE côté API, simple PATCH côté Notion (rien n'est supprimé).
export async function closeGarage(id: string, operator: Operator | null, keepalive = false) {
  const qs = operator ? `?operator=${encodeURIComponent(operator)}` : "";
  return json<unknown>(await fetch(`/api/garages/${id}${qs}`, { method: "DELETE", keepalive }));
}

export async function fetchStats(signal?: AbortSignal) {
  return json<Stats>(await fetch("/api/stats", { signal }));
}
