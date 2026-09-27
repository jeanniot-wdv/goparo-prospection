"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchQueue } from "@/lib/api/garages-client";
import { DEFAULT_QUEUE_PARAMS, type QueueParams } from "@/lib/notion/filters";
import type { Garage } from "@/lib/types";

interface QueueState {
  garages: Garage[];
  cursor: string | null;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

const INITIAL: QueueState = { garages: [], cursor: null, hasMore: false, loading: true, loadingMore: false, error: null };

// File de garages paginée (20 par page, tri Notion par priorité).
// `remove` / `restore` servent à la sortie optimiste d'un ticket et à son annulation.
export function useGarageQueue() {
  const [params, setParams] = useState<QueueParams>(DEFAULT_QUEUE_PARAMS);
  const [state, setState] = useState<QueueState>(INITIAL);
  // Ids retirés localement (écriture en attente) : ignorés s'ils reviennent d'une page suivante.
  const hidden = useRef(new Set<string>());
  const controller = useRef<AbortController | null>(null);
  // N° de ticket stable : attribué à l'arrivée dans la file, ne bouge plus quand
  // une fiche en sort. Remis à zéro quand les filtres changent.
  const numbers = useRef(new Map<string, number>());

  const load = useCallback(async (p: QueueParams, cursor: string | null) => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setState((s) => (cursor ? { ...s, loadingMore: true } : { ...s, loading: true, error: null }));
    try {
      const data = await fetchQueue(p, cursor, ctrl.signal);
      const fresh = data.garages.filter((g) => !hidden.current.has(g.id));
      if (!cursor) numbers.current = new Map();
      for (const g of fresh) {
        if (!numbers.current.has(g.id)) numbers.current.set(g.id, numbers.current.size + 1);
      }
      setState((s) => {
        const known = cursor ? new Set(s.garages.map((g) => g.id)) : new Set<string>();
        return {
          garages: cursor ? [...s.garages, ...fresh.filter((g) => !known.has(g.id))] : fresh,
          cursor: data.nextCursor,
          hasMore: data.hasMore,
          loading: false,
          loadingMore: false,
          error: null,
        };
      });
    } catch (error) {
      if (ctrl.signal.aborted) return;
      setState((s) => ({
        ...s,
        loading: false,
        loadingMore: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      }));
    }
  }, []);

  useEffect(() => {
    load(params, null);
    return () => controller.current?.abort();
  }, [params, load]);

  const updateParams = useCallback((patch: Partial<QueueParams>) => {
    setParams((p) => ({ ...p, ...patch }));
  }, []);

  const loadMore = useCallback(() => {
    if (state.hasMore && !state.loadingMore && !state.loading) load(params, state.cursor);
  }, [state.hasMore, state.loadingMore, state.loading, state.cursor, params, load]);

  const reload = useCallback(() => load(params, null), [params, load]);

  const remove = useCallback((id: string) => {
    hidden.current.add(id);
    setState((s) => ({ ...s, garages: s.garages.filter((g) => g.id !== id) }));
  }, []);

  const restore = useCallback((garage: Garage, index: number) => {
    hidden.current.delete(garage.id);
    setState((s) => {
      if (s.garages.some((g) => g.id === garage.id)) return s;
      const garages = [...s.garages];
      garages.splice(Math.min(index, garages.length), 0, garage);
      return { ...s, garages };
    });
  }, []);

  const numberOf = useCallback((id: string) => String(numbers.current.get(id) ?? 0).padStart(4, "0"), []);

  // Répercute une écriture confirmée sur la fiche encore présente dans la file
  // (cas « Passer » : la fiche n'est pas retirée, mais son contenu a changé).
  // N'écrit rien avant confirmation, pour rester cohérent avec une annulation.
  const patchLocal = useCallback((id: string, patch: Partial<Garage>) => {
    setState((s) => ({ ...s, garages: s.garages.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  }, []);

  return { params, updateParams, ...state, loadMore, reload, remove, restore, patchLocal, numberOf };
}

export type GarageQueue = ReturnType<typeof useGarageQueue>;
