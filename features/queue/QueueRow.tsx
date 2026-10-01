import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { priorityTier } from "@/lib/domain/priority";
import { getNomAffiche } from "@/lib/domain/search-links";
import type { Garage } from "@/lib/types";

const PRIORITY_LABELS = { haute: "Haute", moyenne: "Moyenne", basse: "Basse" } as const;

export function QueueRow({
  garage, number, active, onSelect,
}: {
  garage: Garage;
  number: string;
  active: boolean;
  leaving?: boolean;
  onSelect: () => void;
}) {
  const known = [garage.telephone, garage.email, garage.siteWeb].filter(Boolean).length;
  const tier = garage.scorePriorite === null ? null : priorityTier(garage.scorePriorite);

  return (
    <button
      type="button"
      onClick={onSelect}
      data-active={active}
      aria-current={active ? "true" : undefined}
      className={cn(
        "relative grid min-h-19 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted",
        active && "bg-link-subtle hover:bg-link-subtle",
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-[3px]", active && "bg-link")} />
      <span className="min-w-0">
        <span className="mb-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">#{number}</span>
          {garage.commune && <span className="truncate">{garage.commune}</span>}
        </span>
        <span className="block truncate text-sm font-semibold text-foreground">
          {getNomAffiche(garage) || "(sans nom)"}
        </span>
        {garage.cp !== null && <span className="text-xs text-muted-foreground">{garage.cp}</span>}
      </span>
      <span className="flex w-20 shrink-0 flex-col items-end gap-2">
        {tier && (
          <Badge
            variant="secondary"
            title={`Score de priorité : ${garage.scorePriorite}`}
            className={cn("border", tier === "haute" && "border-attention/30 bg-attention-subtle text-attention", tier === "basse" && "text-muted-foreground")}
          >
            {PRIORITY_LABELS[tier]}
          </Badge>
        )}
        <span className="w-full">
          <Progress value={(known / 3) * 100} aria-label={`${known} coordonnée${known > 1 ? "s" : ""} sur 3 connue${known > 1 ? "s" : ""}`} className="h-1.5 bg-muted [&>div]:bg-success" />
          <span className="mt-0.5 block text-right text-[11px] tabular-nums text-muted-foreground">{known}/3</span>
        </span>
      </span>
    </button>
  );
}
