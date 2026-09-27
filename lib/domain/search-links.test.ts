import { describe, expect, it } from "vitest";
import type { Garage } from "../types";
import { buildAiSearchUrl, buildSearchLinks, buildSearchPrompt, getNomAffiche } from "./search-links";

function garage(over: Partial<Garage> = {}): Garage {
  return {
    id: "g1", nom: "Garage Dupont", enseigne: "", adresse: "12 rue des Lilas", commune: "Villeurbanne", cp: 69100,
    dirigeant: "D", segment: null, franchiseSuspectee: null, telephone: null, email: null, siteWeb: null,
    telNonTrouve: false, emailNonTrouve: false, siren: null, effectif: null, naf: null, dateCreation: null,
    statutActivite: null, prospectionActive: null, notesIa: "", scorePriorite: null, traiteLe: null, traitePar: null,
    ...over,
  };
}

describe("buildAiSearchUrl", () => {
  it("ouvre le mode IA (udm=50) avec le prompt comme requête", () => {
    const g = garage();
    const url = buildAiSearchUrl(g);
    expect(url).toBe(`https://www.google.com/search?udm=50&q=${encodeURIComponent(buildSearchPrompt(g))}`);
  });

  it("le prompt contient le nom affiché et la commune", () => {
    const g = garage({ enseigne: "Dupont Auto" });
    expect(buildAiSearchUrl(g)).toContain(encodeURIComponent(getNomAffiche(g)));
    expect(buildAiSearchUrl(g)).toContain(encodeURIComponent("Villeurbanne"));
  });
});

describe("buildSearchLinks", () => {
  it("garde un lien Google classique séparé (requête courte, sans udm=50)", () => {
    const google = buildSearchLinks(garage()).find((l) => l.id === "google");
    expect(google?.url).not.toContain("udm=50");
    expect(google?.url).toContain("google.com/search?q=");
  });
});
