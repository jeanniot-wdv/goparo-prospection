import { ArrowUpRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EFFECTIF_LABELS } from "@/lib/domain/stats";
import { getNomAffiche } from "@/lib/domain/search-links";
import type { Garage } from "@/lib/types";

const NAF_LABELS: Record<string, string> = {
  "45.20A": "Entretien véhicules légers",
  "45.20B": "Entretien autres véhicules",
};

function formatSiren(siren: string) {
  return siren.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}

// L'adresse Notion contient parfois déjà « CP COMMUNE » : on ne le répète pas.
function formatLieu(g: Garage) {
  const lieu = [g.cp, g.commune].filter(Boolean).join(" ");
  if (!g.adresse) return lieu || "Adresse inconnue";
  const dejaDedans = g.cp !== null && g.adresse.includes(String(g.cp));
  return dejaDedans ? g.adresse : [g.adresse, lieu].filter(Boolean).join(" · ");
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-medium">{children || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

// En-tête de fiche : identité d'abord, puis les données utiles à la recherche.
export function TicketHeader({ garage, number, toolbar }: { garage: Garage; number: string; toolbar?: React.ReactNode }) {
  const annee = garage.dateCreation?.slice(0, 4);
  const metadata = (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border bg-card p-4 sm:grid-cols-3">
      <Meta label="Dirigeant">{garage.dirigeant}</Meta>
      {garage.enseigne.trim() !== "" && <Meta label="Nom légal">{garage.nom}</Meta>}
      <Meta label="SIREN">
        {garage.siren && (
          <a
            href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${garage.siren}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 font-mono text-link hover:underline"
          >
            {formatSiren(garage.siren)}
            <ArrowUpRightIcon className="size-3" />
          </a>
        )}
      </Meta>
      <Meta label="Effectif">{garage.effectif && EFFECTIF_LABELS[garage.effectif]}</Meta>
      <Meta label="Création">{annee && `${annee} · ${new Date().getFullYear() - Number(annee)} ans`}</Meta>
      <Meta label="NAF">{garage.naf && `${garage.naf} ${NAF_LABELS[garage.naf] ?? ""}`}</Meta>
    </dl>
  );
  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono tabular-nums">#{number}</Badge>
          {garage.segment === "structure_employeuse" && <Badge variant="outline">Employeuse</Badge>}
          {garage.franchiseSuspectee === "oui" && <Badge variant="secondary">Franchise ?</Badge>}
        </div>
        {toolbar}
      </div>

      <div className="min-w-0">
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] leading-tight font-semibold tracking-[-0.025em] break-words">
          {getNomAffiche(garage) || "(sans nom)"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {formatLieu(garage)}
        </p>
      </div>

      <details className="group sm:hidden">
        <summary className="cursor-pointer list-none text-xs font-semibold text-link">Informations du garage <span className="inline-block transition-transform group-open:rotate-90">▸</span></summary>
        <div className="mt-3">{metadata}</div>
      </details>
      <div className="hidden sm:block">{metadata}</div>
    </header>
  );
}
