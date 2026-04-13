import { NextRequest, NextResponse } from "next/server";
import { analyzeFraud } from "@/lib/fraud-engine";
import { generateTestnetTxHash } from "@/lib/x402";
import { db } from "@/lib/db";

interface AgentTask {
  message?: string;
  url?: string;
  wallet?: string;
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks } = body as { tasks: AgentTask[] };

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: "Provide an array of tasks to analyze" },
        { status: 400 }
      );
    }

    if (tasks.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 tasks per agent session" },
        { status: 400 }
      );
    }

    const sessionId = `agent_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const results: Array<{
      task: AgentTask;
      analysis: ReturnType<typeof analyzeFraud>;
      txHash: string;
      cost: number;
    }> = [];
    let totalCost = 0;

    for (const task of tasks) {
      if (!task.message && !task.url && !task.wallet && !task.email) continue;

      const analysis = analyzeFraud(task);
      const txHash = generateTestnetTxHash();
      const cost = 0.01;
      totalCost += cost;

      const inputFields: string[] = [];
      if (task.message) inputFields.push("message");
      if (task.url) inputFields.push("url");
      if (task.wallet) inputFields.push("wallet");
      if (task.email) inputFields.push("email");

      const inputType = inputFields.length > 1 ? "combined" : inputFields[0];
      const inputContent = task.message || task.url || task.wallet || task.email || "";

      const savedAnalysis = await db.analysis.create({
        data: {
          inputType,
          inputContent,
          riskScore: analysis.riskScore,
          threatLevel: analysis.threatLevel,
          prediction: analysis.prediction,
          recommendedAction: analysis.recommendedAction,
          details: JSON.stringify(analysis.details),
          paymentVerified: true,
          paymentTxHash: txHash,
          paymentAmount: cost,
        },
      });

      await db.payment.create({
        data: {
          analysisId: savedAnalysis.id,
          amount: cost,
          asset: "USDC",
          network: "stellar:testnet",
          status: "verified",
          txHash,
          fromWallet: "GDEMO...AGENT_WALLET",
          toWallet: "GBXQJT5DQCIW2BIX4JHTJXPIAOFUZMCLZVRNQY3A5QXCZQDWZEMSHYVL",
        },
      });

      results.push({
        task,
        analysis,
        txHash,
        cost,
      });
    }

    await db.agentSession.create({
      data: {
        agentName: sessionId,
        walletAddress: "GDEMO...AGENT_WALLET",
        totalPaid: totalCost,
        requestCount: results.length,
      },
    });

    return NextResponse.json({
      sessionId,
      results,
      totalCost,
      taskCount: results.length,
    });
  } catch (error) {
    console.error("Error in /api/agent/demo:", error);
    return NextResponse.json(
      { error: "Agent demo failed" },
      { status: 500 }
    );
  }
}
