import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  aiBrief, collectionsTrend, funnel, inventoryDistribution, revenueByProject, salesTrend, totals,
} from "@/lib/mock/data";
import { inr, num } from "@/lib/format";
import { KpiCard, SectionCard } from "@/components/common/primitives";
import { GovernanceNote } from "@/components/ai/ai-cards";
import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";
import {
  ArrowRight, Building2, ChevronRight, IndianRupee, Percent, Sparkles, TrendingUp, Users, Wallet,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Estatum ERP" },
      { name: "description", content: "AI business brief, revenue, collections, inventory and sales funnel for your real-estate portfolio." },
      { property: "og:title", content: "Dashboard — Estatum ERP" },
      { property: "og:description", content: "AI business brief, revenue, collections, inventory and sales funnel in one operational view." },
    ],
  }),
  component: DashboardPage,
});

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-danger",
  warning: "bg-warning",
  info: "bg-primary",
  positive: "bg-teal",
};

const CHART_COLORS = ["var(--color-chart-1)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-2)"];

const axis = { stroke: "var(--color-muted-foreground)", fontSize: 11 } as const;

function ChartTooltip() {
  return (
    <Tooltip
      cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
      contentStyle={{
        borderRadius: 8,
        border: "1px solid var(--color-border)",
        background: "var(--color-card)",
        fontSize: 12,
        boxShadow: "var(--shadow-raised)",
      }}
    />
  );
}

function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Good morning, Rajan</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's what needs your attention today · Wednesday, 2 September 2026
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5">
              <TrendingUp className="size-3.5 text-teal" /> Portfolio health <b className="text-foreground">Stable</b>
            </span>
          </div>
        </div>

        {/* AI business brief */}
        <section className="overflow-hidden rounded-lg border border-ai-border bg-ai-soft">
          <header className="flex flex-wrap items-center gap-2 border-b border-ai-border/70 px-4 py-3">
            <Sparkles className="size-4 text-ai" />
            <h2 className="text-xs font-semibold tracking-[0.1em] text-ai uppercase">AI Business Brief</h2>
            <span className="text-xs text-muted-foreground">Generated 08:40 IST · Model v4.2</span>
            <span className="ml-auto text-sm font-semibold">
              14 high-priority actions require attention
            </span>
          </header>
          <ul className="grid divide-y divide-ai-border/50 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
            {aiBrief.map((item) => (
              <li key={item.id} className="border-ai-border/50 sm:border-b lg:[&:nth-child(-n+3)]:border-b lg:[&:nth-child(n+4)]:border-b-0">
                <Link
                  to={item.to}
                  className="group flex h-full items-start gap-3 px-4 py-3 transition-colors hover:bg-card/70"
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", SEVERITY_DOT[item.severity])} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{item.headline}</span>
                    <span className="block text-xs text-muted-foreground">{item.detail}</span>
                  </span>
                  <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
            <li className="flex items-center px-4 py-3">
              <Link to="/ai-insights" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ai">
                Open AI Insights Center <ArrowRight className="size-4" />
              </Link>
            </li>
          </ul>
          <div className="px-4 pb-4">
            <GovernanceNote requirement="All financial and pricing changes require human approval" />
          </div>
        </section>

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <KpiCard label="Total Revenue" value={inr(totals.revenue)} change={11.8} icon={IndianRupee} accent />
          <KpiCard label="Total Bookings" value={num(totals.bookings)} change={14.2} icon={Building2} />
          <KpiCard label="Collections" value={inr(totals.collections)} change={6.4} icon={Wallet} />
          <KpiCard label="Available Inventory" value={num(totals.available)} change={-4.1} hint="units vs last month" icon={Building2} />
          <KpiCard label="Active Leads" value={num(totals.leads)} change={9.3} icon={Users} />
          <KpiCard label="Conversion Rate" value={`${totals.conversion}%`} change={0.6} icon={Percent} />
        </div>

        {/* Charts */}
        <div className="grid gap-4 xl:grid-cols-3">
          <SectionCard title="Sales trend" description="Bookings and site visits over 12 months" className="xl:col-span-2" bodyClassName="pt-2">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesTrend} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} {...axis} />
                <YAxis tickLine={false} axisLine={false} {...axis} />
                {ChartTooltip()}
                <Line type="monotone" dataKey="bookings" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="siteVisits" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Inventory distribution" description={`${num(totals.units)} units across 12 projects`}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={inventoryDistribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="var(--color-card)">
                  {inventoryDistribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                {ChartTooltip()}
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-1 grid grid-cols-2 gap-1.5 text-xs">
              {inventoryDistribution.map((d, i) => (
                <li key={d.name} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {d.name}
                  <span className="num ml-auto font-semibold">{num(d.value)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Revenue by project" description="₹ crore, booked value">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueByProject} layout="vertical" margin={{ left: 40, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} {...axis} />
                <YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} {...axis} />
                {ChartTooltip()}
                <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Collections" description="Expected vs received, ₹ crore">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={collectionsTrend} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="recv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} {...axis} />
                <YAxis tickLine={false} axisLine={false} {...axis} />
                {ChartTooltip()}
                <Area type="monotone" dataKey="expected" stroke="var(--color-muted-foreground)" fill="none" strokeDasharray="4 4" strokeWidth={1.5} />
                <Area type="monotone" dataKey="received" stroke="var(--color-chart-1)" fill="url(#recv)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Sales funnel" description="Last 90 days">
            <ul className="space-y-2.5">
              {funnel.map((f, i) => {
                const width = (f.value / funnel[0].value) * 100;
                const conv = i === 0 ? 100 : (f.value / funnel[i - 1].value) * 100;
                return (
                  <li key={f.stage}>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-medium">{f.stage}</span>
                      <span className="num text-muted-foreground">
                        {num(f.value)} {i > 0 ? `· ${conv.toFixed(0)}%` : ""}
                      </span>
                    </div>
                    <div className="mt-1 h-6 w-full rounded-md bg-muted">
                      <div
                        className="h-6 rounded-md bg-primary/85"
                        style={{ width: `${Math.max(width, 6)}%`, opacity: 1 - i * 0.12 }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
