// SentinelX — x402 payment validation utilities
//
// Pure, dependency-free validation used by:
//   - the paying agent (reject requirements before paying: "no pagar a ciegas")
//   - the receipt verifier (validate on-chain transfer data against expectations)
//
// Safety rules (bootcamp criteria: tope de gasto, errores y seguridad):
//   amount   → must match exactly the expected atomic amount (or be <= cap)
//   payTo    → must be in the allow-list of known recipient wallets
//   asset    → must be the expected SEP-41 contract (default: testnet USDC)
//   network  → must be a Stellar CAIP-2 network we trust
//   hash reuse → a receipt hash can never be accepted twice (replay protection)

export const USDC_TESTNET = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
export const USDC_PUBNET = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
export const G_STELLAR = /^G[A-Z2-7]{55}$/; // Stellar Ed25519 account (emisor/destinatario)
export const C_CONTRACT = /^C[A-Z2-7]{55}$/; // Soroban contract id (contrato USDC/SEP-41)

/** Expectations for a payment/transfer */
export interface PaymentExpectation {
  /** Expected SEP-41 contract id (C…) */
  asset: string;
  /** Expected recipient wallet (G…) */
  payTo: string;
  /** Maximum atomic amount the payer will accept/has budgeted */
  maxAmount: string;
  /** Optional exact atomic amount required */
  exactAmount?: string;
  /** Optional network check (CAIP-2, e.g. stellar:testnet) */
  network?: string;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

function isNonNegativeInteger(s: string): boolean {
  return /^\d+$/.test(s) && BigInt(s) >= BigInt(0);
}

/** Validate a payment requirement (as delivered in a 402 / payment-required header) */
export function validatePaymentRequirements(
  reqs: { scheme?: string; network?: string; asset?: string; amount?: string; payTo?: string } | undefined | null,
  expectation: PaymentExpectation
): ValidationResult {
  if (!reqs) return { ok: false, reason: "no payment requirements provided" };
  if (reqs.scheme !== "exact") return { ok: false, reason: `unsupported scheme: ${reqs.scheme}` };
  if (expectation.network && reqs.network !== expectation.network) {
    return { ok: false, reason: `unexpected network: ${reqs.network} (expected ${expectation.network})` };
  }
  if (!reqs.asset || !C_CONTRACT.test(reqs.asset)) {
    return { ok: false, reason: `asset is not a valid SEP-41 contract: ${reqs.asset}` };
  }
  if (reqs.asset !== expectation.asset) {
    return { ok: false, reason: `unexpected asset contract: ${reqs.asset} (expected ${expectation.asset})` };
  }
  if (!reqs.payTo || !G_STELLAR.test(reqs.payTo)) {
    return { ok: false, reason: `payTo is not a valid Stellar account: ${reqs.payTo}` };
  }
  if (reqs.payTo !== expectation.payTo) {
    return { ok: false, reason: `unexpected recipient: ${reqs.payTo} (expected ${expectation.payTo})` };
  }
  if (!reqs.amount || !isNonNegativeInteger(reqs.amount)) {
    return { ok: false, reason: `amount is not a valid atomic integer: ${reqs.amount}` };
  }
  if (expectation.exactAmount && reqs.amount !== expectation.exactAmount) {
    return { ok: false, reason: `unexpected amount: ${reqs.amount} (expected exactly ${expectation.exactAmount})` };
  }
  if (BigInt(reqs.amount) > BigInt(expectation.maxAmount)) {
    return { ok: false, reason: `spend cap exceeded: ${reqs.amount} > cap ${expectation.maxAmount}` };
  }
  return { ok: true };
}

/** Validate an on-chain transfer observed for a receipt */
export function validateTransfer(
  transfer: { contractId?: string; to?: string; amount?: string } | undefined | null,
  expectation: PaymentExpectation
): ValidationResult {
  if (!transfer) return { ok: false, reason: "no transfer found in transaction" };
  if (!transfer.contractId || !C_CONTRACT.test(transfer.contractId)) {
    return { ok: false, reason: `transfer contract id invalid: ${transfer.contractId}` };
  }
  if (transfer.contractId !== expectation.asset) {
    return { ok: false, reason: `wrong asset: ${transfer.contractId} (expected ${expectation.asset})` };
  }
  if (!transfer.to || !G_STELLAR.test(transfer.to)) {
    return { ok: false, reason: `transfer recipient invalid: ${transfer.to}` };
  }
  if (transfer.to !== expectation.payTo) {
    return { ok: false, reason: `wrong recipient: ${transfer.to} (expected ${expectation.payTo})` };
  }
  if (!transfer.amount || !isNonNegativeInteger(transfer.amount)) {
    return { ok: false, reason: `transfer amount invalid: ${transfer.amount}` };
  }
  const expected = expectation.exactAmount ?? expectation.maxAmount;
  if (transfer.amount !== expected) {
    return {
      ok: false,
      reason:
        expectation.exactAmount
          ? `wrong amount: ${transfer.amount} (expected exactly ${expectation.exactAmount})`
          : `amount ${transfer.amount} exceeds cap ${expectation.maxAmount}`,
    };
  }
  return { ok: true };
}

/** Replay protection: a receipt hash must never be accepted twice */
export function assertHashNotSeen(hash: string, seen: Iterable<string>): ValidationResult {
  if (!/^[0-9a-fA-F]{64}$/.test(hash)) return { ok: false, reason: `invalid tx hash: ${hash}` };
  const h = hash.toLowerCase();
  for (const s of seen) {
    if (s.toLowerCase() === h) return { ok: false, reason: `receipt hash already verified (replay): ${hash}` };
  }
  return { ok: true };
}
