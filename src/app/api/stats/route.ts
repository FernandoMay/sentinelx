import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [
      totalAnalyses,
      highRiskCount,
      verifiedPayments,
      totalPaidResult,
      threatGroups,
      recentActivity,
      avgResult,
    ] = await Promise.all([
      db.analysis.count(),
      db.analysis.count({
        where: { threatLevel: { in: ["HIGH", "CRITICAL"] } },
      }),
      db.payment.count({ where: { status: "verified" } }),
      db.payment.aggregate({
        where: { status: "verified" },
        _sum: { amount: true },
      }),
      db.analysis.groupBy({
        by: ["threatLevel"],
        _count: { threatLevel: true },
      }),
      db.analysis.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.analysis.aggregate({
        _avg: { riskScore: true },
      }),
    ]);

    const threatDistribution: Record<string, number> = {};
    for (const g of threatGroups) {
      threatDistribution[g.threatLevel] = g._count.threatLevel;
    }

    return NextResponse.json({
      totalAnalyses,
      highRiskCount,
      totalPayments: verifiedPayments,
      totalAmountPaid: totalPaidResult._sum.amount || 0,
      threatDistribution,
      recentActivity,
      avgRiskScore: avgResult._avg.riskScore || 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
