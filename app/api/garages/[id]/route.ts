import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { updatePage } from "@/lib/notion/client";
import { STATS_TAG } from "@/lib/notion/garages";
import { errorResponse } from "@/lib/notion/http";
import { toNotionProperties } from "@/lib/notion/payload";
import { FERME_PROPS } from "@/lib/domain/prospection-rules";
import { OPERATORS, type Operator, type UpdateGaragePayload } from "@/lib/types";

function parseOperator(value: unknown): Operator | undefined {
  return OPERATORS.includes(value as Operator) ? (value as Operator) : undefined;
}

// Le body contient les champs à écrire ; `operator` renseigne traite_le / traite_par.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: UpdateGaragePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (body.operator !== undefined && !parseOperator(body.operator)) {
    return NextResponse.json({ error: "Unknown operator" }, { status: 400 });
  }

  const properties = toNotionProperties(body);
  if (Object.keys(properties).length === 0) {
    return NextResponse.json({ error: "No properties to update" }, { status: 400 });
  }

  try {
    const data = await updatePage(id, properties);
    revalidateTag(STATS_TAG, "max");
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/garages/{id}?operator=Hiba — « Fermé définitivement ».
// Le verbe DELETE est historique : côté Notion c'est un PATCH, la fiche n'est
// ni archivée ni supprimée. Elle passe en fermé / Pas intéressé et sort des files.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operator = parseOperator(request.nextUrl.searchParams.get("operator"));

  try {
    await updatePage(id, toNotionProperties({ ...FERME_PROPS, operator }));
    revalidateTag(STATS_TAG, "max");
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
