import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { leads, projectName } from "@/lib/mock/data";
import { campaigns } from "@/lib/mock/calling";
import { MockTelephonyProvider } from "../server/calling-agent/telephony/mock";
import { resolveConversationEngine } from "../server/calling-agent/voice-ai/resolve";
import { StubDndProvider } from "../server/calling-agent/compliance";
import { runCampaignBatch } from "../server/calling-agent/campaign-runner";
import type { LeadDialTarget } from "../server/calling-agent/types";

function toE164(phone: string): string {
  return phone.replace(/\s+/g, "");
}

function buildDialTarget(lead: (typeof leads)[number]): LeadDialTarget | undefined {
  const campaign = campaigns.find((c) => c.projectId === lead.projectId) ?? campaigns[0];
  if (!campaign) return undefined;
  return {
    leadId: lead.id,
    leadName: lead.name,
    phone: toE164(lead.phone),
    projectId: lead.projectId,
    projectName: projectName(lead.projectId),
    language: campaign.language,
    campaignId: campaign.id,
    campaignGoal: campaign.goal,
    script: campaign.script,
  };
}

/**
 * Demo entry point: dials a handful of leads from the existing mock dataset
 * through the real workflow (compliance → dial → AI conversation → handoff).
 * Always uses MockTelephonyProvider — this is a simulation endpoint, never a
 * real dialer, so it's safe to click with no telephony account configured
 * and can't be accidentally wired into placing live calls. Conversation
 * engine auto-picks Groq, then Claude, then the scripted mock — see
 * resolveConversationEngine.
 */
export const runDemoCampaign = createServerFn({ method: "POST" })
  .validator(z.object({ count: z.number().int().min(1).max(10).default(3) }))
  .handler(async ({ data }) => {
    const targets = leads
      .filter((l) => l.status === "Hot" || l.status === "Warm")
      .slice(0, data.count)
      .map(buildDialTarget)
      .filter((t): t is LeadDialTarget => Boolean(t));

    return runCampaignBatch(targets, {
      telephony: new MockTelephonyProvider(),
      conversation: resolveConversationEngine(),
      dnd: new StubDndProvider(),
    });
  });
