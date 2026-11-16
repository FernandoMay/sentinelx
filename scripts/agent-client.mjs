#!/usr/bin/env node
// SentinelX — REAL x402 paying agent (Stellar testnet).
//
// Proves the full agentic-payment loop end to end:
//   POST /api/analyze → 402 (payment-required header) → sign auth entry →
//   facilitator verifies + settles ON-CHAIN → fraud analysis response
//
// Usage:
//   CLIENT_PRIVATE_KEY=S... node scripts/agent-client.mjs <api-url> '<payload>'
//   e.g.
//   CLIENT_PRIVATE_KEY=S... node scripts/agent-client.mjs \
//     http://localhost:3111/api/analyze '{"url":"http://bit.ly/free-xlm"}'
//
// Env: CLIENT_PRIVATE_KEY (Stellar S... secret, testnet)

import { x402Client } from "@x402/core/client";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { createEd25519Signer } from "@x402/stellar";
import { wrapFetchWithPayment } from "@x402/fetch";

const API_URL = process.argv[2] || "http://localhost:3111/api/analyze";
const PAYLOAD = process.argv[3] || '{"url":"http://bit.ly/free-xlm-giveaway"}';

const secret = process.env.CLIENT_PRIVATE_KEY;
if (!secret) {
  console.error("Missing CLIENT_PRIVATE_KEY (Stellar secret key, starts with S).");
  console.error("Tip: run scripts/setup-testnet.mjs — it writes .env.local with a funded test client.");
  process.exit(1);
}

const signer = createEd25519Signer(secret, "stellar:testnet");
console.log("[agent] payer:", signer.address);

const client = new x402Client();
client.register("stellar:testnet", new ExactStellarScheme(signer));
// SentinelX test runs may use custom SEP-41 tokens (e.g. the TUSDC e2e token).
// For production USDC-only use, keep the default spend controls instead.
if (process.env.X402_ALLOW_ANY_ASSET === "1") {
  client.setSpendControls(false);
} else {
  client.setSpendControls({
    allowedAssets: [
      { network: "stellar:testnet", asset: process.env.X402_ASSET_CONTRACT || "TUSDC" },
    ],
  });
}
const fetchWithPay = wrapFetchWithPayment(globalThis.fetch, client);

console.log("[agent] →", API_URL, PAYLOAD);

try {
  const response = await fetchWithPay(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: PAYLOAD,
  });

  const body = await response.json();
  console.log("[agent] status:", response.status);
  console.log("[agent] payment-response header:", response.headers.get("payment-response"));
  console.log("[agent] body:", JSON.stringify(body, null, 2));
} catch (error) {
  console.error("[agent] error:", error.message ?? error);
  process.exit(1);
}
