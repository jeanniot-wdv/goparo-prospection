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
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold leading-none whitespace-nowrap tabular-nums">{children}</span>
    </div>
  );
}

// Progression compacte, avec les métriques essentielles visibles sur mobile.
export function StatsStrip({ live, error }: { live: LiveStats | null; error: string | null }) {
  if (error) return <p className="text-xs text-destructive">Statistiques indisponibles</p>;
  if (!live) {
    return (
      <div className="flex flex-col gap-3 rounded-md border bg-card p-3" aria-busy>
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-7 w-4/5" />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-md border bg-card p-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold">Progression globale</span>
        <span className="font-semibold tabular-nums text-success">{pct(live.traites / Math.max(1, live.total))}</span>
      </div>
      <Progress
        value={(live.traites / Math.max(1, live.total)) * 100}
        aria-label="Progression"
        className="h-2 bg-muted [&>div]:bg-success"
      />
      <div className="flex touch-pan-x divide-x overflow-x-auto overflow-y-hidden pb-0.5 [scrollbar-width:none]">
        <Cell label="Traités">
          {nf.format(live.traites)}
          <span className="font-normal text-muted-foreground">/{nf.format(live.total)}</span>
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
      <span className="text-xs font-semibold text-muted-foreground">Aujourd&apos;hui</span>
      {live ? (
        <>
          <span className="text-3xl leading-none font-semibold tabular-nums">{live.aujourdhui}</span>
          <span className="text-xs text-muted-foreground">
            {TRAITE_PAR_VALUES.map((o) => `${o} ${live.aujourdhuiParOperateur[o]}`).join(" · ")}
          </span>
        </>
      ) : (
        <Skeleton className="h-12 w-16" />
      )}
    </div>
  );
}
