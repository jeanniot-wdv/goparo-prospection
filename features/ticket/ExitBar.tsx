"use client";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { hasEmail, hasTel, type FicheState } from "@/lib/domain/prospection-rules";
import { HoldButton } from "./HoldButton";

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
    <div className="sticky bottom-0 z-10 trait-t border-encre bg-ciment px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:px-10">
      {ask ? (
        <div role="alertdialog" aria-label={ask === "email" ? "Email trouvé ?" : "Téléphone trouvé ?"} className="flex animate-monte flex-wrap items-center gap-3">
          <p className="mr-auto font-expanded text-[15px] font-black uppercase">
            {ask === "email" ? "Email trouvé ?" : "Téléphone trouvé ?"}
          </p>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
            <Button variant="outline" size="lg" onClick={onAskOui} disabled={disabled} className="border-encre">
              Oui, je le saisis <Kbd>O</Kbd>
            </Button>
            <Button variant="secondary" size="lg" onClick={onAskNon} disabled={disabled}>
              Non, introuvable <Kbd className="bg-papier/15 text-papier/80">N</Kbd>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <HoldButton onComplete={onFerme} disabled={disabled} className="hidden lg:inline-flex">
            Fermé <span className="font-normal text-mute">(maintenir)</span>
          </HoldButton>
          <div className="grid flex-1 grid-cols-2 gap-2 lg:ml-auto lg:flex lg:flex-none">
            {known ? (
              <Button variant="outline" size="lg" onClick={onPasser} disabled={disabled} className="border-encre">
                Passer <Kbd>P</Kbd>
              </Button>
            ) : (
              <Button variant="outline" size="lg" onClick={onRienTrouve} disabled={disabled} className="border-encre">
                Rien trouvé <Kbd>N</Kbd>
              </Button>
            )}
            <Button
              variant="secondary"
              size="lg"
              onClick={known ? onTerminer : onPasser}
              disabled={disabled}
              className="font-expanded font-extrabold tracking-wide uppercase"
            >
              {known ? "Terminer" : "Passer"}
              <Kbd className="bg-papier/15 text-papier/80">{known ? "⌘↵" : "P"}</Kbd>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
