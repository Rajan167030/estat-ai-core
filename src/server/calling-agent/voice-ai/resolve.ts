import type { ConversationEngine } from "./base";
import { MockConversationEngine } from "./mock";
import { ClaudeConversationEngine } from "./claude";
import { GroqConversationEngine } from "./groq";
import { hasGroqKey } from "../../groq/client";

/**
 * Picks the best available engine from configured API keys: Groq first
 * (fastest inference — matters most on a live call, where every extra
 * second of "thinking" is dead air), then Claude, then the free scripted
 * mock for local dev with no keys at all.
 */
export function resolveConversationEngine(): ConversationEngine {
  if (hasGroqKey()) return new GroqConversationEngine();
  if (process.env["ANTHROPIC_API_KEY"]) return new ClaudeConversationEngine();
  return new MockConversationEngine();
}
