import { getLiveSession } from "./session-store";
import { getDefaultSttProvider } from "../voice/stt";
import { getDefaultTtsProvider } from "../voice/tts";
import { cacheAudio, getCachedAudio } from "../voice/audio-store";
import { resolveConversationEngine } from "../voice-ai/resolve";
import type { CallResult } from "../types";

const MAX_TURNS = 6;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function exoml(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "content-type": "text/xml; charset=utf-8" },
  });
}

/**
 * Handles Exotel's callback for a live call: plays the AI's line, records
 * the lead's reply, transcribes + generates the next turn, and repeats
 * until the conversation ends. Registered in src/server.ts at
 * /api/exotel-webhook.
 *
 * UNVERIFIED AGAINST A LIVE ACCOUNT: the field names read from Exotel's POST
 * body (CallSid, RecordingUrl) and the Record/Play ExoML tags match their
 * documented API as of writing, but this has not been tested against a real
 * call. On your first real test, log `params` below and compare against
 * what Exotel actually sends — if names differ, fix them here.
 */
export async function handleExotelWebhook(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session");
  const session = sessionId ? getLiveSession(sessionId) : undefined;

  if (!session) {
    return exoml(`<Say>Sorry, this call session could not be found.</Say><Hangup/>`);
  }

  const form = await request.formData().catch(() => new FormData());
  const params = Object.fromEntries(form.entries()) as Record<string, string>;

  if (params["CallSid"] && !session.providerCallId) session.providerCallId = params["CallSid"];

  const recordingUrl = params["RecordingUrl"];
  const stt = getDefaultSttProvider();
  const latestUtterance = recordingUrl
    ? await stt.transcribe(recordingUrl, session.lead.language).catch(() => "")
    : "";

  if (recordingUrl) {
    session.transcript.push({
      speaker: "Lead",
      at: new Date().toISOString(),
      text: latestUtterance || "[inaudible]",
    });
  }

  const engine = resolveConversationEngine();
  const turnResult = await engine.nextTurn({
    lead: session.lead,
    history: session.transcript,
    latestUtterance,
  });
  session.transcript.push({
    speaker: "Agent",
    at: new Date().toISOString(),
    text: turnResult.reply,
  });
  session.turn += 1;

  const tts = await getDefaultTtsProvider().synthesize(turnResult.reply, session.lead.language);
  const audioId = cacheAudio(tts);
  const playUrl = `${url.origin}/api/tts-audio/${audioId}`;

  const shouldEnd = turnResult.isFinalTurn || session.turn >= MAX_TURNS;

  if (shouldEnd) {
    const result: CallResult = {
      id: session.id,
      campaignId: session.lead.campaignId,
      leadId: session.lead.leadId,
      leadName: session.lead.leadName,
      phone: session.lead.phone,
      projectId: session.lead.projectId,
      state: turnResult.shouldHandoff ? "HUMAN_HANDOFF" : "DONE",
      intentScore: turnResult.intentScore,
      durationSec: Math.max(
        1,
        Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000),
      ),
      startedAt: session.startedAt,
      endedAt: new Date().toISOString(),
      transcript: session.transcript,
      ...(session.providerCallId ? { providerCallId: session.providerCallId } : {}),
      ...(turnResult.outcome ? { outcome: turnResult.outcome } : {}),
      ...(turnResult.sentiment ? { sentiment: turnResult.sentiment } : {}),
      ...(turnResult.shouldHandoff ? { handoffTo: "Sales Manager" } : {}),
      ...(turnResult.handoffReason ? { handoffReason: turnResult.handoffReason } : {}),
    };
    session.result = result;
    return exoml(`<Play>${escapeXml(playUrl)}</Play><Hangup/>`);
  }

  const actionUrl = `${url.origin}/api/exotel-webhook?session=${session.id}`;
  return exoml(
    `<Play>${escapeXml(playUrl)}</Play><Record action="${escapeXml(actionUrl)}" method="POST" maxLength="15" playBeep="true" timeout="5"/>`,
  );
}

export async function handleTtsAudioRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop() ?? "";
  const audio = getCachedAudio(id);
  if (!audio) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(audio.bytes), { headers: { "content-type": audio.contentType } });
}
