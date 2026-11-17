import {
  validatePaymentRequirements,
  validateTransfer,
  assertHashNotSeen,
  USDC_TESTNET,
  type PaymentExpectation,
} from "@/lib/x402-verify";

const ASSET = USDC_TESTNET;
const PAY_TO = "GCNCKN6ZKZB2FZAVPVEU3B2RA6ETYHUDFXU473CUGBJD2U7LG4OEKFGW";
const OTHER_WALLET = "GBXQJT5DQCIW2BIX4JHTJXPIAOFUZMCLZVRNQY3A5QXCZQDWZEMSHYVL";
const OTHER_CONTRACT = "CCIDIQ56ZRGTTSPEALP6LK6IET4PF24TPW743XPL6R767SKMJHREGFTE";

const expectation: PaymentExpectation = {
  asset: ASSET,
  payTo: PAY_TO,
  maxAmount: "100000",
  exactAmount: "100000",
  network: "stellar:testnet",
};

describe("validatePaymentRequirements", () => {
  const ok = {
    scheme: "exact",
    network: "stellar:testnet",
    asset: ASSET,
    amount: "100000",
    payTo: PAY_TO,
  };

  it("accepts a valid requirement", () => {
    expect(validatePaymentRequirements(ok, expectation)).toEqual({ ok: true });
  });

  it("rejects missing requirements", () => {
    expect(validatePaymentRequirements(undefined, expectation).ok).toBe(false);
    expect(validatePaymentRequirements(null, expectation).ok).toBe(false);
  });

  it("rejects an unsupported scheme", () => {
    const result = validatePaymentRequirements({ ...ok, scheme: "upticker" }, expectation);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("scheme");
  });

  it("rejects an unexpected network", () => {
    const result = validatePaymentRequirements({ ...ok, network: "stellar:pubnet" }, expectation);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("network");
  });

  it("rejects a wrong asset contract", () => {
    const result = validatePaymentRequirements({ ...ok, asset: OTHER_CONTRACT }, expectation);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("asset");
  });

  it("rejects a malformed asset (not a C… contract)", () => {
    const result = validatePaymentRequirements({ ...ok, asset: "USDC" }, expectation);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("SEP-41");
  });

  it("rejects a wrong recipient", () => {
    const result = validatePaymentRequirements({ ...ok, payTo: OTHER_WALLET }, expectation);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("recipient");
  });

  it("rejects a malformed payTo (not a G… account)", () => {
    const result = validatePaymentRequirements({ ...ok, payTo: "not-a-wallet" }, expectation);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("Stellar account");
  });

  it("rejects an amount over the spend cap", () => {
    const result = validatePaymentRequirements({ ...ok, amount: "200000" }, expectation);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("200000");
  });

  it("rejects over-cap when no exact amount is set", () => {
    const capOnly = { ...expectation, exactAmount: undefined };
    const reqs = { ...ok, amount: "200000" };
    const result = validatePaymentRequirements(reqs, capOnly);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("cap");
  });

  it("rejects an unexpected exact amount", () => {
    const result = validatePaymentRequirements({ ...ok, amount: "50000" }, expectation);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("amount");
  });

  it("rejects a non-integer amount", () => {
    const result = validatePaymentRequirements({ ...ok, amount: "-1" }, expectation);
    expect(result.ok).toBe(false);
  });
});

describe("validateTransfer", () => {
  const transfer = { contractId: ASSET, to: PAY_TO, amount: "100000" };

  it("accepts a matching transfer", () => {
    expect(validateTransfer(transfer, expectation)).toEqual({ ok: true });
  });

  it("rejects a missing transfer", () => {
    expect(validateTransfer(null, expectation).ok).toBe(false);
  });

  it("rejects a wrong asset", () => {
    const result = validateTransfer({ ...transfer, contractId: OTHER_CONTRACT }, expectation);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("wrong asset");
  });

  it("rejects a malformed contract id", () => {
    const result = validateTransfer({ ...transfer, contractId: "X" }, expectation);
    expect(result.ok).toBe(false);
  });

  it("rejects a wrong recipient", () => {
    const result = validateTransfer({ ...transfer, to: OTHER_WALLET }, expectation);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("wrong recipient");
  });

  it("rejects a wrong amount", () => {
    const result = validateTransfer({ ...transfer, amount: "99000" }, expectation);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("wrong amount");
  });
});

describe("assertHashNotSeen", () => {
  const hash = "b2c6739a876a10ef8ffbbf58ceaf9c24f17cd3117601e21bac86198f587a6bae";

  it("accepts a new hash", () => {
    expect(assertHashNotSeen(hash, [])).toEqual({ ok: true });
  });

  it("rejects a repeated hash (replay)", () => {
    const result = assertHashNotSeen(hash, [hash]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("replay");
  });

  it("rejects a repeated hash case-insensitively", () => {
    expect(assertHashNotSeen(hash.toUpperCase(), [hash]).ok).toBe(false);
  });

  it("rejects a malformed hash", () => {
    const result = assertHashNotSeen("0xdeadbeef", []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("invalid tx hash");
  });
});
