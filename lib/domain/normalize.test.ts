import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizePhone, normalizeUrl } from "./normalize";

describe("normalizePhone", () => {
  it.each([
    ["03 88 12 34 56", "+33 3 88 12 34 56"],
    ["0388123456", "+33 3 88 12 34 56"],
    ["03.88.12.34.56", "+33 3 88 12 34 56"],
    ["06-12-34-56-78", "+33 6 12 34 56 78"],
    ["+33 3 88 12 34 56", "+33 3 88 12 34 56"],
    ["+33388123456", "+33 3 88 12 34 56"],
    ["+33 (0)3 88 12 34 56", "+33 3 88 12 34 56"],
    ["0033 3 88 12 34 56", "+33 3 88 12 34 56"],
  ])("%s → %s", (input, expected) => {
    expect(normalizePhone(input)).toEqual({ ok: true, value: expected });
  });

  it("garde les numéros étrangers", () => {
    expect(normalizePhone("+352 26 12 34 56")).toEqual({ ok: true, value: "+35226123456" });
    expect(normalizePhone("0049 721 123456")).toEqual({ ok: true, value: "+49721123456" });
  });

  it.each(["", "03 88 12 34", "abc", "00 00 00 00 00", "03 88 12 34 56 78"])("refuse %j", (input) => {
    expect(normalizePhone(input).ok).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("met en minuscules et retire les espaces et mailto:", () => {
    expect(normalizeEmail("  mailto:Contact@Garage-Dupont.FR ")).toEqual({ ok: true, value: "contact@garage-dupont.fr" });
  });
  it.each(["contact@", "contact@garage", "con tact@garage.fr", "@garage.fr", ""])("refuse %j", (input) => {
    expect(normalizeEmail(input).ok).toBe(false);
  });
});

describe("normalizeUrl", () => {
  it("préfixe https:// si besoin", () => {
    expect(normalizeUrl("garage-dupont.fr")).toEqual({ ok: true, value: "https://garage-dupont.fr" });
    expect(normalizeUrl("http://garage.fr/contact")).toEqual({ ok: true, value: "http://garage.fr/contact" });
  });
  it("refuse une URL sans domaine", () => {
    expect(normalizeUrl("garage").ok).toBe(false);
    expect(normalizeUrl("").ok).toBe(false);
  });
});
