import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  EmptyState, KpiCard, PageHeader, SectionCard, StatusBadge,
} from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { projectName, reraItems } from "@/lib/mock/data";
import { inr, relativeDays, shortDate } from "@/lib/format";
import { ScrollText, AlertTriangle, CheckCircle2, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/rera")({
  head: () => ({
    meta: [
      { title: "RERA Compliance — Estatum ERP" },
      { name: "description", content: "RERA filing calendar: upcoming and overdue obligations, severity, penalty exposure and completion status per project." },
      { property: "og:title", content: "RERA Compliance — Estatum ERP" },
      { property: "og:description", content: "Filing deadlines, penalty exposure and compliance status across projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReraPage,
});

const HI: Record<string, string> = {
  "Upcoming": "आगामी",
  "Overdue": "समय-सीमा बीत चुकी",
  "Completed": "पूर्ण",
};

function ReraPage() {
  const [hindi, setHindi] = useState(false);
  const upcoming = reraItems.filter((r) => r.status === "Upcoming");
  const overdue = reraItems.filter((r) => r.status === "Overdue");
  const completed = reraItems.filter((r) => r.status === "Completed");
  const penalty = [...upcoming, ...overdue].reduce((s, r) => s + r.penalty, 0);

  const timeline = [...reraItems]
    .filter((r) => r.status !== "Completed")
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

  return (
    <AppShell>
      <PageHeader
        title={hindi ? "रेरा अनुपालन" : "RERA compliance"}
        subtitle={hindi ? "फाइलिंग की समय-सीमा, जोखिम और संभावित जुर्माना" : "Filing deadlines, risk severity and penalty exposure"}
        actions={
          <Button variant="outline" size="sm" onClick={() => setHindi((v) => !v)}>
            {hindi ? "English" : "हिन्दी"}
          </Button>
        }
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={hindi ? "आगामी" : "Upcoming"} value={String(upcoming.length)} icon={ScrollText} accent />
        <KpiCard label={hindi ? "समय-सीमा बीत चुकी" : "Overdue"} value={String(overdue.length)} icon={AlertTriangle} />
        <KpiCard label={hindi ? "पूर्ण" : "Completed"} value={String(completed.length)} icon={CheckCircle2} />
        <KpiCard label={hindi ? "संभावित जुर्माना" : "Penalty exposure"} value={inr(penalty)} icon={IndianRupee} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SectionCard
          title={hindi ? "समय-रेखा" : "Compliance timeline"}
          description={hindi ? "आने वाली फाइलिंग" : "Next filings, earliest first"}
          className="lg:col-span-2"
        >
          {timeline.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nothing pending" description="Every RERA obligation is filed and closed." />
          ) : (
            <ol className="space-y-3">
              {timeline.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2.5">
                  <div className="w-24 shrink-0">
                    <div className="num text-sm font-semibold">{shortDate(r.due)}</div>
                    <div className="text-xs text-muted-foreground">{relativeDays(r.due)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.task}</p>
                    <p className="text-xs text-muted-foreground">{projectName(r.projectId)} · {r.authority}</p>
                  </div>
                  <StatusBadge status={`${r.severity} risk`} tone={r.severity === "High" ? "red" : r.severity === "Medium" ? "amber" : "green"} />
                  <StatusBadge status={hindi ? (HI[r.status] ?? r.status) : r.status} />
                  <span className="num text-sm font-semibold">{inr(r.penalty)}</span>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>

        <SectionCard
          title={hindi ? "पूर्ण हुई फाइलिंग" : "Completed filings"}
          description={hindi ? "इस तिमाही में जमा" : "Submitted this quarter"}
        >
          {completed.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing filed yet this quarter.</p>
          ) : (
            <ul className="space-y-2">
              {completed.slice(0, 10).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{r.task}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{shortDate(r.due)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
