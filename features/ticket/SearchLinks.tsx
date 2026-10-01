import { ArrowUpRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildSearchLinks } from "@/lib/domain/search-links";
import type { Garage } from "@/lib/types";

// Sources de recherche ouvertes dans un nouvel onglet.
export function SearchLinks({ garage }: { garage: Garage }) {
  return (
    <nav aria-label="Rechercher ailleurs" className="flex touch-pan-x items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none]">
      <span className="mr-1 shrink-0 text-xs text-muted-foreground">Autres sources</span>
      {buildSearchLinks(garage).map((link) => (
        <Button key={link.id} asChild variant="link" size="sm" className="shrink-0 px-1">
          <a href={link.url} target="_blank" rel="noreferrer">
            {link.label}
            <ArrowUpRightIcon data-icon="inline-end" />
          </a>
        </Button>
      ))}
    </nav>
  );
}
