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
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import type { LiveStats } from "@/lib/domain/stats";

function Logo() {
  return (
    <Link href="/" className="text-[17px] font-semibold tracking-[-0.03em] text-foreground">
      Goparo<span className="text-link">.</span>
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
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-card px-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Logo />
          <span className="hidden border-l pl-3 text-sm text-muted-foreground sm:inline">Prospection</span>
        </div>
        <nav aria-label="Navigation principale" className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="text-foreground">
            <Link href="/atelier">Tableau de bord</Link>
          </Button>
          <ThemeToggle />
          <span className="hidden lg:inline-flex">{fullscreenButton}</span>
        </nav>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[220px_minmax(320px,0.9fr)_minmax(0,1.3fr)]">
        <aside className="hidden min-h-0 flex-col gap-6 overflow-y-auto border-r bg-sidebar px-4 py-5 lg:flex">
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold text-muted-foreground">Qui travaille ?</h2>
            <OperatorPicker operator={operator} onChange={setOperator} />
          </section>
          <QueueFiltersPanel params={queue.params} update={queue.updateParams} />
          <div className="mt-auto flex flex-col gap-5 border-t pt-5">
            <DayCounter live={stats.live} />
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">Raccourcis clavier</summary>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 text-xs">
                {SHORTCUT_LEGEND.map(([k, label]) => (
                  <div key={k} className="contents">
                    <dt><Kbd>{k}</Kbd></dt>
                    <dd className="text-muted-foreground">{label}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </div>
        </aside>

        <section
          className={cn("flex min-h-0 flex-col border-r bg-background", ticketOpen && !isDesktop && "hidden")}
          aria-label="File de garages"
        >
          <div className="flex min-w-0 flex-col gap-4 border-b px-4 py-4">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <h1 className="text-base font-semibold">File de prospection</h1>
              <div className="w-36 shrink-0"><OperatorPicker operator={operator} onChange={setOperator} /></div>
            </div>
            <StatsStrip live={stats.live} error={stats.error} />
            <Tabs value={queue.params.queue} onValueChange={(v) => queue.updateParams({ queue: v as Queue })} className="min-w-0">
              <TabsList
                variant="line"
                className="w-full min-w-0 touch-pan-x justify-start gap-4 overflow-x-auto overflow-y-hidden border-b p-0 pb-[5px] [scrollbar-width:none] group-data-horizontal/tabs:h-11 sm:group-data-horizontal/tabs:h-[38px]"
              >
                {QUEUES.map((q) => (
                  <TabsTrigger key={q.value} value={q.value} className="flex-none px-1 text-sm font-medium">
                    {q.label}
                    {stats.live && <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">{queueCount(stats.live, q.value)}</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <QueueSearch value={queue.params.q} onChange={(q) => queue.updateParams({ q })} />
            <div className="lg:hidden"><QueueFiltersPills params={queue.params} update={queue.updateParams} /></div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <QueueList queue={queue} selectedId={garage?.id ?? null} onSelect={setSelectedId} />
          </div>
        </section>

        <main className={cn("min-h-0 overflow-y-auto bg-inset", !ticketOpen && "hidden lg:block")} aria-label="Fiche garage">
          {garage ? (
            <Ticket
              key={garage.id}
              garage={garage}
              number={queue.numberOf(garage.id)}
              onExit={handleExit}
              handleRef={ticketRef}
              initialSaisie={restored?.id === garage.id ? restored.saisie : undefined}
              toolbar={isDesktop ? fullscreenButton : (
                <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                  <ChevronLeftIcon /> Liste
                </Button>
              )}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <p className="text-sm text-muted-foreground">{queue.loading ? "Chargement…" : "Sélectionnez un garage dans la file."}</p>
            </div>
          )}
        </main>
      </div>

      {ready && operator === null && <OperatorGate onChange={setOperator} />}
    </div>
  );
}
