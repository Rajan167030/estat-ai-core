import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard, Meter, PageHeader, StatusBadge } from "@/components/common/primitives";
import { possessionItems, projectName } from "@/lib/mock/data";
import { shortDate } from "@/lib/format";
import { KeyRound, Hammer, ClipboardCheck, Home } from "lucide-react";

export const Route = createFileRoute("/possession")({
  head: () => ({
    meta: [
      { title: "Possession & Handover — Estatum ERP" },
      {
        name: "description",
        content:
          "Handover pipeline from construction and snagging through final payment, possession readiness, handover and RWA transition.",
      },
      { property: "og:title", content: "Possession & Handover — Estatum ERP" },
      {
        property: "og:description",
        content: "Stage-wise possession pipeline with snag counts and handover dates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PossessionPage,
});

const STAGES = [
  "Construction",
  "Snagging",
  "Final Payment",
  "Possession Ready",
  "Handover",
  "RWA",
] as const;

function PossessionPage() {
  const count = (stage: string) => possessionItems.filter((p) => p.stage === stage).length;
  const snags = possessionItems.reduce((s, p) => s + p.snags, 0);

  return (
    <AppShell>
      <PageHeader
        title="Possession"
        subtitle="Construction → Snagging → Final payment → Possession ready → Handover → RWA"
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Units in pipeline"
          value={String(possessionItems.length)}
          icon={KeyRound}
          accent
        />
        <KpiCard label="Possession ready" value={String(count("Possession Ready"))} icon={Home} />
        <KpiCard label="Open snags" value={String(snags)} icon={ClipboardCheck} />
        <KpiCard label="In construction" value={String(count("Construction"))} icon={Hammer} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {STAGES.map((stage) => {
          const items = possessionItems.filter((p) => p.stage === stage);
          return (
            <div key={stage} className="surface flex flex-col">
              <header className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <h2 className="text-sm font-semibold">{stage}</h2>
                <span className="num rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold">
                  {items.length}
                </span>
              </header>
              <div className="space-y-2 p-3">
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No units at this stage.</p>
                ) : (
                  items.map((p) => (
                    <article key={p.id} className="rounded-md border border-border p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="num text-sm font-semibold">{p.unitCode}</span>
                        {p.snags > 0 ? (
                          <StatusBadge status={`${p.snags} snags`} tone="amber" />
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.customer}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {projectName(p.projectId)}
                      </p>
                      <div className="mt-2">
                        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{p.completion}% complete</span>
                          <span>{shortDate(p.handoverDate)}</span>
                        </div>
                        <Meter value={p.completion} tone={p.completion >= 90 ? "teal" : "blue"} />
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
