import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/* ---------- Page header ---------- */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* ---------- Status badge ---------- */
export type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "teal" | "ai";

const toneClass: Record<Tone, string> = {
  neutral: "bg-slate-soft text-muted-foreground border-border",
  blue: "bg-info-soft text-primary border-primary/20",
  green: "bg-success-soft text-success border-success/20",
  amber: "bg-warning-soft text-warning border-warning/25",
  red: "bg-danger-soft text-danger border-danger/20",
  teal: "bg-teal-soft text-teal border-teal/20",
  ai: "bg-ai-soft text-ai border-ai-border",
};

const STATUS_TONES: Record<string, Tone> = {
  Hot: "red", Warm: "amber", Cold: "neutral", Converted: "green", Lost: "neutral",
  Available: "green", Hold: "amber", Booked: "blue", Sold: "neutral", "Possession Ready": "teal",
  Confirmed: "green", Pending: "amber", Cancelled: "neutral",
  Paid: "green", Partial: "amber", Due: "blue", Overdue: "red",
  Low: "green", Medium: "amber", High: "red",
  Verified: "green", "Needs Review": "amber", Rejected: "red",
  "Pending Approval": "amber", Payable: "blue", Disputed: "red",
  Platinum: "ai", Gold: "amber", Silver: "neutral",
  Upcoming: "blue", Completed: "green",
};

export function StatusBadge({ status, tone }: { status: string; tone?: Tone }) {
  const t = tone ?? STATUS_TONES[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        toneClass[t],
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

/* ---------- KPI card ---------- */
export function KpiCard({
  label,
  value,
  change,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  change?: number;
  hint?: string;
  icon?: LucideIcon;
  accent?: boolean;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="surface p-4">
      <div className="flex items-start justify-between">
        <span className="label-xs">{label}</span>
        {Icon ? (
          <Icon className={cn("size-4", accent ? "text-primary" : "text-muted-foreground")} />
        ) : null}
      </div>
      <div className="num mt-2 text-[26px] leading-8 font-semibold">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {change !== undefined ? (
          <span className={cn("inline-flex items-center gap-0.5 font-semibold", up ? "text-success" : "text-danger")}>
            {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        ) : null}
        <span className="text-muted-foreground">{hint ?? "vs last month"}</span>
      </div>
    </div>
  );
}

/* ---------- Section / chart card ---------- */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("surface flex flex-col", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <div className="rounded-lg border border-border bg-muted p-2.5">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* ---------- Skeletons ---------- */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

/* ---------- Error state ---------- */
export function ErrorState({ title, onRetry }: { title: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-danger/20 bg-danger-soft p-6 text-center">
      <h3 className="text-sm font-semibold text-danger">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        We couldn't retrieve the latest data. Please try again.
      </p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-4 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

/* ---------- Data grid helpers ---------- */
export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cn("label-xs px-3 py-2.5 text-left font-semibold whitespace-nowrap", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>;
}

export function DataTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="border-b border-border bg-muted/60">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

/* ---------- Progress bar ---------- */
export function Meter({ value, tone = "blue" }: { value: number; tone?: Tone }) {
  const fill: Record<Tone, string> = {
    neutral: "bg-muted-foreground", blue: "bg-primary", green: "bg-success",
    amber: "bg-warning", red: "bg-danger", teal: "bg-teal", ai: "bg-ai",
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full", fill[tone])} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
