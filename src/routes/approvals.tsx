import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, KpiCard, PageHeader } from "@/components/common/primitives";
import { ApprovalCard } from "@/components/ai/ai-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { approvals } from "@/lib/mock/data";
import { inr } from "@/lib/format";
import { ShieldCheck, Sparkles, Percent, ScrollText } from "lucide-react";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Approvals — Estatum ERP" },
      { name: "description", content: "Review pricing, discount, commission and RERA requests. Every change records who asked, who approved and why." },
      { property: "og:title", content: "Approvals — Estatum ERP" },
      { property: "og:description", content: "Pending pricing, discount, commission and compliance approvals with full audit context." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApprovalsPage,
});

const TABS = ["All", "Pricing", "Discount", "Commission", "RERA", "Other"] as const;
const KNOWN = ["Pricing", "Discount", "Commission", "RERA"];

function ApprovalsPage() {
  const [tab, setTab] = useState<string>("All");
  const filtered = approvals.filter((a) =>
    tab === "All" ? true : tab === "Other" ? !KNOWN.includes(a.kind) : a.kind === tab,
  );
  const aiRequested = approvals.filter((a) => a.requestedBy.toLowerCase().includes("ai")).length;
  const financialImpact = approvals.reduce((s, a) => s + Math.abs(a.impact ?? 0), 0);

  return (
    <AppShell>
      <PageHeader
        title="Approvals"
        subtitle="AI recommends · Human approves · System executes · Audit records"
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Pending approvals" value={String(approvals.length)} icon={ShieldCheck} accent />
        <KpiCard label="Raised by AI" value={String(aiRequested)} hint="never auto-applied" icon={Sparkles} />
        <KpiCard label="Commission requests" value={String(approvals.filter((a) => a.kind === "Commission").length)} icon={Percent} />
        <KpiCard label="Financial impact" value={inr(financialImpact)} hint="absolute value under review" icon={ScrollText} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <EmptyState
              title="Nothing waiting here"
              description="No approval requests of this type are pending right now."
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filtered.map((a) => (
                <ApprovalCard
                  key={a.id}
                  id={a.id}
                  kind={a.kind}
                  title={a.title}
                  entity={a.entity}
                  current={a.current}
                  proposed={a.proposed}
                  reason={a.reason}
                  requestedBy={a.requestedBy}
                  requires={a.requires}
                  raised={a.raised}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
