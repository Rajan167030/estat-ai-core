import type { TelephonyProvider } from "./telephony/base";
import type { ConversationEngine, ConversationTurnOutput } from "./voice-ai/base";
import type { DndProvider } from "./compliance";
import { evaluateCompliance } from "./compliance";
import type { CallResult, LeadDialTarget, TranscriptTurn } from "./types";

export interface CallSessionDeps {
  telephony: TelephonyProvider;
  conversation: ConversationEngine;
  dnd: DndProvider;
}

const MAX_TURNS = 6;

/**
 * Runs one call end to end: compliance gate → dial → turn-by-turn AI
 * conversation → handoff-or-wrap-up. This is the state machine described in
 * the calling-agent workflow: QUEUED → COMPLIANCE_BLOCKED/DIALING/FAILED →
 * AI_CONVERSATION (looped turns) → HUMAN_HANDOFF | DONE.
 *
 * The lead's spoken replies are simulated placeholders here — a real
 * deployment feeds `latestUtterance` from the live call's STT stream via the
 * telephony provider's media webhook instead of the stand-in text below.
 */
export async function runCallSession(
  lead: LeadDialTarget,
  deps: CallSessionDeps,
  now: Date = new Date(),
): Promise<CallResult> {
  const id = `CALL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startedAt = now.toISOString();
  const base: CallResult = {
    id,
    campaignId: lead.campaignId,
    leadId: lead.leadId,
    leadName: lead.leadName,
    phone: lead.phone,
    projectId: lead.projectId,
    state: "QUEUED",
    intentScore: 0,
    durationSec: 0,
    startedAt,
    transcript: [],
  };

  const compliance = await evaluateCompliance(lead.phone, deps.dnd, now);
  if (!compliance.allowed) {
    return {
      ...base,
      state: "COMPLIANCE_BLOCKED",
      complianceBlockedReason: compliance.reasons.join("; "),
      endedAt: new Date().toISOString(),
    };
  }

  const dialResult = await deps.telephony.dial(lead.phone);
  if (dialResult.status === "failed") {
    return {
      ...base,
      state: "FAILED",
      outcome: "Wrong number",
      endedAt: new Date().toISOString(),
      ...(dialResult.error ? { complianceBlockedReason: dialResult.error } : {}),
    };
  }

  const transcript: TranscriptTurn[] = [];
  let final: ConversationTurnOutput | undefined;
  const t0 = Date.now();

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const latestUtterance =
      turn === 0 ? "" : "[simulated lead reply — real deployment feeds STT transcript here]";
    const result = await deps.conversation.nextTurn({ lead, history: transcript, latestUtterance });
    transcript.push({ speaker: "Agent", at: new Date().toISOString(), text: result.reply });
    final = result;
    if (result.isFinalTurn) break;
    transcript.push({ speaker: "Lead", at: new Date().toISOString(), text: latestUtterance });
  }

  if (final?.shouldHandoff) {
    try {
      await deps.telephony.transfer(
        dialResult.providerCallId,
        process.env["HUMAN_HANDOFF_NUMBER"] ?? "+910000000000",
      );
    } catch (err) {
      transcript.push({
        speaker: "Agent",
        at: new Date().toISOString(),
        text: `[handoff requested but provider transfer failed: ${err instanceof Error ? err.message : String(err)} — a human must pick this up manually]`,
      });
    }
  }

  const durationSec = Math.max(1, Math.round((Date.now() - t0) / 1000));

  return {
    ...base,
    state: final?.shouldHandoff ? "HUMAN_HANDOFF" : "DONE",
    intentScore: final?.intentScore ?? 0,
    durationSec,
    transcript,
    providerCallId: dialResult.providerCallId,
    endedAt: new Date().toISOString(),
    ...(final?.outcome ? { outcome: final.outcome } : {}),
    ...(final?.sentiment ? { sentiment: final.sentiment } : {}),
    ...(final?.shouldHandoff ? { handoffTo: "Sales Manager" } : {}),
    ...(final?.handoffReason ? { handoffReason: final.handoffReason } : {}),
  };
}
