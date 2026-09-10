import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  DataTable, EmptyState, KpiCard, PageHeader, SectionCard, StatusBadge, Td, Th,
} from "@/components/common/primitives";
import { AIPanel, ConfidenceBar, GovernanceNote } from "@/components/ai/ai-cards";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { payments, projectName, projects } from "@/lib/mock/data";
import { inr, shortDate } from "@/lib/format";
import { Wallet, AlertTriangle, CalendarClock, TrendingDown, PhoneCall } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payments & Collections — Estatum ERP" },
      { name: "description", content: "Collections dashboard: what is collected, due this week, overdue, and which customers carry the highest delay risk." },
      { property: "og:title", content: "Payments & Collections — Estatum ERP" },
      { property: "og:description", content: "Milestone collections, outstanding demands and AI collection-risk scoring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const [q, setQ] = useState("");
  const [project, setProject] = useState("all");
  const [status, setStatus] = useState("all");

  const collected = payments.reduce((s, p) => s + p.paid, 0);
  const outstanding = payments.reduce((s, p) => s + Math.max(0, p.due - p.paid), 0);
  const overdue = payments.filter((p) => p.status === "Overdue");
  const dueSoon = payments.filter((p) => p.status === "Due");
  const highRisk = payments
    .filter((p) => p.risk === "High" && p.status !== "Paid")
    .sort((a, b) => b.delayProbability - a.delayProbability);

  const rows = useMemo(
    () =>
      payments.filter((p) => {
        if (q && !`${p.customer} ${p.unitCode}`.toLowerCase().includes(q.toLowerCase())) return false;
        if (project !== "all" && p.projectId !== project) return false;
        if (status !== "all" && p.status !== status) return false;
        return true;
      }).slice(0, 120),
    [q, project, status],
  );

  const top = highRisk[0];

  return (
    <AppShell>
      <PageHeader title="Payments" subtitle="Milestone collections, outstanding demands and delay risk" />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total collected" value={inr(collected)} icon={Wallet} accent />
        <KpiCard label="Due this week" value={inr(dueSoon.reduce((s, p) => s + (p.due - p.paid), 0))} icon={CalendarClock} />
        <KpiCard label="Overdue" value={inr(overdue.reduce((s, p) => s + (p.due - p.paid), 0))} hint={`${overdue.length} demands`} icon={AlertTriangle} />
        <KpiCard label="High risk" value={String(highRisk.length)} hint="predicted delay" icon={TrendingDown} />
        <KpiCard label="Outstanding" value={inr(outstanding)} icon={Wallet} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Collection risk" description="Highest predicted delay, ranked by AI" className="lg:col-span-1">
          {top ? (
            <AIPanel title="Collection risk" subtitle={top.unitCode}>
              <p className="text-sm font-semibold">{top.customer}</p>
              <p className="text-xs text-muted-foreground">
                {projectName(top.projectId)} · {top.milestone} · {inr(top.due - top.paid)} outstanding
              </p>
              <div className="mt-3">
                <ConfidenceBar value={top.delayProbability} label="Delay probability" />
              </div>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                <li>Two previous milestones paid after the due date.</li>
                <li>Home-loan disbursement pending with the bank.</li>
                <li>No response to the last two collection reminders.</li>
              </ul>
              <Button
                size="sm"
                className="mt-3 w-full"
                onClick={() => toast.success(`Collection call scheduled with ${top.customer}.`)}
              >
                <PhoneCall className="size-4" /> Schedule collection call
              </Button>
              <GovernanceNote requirement="Any waiver or reschedule needs Finance Head approval" />
            </AIPanel>
          ) : (
            <EmptyState icon={Wallet} title="No high-risk collections" description="Every customer is currently tracking on schedule." />
          )}
        </SectionCard>

        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer or unit" className="h-9 w-full sm:w-64" />
            <Select value={project} onValueChange={setProject}>
              <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Due">Due</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3">
            {rows.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No overdue payments"
                description="Great — all customers matching these filters are currently up to date."
              />
            ) : (
              <DataTable
                head={<><Th>Customer</Th><Th>Unit</Th><Th className="text-right">Due</Th><Th>Due date</Th><Th className="text-right">Paid</Th><Th className="text-right">Outstanding</Th><Th>Risk</Th><Th>Status</Th></>}
              >
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/50">
                    <Td className="font-medium">{p.customer}</Td>
                    <Td className="num">{p.unitCode}</Td>
                    <Td className="num text-right">{inr(p.due)}</Td>
                    <Td className="text-muted-foreground">{shortDate(p.dueDate)}</Td>
                    <Td className="num text-right">{inr(p.paid)}</Td>
                    <Td className="num text-right font-semibold">{inr(Math.max(0, p.due - p.paid))}</Td>
                    <Td><StatusBadge status={p.risk} /></Td>
                    <Td><StatusBadge status={p.status} /></Td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
