import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  Td,
  Th,
  EmptyState,
} from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { leads, partnerName, projectName, projects, SOURCES, totals } from "@/lib/mock/data";
import { inr, num, relativeDays, shortDate } from "@/lib/format";
import { Download, Flame, Plus, SearchX, Upload, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leads/")({
  head: () => ({
    meta: [
      { title: "Leads — Estatum ERP" },
      {
        name: "description",
        content:
          "Score, filter and act on every real-estate lead with source attribution and follow-up tracking.",
      },
      { property: "og:title", content: "Leads — Estatum ERP" },
      {
        property: "og:description",
        content: "Lead scoring, source attribution and follow-up discipline for your sales team.",
      },
    ],
  }),
  component: LeadsPage,
});

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="num w-6 text-sm font-semibold">{score}</span>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            score > 78 ? "bg-danger" : score > 55 ? "bg-warning" : "bg-muted-foreground",
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function LeadsPage() {
  const [q, setQ] = useState("");
  const [project, setProject] = useState("all");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");

  const filtered = useMemo(
    () =>
      leads.filter(
        (l) =>
          (project === "all" || l.projectId === project) &&
          (status === "all" || l.status === status) &&
          (source === "all" || l.source === source) &&
          (q === "" ||
            l.name.toLowerCase().includes(q.toLowerCase()) ||
            l.id.toLowerCase().includes(q.toLowerCase())),
      ),
    [q, project, status, source],
  );

  const hot = leads.filter((l) => l.status === "Hot").length;

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          title="Leads"
          subtitle={`${num(totals.leads)} total leads · ${num(filtered.length)} shown`}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => toast("Import mapping opened.")}>
                <Upload className="size-4" /> Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Export queued — you'll get an email.")}
              >
                <Download className="size-4" /> Export
              </Button>
              <Button size="sm" onClick={() => toast.success("New lead form opened.")}>
                <Plus className="size-4" /> Add lead
              </Button>
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Hot leads" value={num(hot)} change={12.4} icon={Flame} accent />
          <KpiCard label="Follow-ups due today" value="42" change={-6.2} icon={Users} />
          <KpiCard label="Site visits this week" value="128" change={8.9} icon={Users} />
          <KpiCard label="Lead → booking" value="8.4%" change={0.6} icon={Users} />
        </div>

        <div className="surface flex flex-wrap items-center gap-2 p-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or lead ID"
            className="h-9 w-full sm:w-64"
          />
          <Select value={project} onValueChange={setProject}>
            <SelectTrigger className="h-9 w-[190px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["Hot", "Warm", "Cold", "Converted", "Lost"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="h-9 w-[170px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(q || project !== "all" || status !== "all" || source !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ("");
                setProject("all");
                setStatus("all");
                setSource("all");
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No leads match these filters"
            description="Try widening the project, status or source filter to see more of your pipeline."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setQ("");
                  setProject("all");
                  setStatus("all");
                  setSource("all");
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <DataTable
            head={
              <>
                <Th>Lead</Th>
                <Th>Project</Th>
                <Th>Source</Th>
                <Th>Score</Th>
                <Th>Status</Th>
                <Th>Assigned to</Th>
                <Th>Last activity</Th>
                <Th>Next follow-up</Th>
                <Th />
              </>
            }
          >
            {filtered.slice(0, 60).map((l) => (
              <tr key={l.id} className="transition-colors hover:bg-muted/50">
                <Td>
                  <Link to="/leads/$leadId" params={{ leadId: l.id }} className="block">
                    <span className="font-medium">{l.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {l.id} · {inr(l.budget)} · {l.config}
                    </span>
                  </Link>
                </Td>
                <Td className="text-muted-foreground">{projectName(l.projectId)}</Td>
                <Td>
                  <span className="text-xs">{l.source}</span>
                  {l.partnerId ? (
                    <span className="block text-xs text-muted-foreground">
                      {partnerName(l.partnerId)}
                    </span>
                  ) : null}
                </Td>
                <Td>
                  <ScoreBar score={l.score} />
                </Td>
                <Td>
                  <StatusBadge status={l.status} />
                </Td>
                <Td className="text-muted-foreground">{l.owner}</Td>
                <Td className="text-muted-foreground">{relativeDays(l.lastActivity)}</Td>
                <Td
                  className={cn(
                    new Date(l.nextFollowUp) < new Date() ? "font-medium text-danger" : "",
                  )}
                >
                  {shortDate(l.nextFollowUp)}
                </Td>
                <Td>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/leads/$leadId" params={{ leadId: l.id }}>
                      Open
                    </Link>
                  </Button>
                </Td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </AppShell>
  );
}
