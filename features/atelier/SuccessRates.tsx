"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Rate } from "@/lib/domain/stats";
import { DataTable, Empty, GRILLE, Panel, SERIE_1, SERIE_2 } from "./Panel";

const config = {
  email: { label: "Email trouvé", color: SERIE_1 },
  tel: { label: "Tél. trouvé", color: SERIE_2 },
} satisfies ChartConfig;

function RatesChart({ title, rates }: { title: string; rates: Rate[] }) {
  const rows = rates
    .filter((r) => r.traites > 0)
    .map((r) => ({
      nom: r.label,
      traites: r.traites,
      email: Math.round((r.avecEmail / r.traites) * 100),
      tel: Math.round((r.avecTel / r.traites) * 100),
    }));
  if (rows.length === 0) return <Empty>Aucune fiche traitée.</Empty>;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <ChartContainer config={config} className="aspect-auto h-[220px] w-full">
        <BarChart data={rows} margin={{ top: 18 }} barSize={20} barGap={2}>
          <CartesianGrid vertical={false} stroke={GRILLE} />
          <XAxis dataKey="nom" tickLine={false} axisLine={false} interval={0} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v} %`} width={52} />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={
              <ChartTooltipContent
                formatter={(value, name, item) =>
                  `${config[name as keyof typeof config].label} : ${value} % (sur ${item.payload.traites})`
                }
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="email" fill="var(--color-email)">
            <LabelList dataKey="email" position="top" className="fill-foreground font-mono" fontSize={10.5} formatter={(v: unknown) => `${v}`} />
          </Bar>
          <Bar dataKey="tel" fill="var(--color-tel)" />
        </BarChart>
      </ChartContainer>
      <DataTable
        head={[title, "Traités", "Email", "Tél."]}
        rows={rows.map((r) => [r.nom, r.traites, `${r.email} %`, `${r.tel} %`])}
      />
    </div>
  );
}

// Part des fiches traitées où l'email / le tél. a été trouvé, par segment et par effectif.
export function SuccessRates({ parSegment, parEffectif }: { parSegment: Rate[]; parEffectif: Rate[] }) {
  return (
    <Panel title="Taux de réussite" subtitle="Où chercher en priorité : part des fiches traitées avec un email ou un tél.">
      <div className="grid gap-6 md:grid-cols-2">
        <RatesChart title="Par segment" rates={parSegment} />
        <RatesChart title="Par effectif" rates={parEffectif} />
      </div>
    </Panel>
  );
}
