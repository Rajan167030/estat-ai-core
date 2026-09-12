import type { CallSessionDeps } from "./workflow";
import { runCallSession } from "./workflow";
import type { CallResult, LeadDialTarget } from "./types";

export interface CampaignRunSummary {
  requested: number;
  completed: CallResult[];
}

/** Dials a batch of leads with bounded concurrency — mirrors how a real dialer paces outbound minutes/lines. */
export async function runCampaignBatch(
  leads: LeadDialTarget[],
  deps: CallSessionDeps,
  concurrency = 3,
): Promise<CampaignRunSummary> {
  const queue = [...leads];
  const completed: CallResult[] = [];

  async function worker() {
    while (queue.length > 0) {
      const lead = queue.shift();
      if (!lead) break;
      completed.push(await runCallSession(lead, deps));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, leads.length) }, worker));
  return { requested: leads.length, completed };
}
