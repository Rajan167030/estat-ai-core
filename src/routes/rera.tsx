import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  EmptyState,
  KpiCard,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectName, reraItems } from "@/lib/mock/data";
import { inr, relativeDays, shortDate } from "@/lib/format";
import {
  ScrollText,
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  DatabaseZap,
  Building2,
  Loader2,
} from "lucide-react";
import {
  getScrapeSources,
  runReraScrape,
  runAllReraScrapes,
  runListingScrapeFn,
  runAllListingScrapes,
} from "@/api/scraper";
import type { ScrapeRunSummary } from "@/server/scraper/types";
import type { ListingRunSummary } from "@/server/scraper/listings/pipeline";
import { toast } from "sonner";

interface SourceMeta {
  key: string;
  label: string;
  homepageUrl: string;
}

export const Route = createFileRoute("/rera")({
  head: () => ({
    meta: [
      { title: "RERA Compliance — Estatum ERP" },
      {
        name: "description",
        content:
          "RERA filing calendar: upcoming and overdue obligations, severity, penalty exposure and completion status per project.",
      },
      { property: "og:title", content: "RERA Compliance — Estatum ERP" },
      {
        property: "og:description",
        content: "Filing deadlines, penalty exposure and compliance status across projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReraPage,
});

const HI: Record<string, string> = {
  Upcoming: "आगामी",
  Overdue: "समय-सीमा बीत चुकी",
  Completed: "पूर्ण",
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

  const [reraSources, setReraSources] = useState<SourceMeta[]>([]);
  const [listingSources, setListingSources] = useState<SourceMeta[]>([]);
  const [reraSourceKey, setReraSourceKey] = useState<string>("");
  const [listingSourceKey, setListingSourceKey] = useState<string>("");
  const [reraRuns, setReraRuns] = useState<ScrapeRunSummary[]>([]);
  const [listingRuns, setListingRuns] = useState<ListingRunSummary[]>([]);
  const [reraBusy, setReraBusy] = useState(false);
  const [listingBusy, setListingBusy] = useState(false);

  useEffect(() => {
    getScrapeSources().then((sources) => {
      setReraSources(sources.rera);
      setListingSources(sources.listings);
      setReraSourceKey((prev) => prev || (sources.rera[0]?.key ?? ""));
      setListingSourceKey((prev) => prev || (sources.listings[0]?.key ?? ""));
    });
  }, []);

  async function handleRunRera(all: boolean) {
    setReraBusy(true);
    try {
      const results = all
        ? await runAllReraScrapes()
        : [await runReraScrape({ data: { source: reraSourceKey } })];
      setReraRuns((prev) => [...results, ...prev]);
      toast(
        `Ran ${results.length} RERA source${results.length > 1 ? "s" : ""} — ${results.reduce((s, r) => s + r.fetched, 0)} projects fetched.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "RERA scrape failed");
    } finally {
      setReraBusy(false);
    }
  }

  async function handleRunListing(all: boolean) {
    setListingBusy(true);
    try {
      const results = all
        ? await runAllListingScrapes()
        : [await runListingScrapeFn({ data: { source: listingSourceKey } })];
      setListingRuns((prev) => [...results, ...prev]);
      toast(
        `Ran ${results.length} listing source${results.length > 1 ? "s" : ""} — ${results.reduce((s, r) => s + r.fetched, 0)} listings fetched.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Listing scrape failed");
    } finally {
      setListingBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title={hindi ? "रेरा अनुपालन" : "RERA compliance"}
        subtitle={
          hindi
            ? "फाइलिंग की समय-सीमा, जोखिम और संभावित जुर्माना"
            : "Filing deadlines, risk severity and penalty exposure"
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => setHindi((v) => !v)}>
            {hindi ? "English" : "हिन्दी"}
          </Button>
        }
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={hindi ? "आगामी" : "Upcoming"}
          value={String(upcoming.length)}
          icon={ScrollText}
          accent
        />
        <KpiCard
          label={hindi ? "समय-सीमा बीत चुकी" : "Overdue"}
          value={String(overdue.length)}
          icon={AlertTriangle}
        />
        <KpiCard
          label={hindi ? "पूर्ण" : "Completed"}
          value={String(completed.length)}
          icon={CheckCircle2}
        />
        <KpiCard
          label={hindi ? "संभावित जुर्माना" : "Penalty exposure"}
          value={inr(penalty)}
          icon={IndianRupee}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SectionCard
          title={hindi ? "समय-रेखा" : "Compliance timeline"}
          description={hindi ? "आने वाली फाइलिंग" : "Next filings, earliest first"}
          className="lg:col-span-2"
        >
          {timeline.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nothing pending"
              description="Every RERA obligation is filed and closed."
            />
          ) : (
            <ol className="space-y-3">
              {timeline.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2.5"
                >
                  <div className="w-24 shrink-0">
                    <div className="num text-sm font-semibold">{shortDate(r.due)}</div>
                    <div className="text-xs text-muted-foreground">{relativeDays(r.due)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.task}</p>
                    <p className="text-xs text-muted-foreground">
                      {projectName(r.projectId)} · {r.authority}
                    </p>
                  </div>
                  <StatusBadge
                    status={`${r.severity} risk`}
                    tone={
                      r.severity === "High" ? "red" : r.severity === "Medium" ? "amber" : "green"
                    }
                  />
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

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="RERA registries"
          description="Government registration data — 6 state portals wired, each behind its own site-specific parser (see src/server/scraper/registry.ts)."
        >
          <div className="flex flex-wrap items-center gap-2">
            <Select value={reraSourceKey} onValueChange={setReraSourceKey}>
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue placeholder="Choose a state RERA" />
              </SelectTrigger>
              <SelectContent>
                {reraSources.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRunRera(false)}
              disabled={reraBusy || !reraSourceKey}
            >
              {reraBusy ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <DatabaseZap className="mr-1.5 size-3.5" />
              )}
              Run
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRunRera(true)}
              disabled={reraBusy}
            >
              Run all {reraSources.length || ""}
            </Button>
          </div>

          {reraRuns.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={DatabaseZap}
                title="No scrape run yet"
                description="Pick a state and click Run, or Run all to pull every registered source."
              />
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              {reraRuns.map((run, i) => (
                <div key={`${run.source}-${run.ranAt}-${i}`} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {reraSources.find((s) => s.key === run.source)?.label ?? run.source}
                    </span>
                    <StatusBadge
                      status={run.mode === "live" ? "Live fetch" : "Stub sample"}
                      tone={run.mode === "live" ? "green" : "amber"}
                    />
                    <span>
                      {run.fetched} fetched · {run.inserted} new · {run.updated} updated ·{" "}
                      {relativeDays(run.ranAt)}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {run.sample.map((p) => (
                      <li
                        key={`${p.source}:${p.sourceId}`}
                        className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2.5 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{p.projectName}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.reraNumber} · {p.promoterName} · {p.district}
                          </p>
                        </div>
                        <StatusBadge
                          status={p.status}
                          tone={
                            p.status === "Registered"
                              ? "green"
                              : p.status === "Extended"
                                ? "amber"
                                : "red"
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Listing portals (market intel)"
          description="99acres, MagicBricks, Housing.com, NoBroker, Square Yards — these ban scraping in their ToS, so this pulls fixture samples; go live via each platform's partner/data-feed API (see src/server/scraper/listings)."
        >
          <div className="flex flex-wrap items-center gap-2">
            <Select value={listingSourceKey} onValueChange={setListingSourceKey}>
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue placeholder="Choose a portal" />
              </SelectTrigger>
              <SelectContent>
                {listingSources.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRunListing(false)}
              disabled={listingBusy || !listingSourceKey}
            >
              {listingBusy ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Building2 className="mr-1.5 size-3.5" />
              )}
              Run
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRunListing(true)}
              disabled={listingBusy}
            >
              Run all {listingSources.length || ""}
            </Button>
          </div>

          {listingRuns.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={Building2}
                title="No scrape run yet"
                description="Pick a portal and click Run, or Run all to pull every listing source."
              />
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              {listingRuns.map((run, i) => (
                <div key={`${run.source}-${run.ranAt}-${i}`} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {listingSources.find((s) => s.key === run.source)?.label ?? run.source}
                    </span>
                    <StatusBadge status="Stub sample" tone="amber" />
                    <span>
                      {run.fetched} fetched · {run.inserted} new · {run.updated} updated ·{" "}
                      {relativeDays(run.ranAt)}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {run.sample.map((l) => (
                      <li
                        key={`${l.source}:${l.listingId}`}
                        className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2.5 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{l.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {l.projectName} · {l.locality}, {l.city} · ₹{l.pricePerSqft}/sqft
                          </p>
                        </div>
                        {l.possessionStatus && (
                          <StatusBadge status={l.possessionStatus} tone="blue" />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
