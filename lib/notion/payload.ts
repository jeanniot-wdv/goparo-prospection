import type { UpdateGaragePayload } from "../types";
import { PROPS } from "./schema";

// Date du jour à Paris au format AAAA-MM-JJ (les stats regroupent par jour local).
export function parisDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(now);
}

// Traduit un UpdateGaragePayload en propriétés Notion pour PATCH /pages/{id}.
export function toNotionProperties(body: UpdateGaragePayload, now: Date = new Date()): Record<string, unknown> {
  const properties: Record<string, unknown> = {};

  if (body.telephone !== undefined) properties[PROPS.telephone] = { phone_number: body.telephone || null };
  if (body.email !== undefined) properties[PROPS.email] = { email: body.email || null };
  if (body.siteWeb !== undefined) properties[PROPS.siteWeb] = { url: body.siteWeb || null };
  if (body.telNonTrouve !== undefined) properties[PROPS.telNonTrouve] = { checkbox: body.telNonTrouve };
  if (body.emailNonTrouve !== undefined) properties[PROPS.emailNonTrouve] = { checkbox: body.emailNonTrouve };
  if (body.emailType !== undefined) properties[PROPS.emailType] = { select: { name: body.emailType } };
  if (body.statutActivite !== undefined) properties[PROPS.statutActivite] = { select: { name: body.statutActivite } };
  if (body.confiance !== undefined) properties[PROPS.confiance] = { select: { name: body.confiance } };
  if (body.prospectionActive !== undefined) {
    properties[PROPS.prospectionActive] = { select: { name: body.prospectionActive } };
  }
  if (body.notesIa !== undefined) properties[PROPS.notesIa] = { rich_text: [{ text: { content: body.notesIa } }] };
  if (body.operator !== undefined) {
    properties[PROPS.traiteLe] = { date: { start: parisDay(now) } };
    properties[PROPS.traitePar] = { select: { name: body.operator } };
  }

  return properties;
}
