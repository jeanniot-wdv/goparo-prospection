"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { closeGarage, patchGarage } from "@/lib/api/garages-client";
import { isTracked, type ExitKind } from "@/lib/domain/prospection-rules";
import { getNomAffiche } from "@/lib/domain/search-links";
import type { Garage, Operator, UpdateGaragePayload } from "@/lib/types";

export const UNDO_DELAY_MS = 5000;

export interface PendingEntry {
  key: string;
  garage: Garage;
  index: number;
  kind: ExitKind;
  payload: UpdateGaragePayload | null;
}

export const STAMP_LABELS: Partial<Record<ExitKind, string>> = {
  complet: "Enrichi",
  "tel-introuvable": "Enrichi",
  "email-introuvable": "À enrichir",
  aucune: "À enrichir",
  ferme: "Fermé",
};

/**
 * Écriture différée pour permettre l'annulation : rien ne part vers Notion
 * pendant UNDO_DELAY_MS. « Annuler » remet simplement la fiche dans la file.
 * À la fermeture de la page (pagehide), tout ce qui est en attente part
 * immédiatement avec fetch keepalive.
 */
export function usePendingCommits({
  operator,
  onRestore,
  onSent,
}: {
  operator: Operator | null;
  onRestore: (entry: PendingEntry) => void;
  onSent?: (entry: PendingEntry) => void;
}) {
  const pending = useRef(new Map<string, { entry: PendingEntry; timer: ReturnType<typeof setTimeout> }>());
  const order = useRef<string[]>([]);
  const latest = useRef({ operator, onRestore, onSent });
  useEffect(() => {
    latest.current = { operator, onRestore, onSent };
  });

  const send = useCallback(async (entry: PendingEntry, keepalive = false) => {
    const { operator: op } = latest.current;
    const tracked = isTracked(entry.kind) && op ? { operator: op } : {};
    if (entry.kind === "ferme") await closeGarage(entry.garage.id, op, keepalive);
    else if (entry.payload) await patchGarage(entry.garage.id, { ...entry.payload, ...tracked }, keepalive);
  }, []);

  const flush = useCallback(
    async (key: string) => {
      const item = pending.current.get(key);
      if (!item) return;
      pending.current.delete(key);
      order.current = order.current.filter((k) => k !== key);
      try {
        await send(item.entry);
        latest.current.onSent?.(item.entry);
      } catch (error) {
        latest.current.onRestore(item.entry);
        toast.error(`Échec pour ${getNomAffiche(item.entry.garage)}`, {
          description: error instanceof Error ? error.message : undefined,
          duration: 10000,
        });
      }
    },
    [send],
  );

  const undo = useCallback((key?: string) => {
    const k = key ?? order.current.at(-1);
    if (!k) return false;
    const item = pending.current.get(k);
    if (!item) return false;
    clearTimeout(item.timer);
    pending.current.delete(k);
    order.current = order.current.filter((x) => x !== k);
    toast.dismiss(k);
    latest.current.onRestore(item.entry);
    return true;
  }, []);

  const schedule = useCallback(
    (entry: Omit<PendingEntry, "key">) => {
      const key = `${entry.garage.id}-${Date.now()}`;
      const full = { ...entry, key };
      // Sortie sans écriture (« Passer » sans site web) : rien à différer.
      if (entry.kind !== "ferme" && !entry.payload) return;
      const timer = setTimeout(() => flush(key), UNDO_DELAY_MS);
      pending.current.set(key, { entry: full, timer });
      order.current.push(key);
      const stamp = STAMP_LABELS[entry.kind];
      toast(stamp ? `${getNomAffiche(entry.garage)} · ${stamp}` : `${getNomAffiche(entry.garage)} · site enregistré`, {
        id: key,
        duration: UNDO_DELAY_MS,
        action: { label: "Annuler (U)", onClick: () => undo(key) },
      });
    },
    [flush, undo],
  );

  // Fermeture de l'onglet : on envoie tout de suite ce qui attend encore.
  useEffect(() => {
    const onPageHide = () => {
      for (const [key, item] of pending.current) {
        clearTimeout(item.timer);
        pending.current.delete(key);
        send(item.entry, true).catch(() => {});
      }
      order.current = [];
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [send]);

  return { schedule, undo };
}
