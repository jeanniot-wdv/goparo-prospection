import { cn } from "@/lib/utils";
import { priorityTier } from "@/lib/domain/priority";
import { getNomAffiche } from "@/lib/domain/search-links";
import type { Garage } from "@/lib/types";

// Ordinal (3 paliers) sur les tons neutres du système : plein encre = haute,
// voile = moyenne, contour mute = basse. Pas de teinte, pour ne pas entrer en
// conflit avec le bleu (données trouvées) ni l'orange (action principale).
const TIER_CLASSES = {
  haute: "border-encre bg-encre text-papier",
  moyenne: "border-filet bg-voile text-encre",
  basse: "border-filet text-mute",
} as const;

// Jauge 3 segments : tél. / email / site. Plein bleu Goparo = donnée connue.
export function Gauge({ garage, className }: { garage: Garage; className?: string }) {
  const parts = [
    { label: "tél.", on: Boolean(garage.telephone) },
    { label: "email", on: Boolean(garage.email) },
    { label: "site", on: Boolean(garage.siteWeb) },
  ];
  return (
    <span
      className={cn("flex gap-[3px]", className)}
      aria-label={`Connu : ${parts.filter((p) => p.on).map((p) => p.label).join(", ") || "rien"}`}
    >
      {parts.map((p) => (
        <span key={p.label} className={cn("h-3 w-[7px] trait", p.on ? "border-marque bg-marque" : "border-mute/70")} />
      ))}
    </span>
  );
}

export function QueueRow({
  garage,
  number,
  active,
  leaving,
  onSelect,
}: {
  garage: Garage;
  number: string;
  active: boolean;
  leaving?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-active={active}
      aria-current={active ? "true" : undefined}
      className={cn(
        "group relative grid w-full grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-filet py-2.5 pr-4 pl-4 text-left transition-colors hover:bg-papier/60",
        leaving && "animate-sortie",
      )}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-[3px] bg-signal transition-transform origin-left", active ? "scale-x-100" : "scale-x-0")}
      />
      <span className={cn("font-mono text-[11px] tabular-nums", active ? "text-encre" : "text-mute")}>
        {number}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-condensed text-[15px] leading-tight font-extrabold uppercase">
          {getNomAffiche(garage) || "(sans nom)"}
        </span>
        <span className="block truncate font-mono text-[11px] text-mute">
          {garage.commune || "—"}
          {garage.cp !== null && ` · ${garage.cp}`}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <Gauge garage={garage} />
        {garage.scorePriorite !== null && (
          <span
            className={cn(
              "trait px-1 font-mono text-[10px] leading-[1.4] tabular-nums",
              TIER_CLASSES[priorityTier(garage.scorePriorite)],
            )}
            title={`Score de priorité : ${garage.scorePriorite} (${priorityTier(garage.scorePriorite)})`}
          >
            p{garage.scorePriorite}
          </span>
        )}
      </span>
    </button>
  );
}
