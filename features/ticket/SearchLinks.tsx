import { ArrowUpRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildSearchLinks } from "@/lib/domain/search-links";
import type { Garage } from "@/lib/types";

// Sources de recherche ouvertes dans un nouvel onglet.
export function SearchLinks({ garage }: { garage: Garage }) {
  return (
    <nav aria-label="Rechercher ailleurs" className="flex flex-wrap items-center gap-1.5">
      <span className="etiquette mr-1 text-mute">Chercher sur</span>
      {buildSearchLinks(garage).map((link) => (
        <Button key={link.id} asChild variant="outline" size="sm" className="border-encre bg-transparent">
          <a href={link.url} target="_blank" rel="noreferrer">
            {link.label}
            <ArrowUpRightIcon data-icon="inline-end" />
          </a>
        </Button>
      ))}
    </nav>
  );
}
