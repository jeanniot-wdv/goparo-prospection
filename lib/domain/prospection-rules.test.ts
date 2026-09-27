import { describe, expect, it } from "vitest";
import {
  AUCUNE_COORDONNEE_PROPS,
  EMAIL_SAISI_PROPS,
  FERME_PROPS,
  TEL_SEUL_EMAIL_NON_TROUVE_PROPS,
  availableExits,
  coordonneesFromPayload,
  resolveExit,
  type FicheState,
} from "./prospection-rules";

const vide: FicheState = { telephoneExistant: null, emailExistant: null, saisie: {} };
const tel = "+33 3 88 12 34 56";
const email = "contact@garage.fr";

describe("availableExits", () => {
  it("rien saisi : aucune coordonnée ou passer", () => {
    expect(availableExits(vide)).toEqual(["aucune", "passer"]);
  });
  it("tél. seul : « Email trouvé ? » → Non = email introuvable (Oui = rester, pas de sortie)", () => {
    expect(availableExits({ ...vide, saisie: { telephone: tel } })).toEqual(["email-introuvable", "passer"]);
  });
  it("email seul : « Téléphone trouvé ? » → Non = tél. introuvable", () => {
    expect(availableExits({ ...vide, saisie: { email } })).toEqual(["tel-introuvable", "passer"]);
  });
  it("les deux : terminer", () => {
    expect(availableExits({ ...vide, saisie: { telephone: tel, email } })).toEqual(["complet"]);
  });
  it("file « À compléter » : le tél. existant compte", () => {
    expect(availableExits({ ...vide, telephoneExistant: tel })).toEqual(["email-introuvable", "passer"]);
    expect(availableExits({ ...vide, telephoneExistant: tel, saisie: { email } })).toEqual(["complet"]);
  });
});

describe("resolveExit", () => {
  it("complet : saisie + props email saisi", () => {
    expect(resolveExit("complet", { ...vide, saisie: { telephone: tel, email } })).toEqual({
      telephone: tel,
      email,
      ...EMAIL_SAISI_PROPS,
    });
  });
  it("email introuvable : coche email_non_trouve, reste À enrichir", () => {
    expect(resolveExit("email-introuvable", { ...vide, saisie: { telephone: tel } })).toEqual({
      telephone: tel,
      emailNonTrouve: true,
      ...TEL_SEUL_EMAIL_NON_TROUVE_PROPS,
    });
  });
  it("tél. introuvable : coche tel_non_trouve, passe À prospecter", () => {
    expect(resolveExit("tel-introuvable", { ...vide, saisie: { email } })).toEqual({
      email,
      telNonTrouve: true,
      ...EMAIL_SAISI_PROPS,
    });
  });
  it("aucune coordonnée", () => {
    expect(resolveExit("aucune", vide)).toEqual(AUCUNE_COORDONNEE_PROPS);
  });
  it("fermé ignore la saisie", () => {
    expect(resolveExit("ferme", { ...vide, saisie: { telephone: tel } })).toEqual(FERME_PROPS);
  });
  it("passer n'écrit que le site web", () => {
    expect(resolveExit("passer", vide)).toBeNull();
    expect(resolveExit("passer", { ...vide, saisie: { siteWeb: "https://g.fr" } })).toEqual({ siteWeb: "https://g.fr" });
  });
  it("n'envoie pas le tél. existant", () => {
    expect(resolveExit("complet", { ...vide, telephoneExistant: tel, saisie: { email } })).not.toHaveProperty("telephone");
  });
});

describe("coordonneesFromPayload", () => {
  it("null → objet vide", () => {
    expect(coordonneesFromPayload(null)).toEqual({});
  });
  it("ne garde que tél./email/site présents dans le payload", () => {
    expect(coordonneesFromPayload({ siteWeb: "https://g.fr", notesIa: "x" })).toEqual({ siteWeb: "https://g.fr" });
    expect(coordonneesFromPayload(EMAIL_SAISI_PROPS)).toEqual({});
  });
});
