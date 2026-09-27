import type { NotionPage } from "./mapper";

export const NOTION_API_BASE = "https://api.notion.com/v1";
export const NOTION_VERSION = "2025-09-03";

export class NotionError extends Error {
  constructor(
    public status: number,
    body: string,
  ) {
    super(`Notion API error (${status}): ${body}`);
  }
}

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

export async function notionFetch<T>(path: string, init: { method: string; body?: unknown }): Promise<T> {
  const response = await fetch(`${NOTION_API_BASE}${path}`, {
    method: init.method,
    headers: notionHeaders(),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new NotionError(response.status, await response.text());
  }
  return (await response.json()) as T;
}

export interface QueryResult {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

export function queryDataSource(body: Record<string, unknown>, filterProperties?: string[]) {
  const search = new URLSearchParams();
  for (const p of filterProperties ?? []) search.append("filter_properties[]", p);
  const qs = search.size > 0 ? `?${search.toString()}` : "";
  return notionFetch<QueryResult>(`/data_sources/${getDataSourceId()}/query${qs}`, { method: "POST", body });
}

// Parcourt toutes les pages d'une requête (100 par appel, maximum de l'API).
export async function queryAll(body: Record<string, unknown>, filterProperties?: string[]) {
  const pages: NotionPage[] = [];
  let cursor: string | null = null;
  do {
    const data: QueryResult = await queryDataSource(
      { ...body, page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) },
      filterProperties,
    );
    pages.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return pages;
}

export function updatePage(id: string, properties: Record<string, unknown>) {
  return notionFetch<NotionPage>(`/pages/${id}`, { method: "PATCH", body: { properties } });
}
