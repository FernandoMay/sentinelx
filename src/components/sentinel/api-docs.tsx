"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ---- Endpoint Data ----
interface Endpoint {
  method: "POST" | "GET";
  path: string;
  description: string;
  requestBody: string;
  response: string;
}

const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/analyze",
    description:
      "Analyze content for fraud. Accepts a message, URL, and/or wallet address. Returns a 402 on first call requiring payment via x402 protocol.",
    requestBody: JSON.stringify(
      {
        message:
          "Congratulations! You won a free airdrop of 10,000 XLM. Click here to claim: https://stellar-airdrop.xyz",
        url: "https://stellar-airdrop.xyz",
        wallet: "GBDQWTJOLIVIYRGXG4VEXFIAJQKXCXKLJMLNM55N45GQV7JCT4JOQXXX",
      },
      null,
      2
    ),
    response: JSON.stringify(
      {
        status: 200,
        data: {
          riskScore: 92,
          threatLevel: "CRITICAL",
          prediction: "phishing_attack",
          confidence: 0.97,
          recommendedAction: "Block and report immediately.",
          analysis: {
            urlCheck: { status: "fail", detail: "Domain registered 2h ago" },
            messagePattern: {
              status: "fail",
              detail: "Urgency triggers detected",
            },
            walletReputation: {
              status: "warn",
              detail: "No prior transaction history",
            },
          },
          payment: {
            amount: "0.01",
            asset: "USDC",
            txHash: "a1b2c3d4e5f6...abcdef0",
          },
        },
      },
      null,
      2
    ),
  },
  {
    method: "GET",
    path: "/api/analyze/history",
    description:
      "Retrieve paginated analysis history for the authenticated wallet. Results are sorted by most recent first.",
    requestBody: "No request body required.",
    response: JSON.stringify(
      {
        status: 200,
        data: {
          analyses: [
            {
              id: "txn_001",
              timestamp: "2025-01-15T10:30:00Z",
              inputType: "message",
              riskScore: 92,
              prediction: "phishing_attack",
              cost: "0.01 USDC",
            },
            {
              id: "txn_002",
              timestamp: "2025-01-15T10:28:00Z",
              inputType: "url",
              riskScore: 85,
              prediction: "credential_harvesting",
              cost: "0.01 USDC",
            },
          ],
          total: 47,
          page: 1,
          pageSize: 20,
        },
      },
      null,
      2
    ),
  },
  {
    method: "POST",
    path: "/api/agent/demo",
    description:
      "Run a multi-step autonomous agent demo. The agent will analyze 3 different inputs with automatic x402 payment processing.",
    requestBody: JSON.stringify(
      {
        tasks: [
          {
            type: "message",
            input:
              "CONGRATULATIONS! You won a free airdrop...",
          },
          {
            type: "url",
            input: "https://ste!!lar-login.com/auth",
          },
          {
            type: "wallet",
            input: "GBDQWTJOLIVIYRGXG4VEXFIAJQKXCXKLJMLNM55N45GQV7JCT4JOQXXX",
          },
        ],
        wallet: "GDEMO...AGENT",
      },
      null,
      2
    ),
    response: JSON.stringify(
      {
        status: 200,
        data: {
          results: [
            {
              task: 1,
              type: "message",
              riskScore: 92,
              prediction: "phishing_attack",
              cost: "0.01 USDC",
              txHash: "TX_abc123...def456",
            },
            {
              task: 2,
              type: "url",
              riskScore: 85,
              prediction: "credential_harvesting",
              cost: "0.01 USDC",
              txHash: "TX_789abc...012def",
            },
            {
              task: 3,
              type: "wallet",
              riskScore: 12,
              prediction: "legitimate_wallet",
              cost: "0.01 USDC",
              txHash: "TX_111222...333444",
            },
          ],
          summary: {
            totalTasks: 3,
            totalCost: "0.03 USDC",
            timeElapsed: "4.2s",
          },
        },
      },
      null,
      2
    ),
  },
];

const methodColors: Record<string, string> = {
  POST: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  GET: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

// ---- Component ----
export function ApiDocs() {
  return (
    <section id="api-docs" className="relative py-24">
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
            API Documentation
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            RESTful endpoints with built-in x402 payment protocol. Integrate
            fraud detection into any application or agent.
          </p>
        </motion.div>

        {/* x402 Protocol Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-400">
                x402 Payment Protocol
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                SentinelX uses the x402 protocol for HTTP-native payments. When
                a request requires payment, the server responds with a{" "}
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">
                  402 Payment Required
                </code>{" "}
                status, including Stellar payment details in the response body.
                The client signs and submits the payment, then retries the
                original request with the transaction hash.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Endpoint Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs defaultValue="0">
            <TabsList className="w-full sm:w-auto">
              {endpoints.map((ep, i) => (
                <TabsTrigger key={i} value={String(i)} className="gap-1.5">
                  <Badge
                    variant="outline"
                    className={`${methodColors[ep.method]} border text-[10px] px-1.5 py-0`}
                  >
                    {ep.method}
                  </Badge>
                  <span className="hidden text-xs sm:inline">
                    {ep.path}
                  </span>
                  <span className="text-xs sm:hidden">Endpoint {i + 1}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {endpoints.map((ep, i) => (
              <TabsContent key={i} value={String(i)}>
                <Card className="border-border/50 bg-card/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`${methodColors[ep.method]} border font-mono`}
                      >
                        {ep.method}
                      </Badge>
                      <code className="font-mono text-sm text-foreground">
                        {ep.path}
                      </code>
                    </div>
                    <CardDescription className="mt-2">
                      {ep.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Request Body */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground">
                          Request Body
                        </h4>
                      </div>
                      <CodeBlock code={ep.requestBody} />
                    </div>

                    {/* Response */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground">
                          Response
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          200 OK
                        </Badge>
                      </div>
                      <CodeBlock code={ep.response} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}

// ---- Code Block with Copy ----
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative rounded-lg border border-border bg-background p-4">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <pre className="max-h-72 overflow-auto text-xs leading-relaxed text-muted-foreground scroll-smooth">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
