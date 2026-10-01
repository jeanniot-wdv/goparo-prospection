"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// Le choix explicite est mémorisé ; sans choix, le thème suit le système.
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem("goparo-theme"); } catch {}
      const next = saved === "dark" || (!saved && media.matches);
      document.documentElement.classList.toggle("dark", next);
      setDark(next);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("goparo-theme", next ? "dark" : "light"); } catch {}
    setDark(next);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={dark ? "Activer le thème clair" : "Activer le thème sombre"} title={dark ? "Thème clair" : "Thème sombre"}>
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
