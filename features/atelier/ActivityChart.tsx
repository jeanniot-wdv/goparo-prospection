"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Stats } from "@/lib/domain/stats";
import { TRAITE_PAR_VALUES } from "@/lib/types";
import { DataTable, Empty, GRILLE, Panel, SERIE_1, SERIE_2, SERIE_3, nf } from "./Panel";

const config = {
  Hiba: { label: "Hiba", color: SERIE_1 },
  Romain: { label: "Romain", color: SERIE_2 },
  Automatisation: { label: "Automatisation", color: SERIE_3 },
} satisfies ChartConfig;

const jour = (d: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

// "Automatisation" force un scroll horizontal du tableau sur mobile : raccourci en-dessous de sm.
const dataTableHead = (o: (typeof TRAITE_PAR_VALUES)[number]) =>
  o === "Automatisation" ? (
    <span key={o}>
      <span className="sm:hidden">Auto</span>
      <span className="hidden sm:inline">Automatisation</span>
    </span>
  ) : (
    o
  );

// Fiches traitées par jour et par personne (traite_le / traite_par), 30 derniers jours d'activité.
// N'inclut que les fiches réellement closes : celles encore « À compléter » (tél. connu,
// email pas encore trouvé) n'y figurent pas tant qu'elles ne sont pas résolues.
export function ActivityChart({ stats }: { stats: Stats }) {
  const rows = stats.parJour.slice(-30).map((d) => ({ date: d.date, jour: jour(d.date), total: d.total, ...d.parOperateur }));

  return (
    <Panel title="Activité">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs tabular-nums">
        <span>
          <span className="text-muted-foreground">À compléter</span> {nf.format(stats.aCompleter)}
        </span>
        {TRAITE_PAR_VALUES.map((o) => (
          <span key={o}>
            <span className="text-muted-foreground">{o}</span> {nf.format(stats.parOperateur[o])}
          </span>
        ))}
        <span>
          <span className="text-muted-foreground">Rythme</span> {stats.rythme ? `${Math.round(stats.rythme)}/jour` : "—"}
        </span>
      </div>
      {rows.length === 0 ? (
        <Empty>Aucune fiche traitée depuis la mise en place du suivi (traite_le).</Empty>
      ) : (
        <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
          <BarChart data={rows} barSize={18}>
            <CartesianGrid vertical={false} stroke={GRILLE} />
            <XAxis dataKey="jour" tickLine={false} axisLine={false} fontSize={11} minTickGap={16} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={32} />
            <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {TRAITE_PAR_VALUES.map((o) => (
              <Bar key={o} dataKey={o} stackId="j" fill={`var(--color-${o})`} stroke="var(--card)" strokeWidth={2} />
            ))}
          </BarChart>
        </ChartContainer>
      )}
      {rows.length > 0 && (
        <DataTable head={["Jour", ...TRAITE_PAR_VALUES.map(dataTableHead), "Total"]} rows={rows.map((r) => [r.date, ...TRAITE_PAR_VALUES.map((o) => r[o]), r.total])} />
      )}
    </Panel>
  );
}
