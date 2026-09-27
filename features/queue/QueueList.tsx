"use client";

import { useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { GarageQueue } from "./useGarageQueue";
import { QueueRow } from "./QueueRow";

export function QueueList({
  queue,
  selectedId,
  onSelect,
}: {
  queue: GarageQueue;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const { loadMore } = queue;

  // « Charger plus » automatique quand le bas de la liste devient visible.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), {
      rootMargin: "240px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // La ligne active reste visible quand on navigue au clavier.
  useEffect(() => {
    if (!selectedId) return;
    document.querySelector(`[data-garage-id="${selectedId}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  if (queue.loading) {
    return (
      <div className="flex flex-col" aria-busy>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 border-b border-filet px-4 py-3">
            <Skeleton className="h-3 w-8" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
            <Skeleton className="h-3 w-7" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {queue.error && (
        <Alert variant="destructive" className="m-4 w-auto">
          <AlertDescription className="flex items-center justify-between gap-3">
            {queue.error}
            <Button size="sm" variant="outline" onClick={queue.reload}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {queue.garages.length === 0 && !queue.error ? (
        <div className="hachures m-4 flex flex-col items-center gap-1 trait border-dashed border-filet px-6 py-12 text-center">
          <p className="font-expanded text-lg font-black uppercase">File vide</p>
          <p className="text-sm text-muted-foreground">Aucun garage ne correspond à ces filtres.</p>
        </div>
      ) : (
        <ol>
          {queue.garages.map((garage) => (
            <li key={garage.id} data-garage-id={garage.id}>
              <QueueRow
                garage={garage}
                number={queue.numberOf(garage.id)}
                active={garage.id === selectedId}
                onSelect={() => onSelect(garage.id)}
              />
            </li>
          ))}
        </ol>
      )}

      <div ref={sentinel} className="flex h-14 items-center justify-center text-mute">
        {queue.loadingMore && <Spinner />}
        {!queue.hasMore && queue.garages.length > 0 && (
          <span className="etiquette text-mute">Fin de la file</span>
        )}
      </div>
    </div>
  );
}
