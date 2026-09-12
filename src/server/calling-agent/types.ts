export type Sentiment = "Positive" | "Neutral" | "Negative";

export type CallOutcome =
  | "Site visit booked"
  | "Follow-up scheduled"
  | "Interested"
  | "Not interested"
  | "Callback requested"
  | "Wrong number"
  | "No answer";

export type CallState =
  | "QUEUED"
  | "COMPLIANCE_BLOCKED"
  | "DIALING"
  | "NO_ANSWER"
  | "FAILED"
  | "CONNECTED"
  | "AI_CONVERSATION"
  | "HUMAN_HANDOFF"
  | "WRAP_UP"
  | "DONE";

export interface LeadDialTarget {
  leadId: string;
  leadName: string;
  /** E.164, e.g. +919876543210 */
  phone: string;
  projectId: string;
  projectName: string;
  language: "Hindi" | "English" | "Hinglish" | "Marathi";
  campaignId: string;
  campaignGoal: string;
  script: string;
}

export interface TranscriptTurn {
  speaker: "Agent" | "Lead";
  at: string;
  text: string;
}

export interface CallResult {
  id: string;
  campaignId: string;
  leadId: string;
  leadName: string;
  phone: string;
  projectId: string;
  state: CallState;
  outcome?: CallOutcome;
  sentiment?: Sentiment;
  intentScore: number;
  durationSec: number;
  startedAt: string;
  endedAt?: string;
  transcript: TranscriptTurn[];
  handoffTo?: string;
  handoffReason?: string;
  complianceBlockedReason?: string;
  providerCallId?: string;
}
