import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader, SectionCard, StatusBadge, Meter } from "@/components/common/primitives";
import { AIPanel, ConfidenceBar, GovernanceNote } from "@/components/ai/ai-cards";
import { Button } from "@/components/ui/button";
import { callById, campaignById } from "@/lib/mock/calling";
import { projectName } from "@/lib/mock/data";
import { relativeDays } from "@/lib/format";
import { ArrowLeft, Phone, PhoneForwarded, Play, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calling-agent/$callId")({
  loader: ({ params }) => {
    const call = callById(params.callId);
    if (!call) throw notFound();
    return { call };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Call unavailable — Estatum ERP" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.call.leadName} — AI call ${loaderData.call.id} — Estatum ERP`;
    const description = "Full AI call record: transcript, sentiment, objections, outcome and human handoff for this lead.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CallDetail,
  errorComponent: () => (
    <AppShell>
      <p className="text-sm text-danger">Unable to load this call. Please retry.</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="text-sm text-muted-foreground">Call record not found.</p>
    </AppShell>
  ),
});

function mmss(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function CallDetail() {
  const { call } = Route.useLoaderData();
  const campaign = campaignById(call.campaignId);
  const sentimentTone = call.sentiment === "Positive" ? "green" : call.sentiment === "Negative" ? "red" : "neutral";

  return (
    <AppShell>
      <div className="mb-4">
        <Link to="/calling-agent" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to calling agent
        </Link>
      </div>

      <PageHeader
        title={call.leadName}
        subtitle={`${call.id} · ${call.phone} · ${projectName(call.projectId)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success("Recording playback started")}>
              <Play className="size-4" /> Play recording
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/leads/$leadId" params={{ leadId: call.leadId }}>Open lead</Link>
            </Button>
            <Button size="sm" onClick={() => toast.success(`Handoff requested — ${call.handoffTo ?? "sales manager"} will be notified`)}>
              <PhoneForwarded className="size-4" /> Hand off to human
            </Button>
          </div>
        }
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <SectionCard title="Call summary" description={`Campaign: ${campaign?.name ?? "—"}`}>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Status" value={<StatusBadge status={call.status} />} />
              <Field label="Outcome" value={call.outcome ? <StatusBadge status={call.outcome} /> : <span className="text-sm text-muted-foreground">In flight</span>} />
              <Field label="Sentiment" value={call.sentiment ? <StatusBadge status={call.sentiment} tone={sentimentTone} /> : <span className="text-sm text-muted-foreground">—</span>} />
              <Field label="Duration" value={<span className="num text-sm font-medium">{mmss(call.durationSec)}</span>} />
              <Field label="Attempt" value={<span className="num text-sm font-medium">#{call.attempt}</span>} />
              <Field label="Started" value={<span className="text-sm">{relativeDays(call.startedAt)}</span>} />
              <Field label="Language" value={<span className="text-sm">{campaign?.language ?? "Hinglish"}</span>} />
              <Field label="Voice" value={<span className="text-sm">{campaign?.voice ?? "Aarohi (female, warm)"}</span>} />
            </div>
            <p className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-sm">{call.summary}</p>
            <div className="mt-3">
              <p className="label-xs">Intent score</p>
              <div className="mt-1.5 flex items-center gap-3">
                <Meter value={call.intentScore} />
                <span className="num text-sm font-semibold">{call.intentScore}/100</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Transcript" description="Auto-transcribed and translated on the fly. Recording retained for 90 days.">
            {call.transcript.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transcript yet — this call has not connected.</p>
            ) : (
              <ol className="space-y-3">
                {call.transcript.map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="num w-11 shrink-0 pt-1 text-xs text-muted-foreground">{t.at}</span>
                    <div
                      className={cn(
                        "flex-1 rounded-md border p-3 text-sm",
                        t.speaker === "Agent" ? "border-ai-border bg-ai-soft" : "border-border bg-card",
                      )}
                    >
                      <p className="label-xs mb-1 flex items-center gap-1.5">
                        {t.speaker === "Agent" ? <Sparkles className="size-3" /> : <Phone className="size-3" />}
                        {t.speaker === "Agent" ? "AI agent" : call.leadName}
                      </p>
                      {t.text}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>

          <SectionCard title="Objections detected" description="Extracted from the conversation for script tuning.">
            {call.objections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No objections were raised on this call.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {call.objections.map((o, i) => (
                  <li key={i}>
                    <StatusBadge status={o} tone="amber" />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <AIPanel title="Recommended next action" subtitle="Generated from this conversation">
            <p className="text-sm font-medium">{call.nextAction}</p>
            <div className="mt-3">
              <ConfidenceBar value={Math.min(96, 55 + Math.round(call.intentScore * 0.4))} />
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <li>• Intent score {call.intentScore}/100 from this conversation</li>
              <li>• Outcome recorded as {call.outcome ?? call.status}</li>
              <li>• {call.objections.length} objection(s) detected in transcript</li>
            </ul>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => toast.success("Sent for approval — Sales Manager notified")}>
                <ShieldCheck className="size-4" /> Request approval
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast("Recommendation dismissed")}>Dismiss</Button>
            </div>
            <div className="mt-4">
              <GovernanceNote requirement={campaign?.requiresApproval ?? "Sales Manager approval required"} />
            </div>
          </AIPanel>

          <SectionCard title="Handoff">
            {call.handoffTo ? (
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="size-4 text-success" />
                Assigned to <span className="font-medium">{call.handoffTo}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No human handoff yet. The AI agent will retry as per campaign rules.</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {campaign?.requiresApproval ?? "Sales Manager approval required to change the script."}
            </p>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="label-xs">{label}</p>
      <div className="mt-1">{value}</div>
    </div>
  );
}
