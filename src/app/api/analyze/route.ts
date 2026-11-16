import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { analyzeFraud } from "@/lib/fraud-engine";
import { createPaymentRequired, verifyPayment } from "@/lib/x402";
import {
  X402_NETWORK,
  X402_PAY_TO,
  isLiveMode,
  getAnalyzeRouteConfig,
  getX402ResourceServer,
} from "@/lib/x402-live";
import type { PaymentVerification } from "@/lib/x402";
import { db } from "@/lib/db";

/**
 * POST /api/analyze — SentinelX fraud analysis, protected by real x402 payments.
 *
 * LIVE mode (default): the route is wrapped with @x402/next `withX402`.
 * Clients without payment get a real 402 response (x402 v2 spec) pointing to
 * the Coinbase facilitator on Stellar; clients with an X-PAYMENT header are
 * verified and settled ON-CHAIN (USDC, Soroban) after a successful analysis.
 *
 * DEMO mode (X402_MODE=demo): legacy simulated flow kept for offline demos.
 */

// ---------------------------------------------------------------------------
// Core handler: runs after payment verification (or verification-less demo)
// ---------------------------------------------------------------------------

async function analyzeHandler(
  request: NextRequest,
  demoVerification?: PaymentVerification
) {
  try {
    const body = await request.json();
    const { message, url, wallet, email } = body;

    // Validate at least one input field is provided
    if (!message && !url && !wallet && !email) {
      return NextResponse.json(
        { error: "At least one input field is required: message, url, wallet, or email" },
        { status: 400 }
      );
    }

    // Run fraud analysis
    const analysis = analyzeFraud({ message, url, wallet, email });

    // Determine input type and content for DB storage
    const inputFields: string[] = [];
    if (message) inputFields.push("message");
    if (url) inputFields.push("url");
    if (wallet) inputFields.push("wallet");
    if (email) inputFields.push("email");

    const inputType = inputFields.length > 1 ? "combined" : inputFields[0];
    const inputContent = message || url || wallet || email || "";

    // Save analysis to database. In live mode the payment txHash is written
    // later by the onAfterSettle hook in src/lib/x402-live.ts once the
    // facilitator settles on-chain. In demo mode the simulated verification is
    // attached directly.
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
        paymentTxHash: demoVerification?.txHash ?? null,
        paymentAmount: demoVerification?.amount ?? null,
      },
    });

    // Pre-create the payment row. In live mode the real on-chain txHash is
    // linked back to this row by the onAfterSettle hook.
    await db.payment.create({
      data: {
        analysisId: savedAnalysis.id,
        amount: demoVerification?.amount ?? 0.01,
        asset: demoVerification?.asset ?? "USDC",
        network: X402_NETWORK,
        status: demoVerification ? "verified" : "pending",
        txHash: demoVerification?.txHash ?? null,
        fromWallet: demoVerification?.fromWallet ?? null,
        toWallet: demoVerification?.toWallet ?? X402_PAY_TO,
      },
    });

    // Return analysis result (payment metadata added by settlement hook)
    return NextResponse.json({
      id: savedAnalysis.id,
      riskScore: analysis.riskScore,
      threatLevel: analysis.threatLevel,
      prediction: analysis.prediction,
      recommendedAction: analysis.recommendedAction,
      details: analysis.details,
      payment: {
        txHash: demoVerification?.txHash ?? null,
        amount: demoVerification?.amount ?? 0.01,
        asset: demoVerification?.asset ?? "USDC",
        network: X402_NETWORK,
        settledOnChain: isLiveMode() && !demoVerification,
      },
      createdAt: savedAnalysis.createdAt,
    });
  } catch (error) {
    console.error("Error in /api/analyze:", error);
    return NextResponse.json(
      { error: "Internal server error during fraud analysis" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Demo mode: legacy simulated 402 flow (no real Stellar transactions)
// ---------------------------------------------------------------------------

async function demoHandler(request: NextRequest) {
  let verification: ReturnType<typeof verifyPayment> | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    const { message, url, wallet, email } = body;

    if (!message && !url && !wallet && !email) {
      return NextResponse.json(
        { error: "At least one input field is required: message, url, wallet, or email" },
        { status: 400 }
      );
    }

    const paymentHeader = request.headers.get("x-payment");
    if (!paymentHeader) {
      const paymentResponse = createPaymentRequired("fraud-analysis");
      return NextResponse.json(paymentResponse.body, { status: paymentResponse.status });
    }

    verification = verifyPayment(paymentHeader);
    if (!verification.valid) {
      return NextResponse.json(
        { error: "Payment verification failed. Invalid or expired payment." },
        { status: 402 }
      );
    }
  } catch {
    // fallthrough — demo mode is best-effort
  }

  return analyzeHandler(request, verification);
}

// ---------------------------------------------------------------------------
// Exported handler: live (real x402) or demo (simulated)
// ---------------------------------------------------------------------------

const routeConfig = getAnalyzeRouteConfig();

export const POST = isLiveMode()
  ? withX402<unknown>(
    (request) => analyzeHandler(request),
    routeConfig,
    getX402ResourceServer()
  )
  : demoHandler;
