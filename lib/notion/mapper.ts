import type { Effectif, Garage, TraitePar } from "../types";
import { PROPS } from "./schema";

// Forme minimale des valeurs de propriétés Notion utilisées par l'app.
export type NotionPropertyValue =
  | { type: "title"; title: { plain_text: string }[] }
  | { type: "rich_text"; rich_text: { plain_text: string }[] }
  | { type: "number"; number: number | null }
  | { type: "select"; select: { name: string } | null }
  | { type: "phone_number"; phone_number: string | null }
  | { type: "email"; email: string | null }
  | { type: "url"; url: string | null }
  | { type: "checkbox"; checkbox: boolean }
  | { type: "date"; date: { start: string } | null }
  | { type: "formula"; formula: { type: "number"; number: number | null } | { type: string } };

export interface NotionPage {
  id: string;
  properties: Record<string, NotionPropertyValue>;
}

type Props = NotionPage["properties"];

export function plainText(prop: NotionPropertyValue | undefined): string {
  if (!prop) return "";
  if (prop.type === "title") return prop.title.map((t) => t.plain_text).join("");
  if (prop.type === "rich_text") return prop.rich_text.map((t) => t.plain_text).join("");
  return "";
}

function select<T extends string>(props: Props, name: string): T | null {
  const p = props[name];
  return p?.type === "select" ? ((p.select?.name as T) ?? null) : null;
}

function num(props: Props, name: string): number | null {
  const p = props[name];
  if (p?.type === "number") return p.number;
  if (p?.type === "formula" && p.formula.type === "number") return (p.formula as { number: number | null }).number;
  return null;
}

function date(props: Props, name: string): string | null {
  const p = props[name];
  return p?.type === "date" ? (p.date?.start ?? null) : null;
}

function checkbox(props: Props, name: string): boolean {
  const p = props[name];
  return p?.type === "checkbox" ? p.checkbox : false;
}

export function mapPageToGarage(page: NotionPage): Garage {
  const props = page.properties;
  const siren = num(props, PROPS.siren);
  const telephone = props[PROPS.telephone];
  const email = props[PROPS.email];
  const siteWeb = props[PROPS.siteWeb];
  return {
    id: page.id,
    nom: plainText(props[PROPS.nom]),
    enseigne: plainText(props[PROPS.enseigne]),
    adresse: plainText(props[PROPS.adresse]),
    commune: plainText(props[PROPS.commune]),
    cp: num(props, PROPS.cp),
    dirigeant: plainText(props[PROPS.dirigeant]),
    segment: select(props, PROPS.segment),
    franchiseSuspectee: select(props, PROPS.franchiseSuspectee),
    telephone: telephone?.type === "phone_number" ? telephone.phone_number : null,
    email: email?.type === "email" ? email.email : null,
    siteWeb: siteWeb?.type === "url" ? siteWeb.url : null,
    telNonTrouve: checkbox(props, PROPS.telNonTrouve),
    emailNonTrouve: checkbox(props, PROPS.emailNonTrouve),
    // Le SIREN est stocké en nombre : on remet les zéros de tête perdus.
    siren: siren === null ? null : String(siren).padStart(9, "0"),
    effectif: select<Effectif>(props, PROPS.effectif),
    naf: select(props, PROPS.naf),
    dateCreation: date(props, PROPS.dateCreation),
    statutActivite: select(props, PROPS.statutActivite),
    prospectionActive: select(props, PROPS.prospectionActive),
    notesIa: plainText(props[PROPS.notesIa]),
    scorePriorite: num(props, PROPS.scorePriorite),
    traiteLe: date(props, PROPS.traiteLe),
    traitePar: select<TraitePar>(props, PROPS.traitePar),
  };
}
