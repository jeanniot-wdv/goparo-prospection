import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityChart } from "@/features/atelier/ActivityChart";
import { DataQuality } from "@/features/atelier/DataQuality";
import { Funnel } from "@/features/atelier/Funnel";
import { StatTile, nf, pct } from "@/features/atelier/Panel";
import { ProgressByDept } from "@/features/atelier/ProgressByDept";
import { SuccessRates } from "@/features/atelier/SuccessRates";
import { getCachedStats } from "@/lib/notion/garages";

export const metadata: Metadata = { title: "Atelier · Goparo Prospection" };

const heure = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso));
// Mois abrégé : en toutes lettres, un mois comme "décembre" déborde de la vignette (police large).
const date = (d: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

async function Dashboard() {
  // Rendu à la demande uniquement : jamais de scan Notion pendant le build.
  await connection();
  const stats = await getCachedStats();

  return (
    <>
      <p className="font-mono text-[12px] text-mute">
        Calculé à {heure(stats.generatedAt)} · mis en cache 10 min, rafraîchi après chaque fiche traitée
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Fiches" value={nf.format(stats.total)} hint="base Grand Est" />
        <StatTile
          label="Traitées"
          value={nf.format(stats.traites)}
          hint={`${pct(stats.traites, stats.total)} du total`}
          accent
        />
        <StatTile label="Restantes" value={nf.format(stats.restants)} hint="file « Nouveaux »" />
        <StatTile label="À compléter" value={nf.format(stats.aCompleter)} hint="tél. sans email" />
        <StatTile
          label="Fin estimée"
          value={stats.finEstimee ? date(stats.finEstimee) : "—"}
          hint={stats.rythme ? `au rythme de ${Math.round(stats.rythme)}/jour` : "pas encore d'activité suivie"}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ProgressByDept stats={stats} />
        <Funnel stats={stats} />
      </div>
      <SuccessRates parSegment={stats.parSegment} parEffectif={stats.parEffectif} />
      <ActivityChart stats={stats} />
      <DataQuality stats={stats} />
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <p className="font-mono text-[12px] text-mute">Lecture des 4 000 fiches Notion… (jusqu&apos;à 30 s au premier chargement)</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

// Tableau de bord Lot 2 : avancement, réussite, activité de l'équipe, qualité des données.
export default function AtelierPage() {
  return (
    <div className="h-dvh overflow-y-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
        <header className="flex flex-wrap items-end justify-between gap-4 trait-b border-encre pb-4">
          <div>
            <Link href="/" className="etiquette text-mute hover:text-encre">
              ← Poste de travail
            </Link>
            <h1 className="mt-2 font-expanded text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.85] font-black uppercase">
              Atelier<span className="text-signal">.</span>
            </h1>
          </div>
          <p className="max-w-sm text-[13px] text-muted-foreground">
            Où en est la base, qui a traité quoi, et ce qu&apos;il faudrait corriger dans Notion.
          </p>
        </header>
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </div>
    </div>
  );
}
