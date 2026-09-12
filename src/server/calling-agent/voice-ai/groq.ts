import type { ConversationEngine, ConversationTurnInput, ConversationTurnOutput } from "./base";
import { groqRequest, hasGroqKey } from "../../groq/client";

const MODEL = process.env["GROQ_MODEL"] ?? "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `You are an outbound real-estate voice sales agent for Estatum, speaking on a live phone call.
Rules:
- Stay strictly within the approved script and campaign goal given below. Never invent or confirm pricing, discounts, possession dates, or legal terms that weren't given to you.
- If the lead asks for anything outside that approved scope (a specific discount, a legal/financial commitment, a complaint), set shouldHandoff=true with a short handoffReason instead of answering it yourself.
- Reply with ONLY a compact JSON object, no prose outside it, matching exactly:
  {"reply": string, "intentScore": number (0-100), "sentiment": "Positive"|"Neutral"|"Negative", "outcome"?: "Site visit booked"|"Follow-up scheduled"|"Interested"|"Not interested"|"Callback requested"|"Wrong number"|"No answer", "shouldHandoff": boolean, "handoffReason"?: string, "isFinalTurn": boolean}
- Keep "reply" to 1-2 natural spoken sentences in the requested language. Set "outcome" and "isFinalTurn"=true only once the call is ready to end.`;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseModelJson(text: string): Partial<ConversationTurnOutput> {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as Partial<ConversationTurnOutput>) : {};
  } catch {
    return {};
  }
}

/**
 * Live LLM-driven conversation turn via Groq's OpenAI-compatible chat
 * completions API — Groq's whole pitch is inference speed (LPU hardware),
 * which matters a lot more than raw quality for a live voice call where
 * every extra second of "thinking" is dead air on the line. Requires
 * GROQ_API_KEY. Groq's lineup rotates faster than most — swap GROQ_MODEL if
 * openai/gpt-oss-120b gets retired (check console.groq.com/docs/models).
 * These are reasoning models: they spend tokens "thinking" in a separate
 * `reasoning` field before the real `content`, so give max_tokens real
 * headroom or JSON mode can fail with an empty response.
 */
export class GroqConversationEngine implements ConversationEngine {
  readonly name = "groq";

  async nextTurn(input: ConversationTurnInput): Promise<ConversationTurnOutput> {
    if (!hasGroqKey()) {
      throw new Error("GroqConversationEngine requires GROQ_API_KEY (or GROQ_API_KEYS) to be set.");
    }

    const messages = [
      {
        role: "system",
        content: [
          SYSTEM_PROMPT,
          `Campaign goal: ${input.lead.campaignGoal}`,
          `Approved script opening: ${input.lead.script}`,
          `Project: ${input.lead.projectName}`,
          `Language: ${input.lead.language}`,
          `Lead name: ${input.lead.leadName}`,
        ].join("\n"),
      },
      ...input.history.map((t) => ({
        role: t.speaker === "Agent" ? "assistant" : "user",
        content: t.text,
      })),
      {
        role: "user",
        content: input.latestUtterance || "[call connected — begin the opening line]",
      },
    ];

    const res = await groqRequest("/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages,
      }),
    });

    if (!res.ok) {
      throw new Error(`Groq API responded ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = parseModelJson(text);

    return {
      reply: parsed.reply ?? "Maaf kijiye, kya aap dobara bata sakte hain?",
      intentScore: clamp(parsed.intentScore ?? 50, 0, 100),
      sentiment: parsed.sentiment ?? "Neutral",
      shouldHandoff: parsed.shouldHandoff ?? false,
      isFinalTurn: parsed.isFinalTurn ?? false,
      ...(parsed.outcome ? { outcome: parsed.outcome } : {}),
      ...(parsed.handoffReason ? { handoffReason: parsed.handoffReason } : {}),
    };
  }
}
