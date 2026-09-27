import type { Garage } from "./types";

export const NOTION_API_BASE = "https://api.notion.com/v1";
export const NOTION_VERSION = "2025-09-03";

export function notionHeaders() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error("NOTION_API_KEY is not set");
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

export function getDataSourceId() {
  const id = process.env.NOTION_DATA_SOURCE_ID;
  if (!id) {
    throw new Error("NOTION_DATA_SOURCE_ID is not set");
  }
  return id;
}

// Minimal shape of the Notion property values we care about.
type NotionPropertyValue =
  | { type: "title"; title: { plain_text: string }[] }
  | { type: "rich_text"; rich_text: { plain_text: string }[] }
  | { type: "number"; number: number | null }
  | { type: "select"; select: { name: string } | null }
  | { type: "phone_number"; phone_number: string | null }
  | { type: "email"; email: string | null }
  | { type: "url"; url: string | null }
  | { type: "checkbox"; checkbox: boolean };

export interface NotionPage {
  id: string;
  properties: Record<string, NotionPropertyValue>;
}

function plainText(prop: NotionPropertyValue | undefined): string {
  if (!prop) return "";
  if (prop.type === "title") return prop.title.map((t) => t.plain_text).join("");
  if (prop.type === "rich_text") return prop.rich_text.map((t) => t.plain_text).join("");
  return "";
}

export function mapPageToGarage(page: NotionPage): Garage {
  const props = page.properties;
  return {
    id: page.id,
    nom: plainText(props["Nom"]),
    enseigne: plainText(props["enseigne"]),
    adresse: plainText(props["adresse"]),
    commune: plainText(props["commune"]),
    cp: props["CP"]?.type === "number" ? props["CP"].number : null,
    dirigeant: plainText(props["dirigeant"]),
    segment:
      props["segment"]?.type === "select" ? (props["segment"].select?.name as Garage["segment"]) ?? null : null,
    franchiseSuspectee:
      props["franchise_suspectee"]?.type === "select"
        ? (props["franchise_suspectee"].select?.name as Garage["franchiseSuspectee"]) ?? null
        : null,
    telephone: props["telephone"]?.type === "phone_number" ? props["telephone"].phone_number : null,
    email: props["email"]?.type === "email" ? props["email"].email : null,
    siteWeb: props["site_web"]?.type === "url" ? props["site_web"].url : null,
    telNonTrouve: props["tel_non_trouve"]?.type === "checkbox" ? props["tel_non_trouve"].checkbox : false,
    emailNonTrouve: props["email_non_trouve"]?.type === "checkbox" ? props["email_non_trouve"].checkbox : false,
  };
}
