"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const HOLD_MS = 1200;

/**
 * Bouton shadcn à maintenir (souris, doigt, Espace ou Entrée) : un anneau se
 * remplit pendant HOLD_MS, l'action part à 100 %. Remplace la fenêtre de
 * confirmation : impossible à déclencher par erreur, plus rapide qu'un dialogue.
 */
export function HoldButton({
  onComplete,
  children,
  className,
  disabled,
}: {
  onComplete: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);
  const start = useRef(0);

  const stop = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setProgress(0);
  };

  const begin = () => {
    if (disabled || frame.current !== null) return;
    start.current = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        frame.current = null;
        setProgress(0);
        onComplete();
      } else {
        frame.current = requestAnimationFrame(tick);
      }
    };
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  const r = 7;
  const c = 2 * Math.PI * r;

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={disabled}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        begin();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={(e) => (e.key === " " || e.key === "Enter") && stop()}
      onContextMenu={(e) => e.preventDefault()}
      aria-description={`Maintenir ${HOLD_MS / 1000} s`}
      className={cn("touch-none text-alerte select-none hover:bg-alerte/10 hover:text-alerte", className)}
    >
      <svg viewBox="0 0 18 18" className="size-[18px] -rotate-90" aria-hidden>
        <circle cx="9" cy="9" r={r} fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth="2" />
        <circle
          cx="9"
          cy="9"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
        />
      </svg>
      {children}
    </Button>
  );
}
