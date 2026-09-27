import { NextResponse } from "next/server";
import { getCachedStats } from "@/lib/notion/garages";
import { errorResponse } from "@/lib/notion/http";

// Jamais prérendue au build : le scan Notion n'a lieu qu'à la demande, puis en cache.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getCachedStats());
  } catch (error) {
    return errorResponse(error);
  }
}
