import { NextResponse } from "next/server";
import { getX402LiveInfo, isLiveMode } from "@/lib/x402-live";
import { getX402Info } from "@/lib/x402";

export async function GET() {
  if (isLiveMode()) {
    return NextResponse.json(getX402LiveInfo());
  }
  // Demo mode: legacy simulated protocol info
  return NextResponse.json(getX402Info());
}
