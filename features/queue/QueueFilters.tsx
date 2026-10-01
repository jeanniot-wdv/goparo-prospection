"use client";

import { useEffect, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toggle } from "@/components/ui/toggle";
import type { QueueParams } from "@/lib/notion/filters";
import type { Dept, Segment } from "@/lib/types";

type Update = (patch: Partial<QueueParams>) => void;

const SEGMENTS: { value: Segment | "all"; label: string; court: string }[] = [
  { value: "all", label: "Tous", court: "Tous" },
  { value: "structure_employeuse", label: "Structure employeuse", court: "Employeuse" },
  { value: "solo_non_employeur", label: "Solo non employeur", court: "Solo" },
];

const DEPTS: { value: Dept; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "67", label: "67 · Bas-Rhin" },
  { value: "57", label: "57 · Moselle" },
  { value: "54", label: "54 · Meurthe-et-M." },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function RadioList<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as T)} className="gap-1.5">
      {options.map((o) => (
        <div key={o.value} className="flex items-center gap-2">
          <RadioGroupItem value={o.value} id={`${name}-${o.value}`} />
          <Label htmlFor={`${name}-${o.value}`} className="text-sm font-normal">
            {o.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

function CheckRow({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id} className="text-sm font-normal">
        {children}
      </Label>
    </div>
  );
}

// Colonne de filtres du poste de travail.
export function QueueFiltersPanel({ params, update }: { params: QueueParams; update: Update }) {
  return (
    <div className="flex flex-col gap-5">
      <Section title="Segment">
        <RadioList
          name="segment"
          value={params.segment ?? "all"}
          options={SEGMENTS}
          onChange={(v) => update({ segment: v === "all" ? null : v })}
        />
      </Section>
      <Section title="Département">
        <RadioList name="dept" value={params.dept} options={DEPTS} onChange={(dept) => update({ dept })} />
      </Section>
      <Section title="Filtres">
        <CheckRow id="f-franchise" checked={params.hideFranchise} onChange={(hideFranchise) => update({ hideFranchise })}>
          Masquer franchises
        </CheckRow>
        <CheckRow id="f-enseigne" checked={params.enseigneOnly} onChange={(enseigneOnly) => update({ enseigneOnly })}>
          Enseigne uniquement
        </CheckRow>
      </Section>
    </div>
  );
}

function Pill({ pressed, onChange, children }: { pressed: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <Toggle
      size="sm"
      variant="outline"
      pressed={pressed}
      onPressedChange={onChange}
      className="h-10 shrink-0 rounded-full border border-border bg-card px-3 text-xs font-medium sm:h-9 data-[state=on]:border-link/30 data-[state=on]:bg-link-subtle data-[state=on]:text-link"
    >
      {children}
    </Toggle>
  );
}

// Version mobile : une rangée de pastilles défilable horizontalement.
export function QueueFiltersPills({ params, update }: { params: QueueParams; update: Update }) {
  return (
    <div className="-mx-4 flex touch-pan-x gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {DEPTS.map((d) => (
        <Pill key={d.value} pressed={params.dept === d.value} onChange={() => update({ dept: d.value })}>
          {d.value === "all" ? "Tous dép." : d.value}
        </Pill>
      ))}
      <span aria-hidden className="mx-1 w-px shrink-0 bg-border" />
      {SEGMENTS.filter((s) => s.value !== "all").map((s) => (
        <Pill
          key={s.value}
          pressed={params.segment === s.value}
          onChange={(on) => update({ segment: on ? (s.value as Segment) : null })}
        >
          {s.court}
        </Pill>
      ))}
      <span aria-hidden className="mx-1 w-px shrink-0 bg-border" />
      <Pill pressed={params.hideFranchise} onChange={(hideFranchise) => update({ hideFranchise })}>
        Sans franchises
      </Pill>
      <Pill pressed={params.enseigneOnly} onChange={(enseigneOnly) => update({ enseigneOnly })}>
        Avec enseigne
      </Pill>
    </div>
  );
}

// Recherche Nom / enseigne / commune, envoyée 300 ms après la dernière frappe.
export function QueueSearch({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (draft.trim() === value) return;
    const t = setTimeout(() => onChange(draft.trim()), 300);
    return () => clearTimeout(t);
  }, [draft, value, onChange]);

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && (e.currentTarget.blur(), setDraft(""))}
        placeholder="Nom, enseigne, commune…"
        aria-label="Rechercher un garage"
        data-shortcut-search
        className="h-10 bg-card pl-9 text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft("")}
          aria-label="Effacer la recherche"
          className="absolute top-1/2 right-2 flex size-8 items-center justify-center rounded-md -translate-y-1/2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
