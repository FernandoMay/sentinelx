#!/usr/bin/env node
// SentinelX — Stellar testnet setup for a REAL end-to-end x402 payment test.
//
// Creates (idempotent, state stored in .env.local):
//   1. issuer      → funds TUSDC (custom SEP-41 token via Stellar Asset Contract)
//   2. service     → the x402 payTo wallet (receives payments)
//   3. client      → the paying agent (has TUSDC balance)
//   4. Deploys the SAC contract for TUSDC (real Soroban contract!)
//   5. Adds trustlines (service + client) and mints TUSDC to the client
//
// USDC stays the default asset; run with --asset-usdc docs in README to switch.
// Funding uses friendbot (XLM). Tokens are minted by the issuer (no Circle faucet needed).

import { Keypair, Asset, Operation, TransactionBuilder, Networks, rpc, Horizon, nativeToScVal } from "@stellar/stellar-sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const ASSET_CODE = "TUSDC"; // test USDC sentinel (custom SEP-41 token for e2e tests)
const SERVER = new rpc.Server(RPC_URL);
const HORIZON = new Horizon.Server(HORIZON_URL);

const log = (...a) => console.log("[setup]", ...a);

async function friendbotFund(kp) {
  const res = await fetch(`https://friendbot.stellar.org?addr=${kp.publicKey()}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`friendbot failed for ${kp.publicKey()}: ${res.status} ${body}`);
  }
  log("funded by friendbot:", kp.publicKey().slice(0, 8) + "…");
}

async function submitTx(sourceKp, ops) {
  const sourceAccount = await SERVER.getAccount(sourceKp.publicKey());
  let tx = new TransactionBuilder(sourceAccount, {
    fee: String(100000 + 50000 * ops.length),
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  for (const op of ops) tx = tx.addOperation(op);
  tx = await SERVER.prepareTransaction(
    tx.setTimeout(120).build()
  );
  tx.sign(sourceKp);
  const res = await SERVER.sendTransaction(tx);
  log("tx sent:", res.hash);
  await waitTx(res.hash);
  return res.hash;
}

async function waitTx(hash) {
  for (let i = 0; i < 60; i++) {
    const tx = await SERVER.getTransaction(hash);
    if (tx.status?.toUpperCase() === "SUCCESS") return tx;
    if (tx.status?.toUpperCase() === "FAILED") throw new Error("tx failed: " + JSON.stringify(tx.resultXdr ?? tx));
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("timeout waiting for tx " + hash);
}

/** Submit a classic (non-Soroban) transaction via Horizon */
async function submitClassicTx(sourceKp, ops) {
  const sourceAccount = await HORIZON.loadAccount(sourceKp.publicKey());
  let tx = new TransactionBuilder(sourceAccount, {
    fee: String(100000 + 5000 * ops.length),
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  for (const op of ops) tx = tx.addOperation(op);
  const built = tx.setTimeout(120).build();
  built.sign(sourceKp);
  const res = await HORIZON.submitTransaction(built);
  log("classic tx:", res.hash);
  return res.hash;
}

async function main() {
  const statePath = fileURLToPath(new URL("../../.env.local", import.meta.url));
  const state = {};
  if (existsSync(statePath)) {
    for (const line of readFileSync(statePath, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) state[m[1]] = m[2];
    }
  }

  if (state.ISSUER_SECRET && process.argv[2] !== "--force") {
    log("state already exists in .env.local — pass --force to regenerate");
  }

  const issuer = state.ISSUER_SECRET ? Keypair.fromSecret(state.ISSUER_SECRET) : Keypair.random();
  const service = state.SERVICE_SECRET ? Keypair.fromSecret(state.SERVICE_SECRET) : Keypair.random();
  const client = state.CLIENT_SECRET ? Keypair.fromSecret(state.CLIENT_SECRET) : Keypair.random();

  // 1) Fund accounts that were freshly created
  const fresh = [];
  if (!state.ISSUER_SECRET) fresh.push(issuer);
  if (!state.SERVICE_SECRET) fresh.push(service);
  if (!state.CLIENT_SECRET) fresh.push(client);
  for (const kp of fresh) await friendbotFund(kp);

  // 2) Deploy the Stellar Asset Contract (SAC) for TUSDC — real Soroban contract
  const asset = new Asset(ASSET_CODE, issuer.publicKey());
  await submitTx(issuer, [Operation.createStellarAssetContract({ asset })]);

  // Compute the SAC contract id for the asset (deterministic)
  const contractId = asset.contractId(NETWORK_PASSPHRASE);
  log("SAC contract:", contractId);

  // 3) Trustlines for service + client (classic ops → Horizon)
  await submitClassicTx(service, [Operation.changeTrust({ asset, limit: "1000000" })]);
  await submitClassicTx(client, [Operation.changeTrust({ asset, limit: "1000000" })]);

  // 4) Mint 10 TUSDC (10 * 1e7) to the client (issuer is the SAC admin)
  const MINT = (10n * 10_000_000n).toString();
  await submitTx(issuer, [
    Operation.invokeContractFunction({
      contract: contractId,
      function: "mint",
      args: [nativeToScVal(client.publicKey(), { type: "address" }), nativeToScVal(MINT, { type: "i128" })],
    }),
  ]);

  // 5) Persist state
  const env = [
    `# SentinelX testnet state (generated by scripts/setup-testnet.mjs) — DO NOT COMMIT`,
    `ISSUER_SECRET=${issuer.secret()}`,
    `ISSUER_PUBLIC=${issuer.publicKey()}`,
    `SERVICE_SECRET=${service.secret()}`,
    `SERVICE_PUBLIC=${service.publicKey()}`,
    `CLIENT_SECRET=${client.secret()}`,
    `CLIENT_PUBLIC=${client.publicKey()}`,
    `TUSDC_CONTRACT=${contractId}`,
    ``,
    `# Point the x402 server at the test token for e2e testing`,
    `X402_PAY_TO=${service.publicKey()}`,
    `X402_ASSET_CONTRACT=${contractId}`,
    `X402_ASSET_AMOUNT=100000`,
    `X402_ASSET_DECIMALS=7`,
    ``,
    `# The paying agent`,
    `CLIENT_PRIVATE_KEY=${client.secret()}`,
  ].join("\n");
  writeFileSync(statePath, env);
  console.log("\n=== .env.local written ===");
  console.log("TUSDC contract:", contractId);
  console.log("service (payTo):", service.publicKey());
  console.log("client (payer):", client.publicKey());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
