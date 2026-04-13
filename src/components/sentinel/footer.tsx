"use client";

import React from "react";
import { Shield, Github, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Sentinel<span className="text-emerald-400">X</span>
            </span>
          </div>

          {/* Tagline */}
          <p className="text-center text-sm text-muted-foreground">
            AI Fraud Detection API with x402 Payment Flow on Stellar
          </p>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <a
              href="https://developers.stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              Stellar Docs
            </a>
            <a
              href="https://github.com/anish-agnihotri/x402"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              x402 Protocol
            </a>
          </div>

          <Separator className="max-w-md" />

          {/* Bottom */}
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-xs text-muted-foreground">
              Built for{" "}
              <span className="font-medium text-emerald-400">
                Stellar Hacks: Agents Hackathon
              </span>
            </p>
            <p className="text-xs text-muted-foreground/60">
              Powered by x402 on Stellar Development Foundation
            </p>
            <p className="text-xs text-muted-foreground/40">
              &copy; {new Date().getFullYear()} SentinelX. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
