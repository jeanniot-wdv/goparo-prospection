"use client";

import { CheckIcon, PlusIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

/**
 * Emplacement d'une coordonnée. États :
 * - vide : pointillés, « à trouver » ;
 * - saisie : on tape directement dedans (↵ valide et met au format, Échap annule) ;
 * - rempli : trait plein bleu Goparo, valeur en mono ;
 * - existant : déjà dans Notion (file « À compléter »), non modifiable ici ;
 * - attention : clignote en orange quand le bandeau « trouvé ? » le désigne.
 */
export function Slot({
  label,
  shortcut,
  value,
  existing,
  editing,
  draft,
  error,
  attention,
  inputMode,
  placeholder,
  onEdit,
  onDraft,
  onCommit,
  onCancel,
  onClear,
  className,
}: {
  label: string;
  shortcut: string;
  value?: string;
  existing?: string | null;
  editing: boolean;
  draft: string;
  error: string | null;
  attention?: boolean;
  inputMode: "tel" | "email" | "url";
  placeholder: string;
  onEdit: () => void;
  onDraft: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onClear: () => void;
  className?: string;
}) {
  const legend = (
    <span className="etiquette absolute -top-[7px] left-3 bg-ciment px-1.5 leading-none">{label}</span>
  );

  if (editing) {
    return (
      <div className={cn("relative flex flex-col gap-1", className)}>
        <div className={cn("relative trait bg-papier px-3 pt-4 pb-2", error ? "border-alerte" : "border-encre")}>
          {legend}
          <Input
            autoFocus
            type={inputMode === "tel" ? "tel" : inputMode}
            inputMode={inputMode}
            autoComplete="off"
            spellCheck={false}
            value={draft}
            placeholder={placeholder}
            aria-label={label}
            aria-invalid={Boolean(error)}
            onChange={(e) => onDraft(e.target.value)}
            onBlur={() => (draft.trim() ? onCommit() : onCancel())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onCommit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
              }
            }}
            className="h-8 border-0 bg-transparent px-0 font-mono text-[15px] shadow-none focus-visible:ring-0 aria-invalid:ring-0"
          />
        </div>
        <p className={cn("font-mono text-[11px]", error ? "text-alerte" : "text-mute")}>
          {error ?? "↵ valider et mettre au format · Échap annuler"}
        </p>
      </div>
    );
  }

  if (existing && !value) {
    return (
      <div className={cn("relative trait border-marque bg-marque/5 px-3 pt-4 pb-3", className)}>
        {legend}
        <p className="truncate font-mono text-[15px] text-marque-fonce">{existing}</p>
        <p className="etiquette mt-1 text-marque/80">Déjà dans Notion</p>
      </div>
    );
  }

  if (value) {
    return (
      <div className={cn("group relative trait border-marque bg-papier", className)}>
        {legend}
        <button type="button" onClick={onEdit} className="flex w-full items-center gap-2 px-3 pt-4 pb-3 text-left">
          <CheckIcon className="size-4 shrink-0 text-marque" strokeWidth={2.5} />
          <span className="truncate font-mono text-[15px] text-marque-fonce">{value}</span>
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label={`Effacer ${label}`}
          className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-mute opacity-0 transition-opacity group-hover:opacity-100 hover:text-encre focus-visible:opacity-100"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        "group relative flex items-center justify-between gap-2 trait border-dashed border-mute/80 px-3 pt-4 pb-3 text-left transition-colors hover:border-encre hover:bg-papier/60",
        attention && "animate-clignote border-solid bg-signal/5",
        className,
      )}
    >
      {legend}
      <span className="flex items-center gap-1.5 font-mono text-[14px] text-mute group-hover:text-encre">
        <PlusIcon className="size-3.5" /> à trouver
      </span>
      <Kbd>{shortcut}</Kbd>
    </button>
  );
}
