#!/usr/bin/env node
// SentinelX — x402 receipt verifier (on-chain, by hash).
//
// Validates a settled x402 payment on Stellar testnet BEFORE accepting the receipt:
//   1. Stellar RPC getTransaction(hash) → transaction must be SUCCESS
//   2. Decodes the SAC (SEP-41) `transfer` event from the transaction metadata
//   3. Validates contract id (asset), recipient (payTo) and amount
//   4. Rejects replays: a hash can never be accepted twice (state file)
//
// Usage:
//   node scripts/verify-payment.mjs <txHash> [--asset C…] [--payTo G…] [--amount <atomic>] [--cap <atomic>]
// Defaults come from .env.local / .env (X402_ASSET_CONTRACT, X402_PAY_TO, X402_ASSET_AMOUNT).

import { rpc, xdr, StrKey, scValToNative } from "@stellar/stellar-sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RPC_URL = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const STATE_FILE = join(dirname(fileURLToPath(import.meta.url)), "..", ".x402-verified.json");
const USDC_TESTNET = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

const fail = (msg) => {
  console.error(`✗ REJECTED: ${msg}`);
  process.exit(1);
};

const G_ACCOUNT = /^G[A-Z2-7]{55}$/;
const C_CONTRACT = /^C[A-Z2-7]{55}$/;
const TX_HASH = /^[0-9a-fA-F]{64}$/;

function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const p = join(process.cwd(), name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  }
}

/** Pull the SAC `transfer` event (topics: [transfer, from, to], data: i128 amount) */
async function extractTransferEvent(hash) {
  const server = new rpc.Server(RPC_URL);
  const res = await server.getTransaction(hash);
  if (res.status !== "SUCCESS") fail(`transaction not settled on-chain (status: ${res.status})`);

  // The SDK may return the meta already parsed; normalize to base64 → xdr
  const b64 =
    typeof res.resultMetaXdr === "string" ? res.resultMetaXdr : res.resultMetaXdr.toXDR("base64");
  const meta = xdr.TransactionMeta.fromXDR(b64, "base64");

  // Events live per-operation in TransactionMetaV4.operations()[i].events()
  // (protocol 24+); v3 keeps them in sorobanMeta.events(). The top-level
  // v4.events() only carries system "fee" events.
  let events = [];
  try {
    const v4 = meta.v4();
    for (const op of v4.operations()) {
      events.push(...(op.events() ?? []));
    }
  } catch {
    try {
      events = meta.v3().sorobanMeta().events() ?? [];
    } catch {
      fail("transaction has no contract events (meta v3/v4)");
    }
  }

  // scValToNative maps a ScAddress to its G…/C… string directly
  const addrFromScVal = (scVal) => {
    try {
      const n = scValToNative(scVal);
      return typeof n === "string" ? n : null;
    } catch {
      return null;
    }
  };

  for (const ev of events) {
    let topics;
    let topic0;
    try {
      topics = ev.body().v0().topics();
      // ScSymbol.sym() returns a Buffer in this SDK version — normalize to string
      topic0 = String(topics[0].sym());
    } catch {
      continue;
    }
    if (topic0 !== "transfer") continue;

    // SAC transfer layout: topics [transfer, from, to, "CODE:ISSUER"], data i128 amount
    const from = topics.length >= 2 ? addrFromScVal(topics[1]) : null;
    const to = topics.length >= 3 ? addrFromScVal(topics[2]) : null;
    let amount = null;
    try {
      const n = scValToNative(ev.body().v0().data());
      amount = typeof n === "bigint" ? n.toString() : String(n);
    } catch {
      fail("transfer event found but amount could not be decoded");
    }
    let contractId = null;
    try {
      const cid = ev.contractId?.();
      if (cid) {
        const raw = cid instanceof Uint8Array || Buffer.isBuffer(cid) ? cid : cid.value?.() ?? cid;
        contractId = StrKey.encodeContract(Buffer.from(raw));
      }
    } catch {
      /* event without contract id attached */
    }
    return { from, to, amount, contractId };
  }
  return null;
}

/** Same rules as src/lib/x402-verify.ts (kept in sync; unit-tested there) */
function validateTransfer(transfer, expectation) {
  if (!transfer) return { ok: false, reason: "no SAC transfer event found in the transaction" };
  if (!transfer.contractId || !C_CONTRACT.test(transfer.contractId)) {
    return { ok: false, reason: `transfer contract id invalid: ${transfer.contractId}` };
  }
  if (transfer.contractId !== expectation.asset) {
    return { ok: false, reason: `wrong asset: ${transfer.contractId} (expected ${expectation.asset})` };
  }
  if (!transfer.to || !G_ACCOUNT.test(transfer.to)) {
    return { ok: false, reason: `transfer recipient invalid: ${transfer.to}` };
  }
  if (transfer.to !== expectation.payTo) {
    return { ok: false, reason: `wrong recipient: ${transfer.to} (expected ${expectation.payTo})` };
  }
  if (expectation.exactAmount && transfer.amount !== expectation.exactAmount) {
    return { ok: false, reason: `wrong amount: ${transfer.amount} (expected exactly ${expectation.exactAmount})` };
  }
  return { ok: true };
}

async function main() {
  loadEnvFiles();

  const argv = process.argv.slice(2);
  const hash = argv[0];
  if (!hash || !TX_HASH.test(hash)) {
    fail("usage: node scripts/verify-payment.mjs <txHash> [--asset C…] [--payTo G…] [--amount <atomic>] [--cap <atomic>]");
  }

  const flag = (name) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  const asset = flag("asset") || process.env.X402_ASSET_CONTRACT || USDC_TESTNET;
  const payTo = flag("payTo") || process.env.X402_PAY_TO;
  const exactAmount = flag("amount") || process.env.X402_ASSET_AMOUNT || "100000";
  if (!payTo || !G_ACCOUNT.test(payTo)) fail(`invalid or missing recipient: ${payTo} (set --payTo or X402_PAY_TO)`);

  const expectation = { asset, payTo, exactAmount };

  // 1) Replay protection — never accept the same receipt hash twice
  const seen = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : [];
  if (seen.includes(hash.toLowerCase())) fail(`receipt hash already verified (replay): ${hash}`);

  // 2) On-chain check via Stellar RPC
  const transfer = await extractTransferEvent(hash);

  // 3) Validate contract / recipient / amount
  const result = validateTransfer(transfer, expectation);
  if (!result.ok) fail(result.reason);

  // 4) Accept receipt
  seen.push(hash.toLowerCase());
  writeFileSync(STATE_FILE, JSON.stringify(seen, null, 2));
  console.log(`✓ VERIFIED receipt ${hash}`);
  console.log(`  asset:      ${asset}`);
  console.log(`  from:       ${transfer.from}`);
  console.log(`  to:         ${transfer.to}`);
  console.log(`  amount:     ${transfer.amount} (atomic)`);
}

main().catch((e) => fail(e.message ?? String(e)));
