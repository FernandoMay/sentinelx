// SentinelX x402 Protocol Utilities
// Simulates the x402 payment flow for the hackathon demo
// In production, this would integrate with the real x402-stellar SDK

export interface PaymentRequest {
  amount: number;
  asset: string;
  network: string;
  facilitator: string;
  resource: string;
  description: string;
}

export interface PaymentVerification {
  valid: boolean;
  txHash: string;
  fromWallet: string;
  toWallet: string;
  amount: number;
  asset: string;
  timestamp: string;
}

export interface PaymentHeader {
  version: string;
  amount: string;
  asset: string;
  network: string;
  facilitator: string;
  signature: string;
  payload: string;
}

const FACILITATOR_URL = "https://facilitator.testnet.x402.org";
const SERVICE_WALLET = "GBXQJT5DQCIW2BIX4JHTJXPIAOFUZMCLZVRNQY3A5QXCZQDWZEMSHYVL";
const PRICE_USDC = 0.01;

/**
 * Generate a 402 Payment Required response
 */
export function createPaymentRequired(resource: string): {
  status: number;
  body: PaymentRequest;
} {
  return {
    status: 402,
    body: {
      amount: PRICE_USDC,
      asset: "USDC",
      network: "stellar:testnet",
      facilitator: FACILITATOR_URL,
      resource,
      description: `Access to SentinelX ${resource} — Pay ${PRICE_USDC} USDC on Stellar testnet`,
    },
  };
}

/**
 * Simulate x402 payment creation (sign + build payment header)
 * In production: uses Soroban auth entry signing via wallet
 */
export function createPayment(paymentRequest: PaymentRequest): PaymentHeader {
  const timestamp = Date.now().toString(36);
  const nonce = crypto.randomUUID().replace(/-/g, "").substring(0, 16);

  return {
    version: "1",
    amount: paymentRequest.amount.toString(),
    asset: paymentRequest.asset,
    network: paymentRequest.network,
    facilitator: paymentRequest.facilitator,
    signature: `sim_${nonce}_${timestamp}`,
    payload: btoa(JSON.stringify({
      resource: paymentRequest.resource,
      timestamp,
      nonce,
      facilitator: paymentRequest.facilitator,
    })),
  };
}

/**
 * Simulate payment verification
 * In production: calls facilitator /verify endpoint
 */
export function verifyPayment(paymentHeader: string): PaymentVerification {
  try {
    const header: PaymentHeader = JSON.parse(paymentHeader);

    // Simulate verification with facilitator
    const txHash = `T${crypto.randomUUID().replace(/-/g, "")}`;

    return {
      valid: true,
      txHash,
      fromWallet: "GDEMO...AGENT_WALLET",
      toWallet: SERVICE_WALLET,
      amount: parseFloat(header.amount),
      asset: header.asset,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      valid: false,
      txHash: "",
      fromWallet: "",
      toWallet: "",
      amount: 0,
      asset: "USDC",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Generate a realistic Stellar testnet transaction hash for display
 */
export function generateTestnetTxHash(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let hash = "T";
  for (let i = 0; i < 55; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

/**
 * Get x402 protocol information for display
 */
export function getX402Info() {
  return {
    version: "x402-v1",
    network: "stellar:testnet",
    facilitator: FACILITATOR_URL,
    asset: "USDC",
    pricePerRequest: PRICE_USDC,
    supportedWallets: ["Freighter", "Albedo", "Hana", "HOT", "Klever", "OneKey"],
    protocolDocs: "https://www.x402.org",
    stellarDocs: "https://developers.stellar.org/docs/build/agentic-payments/x402",
  };
}
