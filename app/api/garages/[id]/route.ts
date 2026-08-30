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
  if (body.telNonTrouve !== undefined) {
    properties["tel_non_trouve"] = { checkbox: body.telNonTrouve };
  }
  if (body.emailNonTrouve !== undefined) {
    properties["email_non_trouve"] = { checkbox: body.emailNonTrouve };
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
