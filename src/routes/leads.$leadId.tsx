import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard, StatusBadge, PageHeader, Meter } from "@/components/common/primitives";
import { AIPanel, ConfidenceBar, GovernanceNote } from "@/components/ai/ai-cards";
import { Button } from "@/components/ui/button";
import { leadById, leads, partnerName, projectName } from "@/lib/mock/data";
import { inr, relativeDays, shortDate } from "@/lib/format";
import {
  ArrowLeft,
  Check,
  Mail,
  Phone,
  MapPin,
  CalendarClock,
  MessageSquare,
  Building2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { runLeadInsight } from "@/api/insights";
import type { ReasonedRecommendation } from "@/server/insights/per-item";

export const Route = createFileRoute("/leads/$leadId")({
  loader: ({ params }) => {
    const lead = leadById(params.leadId) ?? leads[0];
    if (!lead) throw notFound();
    return { lead };
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.lead.name} — Lead — Estatum ERP`
      : "Lead — Estatum ERP";
    const description =
      "Lead profile with score explanation, requirements, activity timeline and AI-recommended next action.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: LeadDetail,
  errorComponent: () => (
    <AppShell>
      <p className="text-sm text-danger">Unable to load this lead. Please retry.</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="text-sm text-muted-foreground">Lead not found.</p>
    </AppShell>
  ),
});

function LeadDetail() {
  const { lead } = Route.useLoaderData();
  const [aiResult, setAiResult] = useState<ReasonedRecommendation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function handleRegenerate() {
    setAiLoading(true);
    try {
      const result = await runLeadInsight({ data: { leadId: lead.id } });
      setAiResult(result);
      toast.success("Lead insight regenerated with AI.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate lead insight");
    } finally {
      setAiLoading(false);
    }
  }

  const timeline = [
    {
      icon: Phone,
      title: "Outbound call · 6 min",
      meta: "Discussed 3 BHK east-facing options",
      when: relativeDays(lead.lastActivity),
    },
    {
      icon: MapPin,
      title: `Site visit — ${projectName(lead.projectId)}`,
      meta: "Visited sample flat, Tower A",
      when: "4d ago",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp brochure sent",
      meta: "Opened twice, price sheet downloaded",
      when: "6d ago",
    },
    {
      icon: Building2,
      title: "Lead created",
      meta: `Source: ${lead.source}`,
      when: shortDate(lead.createdAt),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-5">
        <Link
          to="/leads"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to leads
        </Link>

        <PageHeader
          title={lead.name}
          subtitle={
            <span>
              {lead.id} · {projectName(lead.projectId)} · owned by {lead.owner}
            </span>
          }
          actions={
            <>
              <StatusBadge status={lead.status} />
              <Button variant="outline" size="sm" onClick={() => toast.success("Call logged.")}>
                <Phone className="size-4" /> Log call
              </Button>
              <Button
                size="sm"
                onClick={() => toast.success("Follow-up scheduled for today, 4:00 PM.")}
              >
                <CalendarClock className="size-4" /> Schedule follow-up
              </Button>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <SectionCard title="Customer information">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
                {[
                  ["Phone", lead.phone],
                  ["Email", lead.email],
                  ["Source", lead.source],
                  ["Channel partner", partnerName(lead.partnerId)],
                  ["Budget", inr(lead.budget)],
                  ["Configuration", lead.config],
                  ["Site visits", String(lead.siteVisits)],
                  ["Calls logged", String(lead.calls)],
                  ["Created", shortDate(lead.createdAt)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="label-xs">{k}</dt>
                    <dd className="mt-0.5 text-sm font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </SectionCard>

            <SectionCard title="Requirements">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Configuration", value: lead.config },
                  {
                    label: "Budget band",
                    value: `${inr(lead.budget * 0.9)} – ${inr(lead.budget * 1.1)}`,
                  },
                  { label: "Possession", value: "Within 18 months" },
                  { label: "Facing", value: "East preferred" },
                  { label: "Funding", value: "Home loan · pre-approved" },
                  { label: "Purpose", value: "Self-use" },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="rounded-md border border-border bg-muted/40 px-3 py-2"
                  >
                    <p className="label-xs">{r.label}</p>
                    <p className="mt-0.5 text-sm font-medium">{r.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Activity timeline" description="Calls, site visits and follow-ups">
              <ol className="relative space-y-4 border-l border-border pl-5">
                {timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[26px] grid size-5 place-items-center rounded-full border border-border bg-card">
                      <t.icon className="size-3 text-muted-foreground" />
                    </span>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.meta} · {t.when}
                    </p>
                  </li>
                ))}
              </ol>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <AIPanel title="AI Insight" subtitle="Lead scoring model">
              <div className="flex items-end gap-2">
                <span className="num text-4xl font-semibold text-ai">{lead.score}</span>
                <span className="pb-1.5 text-sm text-muted-foreground">/ 100</span>
                <span className="ml-auto pb-1.5">
                  <StatusBadge status={lead.status} />
                </span>
              </div>
              <div className="mt-3">
                <Meter value={lead.score} tone="ai" />
              </div>

              <p className="mt-4 label-xs">Why</p>
              <ul className="mt-1.5 space-y-1.5 text-xs">
                {(
                  aiResult?.reasons ?? [
                    `Budget ${inr(lead.budget)} matches available ${lead.config} inventory`,
                    `${lead.siteVisits} site visit(s) completed`,
                    `${lead.calls} calls logged with high response rate`,
                    `Source: ${lead.source} — historically 2.1x conversion`,
                  ]
                ).map((r) => (
                  <li key={r} className="flex gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-teal" />
                    {r}
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                <ConfidenceBar value={aiResult?.confidence ?? Math.min(96, lead.score + 6)} />
              </div>

              <div className="mt-3 rounded-md border border-border bg-card px-3 py-2">
                <span className="label-xs">Recommended action</span>
                <p className="mt-0.5 text-sm font-medium">
                  {aiResult?.action ?? "Call within 2 hours and block a Saturday site visit"}
                </p>
              </div>
              <GovernanceNote requirement="No approval required — operational action" />
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={aiLoading}>
                  {aiLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                </Button>
                <Button
                  className="flex-1"
                  size="sm"
                  onClick={() => toast.success("Follow-up assigned to " + lead.owner)}
                >
                  Assign follow-up
                </Button>
              </div>
            </AIPanel>

            <SectionCard title="Next follow-up">
              <p className="text-sm font-medium">{shortDate(lead.nextFollowUp)}</p>
              <p className="text-xs text-muted-foreground">
                {relativeDays(lead.nextFollowUp)} · owner {lead.owner}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => toast("Reminder sent on WhatsApp.")}
                >
                  <MessageSquare className="size-4" /> WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => toast("Email drafted.")}
                >
                  <Mail className="size-4" /> Email
                </Button>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
