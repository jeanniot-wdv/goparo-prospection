"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Kbd } from "@/components/ui/kbd";
import { hasEmail, hasTel, type FicheState } from "@/lib/domain/prospection-rules";

export function CloseGarageAction({ onClose, disabled, compact = false }: { onClose: () => void; disabled: boolean; compact?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size={compact ? "sm" : "lg"} disabled={disabled}>
          Marquer fermé
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Marquer ce garage comme fermé ?</AlertDialogTitle>
          <AlertDialogDescription>
            Il sortira de la file. Vous pourrez encore annuler cette action pendant 5 secondes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onClose}>Confirmer la fermeture</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Barre de sortie, fixée en bas (à portée de pouce sur mobile). Quand une seule
 * coordonnée est connue, « Terminer » ouvre le bandeau « … trouvé ? » :
 * Oui = je le saisis (on reste sur la fiche), Non = introuvable (on sort).
 */
export function ExitBar({
  fiche,
  ask,
  disabled,
  onTerminer,
  onRienTrouve,
  onPasser,
  onAskOui,
  onAskNon,
  onFerme,
}: {
  fiche: FicheState;
  ask: "email" | "telephone" | null;
  disabled: boolean;
  onTerminer: () => void;
  onRienTrouve: () => void;
  onPasser: () => void;
  onAskOui: () => void;
  onAskNon: () => void;
  onFerme: () => void;
}) {
  const known = hasTel(fiche) || hasEmail(fiche);

  return (
    <div className="sticky bottom-0 z-10 border-t bg-card px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-[var(--shadow-toolbar)] sm:px-6 lg:px-8">
      {ask ? (
        <div role="alertdialog" aria-label={ask === "email" ? "Email trouvé ?" : "Téléphone trouvé ?"} className="flex animate-monte flex-wrap items-center gap-3">
          <p className="mr-auto text-sm font-semibold">
            {ask === "email" ? "Email trouvé ?" : "Téléphone trouvé ?"}
          </p>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
            <Button variant="outline" size="lg" onClick={onAskOui} disabled={disabled}>
              Oui, je le saisis <Kbd>O</Kbd>
            </Button>
            <Button variant="secondary" size="lg" onClick={onAskNon} disabled={disabled}>
              Non, introuvable <Kbd>N</Kbd>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="hidden lg:block"><CloseGarageAction onClose={onFerme} disabled={disabled} compact /></div>
          <div className="grid flex-1 grid-cols-2 gap-2 lg:ml-auto lg:flex lg:flex-none">
            {known ? (
              <Button variant="outline" size="lg" onClick={onPasser} disabled={disabled}>
                Passer <Kbd>P</Kbd>
              </Button>
            ) : (
              <Button variant="outline" size="lg" onClick={onRienTrouve} disabled={disabled}>
                Rien trouvé <Kbd>N</Kbd>
              </Button>
            )}
            <Button
              variant="secondary"
              size="lg"
              onClick={known ? onTerminer : onPasser}
              disabled={disabled}
              className="font-semibold"
            >
              {known ? "Terminer" : "Passer"}
              <Kbd>{known ? "⌘↵" : "P"}</Kbd>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
