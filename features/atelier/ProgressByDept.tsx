"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ZONE_DEPTS, type Stats } from "@/lib/domain/stats";
import { DataTable, GRILLE, PISTE, Panel, SERIE_1, nf, pct } from "./Panel";

const NOMS: Record<string, string> = {
  "67": "67 Bas-Rhin",
  "57": "57 Moselle",
  "54": "54 Meurthe-et-M.",
  "68": "68 Haut-Rhin",
  "88": "88 Vosges",
  "55": "55 Meuse",
};

const config = {
  traites: { label: "Traités", color: SERIE_1 },
  restant: { label: "Restant", color: PISTE },
} satisfies ChartConfig;

// Traités / restant par département ; hors Grand Est et sans CP regroupés en « Autres ».
export function ProgressByDept({ stats }: { stats: Stats }) {
  const principaux = stats.parDept.filter((d) => ZONE_DEPTS.includes(d.dept));
  const autres = stats.parDept.filter((d) => !ZONE_DEPTS.includes(d.dept));
  const rows = [
    ...principaux.map((d) => ({ nom: NOMS[d.dept] ?? d.dept, total: d.total, traites: d.traites })),
    { nom: "Autres / sans CP", total: autres.reduce((s, d) => s + d.total, 0), traites: autres.reduce((s, d) => s + d.traites, 0) },
  ].map((r) => ({ ...r, restant: r.total - r.traites, taux: pct(r.traites, r.total) }));

  return (
    <Panel title="Progression par département" subtitle="Fiches sorties de la file « Nouveaux » sur le total du département.">
      <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
        <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 48 }} barSize={18}>
          <CartesianGrid horizontal={false} stroke={GRILLE} />
          <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => nf.format(v)} />
          <YAxis type="category" dataKey="nom" width={124} tickLine={false} axisLine={false} className="font-mono" />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={<ChartTooltipContent formatter={(value, name) => `${config[name as keyof typeof config].label} : ${nf.format(Number(value))}`} />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="traites" stackId="d" fill="var(--color-traites)" stroke="var(--card)" strokeWidth={2} />
          <Bar dataKey="restant" stackId="d" fill="var(--color-restant)" stroke="var(--card)" strokeWidth={2}>
            <LabelList dataKey="taux" position="right" className="fill-foreground font-mono" fontSize={11} />
          </Bar>
        </BarChart>
      </ChartContainer>
      <DataTable head={["Département", "Total", "Traités", "%"]} rows={rows.map((r) => [r.nom, r.total, r.traites, pct(r.traites, r.total)])} />
    </Panel>
  );
}
