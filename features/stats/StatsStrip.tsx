import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { LiveStats } from "@/lib/domain/stats";
import { TRAITE_PAR_VALUES } from "@/lib/types";
import { cn } from "@/lib/utils";

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)} %`);
const nf = new Intl.NumberFormat("fr-FR");
const dateCourte = (d: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

function Cell({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex shrink-0 flex-col gap-0.5 px-3 first:pl-0", className)}>
      <span className="etiquette text-[9.5px] text-mute">{label}</span>
      <span className="font-mono text-[13px] leading-none whitespace-nowrap tabular-nums">{children}</span>
    </div>
  );
}

// Bandeau de progression au-dessus de la file : lecture en un coup d'œil, façon compteur d'atelier.
export function StatsStrip({ live, error }: { live: LiveStats | null; error: string | null }) {
  if (error) return <p className="font-mono text-[11px] text-alerte">Stats indisponibles</p>;
  if (!live) {
    return (
      <div className="flex flex-col gap-2" aria-busy>
        <Skeleton className="h-1.5 w-full" />
        <Skeleton className="h-6 w-4/5" />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Progress
        value={(live.traites / Math.max(1, live.total)) * 100}
        aria-label="Progression"
        className="h-1.5 bg-voile [&>div]:bg-encre"
      />
      <div className="-mx-4 flex touch-pan-x divide-x divide-filet overflow-x-auto px-4 [scrollbar-width:none]">
        <Cell label="Traités">
          {nf.format(live.traites)}
          <span className="text-mute">/{nf.format(live.total)}</span>
        </Cell>
        <Cell label="Restant">{nf.format(live.restants)}</Cell>
        <Cell label="Email">{pct(live.tauxEmail)}</Cell>
        <Cell label="Tél.">{pct(live.tauxTel)}</Cell>
        <Cell label="Rythme">{live.rythme ? `${Math.round(live.rythme)}/j` : "—"}</Cell>
        <Cell label="Fin estimée">{live.finEstimee ? dateCourte(live.finEstimee) : "—"}</Cell>
      </div>
    </div>
  );
}

// Compteur du jour, en bas de la colonne de filtres.
export function DayCounter({ live }: { live: LiveStats | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="etiquette text-mute">Aujourd&apos;hui</span>
      {live ? (
        <>
          <span className="font-expanded text-5xl leading-none font-black tabular-nums">
            {live.aujourdhui}
            <span className="ml-1 align-top text-lg text-signal">✓</span>
          </span>
          <span className="font-mono text-[11px] text-mute">
            {TRAITE_PAR_VALUES.map((o) => `${o} ${live.aujourdhuiParOperateur[o]}`).join(" · ")}
          </span>
        </>
      ) : (
        <Skeleton className="h-12 w-16" />
      )}
    </div>
  );
}
