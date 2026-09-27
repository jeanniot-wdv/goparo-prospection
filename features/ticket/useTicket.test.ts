import { describe, expect, it } from "vitest";
import { ticketReducer, type TicketState } from "./useTicket";

const initial: TicketState = { saisie: {}, editing: null, draft: "", error: null, ask: null, exiting: null };

describe("ticketReducer", () => {
  it("met au format à la validation", () => {
    let s = ticketReducer(initial, { type: "edit", slot: "telephone" });
    s = ticketReducer(s, { type: "draft", value: "03.88.12.34.56" });
    s = ticketReducer(s, { type: "commit" });
    expect(s.saisie.telephone).toBe("+33 3 88 12 34 56");
    expect(s.editing).toBeNull();
  });
  it("garde la saisie ouverte avec une erreur si invalide", () => {
    let s = ticketReducer(initial, { type: "edit", slot: "email" });
    s = ticketReducer(s, { type: "draft", value: "pas-un-email" });
    s = ticketReducer(s, { type: "commit" });
    expect(s.editing).toBe("email");
    expect(s.error).toBe("Email non valide");
  });
  it("« Oui, je le saisis » : le bandeau se ferme et l'emplacement s'ouvre", () => {
    let s = ticketReducer(initial, { type: "ask", slot: "email" });
    s = ticketReducer(s, { type: "edit", slot: "email" });
    expect(s.ask).toBeNull();
    expect(s.editing).toBe("email");
  });
  it("gèle le ticket une fois tamponné", () => {
    const s = ticketReducer(initial, { type: "exit", kind: "aucune" });
    expect(ticketReducer(s, { type: "edit", slot: "email" })).toBe(s);
  });
});
