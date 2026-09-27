import { describe, expect, it } from "vitest";
import { mapPageToGarage, type NotionPage } from "./mapper";

const page: NotionPage = {
  id: "abc",
  properties: {
    Nom: { type: "title", title: [{ plain_text: "GARAGE " }, { plain_text: "DUPONT" }] },
    enseigne: { type: "rich_text", rich_text: [{ plain_text: "Dupont Auto" }] },
    adresse: { type: "rich_text", rich_text: [] },
    commune: { type: "rich_text", rich_text: [{ plain_text: "Strasbourg" }] },
    CP: { type: "number", number: 67000 },
    segment: { type: "select", select: { name: "structure_employeuse" } },
    telephone: { type: "phone_number", phone_number: "+33 3 88 12 34 56" },
    email: { type: "email", email: null },
    tel_non_trouve: { type: "checkbox", checkbox: false },
    email_non_trouve: { type: "checkbox", checkbox: true },
    siren: { type: "number", number: 12345678 },
    effectif: { type: "select", select: { name: "02" } },
    naf: { type: "select", select: { name: "45.20A" } },
    date_creation: { type: "date", date: { start: "2012-04-01" } },
    Prospection_active: { type: "select", select: { name: "À enrichir" } },
    score_priorite: { type: "formula", formula: { type: "number", number: 8 } },
    traite_le: { type: "date", date: null },
    traite_par: { type: "select", select: { name: "Hiba" } },
  },
};

describe("mapPageToGarage", () => {
  const g = mapPageToGarage(page);

  it("concatène les textes et lit les nombres", () => {
    expect(g.nom).toBe("GARAGE DUPONT");
    expect(g.enseigne).toBe("Dupont Auto");
    expect(g.adresse).toBe("");
    expect(g.cp).toBe(67000);
  });
  it("remet les zéros de tête du SIREN", () => {
    expect(g.siren).toBe("012345678");
  });
  it("lit selects, dates, formule et cases", () => {
    expect(g.effectif).toBe("02");
    expect(g.naf).toBe("45.20A");
    expect(g.dateCreation).toBe("2012-04-01");
    expect(g.prospectionActive).toBe("À enrichir");
    expect(g.scorePriorite).toBe(8);
    expect(g.traiteLe).toBeNull();
    expect(g.traitePar).toBe("Hiba");
    expect(g.emailNonTrouve).toBe(true);
  });
  it("propriétés absentes → valeurs neutres", () => {
    expect(g.dirigeant).toBe("");
    expect(g.siteWeb).toBeNull();
    expect(g.statutActivite).toBeNull();
    expect(g.franchiseSuspectee).toBeNull();
  });
});
