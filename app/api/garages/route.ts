import { NextRequest, NextResponse } from "next/server";
import { parseQueueParams } from "@/lib/notion/filters";
import { listQueue } from "@/lib/notion/garages";
import { errorResponse } from "@/lib/notion/http";

// GET /api/garages?queue=nouveaux|a-completer&dept=67&q=…&segment=…&hideFranchise=…&enseigneOnly=…&cursor=…
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  try {
    return NextResponse.json(await listQueue(parseQueueParams(searchParams), searchParams.get("cursor")));
  } catch (error) {
    return errorResponse(error);
  }
}
