import { TODAY } from "@/lib/mock/data";
import { callHistory, hourlyCalls, type CallingInsight } from "@/lib/mock/calling";
import { groqChatJson } from "./groq-client";

const MODEL = process.env["GROQ_MODEL_CALLING_INTEL"] ?? "openai/gpt-oss-20b";

const SYSTEM_PROMPT = `You are a calling-analytics narrator for the Estatum ERP calling agent. You are given REAL computed statistics from the actual call log — never invent numbers not present in them.
Reply with ONLY a compact JSON object: {"title": string, "prediction": string, "confidence": number (0-100), "reasons": string[] (2-4 short bullet-style reasons), "action": string, "approval": string}.
"approval" must be "No approval required — operational action" for scheduling/staffing tweaks, or a specific "Requires <role> approval" string for script or policy changes.`;

function computeBestCallingWindowFacts() {
  const withRate = hourlyCalls.map((h) => ({
    ...h,
    connectRatePct: Math.round((h.connected / Math.max(h.calls, 1)) * 100),
  }));
  const sorted = [...withRate].sort((a, b) => b.connectRatePct - a.connectRatePct);
  return { hourlyConnectRates: withRate, bestHour: sorted[0], worstHour: sorted.at(-1) };
}

function computeObjectionClusterFacts() {
  const negative = callHistory.filter((c) => c.sentiment === "Negative");
  const objectionCounts = new Map<string, number>();
  for (const c of callHistory) {
    for (const o of c.objections) objectionCounts.set(o, (objectionCounts.get(o) ?? 0) + 1);
  }
  const ranked = [...objectionCounts.entries()].sort((a, b) => b[1] - a[1]);
  return {
    totalCalls: callHistory.length,
    negativeSentimentCalls: negative.length,
    topObjections: ranked.slice(0, 3).map(([objection, count]) => ({ objection, count })),
  };
}

function computeCallbackBacklogFacts() {
  const callbacks = callHistory.filter((c) => c.outcome === "Callback requested");
  const agingHours = callbacks.map((c) =>
    Math.round((TODAY.getTime() - new Date(c.startedAt).getTime()) / 3_600_000),
  );
  const slaTargetHours = 12;
  const overdueCount = agingHours.filter((h) => h > slaTargetHours).length;
  return {
    callbackRequestedCount: callbacks.length,
    slaTargetHours,
    overdueCount,
    avgAgingHours: Math.round(
      agingHours.reduce((s, h) => s + h, 0) / Math.max(agingHours.length, 1),
    ),
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

async function narrate(facts: unknown): Promise<CallingInsight> {
  const result = await groqChatJson(MODEL, SYSTEM_PROMPT, JSON.stringify(facts));
  return {
    title: String(result["title"] ?? "Calling insight"),
    prediction: String(result["prediction"] ?? ""),
    confidence: clamp(Number(result["confidence"] ?? 50), 0, 100),
    reasons: Array.isArray(result["reasons"])
      ? (result["reasons"] as unknown[]).map(String).slice(0, 4)
      : [],
    action: String(result["action"] ?? ""),
    approval: String(result["approval"] ?? "No approval required — operational action"),
  };
}

/** Real replacements for the 3 static callingInsights entries — same shape, computed from the actual call log + narrated by Groq. */
export async function generateCallingIntelligence(): Promise<CallingInsight[]> {
  return Promise.all([
    narrate(computeBestCallingWindowFacts()),
    narrate(computeObjectionClusterFacts()),
    narrate(computeCallbackBacklogFacts()),
  ]);
}
