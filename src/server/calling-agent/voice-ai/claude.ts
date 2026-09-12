import type { ConversationEngine, ConversationTurnInput, ConversationTurnOutput } from "./base";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env["ANTHROPIC_CALLING_AGENT_MODEL"] ?? "claude-sonnet-5";

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
 * Live LLM-driven conversation turn via the Anthropic Messages API.
 * This only drives the *text* side of the call — pairing it with real voice
 * still needs a speech-to-text/text-to-speech leg (e.g. Exotel's Voicebot
 * Applet, or Deepgram/ElevenLabs in the middle) which isn't wired up here.
 * Requires ANTHROPIC_API_KEY.
 */
export class ClaudeConversationEngine implements ConversationEngine {
  readonly name = "claude";

  async nextTurn(input: ConversationTurnInput): Promise<ConversationTurnOutput> {
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) {
      throw new Error("ClaudeConversationEngine requires ANTHROPIC_API_KEY to be set.");
    }

    const messages = [
      ...input.history.map((t) => ({
        role: t.speaker === "Agent" ? "assistant" : "user",
        content: t.text,
      })),
      {
        role: "user",
        content: input.latestUtterance || "[call connected — begin the opening line]",
      },
    ];

    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: [
          SYSTEM_PROMPT,
          `Campaign goal: ${input.lead.campaignGoal}`,
          `Approved script opening: ${input.lead.script}`,
          `Project: ${input.lead.projectName}`,
          `Language: ${input.lead.language}`,
          `Lead name: ${input.lead.leadName}`,
        ].join("\n"),
        messages,
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API responded ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((b) => b.type === "text")?.text ?? "{}";
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
