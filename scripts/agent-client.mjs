#!/usr/bin/env node
// SentinelX — REAL x402 paying agent (Stellar testnet).
//
// Proves the full agentic-payment loop end to end:
//   POST /api/analyze → 402 (payment-required header) → sign auth entry →
//   facilitator verifies + settles ON-CHAIN → fraud analysis response
//
// The agent pays WITHOUT BLIND SPENDING ("sin pagar a ciegas"):
//   1. Pay-to allow-list  → only pays wallets in X402_ALLOWED_PAY_TO
//   2. Spend cap          → refuses any requirement above X402_MAX_SPEND (atomic)
//   3. Asset allow-list   → only pays the configured SEP-41 contract
//   4. Friendly errors    → insufficient balance / expired auth / replay
//
// Usage:
//   CLIENT_PRIVATE_KEY=S... node scripts/agent-client.mjs <api-url> '<payload>'
//   e.g.
//   CLIENT_PRIVATE_KEY=S... node scripts/agent-client.mjs \
//     http://localhost:3111/api/analyze '{"url":"http://bit.ly/free-xlm"}'
//
// Env: CLIENT_PRIVATE_KEY (Stellar S... secret, testnet)
//      X402_ALLOWED_PAY_TO (comma-separated G… allow-list; defaults to X402_PAY_TO)
//      X402_MAX_SPEND      (atomic cap per payment, default 100000 = $0.01)
//      X402_ASSET_CONTRACT (expected SEP-41 C… contract)

import { x402Client } from "@x402/core/client";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { createEd25519Signer } from "@x402/stellar";
import { wrapFetchWithPayment } from "@x402/fetch";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Load .env.local / .env without external deps (secrets stay OUT of the repo)
for (const name of [".env.local", ".env"]) {
  const p = join(process.cwd(), name);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const API_URL = process.argv[2] || "http://localhost:3111/api/analyze";
const PAYLOAD = process.argv[3] || '{"url":"http://bit.ly/free-xlm-giveaway"}';

const fail = (msg) => {
  console.error(`✗ [agent] ${msg}`);
  process.exit(1);
};

// ---------------------------------------------------------------------------
// Pre-payment policy: the agent validates BEFORE paying ("no pagar a ciegas")
// ---------------------------------------------------------------------------

const G_ACCOUNT = /^G[A-Z2-7]{55}$/;
const C_CONTRACT = /^C[A-Z2-7]{55}$/;

/** Recipient allow-list — the agent only pays wallets explicitly authorized here */
const allowedPayTo = (process.env.X402_ALLOWED_PAY_TO || process.env.X402_PAY_TO || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (allowedPayTo.length === 0) {
  fail("no pay-to allow-list configured (set X402_ALLOWED_PAY_TO or X402_PAY_TO) — refusing to pay blindly");
}

/** Max atomic amount per payment (spend cap) */
const MAX_SPEND = process.env.X402_MAX_SPEND || "100000";
if (!/^\d+$/.test(MAX_SPEND)) fail(`X402_MAX_SPEND is not a valid atomic integer: ${MAX_SPEND}`);

/** Expected SEP-41 asset contract (optional strict check) */
const expectedAsset = process.env.X402_ASSET_CONTRACT || null;

const secret = process.env.CLIENT_PRIVATE_KEY;
if (!secret) {
  fail("Missing CLIENT_PRIVATE_KEY (Stellar secret key, starts with S). Tip: run scripts/setup-testnet.mjs — it writes .env.local with a funded test client.");
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

// Safety policy: filter out requirements we must NOT pay.
// An empty filtered list means the client refuses to pay at all.
client.registerPolicy((version, requirements) =>
  requirements.filter((reqs) => {
    if (reqs.scheme !== "exact") {
      console.warn(`[policy] rejected: unsupported scheme ${reqs.scheme}`);
      return false;
    }
    if (reqs.network !== "stellar:testnet") {
      console.warn(`[policy] rejected: unexpected network ${reqs.network}`);
      return false;
    }
    if (!reqs.payTo || !G_ACCOUNT.test(reqs.payTo)) {
      console.warn(`[policy] rejected: malformed payTo ${reqs.payTo}`);
      return false;
    }
    if (!allowedPayTo.includes(reqs.payTo)) {
      console.warn(`[policy] rejected: recipient ${reqs.payTo} is NOT in the allow-list`);
      return false;
    }
    if (expectedAsset && reqs.asset !== expectedAsset) {
      console.warn(`[policy] rejected: asset ${reqs.asset} != expected ${expectedAsset}`);
      return false;
    }
    if (!reqs.amount || !/^\d+$/.test(reqs.amount)) {
      console.warn(`[policy] rejected: invalid amount ${reqs.amount}`);
      return false;
    }
    if (BigInt(reqs.amount) > BigInt(MAX_SPEND)) {
      console.warn(`[policy] rejected: amount ${reqs.amount} exceeds spend cap ${MAX_SPEND}`);
      return false;
    }
    console.log(`[policy] accepted: ${reqs.amount} atomic to ${reqs.payTo.slice(0, 8)}… (cap ${MAX_SPEND})`);
    return true;
  })
);

const fetchWithPay = wrapFetchWithPayment(globalThis.fetch, client);

/** Map low-level payment failures to friendly, actionable messages */
function friendlyError(error) {
  const msg = String(error?.message ?? error);
  if (/insufficient|balance/i.test(msg)) {
    return "Saldo insuficiente en la wallet del agente. Fondea la cuenta con XLM (friendbot) y añade la trustline del asset en testnet.";
  }
  if (/expired|expir/i.test(msg) || /authorization/i.test(msg) && /expire/i.test(msg)) {
    return "La autorización de pago expiró (auth entry fuera de la ventana de tiempo). Reintenta: se firma una autorización nueva.";
  }
  if (/replay|duplicate|already/i.test(msg)) {
    return "Pago duplicado detectado (replay). Se abortó para no cobrar dos veces.";
  }
  if (/allow-list|spend cap|policy/i.test(msg)) {
    return "El pago fue bloqueado por la política del agente (destinatario no autorizado o tope de gasto).";
  }
  if (/facilitator/i.test(msg)) {
    return `El facilitador rechazó la operación: ${msg}`;
  }
  return msg;
}

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
  console.error("[agent] error:", friendlyError(error));
  process.exit(1);
}
