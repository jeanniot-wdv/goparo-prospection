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
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="etiquette text-mute">{label}</dt>
      <dd className="truncate font-mono text-[13px]">{children || <span className="text-mute">—</span>}</dd>
    </div>
  );
}

// Haut du ticket : n°, nom en Expanded Black, localisation, puis la « souche » de métadonnées.
export function TicketHeader({ garage, number, toolbar }: { garage: Garage; number: string; toolbar?: React.ReactNode }) {
  const annee = garage.dateCreation?.slice(0, 4);
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="trait border-encre bg-encre px-1.5 py-0.5 font-mono text-[12px] leading-none text-papier">
            N°{number}
          </span>
          {garage.segment === "structure_employeuse" && <Badge variant="outline">Employeuse</Badge>}
          {garage.franchiseSuspectee === "oui" && <Badge variant="secondary">Franchise ?</Badge>}
        </div>
        {toolbar}
      </div>

      <div>
        <h1 className="font-expanded text-[clamp(1.9rem,3.4vw,3.1rem)] leading-[0.9] font-black tracking-[-0.015em] break-words uppercase">
          {getNomAffiche(garage) || "(sans nom)"}
        </h1>
        <p className="mt-2 font-mono text-[13px] text-mute">
          {formatLieu(garage)}
        </p>
      </div>

      <div className="decoupe" aria-hidden />

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        <Meta label="Dirigeant">{garage.dirigeant}</Meta>
        {garage.enseigne.trim() !== "" && <Meta label="Nom légal">{garage.nom}</Meta>}
        <Meta label="SIREN">
          {garage.siren && (
            <a
              href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${garage.siren}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 underline decoration-filet underline-offset-2 hover:decoration-encre"
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
    </header>
  );
}
