import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
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
      <p className="text-xs text-muted-foreground">
        Calculé à {heure(stats.generatedAt)} · mis en cache 10 min, rafraîchi après chaque fiche traitée
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
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
      <p className="text-xs text-muted-foreground">Lecture des statistiques Notion…</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
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
    <div className="min-h-dvh bg-inset">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-card px-4 sm:px-6">
        <Link href="/" className="text-[17px] font-semibold tracking-[-0.03em] text-foreground">Goparo<span className="text-link">.</span></Link>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="text-foreground"><Link href="/">Poste de travail</Link></Button>
          <ThemeToggle />
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Progression, activité et qualité des données de prospection.</p>
        </div>
        <Suspense fallback={<DashboardSkeleton />}><Dashboard /></Suspense>
      </div>
    </div>
  );
}
