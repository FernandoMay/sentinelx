import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const history = await db.analysis.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        payments: true,
      },
    });

    return NextResponse.json(history);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch analysis history" },
      { status: 500 }
    );
  }
}
