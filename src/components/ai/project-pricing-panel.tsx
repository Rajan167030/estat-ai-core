import { useState } from "react";
import { AIPanel, ConfidenceBar, GovernanceNote } from "@/components/ai/ai-cards";
import { Button } from "@/components/ui/button";
import { num } from "@/lib/format";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { runProjectPricing } from "@/api/insights";
import type { Project } from "@/lib/mock/data";
import type { ProjectPricingResult } from "@/server/insights/per-item";

/**
 * Shared "AI Pricing Recommendation" panel — used identically on the
 * Inventory page and a project's Overview tab. Starts with the same static
 * numbers those pages always showed; "Regenerate with AI" replaces them
 * with a real Groq-narrated recommendation built on this project's actual
 * inventory + scraped market listings (see src/server/insights/per-item.ts).
 */
export function ProjectPricingPanel({
  project,
  subtitle,
}: {
  project: Project;
  subtitle?: string;
}) {
  const [result, setResult] = useState<ProjectPricingResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRun() {
    setLoading(true);
    try {
      const r = await runProjectPricing({ data: { projectId: project.id } });
      setResult(r);
      toast.success("Pricing recommendation regenerated with AI.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate pricing recommendation");
    } finally {
      setLoading(false);
    }
  }

  const current = result?.currentPricePerSqft ?? project.ratePerSqft;
  const recommended = result?.recommendedPricePerSqft ?? Math.round(project.ratePerSqft * 1.04);
  const confidence = result?.confidence ?? 82;

  return (
    <AIPanel title="AI Pricing Recommendation" {...(subtitle ? { subtitle } : {})}>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-border bg-card px-3 py-2">
          <p className="label-xs">Current price</p>
          <p className="num text-sm font-semibold">₹{num(current)}/sq.ft</p>
        </div>
        <div className="rounded-md border border-ai-border bg-card px-3 py-2">
          <p className="label-xs text-ai">Recommended</p>
          <p className="num text-sm font-semibold text-ai">₹{num(recommended)}/sq.ft</p>
        </div>
      </div>
      <div className="mt-3">
        <ConfidenceBar value={confidence} />
      </div>
      {result ? (
        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          {result.reasons.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
          {result.marketPricePerSqft ? (
            <li>
              • Micro-market comparable:{" "}
              <span className="font-semibold text-foreground">
                ₹{num(result.marketPricePerSqft)}
              </span>
            </li>
          ) : null}
        </ul>
      ) : (
        <dl className="mt-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Demand (30d)</dt>
            <dd className="font-semibold text-success">↑ 18%</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Available inventory</dt>
            <dd className="font-semibold text-danger">↓ 12%</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Micro-market comparable</dt>
            <dd className="font-semibold">₹{num(Math.round(project.ratePerSqft * 1.06))}</dd>
          </div>
        </dl>
      )}
      <GovernanceNote requirement="Requires Sales Manager approval" />
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" onClick={handleRun} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() =>
            toast.success(
              result ? `Approval requested: ${result.action}` : "Price approval submitted.",
            )
          }
        >
          Request approval
        </Button>
      </div>
    </AIPanel>
  );
}
