import { describe, expect, it } from "vitest";
import { PRIORITY_FORMULA } from "@/lib/domain/priority";
import { PRIORITY_FORMULA as SCRIPT_FORMULA, planMigration } from "./notion-migrate.mjs";

describe("notion-migrate", () => {
  it("la formule du script est celle de lib/domain/priority.ts", () => {
    expect(SCRIPT_FORMULA).toBe(PRIORITY_FORMULA);
  });
  it("crée les trois propriétés sur un schéma vierge", () => {
    expect(Object.keys(planMigration({}).changes)).toEqual(["traite_le", "traite_par", "score_priorite"]);
  });
  it("est idempotent", () => {
    const existing = {
      traite_le: { type: "date" },
      traite_par: { type: "select", select: { options: [{ name: "Hiba" }, { name: "Romain" }] } },
      score_priorite: { type: "formula", formula: { expression: "…" } },
    };
    expect(planMigration(existing)).toEqual({ changes: {}, log: [] });
  });
  it("complète les options manquantes sans supprimer les autres", () => {
    const { changes } = planMigration({
      traite_le: { type: "date" },
      traite_par: { type: "select", select: { options: [{ name: "Hiba", id: "x" }, { name: "Autre" }] } },
      score_priorite: { type: "formula" },
    });
    expect(changes.traite_par.select.options.map((o: { name: string }) => o.name)).toEqual(["Hiba", "Autre", "Romain"]);
  });
  it("refuse un type inattendu", () => {
    expect(() => planMigration({ traite_le: { type: "rich_text" } })).toThrow();
  });
});
