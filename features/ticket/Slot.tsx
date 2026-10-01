"use client";

import { useId } from "react";
import { CheckIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Champ métier composé uniquement avec les contrôles shadcn.
export function Slot({
  label, shortcut, value, existing, editing, draft, error, attention,
  inputMode, placeholder, onEdit, onDraft, onCommit, onCancel, onClear, className,
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
  const id = useId();
  const valueClass = inputMode === "tel" ? "font-mono tabular-nums" : "";

  if (editing) {
    return (
      <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
        <Label htmlFor={id} className="text-xs font-semibold">{label}</Label>
        <Input
          id={id}
          autoFocus
          type={inputMode === "tel" ? "tel" : inputMode}
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
          value={draft}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          onChange={(e) => onDraft(e.target.value)}
          onBlur={() => (draft.trim() ? onCommit() : onCancel())}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); onCommit(); }
            else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onCancel(); }
          }}
          className={cn("h-11 sm:h-10", valueClass)}
        />
        <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
          {error ?? "Entrée pour valider · Échap pour annuler"}
        </p>
      </div>
    );
  }

  if (existing && !value) {
    return (
      <Card className={cn("gap-1 border-link/30 bg-link-subtle px-3 py-3", className)}>
        <span className="text-xs font-semibold">{label}</span>
        <span className={cn("truncate text-sm", valueClass)} title={existing}>{existing}</span>
        <span className="text-xs text-muted-foreground">Déjà enregistré dans Notion</span>
      </Card>
    );
  }

  if (value) {
    return (
      <Card className={cn("gap-1 px-3 py-3", className)}>
        <span className="text-xs font-semibold">{label}</span>
        <div className="flex min-w-0 items-center gap-2">
          <CheckIcon className="size-4 shrink-0 text-success" aria-hidden />
          <Button variant="link" size="sm" onClick={onEdit} className={cn("min-w-0 flex-1 justify-start overflow-hidden px-0 text-left", valueClass)} title={value}>
            <span className="truncate">{value}</span>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label={`Effacer ${label}`} className="shrink-0">
            <XIcon />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={onEdit}
      className={cn("flex h-auto min-h-20 w-full flex-col items-stretch gap-2 px-3 py-3 text-left", attention && "border-attention bg-attention-subtle", className)}
    >
      <span className="text-xs font-semibold">{label}</span>
      <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
        <PlusIcon className="size-4" aria-hidden />
        À trouver
        <Kbd className="ml-auto">{shortcut}</Kbd>
      </span>
    </Button>
  );
}
