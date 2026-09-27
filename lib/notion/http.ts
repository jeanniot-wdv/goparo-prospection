import { NextResponse } from "next/server";
import { NotionError } from "./client";

export function errorResponse(error: unknown) {
  if (error instanceof NotionError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}
