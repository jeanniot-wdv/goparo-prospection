import type { ExitKind } from "@/lib/domain/prospection-rules";
import { cn } from "@/lib/utils";
import { STAMP_LABELS } from "./usePendingCommits";

const TONES: Partial<Record<ExitKind, string>> = {
  complet: "text-marque",
  "tel-introuvable": "text-marque",
  "email-introuvable": "text-encre",
  aucune: "text-encre",
  ferme: "text-alerte",
};

// Tampon encreur posé sur le ticket à la sortie : il lit le statut Notion à voix haute.
export function Stamp({ kind }: { kind: ExitKind }) {
  const label = STAMP_LABELS[kind];
  if (!label) return null;
  return (
    <div
      aria-live="assertive"
      className={cn(
        "pointer-events-none absolute top-[42%] left-1/2 z-20 animate-tampon border-[3px] border-current px-5 py-2 mix-blend-multiply",
        "outline-[1.5px] outline-offset-[3px] outline-current outline-solid",
        TONES[kind],
      )}
    >
      <span className="block font-expanded text-[clamp(1.8rem,4vw,3rem)] leading-none font-black tracking-[0.06em] whitespace-nowrap uppercase [filter:url(#encre)]">
        {label}
      </span>
      <svg width="0" height="0" className="absolute">
        <filter id="encre">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.6" />
          <feComposite in="SourceGraphic" operator="in" />
        </filter>
      </svg>
    </div>
  );
}
