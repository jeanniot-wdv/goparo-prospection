"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Stats } from "@/lib/domain/stats";
import { OPERATORS } from "@/lib/types";
import { DataTable, Empty, GRILLE, Panel, SERIE_1, SERIE_2, nf } from "./Panel";

const config = {
  Hiba: { label: "Hiba", color: SERIE_1 },
  Romain: { label: "Romain", color: SERIE_2 },
} satisfies ChartConfig;

const jour = (d: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

// Fiches traitées par jour et par personne (traite_le / traite_par), 30 derniers jours d'activité.
// N'inclut que les fiches réellement closes : celles encore « À compléter » (tél. connu,
// email pas encore trouvé) n'y figurent pas tant qu'elles ne sont pas résolues.
export function ActivityChart({ stats }: { stats: Stats }) {
  const rows = stats.parJour.slice(-30).map((d) => ({ date: d.date, jour: jour(d.date), total: d.total, ...d.parOperateur }));

  return (
    <Panel title="Activité">
      <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[12px]">
        <span>
          <span className="text-mute">À compléter</span> {nf.format(stats.aCompleter)}
        </span>
        {OPERATORS.map((o) => (
          <span key={o}>
            <span className="text-mute">{o}</span> {nf.format(stats.parOperateur[o])}
          </span>
        ))}
        <span>
          <span className="text-mute">Rythme</span> {stats.rythme ? `${Math.round(stats.rythme)}/jour` : "—"}
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
            <ChartTooltip cursor={{ fill: "var(--color-voile)", opacity: 0.5 }} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {OPERATORS.map((o) => (
              <Bar key={o} dataKey={o} stackId="j" fill={`var(--color-${o})`} stroke="var(--color-papier)" strokeWidth={2} />
            ))}
          </BarChart>
        </ChartContainer>
      )}
      {rows.length > 0 && (
        <DataTable head={["Jour", ...OPERATORS, "Total"]} rows={rows.map((r) => [r.date, ...OPERATORS.map((o) => r[o]), r.total])} />
      )}
    </Panel>
  );
}
