import { NextRequest, NextResponse } from "next/server";
import { analyzeFraud } from "@/lib/fraud-engine";
import { createPaymentRequired, verifyPayment } from "@/lib/x402";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
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

    // Step 1: Check for x402 payment header
    const paymentHeader = request.headers.get("x-payment");

    if (!paymentHeader) {
      // Return 402 Payment Required
      const paymentResponse = createPaymentRequired("fraud-analysis");
      return NextResponse.json(paymentResponse.body, { status: paymentResponse.status });
    }

    // Step 2: Verify payment
    const verification = verifyPayment(paymentHeader);

    if (!verification.valid) {
      return NextResponse.json(
        { error: "Payment verification failed. Invalid or expired payment." },
        { status: 402 }
      );
    }

    // Step 3: Run fraud analysis
    const analysis = analyzeFraud({ message, url, wallet, email });

    // Step 4: Determine input type and content for DB storage
    const inputFields: string[] = [];
    if (message) inputFields.push("message");
    if (url) inputFields.push("url");
    if (wallet) inputFields.push("wallet");
    if (email) inputFields.push("email");

    const inputType = inputFields.length > 1 ? "combined" : inputFields[0];
    const inputContent = message || url || wallet || email || "";

    // Step 5: Save analysis to database
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
        paymentTxHash: verification.txHash,
        paymentAmount: verification.amount,
      },
    });

    // Step 6: Save payment record
    await db.payment.create({
      data: {
        analysisId: savedAnalysis.id,
        amount: verification.amount,
        asset: verification.asset,
        network: "stellar:testnet",
        status: "verified",
        txHash: verification.txHash,
        fromWallet: verification.fromWallet,
        toWallet: verification.toWallet,
      },
    });

    // Return analysis result
    return NextResponse.json({
      id: savedAnalysis.id,
      riskScore: analysis.riskScore,
      threatLevel: analysis.threatLevel,
      prediction: analysis.prediction,
      recommendedAction: analysis.recommendedAction,
      details: analysis.details,
      payment: {
        txHash: verification.txHash,
        amount: verification.amount,
        asset: verification.asset,
        timestamp: verification.timestamp,
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
