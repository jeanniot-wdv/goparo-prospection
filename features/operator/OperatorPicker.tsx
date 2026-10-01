"use client";

import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
          className="h-10 flex-1 border-border text-xs font-semibold sm:h-9 data-[state=on]:border-link/30 data-[state=on]:bg-link-subtle data-[state=on]:text-link"
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
    <AlertDialog open>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Qui est au poste ?</AlertDialogTitle>
          <AlertDialogDescription>
            Ton nom est enregistré dans Notion (traite_par) avec chaque fiche traitée. Mémorisé sur cet appareil.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {OPERATORS.map((o) => (
            <Button key={o} variant="secondary" size="lg" onClick={() => onChange(o)}>
              {o}
            </Button>
          ))}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
