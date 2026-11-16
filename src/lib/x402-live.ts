// SentinelX — Real x402 protocol integration on Stellar (v2 spec)
//
// Replaces the simulated payment flow (src/lib/x402.ts, kept for demo mode) with
// the official x402 stack:
//   - @x402/core      → protocol types, x402ResourceServer, HTTPFacilitatorClient
//   - @x402/stellar   → ExactStellarScheme (Soroban SEP-41 token transfers, USDC)
//   - @x402/next      → withX402 wrapper for Next.js API routes
//   - Coinbase x402 facilitator (https://www.x402.org/facilitator) → verify + settle,
//     with sponsored fees on stellar:testnet
//
// Docs: https://developers.stellar.org/docs/build/agentic-payments/x402
// Spec: https://www.x402.org

import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Configuration (env-driven, safe defaults for Stellar testnet)
// ---------------------------------------------------------------------------

export const X402_NETWORK = process.env.X402_NETWORK || "stellar:testnet";
export const X402_FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL || "https://www.x402.org/facilitator";
export const X402_PAY_TO =
  process.env.X402_PAY_TO ||
  // SentinelX service wallet (receives USDC payments)
  "GBXQJT5DQCIW2BIX4JHTJXPIAOFUZMCLZVRNQY3A5QXCZQDWZEMSHYVL";
export const X402_PRICE = process.env.X402_PRICE || "$0.01";

/** "live" = real on-chain x402 payments. "demo" = legacy simulated flow. */
export const X402_MODE = process.env.X402_MODE === "demo" ? "demo" : "live";

/** Network as the CAIP-2 `Network` type expected by @x402/core */
export const X402_NETWORK_ID = X402_NETWORK as Network;

// USDC SEP-41 token contracts (from developers.stellar.org/docs/build/agentic-payments/x402)
export const USDC_TESTNET_ADDRESS =
  "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
export const USDC_PUBNET_ADDRESS =
  "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";

export const isLiveMode = () => X402_MODE === "live";
export const isTestnet = () => X402_NETWORK.includes("testnet");

export function getUsdcAddress(): string {
  return isTestnet() ? USDC_TESTNET_ADDRESS : USDC_PUBNET_ADDRESS;
}

// ---------------------------------------------------------------------------
// Resource server singleton (with settlement persistence hook)
// ---------------------------------------------------------------------------

let resourceServer: x402ResourceServer | null = null;

/**
 * Builds (once) the x402 resource server for the real payment flow.
 *
 * The onAfterSettle hook persists the REAL on-chain transaction hash returned
 * by the facilitator, replacing the fake tx hashes of the demo mode.
 */
export function getX402ResourceServer(): x402ResourceServer {
  if (resourceServer) return resourceServer;

  const facilitator = new HTTPFacilitatorClient({ url: X402_FACILITATOR_URL });

  resourceServer = new x402ResourceServer(facilitator)
    .register(X402_NETWORK_ID, new ExactStellarScheme())
    .onAfterSettle(async (context) => {
      const { result, requirements } = context;
      if (!result.success || !result.transaction) return;

      try {
        // The handler pre-creates a Payment row (status "pending") before
        // settlement. Link the real on-chain result back to it.
        const pending = await db.payment.findFirst({
          where: {
            status: "pending",
            network: X402_NETWORK,
            toWallet: requirements.payTo,
          },
          orderBy: { createdAt: "desc" },
        });

        if (!pending) {
          console.warn(
            `[x402] settlement received (tx ${result.transaction}) but no pending payment row found`
          );
          return;
        }

        await db.payment.update({
          where: { id: pending.id },
          data: {
            status: "verified",
            txHash: result.transaction,
            facilitator: X402_FACILITATOR_URL,
            fromWallet: result.payer ?? pending.fromWallet,
          },
        });

        if (pending.analysisId) {
          await db.analysis.update({
            where: { id: pending.analysisId },
            data: { paymentTxHash: result.transaction, paymentVerified: true },
          });
        }

        console.log(
          `[x402] settled ${requirements.amount} ${requirements.asset} on ${X402_NETWORK}: ${result.transaction}`
        );
      } catch (error) {
        // Never fail the paid response because of persistence issues
        console.error("[x402] failed to persist settlement:", error);
      }
    });

  return resourceServer;
}

// ---------------------------------------------------------------------------
// Route configuration for protected endpoints
// ---------------------------------------------------------------------------

/** Payment config protecting POST /api/analyze (one fraud analysis = one payment). */
export function getAnalyzeRouteConfig() {
  return {
    accepts: {
      scheme: "exact" as const,
      price: X402_PRICE,
      network: X402_NETWORK_ID,
      payTo: X402_PAY_TO,
      description: "SentinelX fraud analysis (message/URL/wallet/email)",
    },
  };
}

// ---------------------------------------------------------------------------
// Introspection (used by /api/x402/info)
// ---------------------------------------------------------------------------

export function getX402LiveInfo() {
  return {
    mode: X402_MODE,
    protocol: "x402-v2",
    network: X402_NETWORK,
    facilitator: X402_FACILITATOR_URL,
    payTo: X402_PAY_TO,
    price: X402_PRICE,
    asset: "USDC",
    assetContract: getUsdcAddress(),
    areFeesSponsored: true,
    supportedWallets: ["Varial", "Hana", "HOT", "Klever", "OneKey", "Scopuly"],
    agentSdk: "https://github.com/FernandoMay/sentinelx#agent-integration",
    protocolDocs: "https://www.x402.org",
    stellarDocs:
      "https://developers.stellar.org/docs/build/agentic-payments/x402",
  };
}
