import { NextRequest, NextResponse } from "next/server";
import { NotionError, queryDataSource } from "@/lib/notion/client";
import { mapPageToGarage } from "@/lib/notion/mapper";
import type { GaragesListResponse, Segment } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const segment = searchParams.get("segment") as Segment | null;
  const hideFranchise = searchParams.get("hideFranchise") !== "false"; // default true
  const enseigneOnly = searchParams.get("enseigneOnly") === "true";
  const cursor = searchParams.get("cursor");

  const filter: Record<string, unknown> = {
    and: [
      { property: "telephone", phone_number: { is_empty: true } },
      { property: "email", email: { is_empty: true } },
      { property: "tel_non_trouve", checkbox: { equals: false } },
      { property: "email_non_trouve", checkbox: { equals: false } },
    ],
  };

  const andConditions = filter.and as unknown[];

  if (segment) {
    andConditions.push({ property: "segment", select: { equals: segment } });
  }

  if (hideFranchise) {
    andConditions.push({ property: "franchise_suspectee", select: { does_not_equal: "oui" } });
  }

  if (enseigneOnly) {
    andConditions.push({ property: "enseigne", rich_text: { is_not_empty: true } });
  }

  const body: Record<string, unknown> = {
    filter,
    sorts: [{ property: "enseigne", direction: "descending" }],
    page_size: 20,
  };
  if (cursor) {
    body.start_cursor = cursor;
  }

  try {
    const data = await queryDataSource(body);

    const payload: GaragesListResponse = {
      garages: data.results.map(mapPageToGarage),
      hasMore: data.has_more,
      nextCursor: data.next_cursor,
    };

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof NotionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
