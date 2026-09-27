"use client";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { OPERATORS, type Operator } from "@/lib/types";

// Sélecteur compact (colonne de filtres, en-tête mobile).
export function OperatorPicker({ operator, onChange }: { operator: Operator | null; onChange: (o: Operator) => void }) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={operator ?? ""}
      onValueChange={(v) => v && onChange(v as Operator)}
      aria-label="Qui est au poste ?"
      className="w-full"
    >
      {OPERATORS.map((o) => (
        <ToggleGroupItem
          key={o}
          value={o}
          className="flex-1 border-encre text-[12.5px] font-semibold data-[state=on]:bg-encre data-[state=on]:text-papier"
        >
          {o}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

// Écran d'accueil tant que personne n'est au poste : obligatoire avant la première action.
export function OperatorGate({ onChange }: { onChange: (o: Operator) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ciment/95 p-6">
      <div className="flex w-full max-w-sm flex-col gap-6 trait border-encre bg-papier p-6">
        <div>
          <p className="etiquette text-mute">Prise de poste</p>
          <h1 className="mt-1 font-expanded text-3xl leading-none font-black uppercase">Qui est au poste ?</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Ton nom est enregistré dans Notion (traite_par) avec chaque fiche traitée. Mémorisé sur cet appareil.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {OPERATORS.map((o) => (
            <Button key={o} variant="secondary" size="xl" onClick={() => onChange(o)}>
              {o}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
