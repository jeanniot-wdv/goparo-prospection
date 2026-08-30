import { NextRequest, NextResponse } from "next/server";
import { NOTION_API_BASE, getDataSourceId, mapPageToGarage, notionHeaders, type NotionPage } from "@/lib/notion";
import type { GaragesListResponse, Segment } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const segment = searchParams.get("segment") as Segment | null;
  const hideFranchise = searchParams.get("hideFranchise") !== "false"; // default true
  const cursor = searchParams.get("cursor");

  const filter: Record<string, unknown> = {
    and: [
      { property: "telephone", phone_number: { is_empty: true } },
      { property: "email", email: { is_empty: true } },
    ],
  };

  const andConditions = filter.and as unknown[];

  if (segment) {
    andConditions.push({ property: "segment", select: { equals: segment } });
  }

  if (hideFranchise) {
    andConditions.push({ property: "franchise_suspectee", select: { does_not_equal: "oui" } });
  }

  const body: Record<string, unknown> = {
    filter,
    page_size: 20,
  };
  if (cursor) {
    body.start_cursor = cursor;
  }

  try {
    const dataSourceId = getDataSourceId();
    const response = await fetch(`${NOTION_API_BASE}/data_sources/${dataSourceId}/query`, {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Notion API error: ${errorText}` }, { status: response.status });
    }

    const data = (await response.json()) as {
      results: NotionPage[];
      has_more: boolean;
      next_cursor: string | null;
    };

    const payload: GaragesListResponse = {
      garages: data.results.map(mapPageToGarage),
      hasMore: data.has_more,
      nextCursor: data.next_cursor,
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
