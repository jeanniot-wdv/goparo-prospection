import { describe, expect, it } from "vitest";
import { PRIORITY_MAX, computePriority, priorityTier } from "./priority";

const base = { segment: null, effectif: null, enseigne: "", dateCreation: null } as const;

describe("computePriority", () => {
  it("0 sans aucune information", () => {
    expect(computePriority(base)).toBe(0);
  });
  it("score maximal", () => {
    expect(
      computePriority({ segment: "structure_employeuse", effectif: "03", enseigne: "Garage X", dateCreation: "2010-05-01" }),
    ).toBe(PRIORITY_MAX);
  });
  it("barème effectif", () => {
    expect(computePriority({ ...base, effectif: "02" })).toBe(2);
    expect(computePriority({ ...base, effectif: "01" })).toBe(1);
    expect(computePriority({ ...base, effectif: "NN" })).toBe(0);
  });
  it("création récente pénalisée, 2024 neutre", () => {
    expect(computePriority({ ...base, dateCreation: "2025-01-10" })).toBe(-2);
    expect(computePriority({ ...base, dateCreation: "2026-03-01" })).toBe(-2);
    expect(computePriority({ ...base, dateCreation: "2024-06-01" })).toBe(0);
  });
  it("enseigne vide (espaces) ne compte pas", () => {
    expect(computePriority({ ...base, enseigne: "  " })).toBe(0);
  });
});

describe("priorityTier", () => {
  it.each([
    [9, "haute"], [6, "haute"],
    [5, "moyenne"], [1, "moyenne"],
    [0, "basse"], [-2, "basse"],
  ] as const)("%i → %s", (score, tier) => {
    expect(priorityTier(score)).toBe(tier);
  });
});
