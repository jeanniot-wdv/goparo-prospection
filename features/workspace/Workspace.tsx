"use client";

import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Queue } from "@/lib/types";
import { cn } from "@/lib/utils";
import { QueueFiltersPanel, QueueFiltersPills, QueueSearch } from "@/features/queue/QueueFilters";
import { QueueList } from "@/features/queue/QueueList";
import { useGarageQueue } from "@/features/queue/useGarageQueue";
import { Ticket, type TicketHandle } from "@/features/ticket/Ticket";
import { usePendingCommits } from "@/features/ticket/usePendingCommits";
import type { ExitKind } from "@/lib/domain/prospection-rules";
import type { UpdateGaragePayload } from "@/lib/types";
import { useIsDesktop } from "./useMediaQuery";

function Logo() {
  return (
    <Link href="/" className="font-expanded text-[17px] leading-none font-black tracking-tight uppercase">
      Goparo<span className="text-signal">.</span>
    </Link>
  );
}

const QUEUES: { value: Queue; label: string }[] = [
  { value: "nouveaux", label: "Nouveaux" },
  { value: "a-completer", label: "À compléter" },
];

export function Workspace() {
  const queue = useGarageQueue();
  const isDesktop = useIsDesktop();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sur desktop, le ticket s'ouvre sans quitter la liste : premier garage par défaut.
  const selectedIndex = queue.garages.findIndex((g) => g.id === selectedId);
  const index = selectedIndex >= 0 ? selectedIndex : isDesktop && queue.garages.length > 0 ? 0 : -1;
  const garage = index >= 0 ? queue.garages[index] : null;
  const ticketOpen = garage !== null && (isDesktop || selectedIndex >= 0);
  const ticketRef = useRef<TicketHandle | null>(null);

  const pending = usePendingCommits({
    operator: null,
    onRestore: (entry) => {
      queue.restore(entry.garage, entry.index);
      setSelectedId(entry.garage.id);
    },
  });

  // Sortie d'un ticket : écriture différée (annulable), la fiche quitte la file
  // tout de suite et on enchaîne sur la suivante.
  const handleExit = (kind: ExitKind, payload: UpdateGaragePayload | null) => {
    if (!garage) return;
    const next = queue.garages[index + 1] ?? queue.garages[index - 1] ?? null;
    pending.schedule({ garage, index, kind, payload });
    if (kind !== "passer") queue.remove(garage.id);
    setSelectedId(next?.id ?? null);
  };

  return (
    <div className="grid h-dvh grid-cols-[minmax(0,1fr)] overflow-hidden lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1.3fr)]">
      <aside className="hidden min-h-0 flex-col gap-8 overflow-y-auto trait-r border-encre px-5 py-5 lg:flex">
        <Logo />
        <QueueFiltersPanel params={queue.params} update={queue.updateParams} />
        <div className="mt-auto">
          <Link href="/atelier" className="etiquette text-mute hover:text-encre">
            Atelier →
          </Link>
        </div>
      </aside>

      <section
        className={cn("flex min-h-0 flex-col lg:trait-r lg:border-encre", ticketOpen && !isDesktop && "hidden")}
        aria-label="File de garages"
      >
        <div className="flex flex-col gap-3 trait-b border-encre px-4 pt-4 pb-3">
          <div className="flex items-center justify-between lg:hidden">
            <Logo />
            <Link href="/atelier" className="etiquette text-mute">
              Atelier →
            </Link>
          </div>
          <Tabs value={queue.params.queue} onValueChange={(v) => queue.updateParams({ queue: v as Queue })}>
            <TabsList variant="line" className="h-9 w-full justify-start gap-4 p-0">
              {QUEUES.map((q) => (
                <TabsTrigger
                  key={q.value}
                  value={q.value}
                  className="flex-none px-0 font-expanded text-[13px] font-extrabold tracking-wide uppercase"
                >
                  {q.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <QueueSearch value={queue.params.q} onChange={(q) => queue.updateParams({ q })} />
          <div className="lg:hidden">
            <QueueFiltersPills params={queue.params} update={queue.updateParams} />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <QueueList queue={queue} selectedId={garage?.id ?? null} onSelect={setSelectedId} />
        </div>
      </section>

      <main
        className={cn("min-h-0 overflow-y-auto bg-ciment", !ticketOpen && "hidden lg:block")}
        aria-label="Ticket"
      >
        {garage ? (
          <Ticket
            key={garage.id}
            garage={garage}
            number={queue.numberOf(garage.id)}
            onExit={handleExit}
            handleRef={ticketRef}
            toolbar={
              !isDesktop && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                  <ChevronLeftIcon /> Liste
                </Button>
              )
            }
          />
        ) : (
          <div className="hachures flex h-full items-center justify-center p-10">
            <p className="font-expanded text-xl font-black text-mute uppercase">
              {queue.loading ? "Chargement…" : "Aucun ticket"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
