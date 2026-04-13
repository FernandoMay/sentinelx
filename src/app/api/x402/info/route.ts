import { NextResponse } from "next/server";
import { getX402Info } from "@/lib/x402";

export async function GET() {
  return NextResponse.json(getX402Info());
}
