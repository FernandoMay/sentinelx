"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, Activity, Zap, DollarSign, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Scams Detected", value: "10K+", icon: ShieldCheck },
  { label: "Per Request", value: "0.01 USDC", icon: DollarSign },
  { label: "Response Time", value: "<200ms", icon: Zap },
  { label: "Network", value: "Stellar Testnet", icon: Globe },
];

export function Hero() {
  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] translate-x-1/4 translate-y-1/4 rounded-full bg-emerald-600/3 blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-6 border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400"
            >
              <Activity className="mr-2 h-3.5 w-3.5" />
              AI-Powered Fraud Detection on Stellar
            </Badge>
          </motion.div>

          {/* Animated Shield / Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mb-8"
          >
            <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-2xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 overflow-hidden sm:h-32 sm:w-32">
              <img
                src="/sentinel-logo.png"
                alt="SentinelX Logo"
                className="h-full w-full object-cover rounded-2xl"
              />
            </div>
            {/* Orbiting dots */}
            <motion.div
              className="absolute h-3 w-3 rounded-full bg-emerald-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{
                top: "50%",
                left: "50%",
                marginTop: "-6px",
                marginLeft: "-6px",
                transformOrigin: "0 0",
              }}
            />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-4xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            AI Fraud Detection.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              Pay Per Request.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            SentinelX turns fraud detection into a pay-per-request AI service
            using x402 on Stellar. No API keys. No subscriptions. Just payments.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              className="bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
              onClick={() => scrollTo("#analyzer")}
            >
              <Shield className="mr-2 h-4 w-4" />
              Start Analyzing
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-border hover:bg-accent"
              onClick={() => scrollTo("#api-docs")}
            >
              View API Docs
            </Button>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm"
              >
                <stat.icon className="h-4 w-4 text-emerald-400" />
                <span className="text-xl font-bold text-foreground sm:text-2xl">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
