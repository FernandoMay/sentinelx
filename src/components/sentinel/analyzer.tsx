"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  MessageSquare,
  Link2,
  Wallet,
  Layers,
  Copy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// ---- Types ----
type ThreatLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type AnalysisPhase =
  | "idle"
  | "sending"
  | "payment_required"
  | "signing"
  | "verifying"
  | "analyzing"
  | "done";

interface AnalysisCheck {
  name: string;
  triggered: boolean;
  score: number;
  description: string;
}

interface AnalysisResult {
  id: string;
  riskScore: number;
  threatLevel: ThreatLevel;
  prediction: string;
  confidence: number;
  recommendedAction: string;
  txHash: string;
  checks: AnalysisCheck[];
  indicators: string[];
}

// ---- Helpers ----
const threatColorMap: Record<ThreatLevel, string> = {
  LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  MEDIUM: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  HIGH: "bg-red-500/15 text-red-400 border-red-500/30",
  CRITICAL: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const threatIconMap: Record<ThreatLevel, React.ElementType> = {
  LOW: Shield,
  MEDIUM: AlertTriangle,
  HIGH: AlertOctagon,
  CRITICAL: AlertOctagon,
};

function getRiskColor(score: number): string {
  if (score < 25) return "text-emerald-400";
  if (score < 50) return "text-yellow-400";
  if (score < 75) return "text-orange-400";
  return "text-red-400";
}

function getProgressColor(score: number): string {
  if (score < 25) return "[&>div]:bg-emerald-500";
  if (score < 50) return "[&>div]:bg-yellow-500";
  if (score < 75) return "[&>div]:bg-orange-500";
  return "[&>div]:bg-red-500";
}

// ---- Sample Data ----
const sampleScam = {
  message:
    "CONGRATULATIONS! You have been selected for an exclusive airdrop worth $10,000 in XLM! Click here to claim: https://stellar-airdrop-free.xyz/claim now! Limited time only! Send 1 XLM to verify your wallet!",
  url: "",
  wallet: "",
};

const samplePhishing = {
  message: "",
  url: "https://ste!!lar-login.com/auth/verify-wallet",
  wallet: "",
};

const sampleSafe = {
  message: "Hey, can you send me 5 XLM to my wallet? My address is GABCDEF... Thanks for the help!",
  url: "",
  wallet: "",
};

// ---- Phase Flow Labels ----
const phaseConfig: Record<
  AnalysisPhase,
  { label: string; description: string } | null
> = {
  idle: null,
  sending: { label: "Sending Request...", description: "Preparing analysis request" },
  payment_required: {
    label: "Payment Required (402)",
    description: "0.01 USDC to access SentinelX API",
  },
  signing: { label: "Signing Payment...", description: "Authorizing Stellar transaction" },
  verifying: {
    label: "Payment Verified",
    description: "Transaction confirmed on Stellar",
  },
  analyzing: { label: "Analyzing...", description: "Running AI fraud detection" },
  done: null,
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---- Component ----
export function Analyzer() {
  const [activeTab, setActiveTab] = useState("message");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [wallet, setWallet] = useState("");
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ amount: number; asset: string; network: string; facilitator: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSample = useCallback(
    (sample: { message?: string; url?: string; wallet?: string }) => {
      setMessage(sample.message || "");
      setUrl(sample.url || "");
      setWallet(sample.wallet || "");
      if (sample.message) setActiveTab("message");
      else if (sample.url) setActiveTab("url");
      else if (sample.wallet) setActiveTab("wallet");
      setResult(null);
      setPhase("idle");
      setDetailsOpen(false);
      setError(null);
      setPaymentDetails(null);
    },
    []
  );

  const runAnalysis = useCallback(async () => {
    setResult(null);
    setDetailsOpen(false);
    setError(null);
    setPaymentDetails(null);

    const requestBody: Record<string, string> = {};
    if (message.trim()) requestBody.message = message;
    if (url.trim()) requestBody.url = url;
    if (wallet.trim()) requestBody.wallet = wallet;

    // Phase 1: Send request (expect 402)
    setPhase("sending");
    try {
      const firstResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      // Phase 2: Handle 402 Payment Required
      if (firstResponse.status === 402) {
        const paymentInfo = await firstResponse.json();
        setPaymentDetails(paymentInfo);
        setPhase("payment_required");
        await delay(1500);

        // Phase 3: Sign payment (simulated)
        setPhase("signing");
        await delay(1800);

        // Phase 4: Retry with payment header
        setPhase("verifying");
        const paymentHeader = JSON.stringify({
          version: "1",
          amount: paymentInfo.amount?.toString() || "0.01",
          asset: paymentInfo.asset || "USDC",
          network: paymentInfo.network || "stellar:testnet",
          facilitator: paymentInfo.facilitator || "",
          signature: `sim_${Date.now().toString(36)}`,
          payload: btoa(JSON.stringify({ resource: "fraud-analysis", timestamp: Date.now() })),
        });

        await delay(1000);

        // Phase 5: Retry with x-payment header
        setPhase("analyzing");
        const secondResponse = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-payment": paymentHeader,
          },
          body: JSON.stringify(requestBody),
        });

        if (!secondResponse.ok) {
          const errData = await secondResponse.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${secondResponse.status}`);
        }

        const analysisData = await secondResponse.json();

        // Map API response to our result type
        const mappedResult: AnalysisResult = {
          id: analysisData.id,
          riskScore: Math.round(analysisData.riskScore * 100),
          threatLevel: analysisData.threatLevel,
          prediction: analysisData.prediction,
          confidence: analysisData.details?.confidence ? Math.round(analysisData.details.confidence * 100) : 85,
          recommendedAction: analysisData.recommendedAction,
          txHash: analysisData.payment?.txHash || "TX_UNKNOWN",
          checks: analysisData.details?.checks || [],
          indicators: analysisData.details?.indicators || [],
        };

        setResult(mappedResult);
        setPhase("done");
      } else if (firstResponse.ok) {
        // Direct response (no payment required - shouldn't happen normally)
        const analysisData = await firstResponse.json();
        const mappedResult: AnalysisResult = {
          id: analysisData.id,
          riskScore: Math.round(analysisData.riskScore * 100),
          threatLevel: analysisData.threatLevel,
          prediction: analysisData.prediction,
          confidence: analysisData.details?.confidence ? Math.round(analysisData.details.confidence * 100) : 85,
          recommendedAction: analysisData.recommendedAction,
          txHash: "DIRECT_ACCESS",
          checks: analysisData.details?.checks || [],
          indicators: analysisData.details?.indicators || [],
        };
        setResult(mappedResult);
        setPhase("done");
      } else {
        const errData = await firstResponse.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${firstResponse.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setPhase("idle");
    }
  }, [message, url, wallet]);

  const hasInput =
    activeTab === "message"
      ? message.trim().length > 0
      : activeTab === "url"
        ? url.trim().length > 0
        : activeTab === "wallet"
          ? wallet.trim().length > 0
          : message.trim().length > 0 ||
            url.trim().length > 0 ||
            wallet.trim().length > 0;

  const isProcessing = phase !== "idle" && phase !== "done";

  return (
    <section id="analyzer" className="relative py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Fraud Analyzer
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Test the x402 payment flow live. Analyze messages, URLs, and wallet
            addresses for fraud indicators.
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              {/* Input Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="mb-4 w-full sm:w-auto">
                  <TabsTrigger value="message" className="gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Message
                  </TabsTrigger>
                  <TabsTrigger value="url" className="gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="wallet" className="gap-1.5">
                    <Wallet className="h-3.5 w-3.5" />
                    Wallet
                  </TabsTrigger>
                  <TabsTrigger value="combined" className="gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    Combined
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="message">
                  <Textarea
                    placeholder="Paste a suspicious message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-32 font-mono text-sm"
                    disabled={isProcessing}
                  />
                </TabsContent>
                <TabsContent value="url">
                  <Input
                    placeholder="https://example.com/suspicious-link"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="font-mono text-sm"
                    disabled={isProcessing}
                  />
                </TabsContent>
                <TabsContent value="wallet">
                  <Input
                    placeholder="GABCD...WXYZ (Stellar wallet address)"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className="font-mono text-sm"
                    disabled={isProcessing}
                  />
                </TabsContent>
                <TabsContent value="combined">
                  <div className="flex flex-col gap-3">
                    <Textarea
                      placeholder="Paste a suspicious message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-20 font-mono text-sm"
                      disabled={isProcessing}
                    />
                    <Input
                      placeholder="https://example.com/suspicious-link"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="font-mono text-sm"
                      disabled={isProcessing}
                    />
                    <Input
                      placeholder="GABCD...WXYZ (Stellar wallet address)"
                      value={wallet}
                      onChange={(e) => setWallet(e.target.value)}
                      className="font-mono text-sm"
                      disabled={isProcessing}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Sample Data Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="self-center text-xs text-muted-foreground">
                  Quick test:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => loadSample(sampleScam)}
                  disabled={isProcessing}
                >
                  <AlertOctagon className="mr-1 h-3 w-3 text-red-400" />
                  Scam Message
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => loadSample(samplePhishing)}
                  disabled={isProcessing}
                >
                  <AlertTriangle className="mr-1 h-3 w-3 text-yellow-400" />
                  Phishing URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => loadSample(sampleSafe)}
                  disabled={isProcessing}
                >
                  <Shield className="mr-1 h-3 w-3 text-emerald-400" />
                  Safe Message
                </Button>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400"
                >
                  {error}
                </motion.div>
              )}

              {/* Analyze Button */}
              <Button
                className="mt-6 w-full bg-emerald-600 text-white hover:bg-emerald-500"
                size="lg"
                onClick={runAnalysis}
                disabled={!hasInput || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze (0.01 USDC)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Flow Visualization */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6"
            >
              <PaymentFlow phase={phase} paymentDetails={paymentDetails} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Card */}
        <AnimatePresence>
          {phase === "done" && result && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="mt-6"
            >
              <ResultCard
                result={result}
                detailsOpen={detailsOpen}
                onToggleDetails={() => setDetailsOpen(!detailsOpen)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ---- Payment Flow Sub-Component ----
function PaymentFlow({
  phase,
  paymentDetails,
}: {
  phase: AnalysisPhase;
  paymentDetails: { amount: number; asset: string; network: string; facilitator: string } | null;
}) {
  const phases: AnalysisPhase[] = [
    "sending",
    "payment_required",
    "signing",
    "verifying",
    "analyzing",
  ];
  const currentIndex = phases.indexOf(phase);

  return (
    <Card className="border-emerald-500/20 bg-card/50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          {/* Step indicators */}
          <div className="flex gap-1.5">
            {phases.map((p, i) => (
              <div
                key={p}
                className={`h-2 w-2 rounded-full transition-all duration-500 ${
                  i <= currentIndex
                    ? "bg-emerald-400"
                    : "bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>
          {phaseConfig[phase] && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {phaseConfig[phase]!.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {phaseConfig[phase]!.description}
                </p>
              </div>
            </>
          )}
        </div>
        {phase === "payment_required" && paymentDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-yellow-400">402 Payment Required</p>
                <p>Amount: {paymentDetails.amount} {paymentDetails.asset}</p>
                <p>Network: {paymentDetails.network}</p>
                {paymentDetails.facilitator && (
                  <p className="font-mono mt-1 opacity-60">Facilitator: {paymentDetails.facilitator}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
        {phase === "verifying" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>
                Payment verified and settled on{" "}
                <span className="font-mono text-emerald-400">Stellar Testnet</span>
              </span>
            </div>
          </motion.div>
        )}
        {phase === "analyzing" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              <span>Running multi-layer fraud detection analysis...</span>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Result Card Sub-Component ----
function ResultCard({
  result,
  detailsOpen,
  onToggleDetails,
}: {
  result: AnalysisResult;
  detailsOpen: boolean;
  onToggleDetails: () => void;
}) {
  const ThreatIcon = threatIconMap[result.threatLevel];

  return (
    <Card className="overflow-hidden border-border/50 bg-card/50">
      <CardContent className="p-0">
        {/* Top Section - Risk Score */}
        <div className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
          {/* Circular Score */}
          <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-2 border-border bg-background/50">
            <span className={`text-4xl font-extrabold ${getRiskColor(result.riskScore)}`}>
              {result.riskScore}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge
                variant="outline"
                className={`${threatColorMap[result.threatLevel]} border text-xs font-semibold`}
              >
                <ThreatIcon className="mr-1 h-3 w-3" />
                {result.threatLevel} RISK
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {result.confidence}% confidence
              </Badge>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {result.prediction.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.recommendedAction.replace(/_/g, " ")}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Button size="sm" variant="destructive" className="h-8 text-xs">
                Block Content
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs">
                Flag as False Positive
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pb-4">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Risk Level</span>
            <span className={getRiskColor(result.riskScore)}>
              {result.riskScore}%
            </span>
          </div>
          <Progress
            value={result.riskScore}
            className={`h-2 ${getProgressColor(result.riskScore)}`}
          />
        </div>

        {/* Indicators */}
        {result.indicators && result.indicators.length > 0 && (
          <div className="px-6 pb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Threat Indicators</p>
            <div className="flex flex-wrap gap-1.5">
              {result.indicators.map((indicator, i) => (
                <Badge key={i} variant="outline" className="border-red-500/20 bg-red-500/5 text-xs text-red-400">
                  {indicator.length > 50 ? indicator.substring(0, 50) + "..." : indicator}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Hash */}
        <div className="border-t border-border/50 px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Payment:</span>
            <span className="font-mono text-foreground/80">
              {result.txHash.slice(0, 16)}...{result.txHash.slice(-8)}
            </span>
            <CopyButton text={result.txHash} />
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
            >
              View on Explorer
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Expandable Details */}
        <div className="border-t border-border/50">
          <button
            onClick={onToggleDetails}
            className="flex w-full items-center justify-between px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Analysis Details ({result.checks.length} checks)
            {detailsOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <AnimatePresence>
            {detailsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 px-6 pb-4">
                  {result.checks.map((check, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border/30 bg-background/30 p-3"
                    >
                      <CheckStatusIcon triggered={check.triggered} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {check.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {check.description}
                        </p>
                      </div>
                      {check.score > 0 && (
                        <span className="text-xs font-mono text-muted-foreground">
                          +{Math.round(check.score * 100)}pts
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Small Sub-Components ----
function CheckStatusIcon({ triggered }: { triggered: boolean }) {
  if (!triggered) {
    return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />;
  }
  return <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="rounded p-0.5 transition-colors hover:bg-accent"
      title="Copy to clipboard"
    >
      {copied ? (
        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}
