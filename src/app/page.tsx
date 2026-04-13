import { Navbar } from "@/components/sentinel/navbar";
import { Hero } from "@/components/sentinel/hero";
import { Features } from "@/components/sentinel/features";
import { HowItWorks } from "@/components/sentinel/how-it-works";
import { Analyzer } from "@/components/sentinel/analyzer";
import { AgentDemo } from "@/components/sentinel/agent-demo";
import { ApiDocs } from "@/components/sentinel/api-docs";
import { StatsBar } from "@/components/sentinel/stats-bar";
import { Footer } from "@/components/sentinel/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <Features />
        <HowItWorks />
        <Analyzer />
        <AgentDemo />
        <ApiDocs />
      </main>
      <Footer />
    </div>
  );
}
