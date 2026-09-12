import type { CallOutcome, LeadDialTarget, Sentiment, TranscriptTurn } from "../types";

export interface ConversationTurnInput {
  lead: LeadDialTarget;
  history: TranscriptTurn[];
  /** The lead's latest spoken utterance (from STT), empty on the opening turn. */
  latestUtterance: string;
}

export interface ConversationTurnOutput {
  reply: string;
  intentScore: number;
  sentiment: Sentiment;
  outcome?: CallOutcome;
  shouldHandoff: boolean;
  handoffReason?: string;
  /** true once the agent has said its closing line and the call can wrap up. */
  isFinalTurn: boolean;
}

export interface ConversationEngine {
  readonly name: string;
  nextTurn(input: ConversationTurnInput): Promise<ConversationTurnOutput>;
}
