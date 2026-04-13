"use client";

import React from "react";
import { motion } from "framer-motion";
import { Send, FileWarning, PenTool, CheckCircle2, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    number: 1,
    icon: Send,
    title: "Request",
    description:
      "Agent sends analysis request with the suspicious content (message, URL, or wallet address).",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  {
    number: 2,
    icon: FileWarning,
    title: "402 Payment Required",
    description:
      "Server responds with HTTP 402 status, including payment details: amount, destination wallet, and memo.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
  {
    number: 3,
    icon: PenTool,
    title: "Sign & Pay",
    description:
      "Agent autonomously signs the Stellar payment transaction using its wallet private key.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  {
    number: 4,
    icon: CheckCircle2,
    title: "Verify & Settle",
    description:
      "Payment is verified on the Stellar network. Transaction hash is confirmed on-chain.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  {
    number: 5,
    icon: MessageSquare,
    title: "Response",
    description:
      "Fraud analysis results delivered: risk score, threat classification, and actionable recommendations.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How x402 Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A seamless 5-step payment flow that enables AI agents to pay for
            fraud detection autonomously.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-emerald-500/30 via-border to-emerald-500/30 lg:block" />

          <div className="flex flex-col gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Step dot on the line */}
                <div className="absolute left-1/2 top-6 hidden -translate-x-1/2 lg:block">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${step.bg} ring-4 ring-background`}
                  >
                    <span className={`text-xs font-bold ${step.color}`}>
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Card - alternating sides */}
                <div
                  className={cn(
                    "lg:w-[calc(50%-3rem)]",
                    index % 2 === 0 ? "lg:mr-auto" : "lg:ml-auto"
                  )}
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="flex gap-4 p-6">
                      {/* Mobile step number */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${step.border} ${step.bg} lg:hidden`}
                      >
                        <step.icon className={`h-5 w-5 ${step.color}`} />
                      </div>

                      {/* Desktop step icon */}
                      <div
                        className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${step.border} ${step.bg} lg:flex`}
                      >
                        <step.icon className={`h-6 w-6 ${step.color}`} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            STEP {step.number}
                          </span>
                        </div>
                        <h3 className="mt-1 text-lg font-semibold text-foreground">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
