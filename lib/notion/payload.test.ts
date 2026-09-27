import { describe, expect, it } from "vitest";
import { parisDay, toNotionProperties } from "./payload";

describe("toNotionProperties", () => {
  it("n'envoie que les champs fournis", () => {
    expect(toNotionProperties({ email: "a@b.fr", emailNonTrouve: false })).toEqual({
      email: { email: "a@b.fr" },
      email_non_trouve: { checkbox: false },
    });
  });
  it("l'opérateur renseigne traite_le (jour de Paris) et traite_par", () => {
    // 23h30 UTC le 31/12 = 1er janvier à Paris
    const props = toNotionProperties({ operator: "Romain" }, new Date("2025-12-31T23:30:00Z"));
    expect(props).toEqual({
      traite_le: { date: { start: "2026-01-01" } },
      traite_par: { select: { name: "Romain" } },
    });
  });
  it("notes en rich_text", () => {
    expect(toNotionProperties({ notesIa: "x" })).toEqual({ notes_ia: { rich_text: [{ text: { content: "x" } }] } });
  });
});

describe("parisDay", () => {
  it("format AAAA-MM-JJ", () => {
    expect(parisDay(new Date("2026-09-27T10:00:00Z"))).toBe("2026-09-27");
  });
});
