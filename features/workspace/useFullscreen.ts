"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}

// API Fullscreen du navigateur (bouton ⛶ / touche F).
export function useFullscreen() {
  const active = useSyncExternalStore(subscribe, () => Boolean(document.fullscreenElement), () => false);
  const toggle = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);
  return { active, toggle };
}
