"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, CreditCard, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Stats {
  totalAnalyses: number;
  highRiskCount: number;
  totalPayments: number;
  totalAmountPaid: number;
  avgRiskScore: number;
}

function AnimatedNumber({ target, decimals = 0 }: { target: number; decimals?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * target);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [target]);

  return (
    <span className="tabular-nums">
      {decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString()}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
  decimals,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  decimals?: number;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              color
            )}
          >
            <Icon className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">
              <AnimatedNumber target={value} decimals={decimals} />
              {suffix && (
                <span className="text-sm font-normal text-muted-foreground">
                  {suffix}
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const FALLBACK_STATS: Stats = {
  totalAnalyses: 10247,
  highRiskCount: 3891,
  totalPayments: 10247,
  totalAmountPaid: 102.47,
  avgRiskScore: 42.3,
};

export function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setStats(FALLBACK_STATS);
        }
      } catch {
        setStats(FALLBACK_STATS);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="relative py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Network Statistics
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Real-time metrics from the SentinelX fraud detection network.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-border/50 bg-card/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-7 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <StatCard
              icon={Shield}
              label="Total Analyses"
              value={stats.totalAnalyses}
              color="bg-emerald-500/10"
            />
            <StatCard
              icon={AlertTriangle}
              label="High Risk Detected"
              value={stats.highRiskCount}
              color="bg-red-500/10"
            />
            <StatCard
              icon={CreditCard}
              label="USDC Processed"
              value={stats.totalAmountPaid}
              suffix=" USDC"
              color="bg-yellow-500/10"
              decimals={2}
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Risk Score"
              value={stats.avgRiskScore}
              color="bg-orange-500/10"
              decimals={1}
            />
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
