import { NextRequest, NextResponse } from "next/server";
import { NOTION_API_BASE, notionHeaders } from "@/lib/notion";
import type { UpdateGaragePayload } from "@/lib/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: UpdateGaragePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const properties: Record<string, unknown> = {};

  if (body.telephone !== undefined) {
    properties["telephone"] = { phone_number: body.telephone };
  }
  if (body.email !== undefined) {
    properties["email"] = { email: body.email };
  }
  if (body.siteWeb !== undefined) {
    properties["site_web"] = { url: body.siteWeb };
  }
  if (body.telNonTrouve !== undefined) {
    properties["tel_non_trouve"] = { checkbox: body.telNonTrouve };
  }
  if (body.emailNonTrouve !== undefined) {
    properties["email_non_trouve"] = { checkbox: body.emailNonTrouve };
  }
  if (body.emailType !== undefined) {
    properties["Email_type"] = { select: { name: body.emailType } };
  }
  if (body.statutActivite !== undefined) {
    properties["Statut_activite"] = { select: { name: body.statutActivite } };
  }
  if (body.confiance !== undefined) {
    properties["Confiance"] = { select: { name: body.confiance } };
  }
  if (body.prospectionActive !== undefined) {
    properties["Prospection_active"] = { select: { name: body.prospectionActive } };
  }
  if (body.notesIa !== undefined) {
    properties["notes_ia"] = { rich_text: [{ text: { content: body.notesIa } }] };
  }

  if (Object.keys(properties).length === 0) {
    return NextResponse.json({ error: "No properties to update" }, { status: 400 });
  }

  try {
    const response = await fetch(`${NOTION_API_BASE}/pages/${id}`, {
      method: "PATCH",
      headers: notionHeaders(),
      body: JSON.stringify({ properties }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Notion API error: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Marque le garage comme fermé définitivement sans l'archiver : la fiche reste
// visible et filtrable dans Notion, mais sort de la liste à traiter (checkboxes
// tel_non_trouve / email_non_trouve à true).
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const response = await fetch(`${NOTION_API_BASE}/pages/${id}`, {
      method: "PATCH",
      headers: notionHeaders(),
      body: JSON.stringify({
        properties: {
          Statut_activite: { select: { name: "fermé" } },
          Prospection_active: { select: { name: "Pas intéressé" } },
          tel_non_trouve: { checkbox: true },
          email_non_trouve: { checkbox: true },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Notion API error: ${errorText}` }, { status: response.status });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
