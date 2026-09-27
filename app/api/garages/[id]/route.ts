import { NextRequest, NextResponse } from "next/server";
import { NotionError, updatePage } from "@/lib/notion/client";
import { toNotionProperties } from "@/lib/notion/payload";
import { FERME_PROPS } from "@/lib/domain/prospection-rules";
import type { UpdateGaragePayload } from "@/lib/types";

function errorResponse(error: unknown) {
  if (error instanceof NotionError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: UpdateGaragePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const properties = toNotionProperties(body);
  if (Object.keys(properties).length === 0) {
    return NextResponse.json({ error: "No properties to update" }, { status: 400 });
  }

  try {
    const data = await updatePage(id, properties);
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}

// Marque le garage comme fermé définitivement sans l'archiver : la fiche reste
// visible et filtrable dans Notion, mais sort de la liste à traiter (checkboxes
// tel_non_trouve / email_non_trouve à true).
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await updatePage(id, toNotionProperties(FERME_PROPS));
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
