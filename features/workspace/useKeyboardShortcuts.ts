"use client";

import { useEffect, useRef } from "react";

export type ShortcutMap = Partial<Record<string, (e: KeyboardEvent) => boolean | void>>;

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)));
}

/**
 * Raccourcis globaux. Clés : lettre minuscule, « Escape », « Mod+Enter »
 * (⌘ ou Ctrl), « ArrowDown »… Ignorés pendant la saisie dans un champ (sauf
 * Échap, géré par les champs eux-mêmes). Un handler qui renvoie `false`
 * laisse passer l'événement.
 */
export function useKeyboardShortcuts(map: ShortcutMap) {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || isTyping(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (e.altKey || (mod && e.key !== "Enter")) return;
      const key = mod ? `Mod+${e.key}` : e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const handler = ref.current[key];
      if (!handler) return;
      if (handler(e) !== false) e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

export const SHORTCUT_LEGEND: [string, string][] = [
  ["J / K", "Garage suivant / précédent"],
  ["C", "Lancer la recherche"],
  ["T E W", "Saisir tél. / email / site"],
  ["⌘↵", "Terminer"],
  ["N", "Rien trouvé / Non"],
  ["P", "Passer"],
  ["U", "Annuler la dernière sortie"],
  ["/", "Rechercher"],
  ["F", "Plein écran"],
  ["Échap", "Fermer / revenir"],
];
