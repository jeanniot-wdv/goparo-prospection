"use client";

import { useEffect } from "react";
import { SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { availableExits, resolveExit, type ExitKind, type Saisie } from "@/lib/domain/prospection-rules";
import { buildAiSearchUrl, buildSearchPrompt } from "@/lib/domain/search-links";
import type { Garage, UpdateGaragePayload } from "@/lib/types";
import { CloseGarageAction, ExitBar } from "./ExitBar";
import { SearchLinks } from "./SearchLinks";
import { Slot } from "./Slot";
import { TicketHeader } from "./TicketHeader";
import { useTicket, type SlotKey } from "./useTicket";

export interface TicketHandle {
  launchSearch: () => void;
  edit: (slot: SlotKey) => void;
  terminer: () => void;
  rienTrouve: () => void;
  passer: () => void;
  answer: (oui: boolean) => boolean;
  cancel: () => boolean;
}

export function Ticket({
  garage,
  number,
  toolbar,
  onExit,
  handleRef,
  initialSaisie,
}: {
  garage: Garage;
  number: string;
  toolbar?: React.ReactNode;
  onExit: (kind: ExitKind, payload: UpdateGaragePayload | null) => void;
  handleRef?: React.RefObject<TicketHandle | null>;
  // Saisie remise en place après « Annuler ».
  initialSaisie?: Saisie;
}) {
  const { state, dispatch, fiche } = useTicket(garage, initialSaisie);

  const exit = (kind: ExitKind) => {
    if (state.exiting) return;
    const payload = resolveExit(kind, fiche);
    if (kind === "passer") return onExit(kind, payload);
    dispatch({ type: "exit", kind });
    onExit(kind, payload);
  };

  const terminer = () => {
    const [first] = availableExits(fiche);
    if (first === "complet") exit("complet");
    else if (first === "email-introuvable") dispatch({ type: "ask", slot: "email" });
    else if (first === "tel-introuvable") dispatch({ type: "ask", slot: "telephone" });
  };

  const launchSearch = async () => {
    // Clic sur un lien plutôt que window.open : les navigateurs de bureau le bloquaient (null).
    // Réutiliser un onglet est impossible : Google l'isole (COOP), le nom de cible est perdu.
    const link = document.createElement("a");
    link.href = buildAiSearchUrl(garage);
    link.target = "_blank";
    link.click();
    try {
      await navigator.clipboard.writeText(buildSearchPrompt(garage));
      toast.success("Prompt copié, recherche IA ouverte");
    } catch {
      toast("Recherche IA ouverte", { description: "Presse-papier indisponible" });
    }
  };

  const handle: TicketHandle = {
    launchSearch,
    edit: (slot) => {
      if (slot === "telephone" && garage.telephone) return;
      dispatch({ type: "edit", slot });
    },
    terminer,
    rienTrouve: () => {
      const [first] = availableExits(fiche);
      if (first === "aucune") exit("aucune");
      else terminer();
    },
    passer: () => exit("passer"),
    answer: (oui) => {
      if (!state.ask) return false;
      if (oui) dispatch({ type: "edit", slot: state.ask });
      else exit(state.ask === "email" ? "email-introuvable" : "tel-introuvable");
      return true;
    },
    cancel: () => {
      if (state.ask) {
        dispatch({ type: "dismissAsk" });
        return true;
      }
      return false;
    },
  };
  useEffect(() => {
    if (handleRef) handleRef.current = handle;
  });

  const slotProps = (slot: SlotKey) => ({
    value: state.saisie[slot],
    editing: state.editing === slot,
    draft: state.draft,
    error: state.editing === slot ? state.error : null,
    attention: state.ask === slot,
    onEdit: () => handle.edit(slot),
    onDraft: (value: string) => dispatch({ type: "draft", value }),
    onCommit: () => dispatch({ type: "commit" }),
    onCancel: () => dispatch({ type: "cancel" }),
    onClear: () => dispatch({ type: "clear", slot }),
  });

  return (
    <div className="flex min-h-full flex-col">
      <article
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-5 sm:gap-6 sm:px-6 lg:gap-7 lg:px-8 lg:py-7"
      >
        <TicketHeader garage={garage} number={number} toolbar={toolbar} />

        <div className="flex flex-col gap-3 rounded-md border bg-card p-4">
          <h2 className="text-sm font-semibold">Rechercher les coordonnées</h2>
          <Button size="xl" onClick={launchSearch} disabled={Boolean(state.exiting)} className="w-full">
            <SearchIcon className="size-4" />
            Lancer la recherche IA
            <Kbd className="ml-1 bg-primary-foreground/15 text-primary-foreground">C</Kbd>
          </Button>
          <SearchLinks garage={garage} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Slot
            label="Tél."
            shortcut="T"
            inputMode="tel"
            placeholder="03 88 12 34 56"
            existing={garage.telephone}
            {...slotProps("telephone")}
          />
          <Slot
            label="Email"
            shortcut="E"
            inputMode="email"
            placeholder="contact@garage.fr"
            existing={garage.email}
            {...slotProps("email")}
          />
          <Slot
            label="Site"
            shortcut="W"
            inputMode="url"
            placeholder="garage-dupont.fr"
            existing={garage.siteWeb}
            className="sm:col-span-2"
            {...slotProps("siteWeb")}
          />
        </div>

        <div className="mt-auto flex justify-center pt-2 lg:hidden">
          <CloseGarageAction onClose={() => exit("ferme")} disabled={Boolean(state.exiting)} compact />
        </div>
      </article>

      <ExitBar
        fiche={fiche}
        ask={state.ask}
        disabled={Boolean(state.exiting)}
        onTerminer={terminer}
        onRienTrouve={() => exit("aucune")}
        onPasser={() => exit("passer")}
        onAskOui={() => handle.answer(true)}
        onAskNon={() => handle.answer(false)}
        onFerme={() => exit("ferme")}
      />
    </div>
  );
}
