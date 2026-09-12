import type { ConversationEngine, ConversationTurnInput, ConversationTurnOutput } from "./base";
import type { CallOutcome, Sentiment } from "../types";

function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const OUTCOMES: CallOutcome[] = [
  "Site visit booked",
  "Follow-up scheduled",
  "Interested",
  "Not interested",
  "Callback requested",
];

/**
 * Deterministic scripted engine for local dev/demo — no LLM call, no cost.
 * Walks a fixed qualification flow (greet → budget/timeline → close) and
 * picks a stable-per-lead outcome so demo runs are reproducible.
 */
export class MockConversationEngine implements ConversationEngine {
  readonly name = "mock";

  async nextTurn(input: ConversationTurnInput): Promise<ConversationTurnOutput> {
    const seed = hashSeed(input.lead.phone + input.lead.leadId);
    const turn = input.history.filter((t) => t.speaker === "Agent").length;
    const firstName = input.lead.leadName.split(" ")[0];

    if (turn === 0) {
      return {
        reply: `Namaste ${firstName}, main ${input.lead.campaignGoal.toLowerCase().includes("payment") ? "Estatum accounts team" : "Estatum"} se bol rahi hoon — aapne ${input.lead.projectName} ke baare me enquiry ki thi. Kya abhi 2 minute baat kar sakte hain?`,
        intentScore: 50,
        sentiment: "Neutral",
        shouldHandoff: false,
        isFinalTurn: false,
      };
    }

    if (turn === 1) {
      return {
        reply: `Bahut accha. Aap kis budget range aur possession timeline dekh rahe hain ${input.lead.projectName} ke liye?`,
        intentScore: 55 + (seed % 20),
        sentiment: "Neutral",
        shouldHandoff: false,
        isFinalTurn: false,
      };
    }

    if (turn === 2) {
      const willBookVisit = seed % 100 < 35;
      return {
        reply: willBookVisit
          ? "Great, main aapke liye is weekend site visit schedule kar deti hoon — kaunsa din suit karega?"
          : "Samajh gayi, main aapko project details WhatsApp kar deti hoon aur kal follow-up karungi.",
        intentScore: 60 + (seed % 30),
        sentiment: seed % 5 === 0 ? "Negative" : "Positive",
        shouldHandoff: false,
        isFinalTurn: false,
      };
    }

    const outcome = OUTCOMES[seed % OUTCOMES.length]!;
    const sentiment: Sentiment =
      outcome === "Not interested"
        ? "Negative"
        : outcome === "Callback requested"
          ? "Neutral"
          : "Positive";
    const shouldHandoff = outcome === "Site visit booked" && seed % 3 === 0;

    return {
      reply: "Dhanyavaad aapke time ke liye, hum jald hi follow-up karenge.",
      intentScore: 40 + (seed % 55),
      sentiment,
      outcome,
      shouldHandoff,
      ...(shouldHandoff
        ? {
            handoffReason:
              "High-intent lead ready to confirm a site-visit slot — routing to a human closer.",
          }
        : {}),
      isFinalTurn: true,
    };
  }
}
