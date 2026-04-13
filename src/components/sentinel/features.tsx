"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Brain,
  Bot,
  KeyRound,
  Activity,
  Coins,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: DollarSign,
    title: "Pay-Per-Request",
    description:
      "Only pay for what you use. Each analysis costs just 0.01 USDC on Stellar testnet.",
  },
  {
    icon: Brain,
    title: "AI-Powered Detection",
    description:
      "Multi-layer analysis engine with pattern matching, heuristic scoring, and behavioral analysis.",
  },
  {
    icon: Bot,
    title: "Agent Native",
    description:
      "Built for AI agents. Autonomous x402 payment flow enables fully automated security workflows.",
  },
  {
    icon: KeyRound,
    title: "No API Keys",
    description:
      "Eliminate credential management. Authentication is handled through Stellar wallet signatures.",
  },
  {
    icon: Activity,
    title: "Real-Time Scoring",
    description:
      "Get instant risk scores from 0-100 with detailed threat classification and actionable recommendations.",
  },
  {
    icon: Coins,
    title: "Stellar Settlement",
    description:
      "Every payment settles on Stellar with full transparency. USDC stablecoin for price stability.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function Features() {
  return (
    <section id="features" className="relative py-24">
      {/* Section divider gradient */}
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
            Why SentinelX?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A new paradigm for fraud detection — transparent, affordable, and
            built for the agent economy.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="group relative h-full border-border/50 bg-card/50 transition-all duration-300 hover:border-emerald-500/30 hover:bg-card/80">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-emerald-500/10 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/15">
                    <feature.icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
