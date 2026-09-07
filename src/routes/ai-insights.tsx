import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard, PageHeader, SectionCard, StatusBadge } from "@/components/common/primitives";
import { AIInsightCard } from "@/components/ai/ai-cards";
import { insights } from "@/lib/mock/data";
import { Sparkles, ShieldCheck, Activity, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/ai-insights")({
  head: () => ({
    meta: [
      { title: "AI Insights Center — Estatum ERP" },
      { name: "description", content: "Lead intelligence, collection risk, pricing intelligence, sales forecast and anomaly detection — each with confidence, reasoning and approval requirement." },
      { property: "og:title", content: "AI Insights Center — Estatum ERP" },
      { property: "og:description", content: "Every AI prediction with its reasoning, confidence and the human approval it needs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AIInsightsPage,
});

const ANOMALIES = [
  {
    title: "Conversion drop — Amit Sharma",
    detail: "Site-visit to booking conversion fell 42% versus his 90-day baseline.",
    severity: "High",
    action: "Schedule pipeline review with Sales Head",
  },
  {
    title: "Unusual discount pattern — Tower B",
    detail: "Average discount ₹3.8L against a ₹1.2L baseline across 9 bookings this month.",
    severity: "High",
    action: "Send to Sales Head for discount policy review",
  },
  {
    title: "Payment reminders unanswered",
    detail: "14 accounts have not responded to the last two reminders — 3x the usual rate.",
    severity: "Medium",
    action: "Assign relationship-manager calls",
  },
];

function AIInsightsPage() {
  const avgConfidence = Math.round(insights.reduce((s, i) => s + i.confidence, 0) / Math.max(insights.length, 1));

  return (
    <AppShell>
      <PageHeader
        title="AI Insights Center"
        subtitle="Predictions with reasoning, confidence and the approval each one needs before anything changes."
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active insights" value={String(insights.length)} icon={Sparkles} accent />
        <KpiCard label="Average confidence" value={`${avgConfidence}%`} icon={Activity} />
        <KpiCard label="Needing approval" value={String(insights.filter((i) => !i.approval.startsWith("No approval")).length)} icon={ShieldCheck} />
        <KpiCard label="Anomalies detected" value={String(ANOMALIES.length)} icon={TrendingDown} />
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {insights.map((i) => (
          <AIInsightCard
            key={i.id}
            category={i.category}
            title={i.title}
            prediction={i.prediction}
            confidence={i.confidence}
            reasons={i.reasons}
            action={i.action}
            approval={i.approval}
          />
        ))}
      </div>

      <SectionCard className="mt-6" title="Anomaly detection" description="Deviations from the rolling 90-day baseline.">
        <ul className="divide-y divide-border">
          {ANOMALIES.map((a) => (
            <li key={a.title} className="flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-[240px] flex-1">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
              </div>
              <StatusBadge status={a.severity} tone={a.severity === "High" ? "red" : "amber"} />
              <p className="text-xs text-muted-foreground">{a.action}</p>
            </li>
          ))}
        </ul>
      </SectionCard>
    </AppShell>
  );
}
