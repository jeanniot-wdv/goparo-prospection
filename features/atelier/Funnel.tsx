"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Stats } from "@/lib/domain/stats";
import { DataTable, GRILLE, Panel, SERIE_1, nf } from "./Panel";

const config = { count: { label: "Fiches", color: SERIE_1 } } satisfies ChartConfig;

// Répartition des fiches par Prospection_active (une seule série : pas de légende).
export function Funnel({ stats }: { stats: Stats }) {
  const vide = stats.entonnoir.find((e) => e.statut === "(vide)")?.count ?? 0;
  const rows = stats.entonnoir.filter((e) => e.statut !== "(vide)");

  return (
    <Panel
      title="Entonnoir Prospection_active"
      subtitle={`${nf.format(vide)} fiches sans statut (jamais traitées) ne sont pas représentées.`}
    >
      <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
        <BarChart data={rows} layout="vertical" margin={{ right: 40 }} barSize={18}>
          <CartesianGrid horizontal={false} stroke={GRILLE} />
          <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="statut" width={128} tickLine={false} axisLine={false} fontSize={11.5} />
          <ChartTooltip cursor={{ fill: "var(--color-voile)", opacity: 0.5 }} content={<ChartTooltipContent hideLabel={false} />} />
          <Bar dataKey="count" fill="var(--color-count)">
            <LabelList dataKey="count" position="right" className="fill-foreground font-mono" fontSize={11} />
          </Bar>
        </BarChart>
      </ChartContainer>
      <DataTable head={["Statut", "Fiches"]} rows={[...rows.map((r) => [r.statut, r.count]), ["(sans statut)", vide]]} />
    </Panel>
  );
}
