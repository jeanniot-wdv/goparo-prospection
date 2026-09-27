"use client";

import { useReducer } from "react";
import { normalizeEmail, normalizePhone, normalizeUrl, type Normalized } from "@/lib/domain/normalize";
import type { ExitKind, FicheState, Saisie } from "@/lib/domain/prospection-rules";
import type { Garage } from "@/lib/types";

export type SlotKey = keyof Saisie;
export const SLOTS: SlotKey[] = ["telephone", "email", "siteWeb"];

const NORMALIZERS: Record<SlotKey, (raw: string) => Normalized> = {
  telephone: normalizePhone,
  email: normalizeEmail,
  siteWeb: normalizeUrl,
};

export interface TicketState {
  saisie: Saisie;
  editing: SlotKey | null;
  draft: string;
  error: string | null;
  // Bandeau « Email / Téléphone trouvé ? » (remplace les anciennes fenêtres).
  ask: "email" | "telephone" | null;
  // Sortie en cours : le tampon est posé, le ticket va quitter la file.
  exiting: ExitKind | null;
}

type Action =
  | { type: "edit"; slot: SlotKey; current?: string }
  | { type: "draft"; value: string }
  | { type: "commit" }
  | { type: "cancel" }
  | { type: "clear"; slot: SlotKey }
  | { type: "ask"; slot: "email" | "telephone" }
  | { type: "dismissAsk" }
  | { type: "exit"; kind: ExitKind };

const INITIAL: TicketState = { saisie: {}, editing: null, draft: "", error: null, ask: null, exiting: null };

export function ticketReducer(state: TicketState, action: Action): TicketState {
  if (state.exiting) return state;
  switch (action.type) {
    case "edit":
      return { ...state, editing: action.slot, draft: action.current ?? state.saisie[action.slot] ?? "", error: null, ask: null };
    case "draft":
      return { ...state, draft: action.value, error: null };
    case "commit": {
      if (!state.editing) return state;
      if (state.draft.trim() === "") return { ...state, editing: null, draft: "", error: null };
      const result = NORMALIZERS[state.editing](state.draft);
      if (!result.ok) return { ...state, error: result.error };
      return { ...state, saisie: { ...state.saisie, [state.editing]: result.value }, editing: null, draft: "", error: null };
    }
    case "cancel":
      return { ...state, editing: null, draft: "", error: null };
    case "clear": {
      const saisie = { ...state.saisie };
      delete saisie[action.slot];
      return { ...state, saisie };
    }
    case "ask":
      return { ...state, ask: action.slot, editing: null };
    case "dismissAsk":
      return { ...state, ask: null };
    case "exit":
      return { ...state, exiting: action.kind, editing: null, ask: null };
  }
}

export function useTicket(garage: Garage) {
  const [state, dispatch] = useReducer(ticketReducer, INITIAL);
  const fiche: FicheState = {
    telephoneExistant: garage.telephone,
    emailExistant: garage.email,
    saisie: state.saisie,
  };
  return { state, dispatch, fiche };
}
