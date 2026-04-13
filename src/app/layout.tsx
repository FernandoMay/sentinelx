import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SentinelX — AI Fraud Detection API with x402 on Stellar",
  description: "Turn fraud detection into a pay-per-request AI service using x402 on Stellar. No API keys. No subscriptions. Just payments.",
  keywords: ["SentinelX", "fraud detection", "AI", "Stellar", "x402", "blockchain", "payment"],
  authors: [{ name: "SentinelX Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "SentinelX — AI Fraud Detection API",
    description: "Pay-per-request AI fraud detection using x402 on Stellar.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SentinelX — AI Fraud Detection API",
    description: "Pay-per-request AI fraud detection using x402 on Stellar.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
