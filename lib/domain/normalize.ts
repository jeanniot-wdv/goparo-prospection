export type Normalized = { ok: true; value: string } | { ok: false; error: string };

/**
 * Téléphone FR → « +33 X XX XX XX XX ». Accepte 0X…, +33…, 0033…, avec espaces,
 * points, tirets ou parenthèses. Les numéros étrangers (+352, +49, +32…) sont
 * gardés en « +indicatif » suivi des chiffres, sans mise en forme.
 */
export function normalizePhone(raw: string): Normalized {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Numéro vide" };
  let digits = trimmed.replace(/[\s.\-()/]/g, "");
  if (!/^\+?\d+$/.test(digits)) return { ok: false, error: "Caractères non valides" };

  if (digits.startsWith("0033")) digits = "+33" + digits.slice(4);
  if (digits.startsWith("+33")) {
    let national = digits.slice(3);
    if (national.startsWith("0")) national = national.slice(1); // +33 (0)6…
    digits = "0" + national;
  }

  if (/^0[1-9]\d{8}$/.test(digits)) {
    const n = digits.slice(1);
    return { ok: true, value: `+33 ${n[0]} ${n.slice(1, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}` };
  }
  if (digits.startsWith("00")) digits = "+" + digits.slice(2);
  if (/^\+[1-9]\d{7,14}$/.test(digits)) return { ok: true, value: digits };
  return { ok: false, error: "Format attendu : 03 88 12 34 56 ou +33 3 88 12 34 56" };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(raw: string): Normalized {
  const value = raw.trim().replace(/^mailto:/i, "").toLowerCase();
  if (!value) return { ok: false, error: "Email vide" };
  if (!EMAIL_RE.test(value)) return { ok: false, error: "Email non valide" };
  return { ok: true, value };
}

export function normalizeUrl(raw: string): Normalized {
  let value = raw.trim();
  if (!value) return { ok: false, error: "URL vide" };
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (!url.hostname.includes(".")) return { ok: false, error: "URL non valide" };
    return { ok: true, value: url.toString().replace(/\/$/, "") };
  } catch {
    return { ok: false, error: "URL non valide" };
  }
}
