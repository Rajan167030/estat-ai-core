import { TODAY, projects, units, leads, payments, projectName } from "@/lib/mock/data";
import { callById } from "@/lib/mock/calling";
import { getDefaultListingStore } from "../scraper/listings/store";
import { groqChatJson } from "./groq-client";

/**
 * Per-item AI panels (project pricing, a single lead's score explanation, a
 * single payment's risk reasoning, a single call's next action) — smaller
 * and faster than the aggregate categories in generate.ts, so they all
 * share one fast model unless overridden.
 */
const MODEL = process.env["GROQ_MODEL_PER_ITEM"] ?? "openai/gpt-oss-20b";

const SYSTEM_PROMPT = `You are an assistant inside the Estatum real-estate ERP. You are given REAL computed facts about one specific record — never invent numbers not present in them.
Reply with ONLY a compact JSON object: {"reasons": string[] (2-4 short bullet-style reasons grounded in the facts given), "action": string (one concrete recommended next step), "confidence": number (0-100, your assessed confidence in this recommendation)}.`;

export interface ReasonedRecommendation {
  reasons: string[];
  action: string;
  confidence: number;
}

async function narrate(facts: unknown): Promise<ReasonedRecommendation> {
  const result = await groqChatJson(MODEL, SYSTEM_PROMPT, JSON.stringify(facts));
  return {
    reasons: Array.isArray(result["reasons"])
      ? (result["reasons"] as unknown[]).map(String).slice(0, 4)
      : [],
    action: String(result["action"] ?? ""),
    confidence: Math.min(100, Math.max(0, Number(result["confidence"] ?? 50))),
  };
}

export interface ProjectPricingResult extends ReasonedRecommendation {
  currentPricePerSqft: number;
  recommendedPricePerSqft: number;
  marketPricePerSqft?: number;
  availablePct: number;
}

/** Real per-project pricing signal: own inventory vs scraped market comps for the same city (see src/server/scraper/listings). */
export async function generateProjectPricing(projectId: string): Promise<ProjectPricingResult> {
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw new Error(`Unknown project: ${projectId}`);

  const projectUnits = units.filter((u) => u.projectId === projectId);
  const total = projectUnits.length;
  const available = projectUnits.filter((u) => u.status === "Available").length;
  const currentPricePerSqft = Math.round(
    projectUnits.reduce((s, u) => s + u.price / Math.max(u.saleable, 1), 0) / Math.max(total, 1),
  );
  const availablePct = Math.round((available / Math.max(total, 1)) * 100);

  const listings = await getDefaultListingStore().list({ city: project.city });
  const marketPricePerSqft = listings.length
    ? Math.round(listings.reduce((s, l) => s + (l.pricePerSqft ?? 0), 0) / listings.length)
    : undefined;

  // Data-driven suggestion, not model-invented: close half the gap to market, capped at a 6% move.
  const gap = marketPricePerSqft ? marketPricePerSqft - currentPricePerSqft : 0;
  const bump = gap > 0 ? Math.min(gap * 0.5, currentPricePerSqft * 0.06) : 0;
  const recommendedPricePerSqft = Math.round(currentPricePerSqft + bump);

  const rec = await narrate({
    project: project.name,
    city: project.city,
    currentPricePerSqft,
    marketPricePerSqft,
    recommendedPricePerSqft,
    availablePct,
    totalUnits: total,
    availableUnits: available,
  });

  return {
    ...rec,
    currentPricePerSqft,
    recommendedPricePerSqft,
    availablePct,
    ...(marketPricePerSqft ? { marketPricePerSqft } : {}),
  };
}

/** Real per-lead facts (score, activity, budget, source) narrated into a scoring explanation + next action. */
export async function generateLeadInsight(leadId: string): Promise<ReasonedRecommendation> {
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) throw new Error(`Unknown lead: ${leadId}`);

  const daysSinceActivity = Math.floor(
    (TODAY.getTime() - new Date(lead.lastActivity).getTime()) / 86_400_000,
  );
  return narrate({
    name: lead.name,
    score: lead.score,
    status: lead.status,
    budget: lead.budget,
    config: lead.config,
    source: lead.source,
    siteVisits: lead.siteVisits,
    calls: lead.calls,
    daysSinceActivity,
    nextFollowUp: lead.nextFollowUp,
  });
}

/** Real per-payment facts (delay probability, outstanding amount) narrated into collection-risk reasoning + action. */
export async function generatePaymentRiskInsight(
  paymentId: string,
): Promise<ReasonedRecommendation> {
  const payment = payments.find((p) => p.id === paymentId);
  if (!payment) throw new Error(`Unknown payment: ${paymentId}`);

  return narrate({
    customer: payment.customer,
    project: projectName(payment.projectId),
    milestone: payment.milestone,
    outstanding: payment.due - payment.paid,
    delayProbabilityPct: payment.delayProbability,
    riskLevel: payment.risk,
    status: payment.status,
  });
}

/** Real per-call facts (transcript, intent score, sentiment, objections) narrated into a next-action recommendation. */
export async function generateCallRecommendation(callId: string): Promise<ReasonedRecommendation> {
  const call = callById(callId);
  if (!call) throw new Error(`Unknown call: ${callId}`);

  return narrate({
    leadName: call.leadName,
    intentScore: call.intentScore,
    outcome: call.outcome ?? call.status,
    sentiment: call.sentiment,
    objections: call.objections,
    summary: call.summary,
    transcriptExcerpt: call.transcript
      .slice(-6)
      .map((t) => `${t.speaker}: ${t.text}`)
      .join("\n"),
  });
}
