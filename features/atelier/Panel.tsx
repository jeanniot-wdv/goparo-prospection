import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const nf = new Intl.NumberFormat("fr-FR");
export const pct = (part: number, total: number) => (total > 0 ? `${Math.round((part / total) * 100)} %` : "—");

// Bleu, vert et neutre : séries différenciées dans les deux thèmes.
export const SERIE_1 = "var(--chart-1)";
export const SERIE_2 = "var(--chart-2)";
export const SERIE_3 = "var(--chart-3)";
export const PISTE = "var(--muted)";
export const GRILLE = "var(--border)";

// Sections réutilisables du tableau de bord, composées avec Card shadcn.
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
    <Card className={cn("min-w-0 gap-4 py-4 sm:py-5", className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {subtitle && <CardDescription className="text-sm">{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

// Vue tableau de chaque graphique (accessibilité, lecture exacte des valeurs).
export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="group text-[13px]">
      <summary className="cursor-pointer list-none text-xs font-semibold text-link hover:underline">
        Voir les données <span className="inline-block transition-transform group-open:rotate-90">▸</span>
      </summary>
      <Table className="mt-2 text-xs">
        <TableHeader>
          <TableRow>
            {head.map((h, i) => (
              <TableHead key={h} className={cn("h-8 text-xs font-semibold", i > 0 && "text-right")}>
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
    <Card className={cn("min-w-0 gap-1 px-4 py-4", accent && "border-success/30 bg-success-subtle")}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn("text-[clamp(1.5rem,3vw,2rem)] leading-tight font-semibold tabular-nums wrap-break-word", accent && "text-success")}>{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Card>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-md border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
