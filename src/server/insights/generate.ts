import type { Insight } from "@/lib/mock/data";
import { groqChatJson } from "./groq-client";
import {
  computeLeadDecayFacts,
  computeCollectionRiskFacts,
  computePricingFacts,
  computeSalesForecastFacts,
  computeAnomalyFacts,
} from "./compute";

/**
 * Different category, different model — matched to how much reasoning the
 * task actually needs rather than using one model everywhere. Lead/collection/
 * anomaly narration is "describe these numbers" (fast, cheap model is
 * plenty); pricing and forecast ask the model to weigh multiple real signals
 * against each other, which benefits from the bigger model. Override any of
 * these per-category via env vars without touching code.
 *
 * Both are reasoning models (they "think" in a separate field before the
 * real answer) — groq-client.ts gives them enough max_tokens headroom to
 * finish that thinking and still produce the JSON.
 */
const MODELS: Record<Insight["category"], string> = {
  "Lead Intelligence": process.env["GROQ_MODEL_LEAD_INTEL"] ?? "openai/gpt-oss-20b",
  "Collection Risk": process.env["GROQ_MODEL_COLLECTION_RISK"] ?? "openai/gpt-oss-20b",
  "Pricing Intelligence": process.env["GROQ_MODEL_PRICING"] ?? "openai/gpt-oss-120b",
  "Sales Forecast": process.env["GROQ_MODEL_FORECAST"] ?? "openai/gpt-oss-120b",
  "Anomaly Detection": process.env["GROQ_MODEL_ANOMALY"] ?? "openai/gpt-oss-20b",
};

const SYSTEM_PROMPT = `You are a real-estate analytics narrator for the Estatum ERP AI Insights Center.
You are given REAL computed statistics from the live dataset — never invent numbers that aren't present in the facts given to you.
Turn the facts into ONE actionable insight. Reply with ONLY a compact JSON object matching exactly:
{"title": string, "prediction": string, "confidence": number (0-100, your assessed confidence this insight is significant and actionable), "reasons": string[] (2-4 short bullet-style reasons), "action": string, "approval": string, "severity": "critical"|"warning"|"info"|"positive"}
"approval" must be "No approval required — operational action" for things like assigning follow-ups or scheduling reviews, or a specific "Requires <role> approval" string for anything that changes price, discount policy, or commits spend.`;

const SEVERITIES = ["critical", "warning", "info", "positive"] as const;
function toSeverity(v: unknown): Insight["severity"] {
  const s = String(v);
  return (SEVERITIES as readonly string[]).includes(s) ? (s as Insight["severity"]) : "info";
}

async function narrate(
  category: Insight["category"],
  id: string,
  facts: unknown,
): Promise<Insight> {
  const model = MODELS[category];
  const result = await groqChatJson(
    model,
    SYSTEM_PROMPT,
    `Category: ${category}\nComputed facts (JSON): ${JSON.stringify(facts)}`,
  );

  return {
    id,
    category,
    title: String(result["title"] ?? category),
    prediction: String(result["prediction"] ?? ""),
    confidence: Math.min(100, Math.max(0, Number(result["confidence"] ?? 50))),
    reasons: Array.isArray(result["reasons"])
      ? (result["reasons"] as unknown[]).map(String).slice(0, 4)
      : [],
    action: String(result["action"] ?? ""),
    approval: String(result["approval"] ?? "No approval required — operational action"),
    severity: toSeverity(result["severity"]),
  };
}

export async function generateLeadIntelligence(): Promise<Insight> {
  return narrate("Lead Intelligence", "AI-LIVE-01", computeLeadDecayFacts());
}
export async function generateCollectionRisk(): Promise<Insight> {
  return narrate("Collection Risk", "AI-LIVE-02", computeCollectionRiskFacts());
}
export async function generatePricingIntelligence(): Promise<Insight> {
  return narrate("Pricing Intelligence", "AI-LIVE-03", await computePricingFacts());
}
export async function generateSalesForecast(): Promise<Insight> {
  return narrate("Sales Forecast", "AI-LIVE-04", computeSalesForecastFacts());
}
export async function generateAnomalyDetection(): Promise<Insight> {
  return narrate("Anomaly Detection", "AI-LIVE-05", computeAnomalyFacts());
}

export async function generateAllInsights(): Promise<Insight[]> {
  return Promise.all([
    generateLeadIntelligence(),
    generateCollectionRisk(),
    generatePricingIntelligence(),
    generateSalesForecast(),
    generateAnomalyDetection(),
  ]);
}
