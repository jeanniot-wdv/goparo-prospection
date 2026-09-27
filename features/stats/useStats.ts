"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchStats } from "@/lib/api/garages-client";
import { applySession, isACompleter, isNouveau, type SessionEvent, type Stats } from "@/lib/domain/stats";
import { parisDay } from "@/lib/notion/payload";
import type { Operator } from "@/lib/types";
import type { PendingEntry } from "@/features/ticket/usePendingCommits";

const REFRESH_MS = 10 * 60 * 1000;

// Stats globales (cache serveur 10 min) corrigées en direct par les sorties de la session.
export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    const load = () =>
      fetchStats(ctrl.signal)
        .then((s) => {
          setStats(s);
          setError(null);
        })
        .catch((e) => !ctrl.signal.aborted && setError(e instanceof Error ? e.message : "Erreur"));
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      ctrl.abort();
      clearInterval(timer);
    };
  }, []);

  const record = useCallback((entry: PendingEntry, operator: Operator | null) => {
    if (entry.kind === "passer") return;
    const now = new Date();
    setEvents((list) => [
      ...list,
      {
        at: now.toISOString(),
        day: parisDay(now),
        operator,
        fromNouveaux: isNouveau(entry.garage),
        fromACompleter: isACompleter(entry.garage),
        addedEmail: Boolean(entry.payload?.email),
        addedTel: Boolean(entry.payload?.telephone),
      },
    ]);
  }, []);

  const live = stats ? applySession(stats, events, parisDay()) : null;
  return { live, error, record, loading: !stats && !error };
}
