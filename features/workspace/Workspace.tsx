"use client";

import Link from "next/link";
import { ChevronLeftIcon, MaximizeIcon, MinimizeIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Queue } from "@/lib/types";
import { cn } from "@/lib/utils";
import { QueueFiltersPanel, QueueFiltersPills, QueueSearch } from "@/features/queue/QueueFilters";
import { QueueList } from "@/features/queue/QueueList";
import { useGarageQueue } from "@/features/queue/useGarageQueue";
import { Ticket, type TicketHandle } from "@/features/ticket/Ticket";
import { usePendingCommits } from "@/features/ticket/usePendingCommits";
import { coordonneesFromPayload, type ExitKind, type Saisie } from "@/lib/domain/prospection-rules";
import type { UpdateGaragePayload } from "@/lib/types";
import { OperatorGate, OperatorPicker } from "@/features/operator/OperatorPicker";
import { useOperator } from "@/features/operator/useOperator";
import { useFullscreen } from "./useFullscreen";
import { SHORTCUT_LEGEND, useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useIsDesktop } from "./useMediaQuery";
import { DayCounter, StatsStrip } from "@/features/stats/StatsStrip";
import { useStats } from "@/features/stats/useStats";
import type { LiveStats } from "@/lib/domain/stats";

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
  { value: "a-verifier-rgpd", label: "RGPD" },
];

function queueCount(live: LiveStats, queue: Queue): number {
  if (queue === "nouveaux") return live.restants;
  if (queue === "a-verifier-rgpd") return live.aVerifierRgpd;
  return live.aCompleter;
}

export function Workspace() {
  const queue = useGarageQueue();
  const isDesktop = useIsDesktop();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [restored, setRestored] = useState<{ id: string; saisie: Saisie } | null>(null);
  const { operator, setOperator, ready } = useOperator();
  const fullscreen = useFullscreen();
  const stats = useStats();

  // Sur desktop, le ticket s'ouvre sans quitter la liste : premier garage par défaut.
  const selectedIndex = queue.garages.findIndex((g) => g.id === selectedId);
  const index = selectedIndex >= 0 ? selectedIndex : isDesktop && queue.garages.length > 0 ? 0 : -1;
  const garage = index >= 0 ? queue.garages[index] : null;
  const ticketOpen = garage !== null && (isDesktop || selectedIndex >= 0);
  const ticketRef = useRef<TicketHandle | null>(null);

  const pending = usePendingCommits({
    operator,
    onRestore: (entry) => {
      queue.restore(entry.garage, entry.index);
      setSelectedId(entry.garage.id);
      const { telephone, email, siteWeb } = entry.payload ?? {};
      setRestored({ id: entry.garage.id, saisie: { telephone, email, siteWeb } });
    },
    onSent: (entry) => {
      stats.record(entry, operator);
      // « Passer » ne retire pas la fiche de la file : on répercute l'écriture
      // confirmée pour que ses emplacements ne semblent pas vides au survol suivant.
      if (entry.kind === "passer") queue.patchLocal(entry.garage.id, coordonneesFromPayload(entry.payload));
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

  const move = (delta: number) => {
    const target = queue.garages[Math.max(0, Math.min(queue.garages.length - 1, (index < 0 ? -1 : index) + delta))];
    if (target) setSelectedId(target.id);
    if (delta > 0 && index >= queue.garages.length - 3) queue.loadMore();
  };

  useKeyboardShortcuts({
    j: () => move(1),
    ArrowDown: () => move(1),
    k: () => move(-1),
    ArrowUp: () => move(-1),
    c: () => ticketRef.current?.launchSearch(),
    t: () => ticketRef.current?.edit("telephone"),
    e: () => ticketRef.current?.edit("email"),
    w: () => ticketRef.current?.edit("siteWeb"),
    "Mod+Enter": () => ticketRef.current?.terminer(),
    n: () => {
      if (!ticketRef.current?.answer(false)) ticketRef.current?.rienTrouve();
    },
    o: () => ticketRef.current?.answer(true),
    p: () => ticketRef.current?.passer(),
    u: () => pending.undo(),
    f: () => fullscreen.toggle(),
    "/": () => document.querySelector<HTMLInputElement>("[data-shortcut-search]")?.focus(),
    Escape: () => {
      if (ticketRef.current?.cancel()) return;
      if (!isDesktop) setSelectedId(null);
    },
  });

  const fullscreenButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={fullscreen.toggle} aria-label="Plein écran">
          {fullscreen.active ? <MinimizeIcon /> : <MaximizeIcon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Plein écran <Kbd>F</Kbd>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="grid h-dvh grid-cols-[minmax(0,1fr)] overflow-hidden lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1.3fr)]">
      <aside className="hidden min-h-0 flex-col gap-8 overflow-y-auto trait-r border-encre px-5 py-5 lg:flex">
        <Logo />
        <section className="flex flex-col gap-2">
          <h2 className="etiquette text-mute">Au poste</h2>
          <OperatorPicker operator={operator} onChange={setOperator} />
        </section>
        <QueueFiltersPanel params={queue.params} update={queue.updateParams} />
        <div className="mt-auto flex flex-col gap-5">
          <DayCounter live={stats.live} />
          <details className="group">
            <summary className="etiquette cursor-pointer list-none text-mute hover:text-encre">Raccourcis ▸</summary>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[11.5px]">
              {SHORTCUT_LEGEND.map(([k, label]) => (
                <div key={k} className="contents">
                  <dt>
                    <Kbd>{k}</Kbd>
                  </dt>
                  <dd className="text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </details>
          <Link href="/atelier" className="etiquette text-mute hover:text-encre">
            Atelier →
          </Link>
        </div>
      </aside>

      <section
        className={cn("flex min-h-0 flex-col lg:trait-r lg:border-encre", ticketOpen && !isDesktop && "hidden")}
        aria-label="File de garages"
      >
        <div className="flex min-w-0 flex-col gap-3 trait-b border-encre px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Logo />
            <div className="w-36">
              <OperatorPicker operator={operator} onChange={setOperator} />
            </div>
            <Link href="/atelier" className="etiquette text-mute">
              Atelier →
            </Link>
          </div>
          <StatsStrip live={stats.live} error={stats.error} />
          <Tabs value={queue.params.queue} onValueChange={(v) => queue.updateParams({ queue: v as Queue })} className="min-w-0">
            <TabsList
              variant="line"
              className="h-9 w-full min-w-0 justify-start gap-4 overflow-x-auto p-0 [scrollbar-width:none]"
            >
              {QUEUES.map((q) => (
                <TabsTrigger
                  key={q.value}
                  value={q.value}
                  className="flex-none px-0 font-expanded text-[13px] font-extrabold tracking-wide uppercase"
                >
                  {q.label}
                  {stats.live && (
                    <span className="font-mono text-[11px] font-medium text-mute tabular-nums">
                      {queueCount(stats.live, q.value)}
                    </span>
                  )}
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
            initialSaisie={restored?.id === garage.id ? restored.saisie : undefined}
            toolbar={
              isDesktop ? (
                fullscreenButton
              ) : (
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

      {ready && operator === null && <OperatorGate onChange={setOperator} />}
    </div>
  );
}
