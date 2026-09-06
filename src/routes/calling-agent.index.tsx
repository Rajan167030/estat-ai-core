import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable, EmptyState, KpiCard, PageHeader, SectionCard, StatusBadge, Td, Th, Meter } from "@/components/common/primitives";
import { AIPanel, ConfidenceBar, GovernanceNote } from "@/components/ai/ai-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { projectName } from "@/lib/mock/data";
import {
  callHistory, callingInsights, callingTotals, campaigns, hourlyCalls, liveCalls, outcomeBreakdown,
  type CallOutcome, type CallRecord,
} from "@/lib/mock/calling";
import { num, relativeDays } from "@/lib/format";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Pause, Play, PhoneCall, PhoneForwarded, Radio, SearchX, Sparkles, Timer, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calling-agent/")({
  head: () => ({
    meta: [
      { title: "AI Calling Agent — Estatum ERP" },
      { name: "description", content: "Run AI voice campaigns that call leads end to end — live queue, transcripts, outcomes and human handoff." },
      { property: "og:title", content: "AI Calling Agent — Estatum ERP" },
      { property: "og:description", content: "AI calls your leads, you approve every script and escalation. Live queue, transcripts and outcomes in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CallingAgentPage,
});

function mmss(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

const OUTCOME_TONE: Record<CallOutcome, "green" | "blue" | "amber" | "neutral" | "red" | "teal"> = {
  "Site visit booked": "green",
  "Follow-up scheduled": "blue",
  Interested: "teal",
  "Callback requested": "amber",
  "Not interested": "neutral",
  "Wrong number": "neutral",
  "No answer": "red",
};

function CallRow({ c }: { c: CallRecord }) {
  return (
    <tr className="transition-colors hover:bg-muted/50">
      <Td>
        <Link to="/calling-agent/$callId" params={{ callId: c.id }} className="block">
          <span className="font-medium">{c.leadName}</span>
          <span className="block text-xs text-muted-foreground">{c.id} · {c.phone}</span>
        </Link>
      </Td>
      <Td className="text-muted-foreground">{projectName(c.projectId)}</Td>
      <Td className="text-muted-foreground">{campaigns.find((x) => x.id === c.campaignId)?.name ?? "—"}</Td>
      <Td><span className="num text-sm font-semibold">{c.intentScore}</span></Td>
      <Td>{c.outcome ? <StatusBadge status={c.outcome} tone={OUTCOME_TONE[c.outcome]} /> : <StatusBadge status={c.status} tone="blue" />}</Td>
      <Td>{c.sentiment ? <StatusBadge status={c.sentiment} tone={c.sentiment === "Positive" ? "green" : c.sentiment === "Negative" ? "red" : "neutral"} /> : "—"}</Td>
      <Td className="num text-muted-foreground">{c.durationSec ? mmss(c.durationSec) : "—"}</Td>
      <Td className="text-muted-foreground">{relativeDays(c.startedAt)}</Td>
      <Td className="text-muted-foreground">{c.handoffTo ?? "—"}</Td>
      <Td>
        <Button asChild variant="ghost" size="sm">
          <Link to="/calling-agent/$callId" params={{ callId: c.id }}>Open</Link>
        </Button>
      </Td>
    </tr>
  );
}

function CallingAgentPage() {
  const [q, setQ] = useState("");
  const [campaign, setCampaign] = useState("all");
  const [outcome, setOutcome] = useState("all");
  const [autoDial, setAutoDial] = useState(true);

  const filtered = useMemo(
    () =>
      callHistory.filter(
        (c) =>
          (campaign === "all" || c.campaignId === campaign) &&
          (outcome === "all" || c.outcome === outcome) &&
          (q === "" || c.leadName.toLowerCase().includes(q.toLowerCase()) || c.id.toLowerCase().includes(q.toLowerCase())),
      ),
    [q, campaign, outcome],
  );

  const minutesPct = Math.round((callingTotals.minutesUsed / callingTotals.minutesQuota) * 100);

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          title="AI Calling Agent"
          subtitle="AI calls leads, qualifies them and books site visits — every script change and escalation stays with your team."
          actions={
            <>
              <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
                <Radio className={cn("size-4", autoDial ? "text-success" : "text-muted-foreground")} />
                <span className="text-xs font-medium">Auto-dial</span>
                <Switch
                  checked={autoDial}
                  onCheckedChange={(v) => {
                    setAutoDial(v);
                    toast(v ? "Auto-dial resumed for running campaigns." : "Auto-dial paused. Queued calls will hold.");
                  }}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => toast("Script library opened.")}>Scripts</Button>
              <Button size="sm" onClick={() => toast.success("New campaign draft created — awaiting Sales Manager approval.")}>
                <PhoneCall className="size-4" /> New campaign
              </Button>
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Calls today" value={num(callingTotals.callsToday)} change={14.2} icon={PhoneCall} accent />
          <KpiCard label="Connect rate" value={`${callingTotals.connectRate}%`} change={3.1} icon={PhoneForwarded} />
          <KpiCard label="Avg. talk time" value={mmss(callingTotals.avgDurationSec)} change={-2.4} icon={Timer} />
          <KpiCard label="Site visits booked" value={num(callingTotals.siteVisitsBooked)} change={9.6} icon={UserCheck} />
          <KpiCard label="Human handoffs" value={num(callingTotals.humanHandoffs)} hint="escalated to sales exec" icon={PhoneForwarded} />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <SectionCard
            title="Live call queue"
            description="Calls in flight right now"
            className="xl:col-span-2"
            action={
              <Button variant="outline" size="sm" onClick={() => toast("Queue paused. In-progress calls will finish.")}>
                <Pause className="size-4" /> Pause queue
              </Button>
            }
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-border">
              {liveCalls.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      c.status === "In progress" ? "animate-pulse bg-success" : c.status === "Dialling" ? "bg-warning" : "bg-muted-foreground/40",
                    )}
                  />
                  <div className="min-w-40 flex-1">
                    <Link to="/calling-agent/$callId" params={{ callId: c.id }} className="text-sm font-medium hover:underline">
                      {c.leadName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{projectName(c.projectId)} · attempt {c.attempt} · score {c.intentScore}</p>
                  </div>
                  <StatusBadge
                    status={c.status}
                    tone={c.status === "In progress" ? "green" : c.status === "Dialling" ? "amber" : "neutral"}
                  />
                  <span className="num w-12 text-right text-sm text-muted-foreground">{c.durationSec ? mmss(c.durationSec) : "—"}</span>
                  <Button variant="ghost" size="sm" onClick={() => toast.success(`Call ${c.id} handed to ${"a sales executive"} — lead notified.`)}>
                    Take over
                  </Button>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Call minutes" description="Current billing cycle">
            <div className="num text-[26px] font-semibold">{num(callingTotals.minutesUsed)}</div>
            <p className="text-xs text-muted-foreground">of {num(callingTotals.minutesQuota)} minutes used</p>
            <div className="mt-3"><Meter value={minutesPct} tone={minutesPct > 85 ? "amber" : "blue"} /></div>
            <div className="mt-4 space-y-2">
              {outcomeBreakdown.slice(0, 5).map((o) => (
                <div key={o.outcome} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{o.outcome}</span>
                  <span className="num font-semibold">{o.count}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="calls">Call history</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="intelligence">AI intelligence</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-4 grid gap-4 lg:grid-cols-2">
            {campaigns.map((c) => {
              const connectPct = c.called ? Math.round((c.connected / c.called) * 100) : 0;
              const progress = Math.round((c.called / c.totalLeads) * 100);
              return (
                <article key={c.id} className="surface flex flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="label-xs">{c.id} · {c.language} · {c.voice}</span>
                      <h3 className="mt-0.5 text-sm font-semibold">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.goal}</p>
                    </div>
                    <StatusBadge
                      status={c.status}
                      tone={c.status === "Running" ? "green" : c.status === "Paused" ? "amber" : c.status === "Scheduled" ? "blue" : "neutral"}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    {[
                      ["Leads", num(c.totalLeads)],
                      ["Called", num(c.called)],
                      ["Connected", `${connectPct}%`],
                      ["Visits", num(c.siteVisits)],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-md border border-border bg-muted/40 px-2 py-1.5">
                        <span className="label-xs">{l}</span>
                        <p className="num text-sm font-semibold">{v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span><span className="num">{progress}%</span>
                    </div>
                    <div className="mt-1"><Meter value={progress} /></div>
                  </div>

                  <p className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground italic">
                    “{c.script}”
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">Window {c.window} · {c.requiresApproval}</p>

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant={c.status === "Running" ? "outline" : "default"}
                      onClick={() =>
                        toast.success(c.status === "Running" ? `${c.name} paused.` : `${c.name} start requested — sent for approval.`)
                      }
                    >
                      {c.status === "Running" ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Start</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast("Script editor opened — changes need approval before going live.")}>
                      Edit script
                    </Button>
                  </div>
                </article>
              );
            })}
          </TabsContent>

          <TabsContent value="calls" className="mt-4 space-y-4">
            <div className="surface flex flex-wrap items-center gap-2 p-3">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lead or call ID" className="h-9 w-full sm:w-64" />
              <Select value={campaign} onValueChange={setCampaign}>
                <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Campaign" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All campaigns</SelectItem>
                  {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger className="h-9 w-[190px]"><SelectValue placeholder="Outcome" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All outcomes</SelectItem>
                  {outcomeBreakdown.map((o) => <SelectItem key={o.outcome} value={o.outcome}>{o.outcome}</SelectItem>)}
                </SelectContent>
              </Select>
              {(q || campaign !== "all" || outcome !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setQ(""); setCampaign("all"); setOutcome("all"); }}>Clear</Button>
              )}
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No calls match these filters"
                description="Try another campaign or outcome to see more of the calling activity."
                action={<Button size="sm" onClick={() => { setQ(""); setCampaign("all"); setOutcome("all"); }}>Reset filters</Button>}
              />
            ) : (
              <DataTable
                head={
                  <>
                    <Th>Lead</Th><Th>Project</Th><Th>Campaign</Th><Th>Intent</Th><Th>Outcome</Th>
                    <Th>Sentiment</Th><Th>Duration</Th><Th>When</Th><Th>Handed to</Th><Th />
                  </>
                }
              >
                {filtered.slice(0, 40).map((c) => <CallRow key={c.id} c={c} />)}
              </DataTable>
            )}
          </TabsContent>

          <TabsContent value="performance" className="mt-4 grid gap-4 lg:grid-cols-2">
            <SectionCard title="Calls by hour" description="Dialled vs connected today">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyCalls} margin={{ left: -18, right: 6, top: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} />
                    <Tooltip cursor={{ fill: "rgba(37,99,235,0.06)" }} />
                    <Bar dataKey="calls" name="Dialled" fill="hsl(215 20% 65%)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="connected" name="Connected" fill="hsl(221 83% 53%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Outcome mix" description="Last 7 days of AI calls">
              <div className="space-y-3">
                {outcomeBreakdown.map((o) => {
                  const max = outcomeBreakdown[0]!.count || 1;
                  return (
                    <div key={o.outcome}>
                      <div className="flex items-center justify-between text-xs">
                        <span>{o.outcome}</span>
                        <span className="num font-semibold">{o.count}</span>
                      </div>
                      <div className="mt-1"><Meter value={Math.round((o.count / max) * 100)} tone={OUTCOME_TONE[o.outcome] === "red" ? "red" : "blue"} /></div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="intelligence" className="mt-4 grid gap-4 lg:grid-cols-3">
            {callingInsights.map((i) => (
              <AIPanel key={i.title} title="Calling intelligence" subtitle="Voice model v2.1">
                <h3 className="text-sm font-semibold">{i.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{i.prediction}</p>
                <div className="mt-3"><ConfidenceBar value={i.confidence} /></div>
                <ul className="mt-3 space-y-1.5">
                  {i.reasons.map((r) => (
                    <li key={r} className="flex gap-2 text-xs">
                      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-ai" />{r}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 rounded-md border border-border bg-card px-3 py-2">
                  <span className="label-xs">Recommended action</span>
                  <p className="mt-0.5 text-sm font-medium">{i.action}</p>
                </div>
                <GovernanceNote requirement={i.approval} />
                <Button size="sm" className="mt-3" onClick={() => toast.success("Approval request submitted for review.")}>
                  Request approval
                </Button>
              </AIPanel>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
