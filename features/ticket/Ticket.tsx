"use client";

import { useEffect, useRef } from "react";
import { SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { availableExits, resolveExit, type ExitKind } from "@/lib/domain/prospection-rules";
import { buildSearchLinks, buildSearchPrompt } from "@/lib/domain/search-links";
import type { Garage, UpdateGaragePayload } from "@/lib/types";
import { ExitBar } from "./ExitBar";
import { HoldButton } from "./HoldButton";
import { SearchLinks } from "./SearchLinks";
import { Slot } from "./Slot";
import { Stamp } from "./Stamp";
import { TicketHeader } from "./TicketHeader";
import { useTicket, type SlotKey } from "./useTicket";

// Durée pendant laquelle le tampon reste visible avant que le ticket ne quitte la file.
const STAMP_MS = 650;

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
}: {
  garage: Garage;
  number: string;
  toolbar?: React.ReactNode;
  onExit: (kind: ExitKind, payload: UpdateGaragePayload | null) => void;
  handleRef?: React.RefObject<TicketHandle | null>;
}) {
  const { state, dispatch, fiche } = useTicket(garage);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
  }, []);

  const exit = (kind: ExitKind) => {
    if (state.exiting) return;
    const payload = resolveExit(kind, fiche);
    if (kind === "passer") return onExit(kind, payload);
    dispatch({ type: "exit", kind });
    exitTimer.current = setTimeout(() => onExit(kind, payload), STAMP_MS);
  };

  const terminer = () => {
    const [first] = availableExits(fiche);
    if (first === "complet") exit("complet");
    else if (first === "email-introuvable") dispatch({ type: "ask", slot: "email" });
    else if (first === "tel-introuvable") dispatch({ type: "ask", slot: "telephone" });
  };

  const launchSearch = async () => {
    const google = buildSearchLinks(garage).find((l) => l.id === "google");
    window.open(google?.url, "_blank", "noopener");
    try {
      await navigator.clipboard.writeText(buildSearchPrompt(garage));
      toast.success("Prompt copié, recherche Google ouverte");
    } catch {
      toast("Recherche Google ouverte", { description: "Presse-papier indisponible" });
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
    <div className="relative flex min-h-full flex-col">
      <article
        className={`relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-7 px-4 py-5 lg:px-10 lg:py-8 ${state.exiting ? "animate-sortie [animation-delay:450ms]" : ""}`}
      >
        <TicketHeader garage={garage} number={number} toolbar={toolbar} />

        <div className="grid gap-4 sm:grid-cols-2">
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

        <div className="flex flex-col gap-3">
          <Button size="xl" onClick={launchSearch} disabled={Boolean(state.exiting)} className="w-full">
            <SearchIcon className="size-5" strokeWidth={2.5} />
            Lancer la recherche
            <Kbd className="ml-1 bg-encre/10 text-encre/70">C</Kbd>
          </Button>
          <SearchLinks garage={garage} />
        </div>

        <div className="mt-auto flex justify-center pt-2 lg:hidden">
          <HoldButton onComplete={() => exit("ferme")} disabled={Boolean(state.exiting)}>
            Fermé définitivement <span className="font-normal text-mute">(maintenir)</span>
          </HoldButton>
        </div>

        {state.exiting && <Stamp kind={state.exiting} />}
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
