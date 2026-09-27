"use client";

import { useCallback, useSyncExternalStore } from "react";
import { OPERATORS, type Operator } from "@/lib/types";

const KEY = "goparo.operator";
const EVENT = "goparo:operator";

// localStorage peut être indisponible (navigation privée, stockage bloqué) : on
// retombe alors sur un choix non mémorisé, redemandé au prochain chargement.
let memory: Operator | null = null;

function read(): Operator | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return OPERATORS.includes(v as Operator) ? (v as Operator) : memory;
  } catch {
    return memory;
  }
}

const noop = () => () => {};

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// Personne au poste, mémorisée sur l'appareil. Envoyée avec chaque écriture (traite_par).
export function useOperator() {
  const operator = useSyncExternalStore(subscribe, read, () => null);
  const setOperator = useCallback((value: Operator) => {
    memory = value;
    try {
      window.localStorage.setItem(KEY, value);
    } catch {
      // stockage indisponible : le choix vaut pour la session
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  // Faux pendant le rendu serveur et l'hydratation : évite d'afficher l'écran
  // « Qui est au poste ? » une fraction de seconde à quelqu'un déjà identifié.
  const ready = useSyncExternalStore(noop, () => true, () => false);
  return { operator, setOperator, ready };
}
