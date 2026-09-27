import { describe, expect, it } from "vitest";
import type { Garage } from "../types";
import { addWorkingDays, applySession, computeStats, deptOf, phoneKey } from "./stats";

let n = 0;
function garage(over: Partial<Garage> = {}): Garage {
  n++;
  return {
    id: `g${n}`, nom: `G${n}`, enseigne: "", adresse: "", commune: "X", cp: 67000, dirigeant: "D",
    segment: "solo_non_employeur", franchiseSuspectee: "non", telephone: null, email: null, siteWeb: null,
    telNonTrouve: false, emailNonTrouve: false, siren: null, effectif: "NN", naf: null, dateCreation: null,
    statutActivite: null, prospectionActive: null, notesIa: "", scorePriorite: 0, traiteLe: null, traitePar: null,
    ...over,
  };
}

describe("computeStats", () => {
  const garages = [
    garage(), // nouveau
    garage({ cp: 57100 }), // nouveau
    garage({ telephone: "+33 3 88 00 00 01", prospectionActive: "À enrichir" }), // à compléter, avant suivi
    garage({ telephone: "03 88 00 00 01", email: "a@b.fr", segment: "structure_employeuse", effectif: "02",
      prospectionActive: "À prospecter", traiteLe: "2026-09-25", traitePar: "Hiba" }),
    garage({ telNonTrouve: true, emailNonTrouve: true, cp: 75001, dirigeant: "",
      prospectionActive: "À enrichir", traiteLe: "2026-09-26", traitePar: "Romain" }),
    garage({ telephone: "+33 6 00 00 00 00", prospectionActive: "À enrichir", traiteLe: "2026-09-26", traitePar: "Romain", cp: null }),
  ];
  const s = computeStats(garages, "2026-09-26", new Date("2026-09-26T10:00:00Z"));

  it("compteurs globaux", () => {
    expect(s).toMatchObject({ total: 6, traites: 4, restants: 2, aCompleter: 1, avecEmail: 1, avecTel: 3, avantSuivi: 1 });
  });
  it("activité par jour et par personne", () => {
    expect(s.parOperateur).toEqual({ Hiba: 1, Romain: 2 });
    expect(s.parJour).toEqual([
      { date: "2026-09-25", total: 1, parOperateur: { Hiba: 1, Romain: 0 } },
      { date: "2026-09-26", total: 2, parOperateur: { Hiba: 0, Romain: 2 } },
    ]);
  });
  it("rythme et fin estimée en jours ouvrés", () => {
    expect(s.rythme).toBe(1.5);
    // 2 restants / 1,5 par jour → 2 jours ouvrés après le samedi 26 : lundi 28, mardi 29
    expect(s.finEstimee).toBe("2026-09-29");
  });
  it("taux par segment sur les fiches traitées", () => {
    expect(s.parSegment.find((r) => r.key === "structure_employeuse")).toMatchObject({ traites: 1, avecEmail: 1, avecTel: 1 });
    expect(s.parSegment.find((r) => r.key === "solo_non_employeur")).toMatchObject({ traites: 3, avecEmail: 0, avecTel: 2 });
  });
  it("départements et entonnoir", () => {
    expect(s.parDept.find((d) => d.dept === "67")).toEqual({ dept: "67", total: 3, traites: 2 });
    expect(s.entonnoir.find((e) => e.statut === "À enrichir")?.count).toBe(3);
    expect(s.entonnoir.find((e) => e.statut === "(vide)")?.count).toBe(2);
  });
  it("qualité des données", () => {
    expect(s.qualite.cpHorsZone.map((g) => g.cp)).toEqual([75001]);
    expect(s.qualite.sansCp).toBe(1);
    expect(s.qualite.sansDirigeant).toBe(1);
    expect(s.qualite.doublonsTel).toHaveLength(1);
    expect(s.qualite.doublonsTel[0].garages).toHaveLength(2);
  });
  it("sans activité récente : pas d'estimation", () => {
    const vide = computeStats([garage()], "2026-09-26");
    expect(vide.rythme).toBeNull();
    expect(vide.finEstimee).toBeNull();
  });
});

describe("helpers", () => {
  it("deptOf", () => {
    expect(deptOf(67000)).toBe("67");
    expect(deptOf(8000)).toBe("08");
    expect(deptOf(null)).toBeNull();
    expect(deptOf(0)).toBeNull();
  });
  it("phoneKey", () => {
    expect(phoneKey("+33 3 88 12 34 56")).toBe(phoneKey("03.88.12.34.56"));
  });
  it("addWorkingDays saute le week-end", () => {
    expect(addWorkingDays("2026-09-25", 1)).toBe("2026-09-28"); // vendredi → lundi
  });
});

describe("applySession", () => {
  const base = computeStats(
    [garage(), garage(), garage({ telephone: "03 88 00 00 09", prospectionActive: "À enrichir" })],
    "2026-09-27",
    new Date("2026-09-27T08:00:00Z"),
  );
  const ev = (over: Partial<import("./stats").SessionEvent>) => ({
    at: "2026-09-27T09:00:00Z", day: "2026-09-27", operator: "Hiba" as const,
    fromNouveaux: true, fromACompleter: false, addedEmail: true, addedTel: true, ...over,
  });

  it("ajoute les sorties postérieures au calcul", () => {
    const live = applySession(base, [ev({}), ev({ at: "2026-09-27T07:00:00Z" })], "2026-09-27");
    expect(live).toMatchObject({ traites: 2, restants: 1, aujourdhui: 1 });
    expect(live.aujourdhuiParOperateur).toEqual({ Hiba: 1, Romain: 0 });
    expect(live.tauxEmail).toBe(0.5);
  });
  it("une fiche de la file À compléter ne change pas les restants", () => {
    const live = applySession(base, [ev({ fromNouveaux: false, fromACompleter: true, addedTel: false })], "2026-09-27");
    expect(live).toMatchObject({ restants: 2, aCompleter: 0, aujourdhui: 1 });
  });
});
