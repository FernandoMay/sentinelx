"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Bot, Play, Square, Clock, CheckCircle2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ---- Console Log Lines ----
interface ConsoleLine {
  text: string;
  type: "info" | "success" | "warning" | "highlight" | "system" | "error";
}

const AGENT_TASKS = [
  {
    message: "CONGRATULATIONS! You have been selected for an exclusive airdrop worth $10,000 in XLM! Click here to claim now! Limited time only!",
  },
  {
    url: "https://ste!!lar-login.com/auth/verify-wallet",
  },
  {
    message: "Hey, can you send me 5 XLM to my wallet? My address is GABCDEF... Thanks for the help!",
  },
  {
    message: "URGENT: Your account will be suspended. Click this link immediately to verify: https://secure-stellar-verify.xyz/login. Enter your seed phrase to confirm.",
  },
  {
    wallet: "GDEMO4FRAUDULETWALLETADDR3SSSSXXXXXXXXXXXXXXXXXX",
  },
];

// ---- Component ----
export function AgentDemo() {
  const [isRunning, setIsRunning] = useState(false);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [summary, setSummary] = useState<{ tasks: number; cost: string; time: string } | null>(null);

  const addLine = useCallback((text: string, type: ConsoleLine["type"] = "info") => {
    setLines((prev) => [...prev, { text, type }]);
  }, []);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const runDemo = useCallback(async () => {
    setIsRunning(true);
    setLines([]);
    setElapsedMs(0);
    setSummary(null);

    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);

    addLine("> Agent initialized. Wallet: GDEMO...AGENT", "system");
    await sleep(400);
    addLine("> Connected to SentinelX API (x402 on Stellar Testnet)", "info");
    await sleep(300);
    addLine(`> Queue: ${AGENT_TASKS.length} tasks loaded`, "info");
    await sleep(500);

    try {
      // Call the real API
      addLine("> Sending batch request to /api/agent/demo...", "info");
      await sleep(600);

      const response = await fetch("/api/agent/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: AGENT_TASKS }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "API call failed");
      }

      const data = await response.json();

      // Process each result with typewriter effect
      for (let i = 0; i < data.results.length; i++) {
        const result = data.results[i];
        addLine("", "info");
        await sleep(200);
        addLine(`━━━ Task ${i + 1}: Analyzing content ━━━`, "highlight");
        await sleep(300);

        // Show input
        const inputPreview = result.task.message
          ? `"${result.task.message.substring(0, 60)}${result.task.message.length > 60 ? "..." : ""}"`
          : result.task.url
            ? `"${result.task.url}"`
            : `"${result.task.wallet}"`;
        addLine(`  Input: ${inputPreview}`, "info");
        await sleep(400);

        // x402 flow
        addLine("> Payment required: 0.01 USDC (402)", "warning");
        await sleep(500);
        addLine("> Signing transaction with wallet key...", "info");
        await sleep(600);
        addLine(`> Payment verified: ${result.txHash.substring(0, 20)}...`, "success");
        await sleep(400);
        addLine("> Running AI fraud detection engine...", "info");
        await sleep(700);

        // Show result
        const score = Math.round(result.analysis.riskScore * 100);
        const level = result.analysis.threatLevel;
        const prediction = result.analysis.prediction.replace(/_/g, " ");

        if (score >= 60) {
          addLine(`> Result: ${level} RISK — ${prediction} (${score}/100)`, "warning");
        } else {
          addLine(`> Result: ${level} RISK — ${prediction} (${score}/100)`, "success");
        }
        await sleep(200);

        const action = result.analysis.recommendedAction.replace(/_/g, " ");
        addLine(`> Recommendation: ${action}`, score >= 60 ? "warning" : "info");
        await sleep(300);
      }

      // Summary
      addLine("", "info");
      addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "system");
      addLine("> All tasks complete.", "success");
      addLine(`> Total cost: ${data.totalCost.toFixed(2)} USDC`, "highlight");
      addLine(`> Session: ${data.sessionId}`, "system");

      const elapsed = Date.now() - startTime;
      setSummary({
        tasks: data.taskCount,
        cost: `${data.totalCost.toFixed(2)} USDC`,
        time: `${(elapsed / 1000).toFixed(1)}s`,
      });
    } catch (err) {
      addLine("", "info");
      addLine(`> Error: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
      addLine("> Falling back to simulation mode...", "warning");
      await sleep(500);

      // Fallback simulation
      const mockResults = [
        { score: 92, level: "HIGH", prediction: "phishing attack" },
        { score: 85, level: "HIGH", prediction: "credential harvesting" },
        { score: 8, level: "LOW", prediction: "legitimate" },
        { score: 88, level: "HIGH", prediction: "social engineering" },
        { score: 45, level: "MEDIUM", prediction: "suspicious wallet" },
      ];

      for (let i = 0; i < AGENT_TASKS.length; i++) {
        addLine("", "info");
        await sleep(200);
        addLine(`━━━ Task ${i + 1}: Simulated analysis ━━━`, "highlight");
        await sleep(300);
        addLine("> Payment simulated: 0.01 USDC", "info");
        await sleep(400);
        addLine(`> Result: ${mockResults[i].level} RISK — ${mockResults[i].prediction} (${mockResults[i].score}/100)`, mockResults[i].score >= 60 ? "warning" : "success");
        await sleep(300);
      }

      addLine("", "info");
      addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "system");
      addLine("> All tasks complete (simulation).", "success");

      const elapsed = Date.now() - startTime;
      setSummary({
        tasks: AGENT_TASKS.length,
        cost: `${(AGENT_TASKS.length * 0.01).toFixed(2)} USDC`,
        time: `${(elapsed / 1000).toFixed(1)}s`,
      });
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
  }, [addLine]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getLineColor = (type: ConsoleLine["type"]): string => {
    switch (type) {
      case "success":
        return "text-emerald-400";
      case "warning":
        return "text-yellow-400";
      case "highlight":
        return "text-emerald-300 font-medium";
      case "error":
        return "text-red-400";
      case "system":
        return "text-muted-foreground/60";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <section id="agent-demo" className="relative py-24">
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
            Agent Demo
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Watch an autonomous AI agent process multiple fraud detection tasks
            with fully automated x402 payments on Stellar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Bot className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Autonomous Agent Console</CardTitle>
                  <CardDescription>
                    AI agent with Stellar wallet executing fraud analysis
                  </CardDescription>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-500"
                onClick={runDemo}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <Square className="mr-1.5 h-3 w-3" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-3 w-3" />
                    Run Agent Demo
                  </>
                )}
              </Button>
            </CardHeader>

            <CardContent>
              {/* Console Window */}
              <div className="rounded-lg border border-border bg-background p-4 font-mono text-xs leading-relaxed">
                {/* Terminal header */}
                <div className="mb-3 flex items-center gap-2 border-b border-border/50 pb-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                  <span className="ml-2 text-muted-foreground">
                    sentinel-agent — stellar testnet
                  </span>
                  {isRunning && (
                    <Badge
                      variant="outline"
                      className="ml-auto border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]"
                    >
                      RUNNING
                    </Badge>
                  )}
                </div>

                {/* Log output */}
                <div
                  ref={scrollRef}
                  className="max-h-80 overflow-y-auto scroll-smooth"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255,255,255,0.1) transparent",
                  }}
                >
                  {lines.length === 0 && !isRunning && (
                    <p className="text-muted-foreground/50">
                      Click &quot;Run Agent Demo&quot; to start the autonomous agent...
                    </p>
                  )}
                  {lines.map((line, i) => (
                    <div
                      key={i}
                      className={`whitespace-pre-wrap ${getLineColor(line.type)}`}
                    >
                      {line.text}
                      {isRunning && i === lines.length - 1 && line.text && (
                        <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-emerald-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              {summary && !isRunning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 grid grid-cols-3 gap-3"
                >
                  <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 p-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tasks</p>
                      <p className="text-sm font-semibold text-foreground">
                        {summary.tasks} complete
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 p-3">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Cost</p>
                      <p className="text-sm font-semibold text-foreground">
                        {summary.cost}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 p-3">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Elapsed</p>
                      <p className="text-sm font-semibold text-foreground">
                        {summary.time}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
