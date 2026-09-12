/**
 * Places ONE real outbound AI call via Exotel. Deliberately a manual CLI
 * script, not a UI button — this costs money and calls a real phone, so it
 * shouldn't be one accidental click away.
 *
 * Required env vars (see README section this script was delivered with):
 *   EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_CALLER_ID
 *   PUBLIC_BASE_URL   — this app's deployed public HTTPS URL
 *   ANTHROPIC_API_KEY, DEEPGRAM_API_KEY, ELEVENLABS_API_KEY — optional;
 *     without them the call still connects but uses the scripted mock
 *     conversation / no real STT / a silent TTS stub instead.
 *
 * Usage:
 *   bun run scripts/start-live-call.ts +919876543210 "Test Lead" "Sunrise Meadows" Hinglish
 */
import { startLiveCall } from "../src/server/calling-agent/live/start-call";
import type { LeadDialTarget } from "../src/server/calling-agent/types";

async function main() {
  const [phone, name = "Test Lead", projectName = "Sunrise Meadows", language = "Hinglish"] =
    process.argv.slice(2);
  if (!phone) {
    console.error(
      'Usage: bun run scripts/start-live-call.ts "+91XXXXXXXXXX" ["Lead Name"] ["Project Name"] [Hindi|English|Hinglish|Marathi]',
    );
    process.exit(1);
  }

  const lead: LeadDialTarget = {
    leadId: "MANUAL-TEST",
    leadName: name,
    phone,
    projectId: "MANUAL",
    projectName,
    language: language as LeadDialTarget["language"],
    campaignId: "MANUAL-TEST",
    campaignGoal: "Qualify and book a site visit",
    script: `Namaste, main ${projectName} team se bol rahi hoon.`,
  };

  console.log(`Dialing ${phone} via Exotel...`);
  const result = await startLiveCall(lead);
  console.log("Call started:", result);
  console.log(
    `Session state will be at src/server/calling-agent/live/session-store.ts in-memory (id: ${result.sessionId}) once the webhook starts receiving callbacks.`,
  );
}

main().catch((err) => {
  console.error("Failed to start call:", err instanceof Error ? err.message : err);
  process.exit(1);
});
