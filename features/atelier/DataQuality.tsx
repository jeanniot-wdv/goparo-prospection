import { ArrowUpRightIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ZONE_DEPTS, type GarageRef, type Stats } from "@/lib/domain/stats";
import { Panel, StatTile, nf } from "./Panel";

const notionUrl = (id: string) => `https://www.notion.so/${id.replace(/-/g, "")}`;

function GarageLink({ g }: { g: GarageRef }) {
  return (
    <a href={notionUrl(g.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 hover:underline">
      {g.nom || "(sans nom)"}
      <ArrowUpRightIcon className="size-3 text-mute" />
    </a>
  );
}

// Vue qualité : ce qu'il faudrait corriger dans Notion.
export function DataQuality({ stats }: { stats: Stats }) {
  const q = stats.qualite;
  return (
    <Panel title="Qualité des données" subtitle={`Départements attendus : ${ZONE_DEPTS.join(", ")}.`}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="CP hors zone" value={nf.format(q.cpHorsZone.length)} />
        <StatTile label="Sans CP" value={nf.format(q.sansCp)} />
        <StatTile label="Sans dirigeant" value={nf.format(q.sansDirigeant)} />
        <StatTile label="Tél. en doublon" value={nf.format(q.doublonsTel.length)} hint="numéros partagés" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="etiquette mb-2 text-mute">Téléphones en doublon</h3>
          <Table className="text-[12.5px]">
            <TableHeader>
              <TableRow>
                <TableHead className="etiquette h-8">Numéro</TableHead>
                <TableHead className="etiquette h-8">Garages</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.doublonsTel.map((d) => (
                <TableRow key={d.telephone}>
                  <TableCell className="py-1.5 align-top font-mono whitespace-nowrap">{d.telephone}</TableCell>
                  <TableCell className="py-1.5 whitespace-normal">
                    <div className="flex flex-col gap-0.5">
                      {d.garages.map((g) => (
                        <GarageLink key={g.id} g={g} />
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="min-w-0">
          <h3 className="etiquette mb-2 text-mute">CP hors zone</h3>
          <div className="max-h-[420px] overflow-y-auto">
            <Table className="text-[12.5px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="etiquette h-8">CP</TableHead>
                  <TableHead className="etiquette h-8">Garage</TableHead>
                  <TableHead className="etiquette h-8">Commune</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.cpHorsZone.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="py-1.5 font-mono">{g.cp}</TableCell>
                    <TableCell className="max-w-48 truncate py-1.5">
                      <GarageLink g={g} />
                    </TableCell>
                    <TableCell className="max-w-40 truncate py-1.5 font-mono text-mute">{g.commune}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Panel>
  );
}
