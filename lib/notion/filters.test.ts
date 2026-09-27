import { describe, expect, it } from "vitest";
import { DEFAULT_QUEUE_PARAMS, buildQueueFilter, parseQueueParams, toSearchParams } from "./filters";

// Profondeur d'imbrication des groupes and/or (Notion : 2 maximum).
function depth(node: unknown): number {
  if (!node || typeof node !== "object") return 0;
  const group = (node as { and?: unknown[]; or?: unknown[] }).and ?? (node as { or?: unknown[] }).or;
  return group ? 1 + Math.max(0, ...group.map(depth)) : 0;
}

describe("buildQueueFilter", () => {
  it("file nouveaux : aucune coordonnée, aucune case cochée, franchises masquées", () => {
    expect(buildQueueFilter(DEFAULT_QUEUE_PARAMS).and).toEqual([
      { property: "telephone", phone_number: { is_empty: true } },
      { property: "email", email: { is_empty: true } },
      { property: "tel_non_trouve", checkbox: { equals: false } },
      { property: "email_non_trouve", checkbox: { equals: false } },
      { property: "franchise_suspectee", select: { does_not_equal: "oui" } },
    ]);
  });

  it("file à compléter : tél. connu, email vide, À enrichir, jamais traité", () => {
    const { and } = buildQueueFilter({ ...DEFAULT_QUEUE_PARAMS, queue: "a-completer", hideFranchise: false });
    expect(and).toEqual([
      { property: "telephone", phone_number: { is_not_empty: true } },
      { property: "email", email: { is_empty: true } },
      { property: "Prospection_active", select: { equals: "À enrichir" } },
      { property: "traite_le", date: { is_empty: true } },
    ]);
  });

  it("file à vérifier (RGPD) : email personnel détecté par l'automatisation", () => {
    const { and } = buildQueueFilter({ ...DEFAULT_QUEUE_PARAMS, queue: "a-verifier-rgpd", hideFranchise: false });
    expect(and).toEqual([{ property: "Prospection_active", select: { equals: "À vérifier (RGPD)" } }]);
  });

  it("département = plage de CP", () => {
    const { and } = buildQueueFilter({ ...DEFAULT_QUEUE_PARAMS, dept: "57" });
    expect(and).toContainEqual({ property: "CP", number: { greater_than_or_equal_to: 57000 } });
    expect(and).toContainEqual({ property: "CP", number: { less_than_or_equal_to: 57999 } });
  });

  it("recherche en or sur Nom / enseigne / commune, dans la limite de 2 niveaux", () => {
    const filter = buildQueueFilter({ ...DEFAULT_QUEUE_PARAMS, q: "dupont", enseigneOnly: true, segment: "solo_non_employeur" });
    expect(filter.and.at(-1)).toEqual({
      or: [
        { property: "Nom", title: { contains: "dupont" } },
        { property: "enseigne", rich_text: { contains: "dupont" } },
        { property: "commune", rich_text: { contains: "dupont" } },
      ],
    });
    expect(depth(filter)).toBe(2);
  });
});

describe("parseQueueParams", () => {
  it("valeurs par défaut : enseigne uniquement désactivé", () => {
    expect(parseQueueParams(new URLSearchParams())).toEqual(DEFAULT_QUEUE_PARAMS);
    expect(DEFAULT_QUEUE_PARAMS.enseigneOnly).toBe(false);
  });
  it("ignore les valeurs inconnues", () => {
    const p = parseQueueParams(new URLSearchParams("queue=x&dept=75&segment=y"));
    expect(p).toMatchObject({ queue: "nouveaux", dept: "all", segment: null });
  });
  it("aller-retour avec toSearchParams", () => {
    const params = { ...DEFAULT_QUEUE_PARAMS, queue: "a-completer" as const, dept: "67" as const, q: "auto" };
    expect(parseQueueParams(toSearchParams(params))).toEqual(params);
  });
});
