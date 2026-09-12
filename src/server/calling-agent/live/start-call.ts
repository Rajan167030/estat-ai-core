import { ExotelTelephonyProvider } from "../telephony/exotel";
import { evaluateCompliance, StubDndProvider } from "../compliance";
import { createLiveSession } from "./session-store";
import type { LeadDialTarget } from "../types";

export interface StartLiveCallResult {
  sessionId: string;
  providerCallId: string;
}

/**
 * Places one real outbound call via Exotel and wires it to the AI
 * conversation loop through /api/exotel-webhook. Requires:
 *  - EXOTEL_SID / EXOTEL_API_KEY / EXOTEL_API_TOKEN / EXOTEL_CALLER_ID
 *  - PUBLIC_BASE_URL — this app's real public HTTPS URL, so Exotel can
 *    reach the webhook (a local dev server won't work; deploy first)
 * The DND check here is a stub that always allows (see compliance.ts) —
 * real NDNC scrubbing needs a telecom-operator/DLT-vendor integration
 * before this is safe to run against real leads at scale.
 */
export async function startLiveCall(lead: LeadDialTarget): Promise<StartLiveCallResult> {
  const baseUrl = process.env["PUBLIC_BASE_URL"];
  if (!baseUrl) {
    throw new Error(
      "PUBLIC_BASE_URL must be set to this app's deployed public HTTPS URL (e.g. https://yourapp.example.com) before starting live calls.",
    );
  }

  const compliance = await evaluateCompliance(lead.phone, new StubDndProvider());
  if (!compliance.allowed) {
    throw new Error(`Blocked by compliance: ${compliance.reasons.join("; ")}`);
  }

  const session = createLiveSession(lead);
  const telephony = new ExotelTelephonyProvider();
  const webhookUrl = `${baseUrl}/api/exotel-webhook?session=${session.id}`;
  const dialResult = await telephony.dial(lead.phone, {
    flowUrl: webhookUrl,
    statusCallbackUrl: webhookUrl,
  });

  if (dialResult.status === "failed") {
    throw new Error(dialResult.error ?? "Dial failed");
  }

  session.providerCallId = dialResult.providerCallId;
  return { sessionId: session.id, providerCallId: dialResult.providerCallId };
}
