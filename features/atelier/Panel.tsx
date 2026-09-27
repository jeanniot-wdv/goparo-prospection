import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const nf = new Intl.NumberFormat("fr-FR");
export const pct = (part: number, total: number) => (total > 0 ? `${Math.round((part / total) * 100)} %` : "—");

// Couleurs de séries validées (scripts dataviz) : série 1 bleu Goparo, série 2 orange signal.
export const SERIE_1 = "var(--color-marque)";
export const SERIE_2 = "var(--color-signal)";
// Automatisation (n8n) : neutre, pour ne pas empiéter sur les deux couleurs réservées aux personnes.
export const SERIE_3 = "var(--color-mute)";
export const PISTE = "var(--color-voile)";
export const GRILLE = "var(--color-filet)";

// Encadré d'une section du tableau de bord, au trait, sans ombre.
export function Panel({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4 trait border-encre bg-papier p-5", className)}>
      <header>
        <h2 className="font-expanded text-[15px] leading-tight font-black uppercase">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

// Vue tableau de chaque graphique (accessibilité, lecture exacte des valeurs).
export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="group text-[13px]">
      <summary className="etiquette cursor-pointer list-none text-mute hover:text-encre">
        Voir les données <span className="inline-block transition-transform group-open:rotate-90">▸</span>
      </summary>
      <Table className="mt-2 font-mono text-[12px]">
        <TableHeader>
          <TableRow>
            {head.map((h, i) => (
              <TableHead key={h} className={cn("etiquette h-8", i > 0 && "text-right")}>
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={String(row[0])}>
              {row.map((cell, i) => (
                <TableCell key={i} className={cn("py-1.5", i > 0 && "text-right tabular-nums")}>
                  {typeof cell === "number" ? nf.format(cell) : cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </details>
  );
}

export function StatTile({ label, value, hint, accent }: { label: string; value: React.ReactNode; hint?: React.ReactNode; accent?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1 trait border-encre p-4", accent ? "bg-encre text-papier" : "bg-papier")}>
      <span className={cn("etiquette", accent ? "text-papier/60" : "text-mute")}>{label}</span>
      <span className="font-expanded text-[clamp(1.8rem,3vw,2.6rem)] leading-none font-black tabular-nums">{value}</span>
      {hint && <span className={cn("font-mono text-[11.5px]", accent ? "text-papier/70" : "text-mute")}>{hint}</span>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="hachures flex min-h-40 items-center justify-center trait border-dashed border-filet p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
