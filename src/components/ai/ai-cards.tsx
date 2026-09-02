import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldCheck, Check, X } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

/** Wrapper for any AI-generated surface. Indigo is reserved for AI only. */
export function AIPanel({
  title = "AI Insight",
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-ai-border bg-ai-soft", className)}>
      <header className="flex items-center gap-2 border-b border-ai-border/70 px-4 py-2.5">
        <Sparkles className="size-4 text-ai" />
        <h2 className="text-xs font-semibold tracking-[0.08em] text-ai uppercase">{title}</h2>
        {subtitle ? <span className="ml-auto text-xs text-muted-foreground">{subtitle}</span> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ConfidenceBar({ value, label = "Confidence" }: { value: number; label?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="num font-semibold text-ai">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ai/15">
        <div className="h-full rounded-full bg-ai" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/** AI recommends -> human approves. Never render a recommendation as applied. */
export function GovernanceNote({ requirement }: { requirement: string }) {
  return (
    <p className="mt-3 flex items-start gap-1.5 rounded-md border border-border bg-card px-2.5 py-2 text-xs text-muted-foreground">
      <ShieldCheck className="mt-px size-3.5 shrink-0 text-teal" />
      <span>
        AI recommends · Human approves · System executes · Audit records — <b className="font-semibold text-foreground">{requirement}</b>
      </span>
    </p>
  );
}

export function AIInsightCard({
  category,
  title,
  prediction,
  confidence,
  reasons,
  action,
  approval,
}: {
  category: string;
  title: string;
  prediction: string;
  confidence: number;
  reasons: string[];
  action: string;
  approval: string;
}) {
  return (
    <AIPanel title={category} subtitle={`Model v4.2`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{prediction}</p>
      <div className="mt-3">
        <ConfidenceBar value={confidence} />
      </div>
      <ul className="mt-3 space-y-1.5">
        {reasons.map((r) => (
          <li key={r} className="flex gap-2 text-xs text-foreground">
            <Check className="mt-0.5 size-3.5 shrink-0 text-teal" />
            {r}
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-md border border-border bg-card px-3 py-2">
        <span className="label-xs">Recommended action</span>
        <p className="mt-0.5 text-sm font-medium">{action}</p>
      </div>
      <GovernanceNote requirement={approval} />
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => toast.success("Approval request submitted for review.")}>
          Request approval
        </Button>
        <Button size="sm" variant="outline" onClick={() => toast("Insight dismissed for 7 days.")}>
          Dismiss
        </Button>
      </div>
    </AIPanel>
  );
}

export function ApprovalCard({
  id,
  kind,
  title,
  entity,
  current,
  proposed,
  reason,
  requestedBy,
  requires,
  raised,
}: {
  id: string;
  kind: string;
  title: string;
  entity: string;
  current: string;
  proposed: string;
  reason: string;
  requestedBy: string;
  requires: string;
  raised: string;
}) {
  const aiRequested = requestedBy.toLowerCase().includes("ai");
  return (
    <article className="surface flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="label-xs">{kind} · {id}</span>
          <h3 className="mt-0.5 text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{entity}</p>
        </div>
        {aiRequested ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-ai-border bg-ai-soft px-2 py-0.5 text-[11px] font-semibold text-ai">
            <Sparkles className="size-3" /> AI
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-border bg-muted/50 px-3 py-2">
          <span className="label-xs">Current</span>
          <p className="num text-sm font-semibold">{current}</p>
        </div>
        <div className="rounded-md border border-primary/25 bg-info-soft px-3 py-2">
          <span className="label-xs text-primary">Proposed</span>
          <p className="num text-sm font-semibold text-primary">{proposed}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{reason}</p>

      <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs">
        <dt className="text-muted-foreground">Requested by</dt>
        <dd className="text-right font-medium">{requestedBy}</dd>
        <dt className="text-muted-foreground">Requires</dt>
        <dd className="text-right font-medium">{requires}</dd>
        <dt className="text-muted-foreground">Raised</dt>
        <dd className="text-right font-medium">{raised}</dd>
      </dl>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={() => toast.success(`${id} approved. Change queued and logged to audit.`)}
        >
          <Check className="size-4" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => toast(`${id} rejected. Requester notified.`)}
        >
          <X className="size-4" /> Reject
        </Button>
      </div>
    </article>
  );
}
