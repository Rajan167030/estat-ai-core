import type { DialOptions, DialResult, TelephonyProvider } from "./base";

/**
 * Exotel Voice API adapter (Ozonetel's REST shape is close enough that a
 * second provider file could reuse most of this — kept separate rather than
 * abstracted further since the two differ in auth and status-callback
 * payloads). Needs an Exotel account with a DLT-registered sender/caller ID
 * before it can place real calls in India — see:
 * https://developer.exotel.com/api/make-a-call-api
 *
 * Required env vars: EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN,
 * EXOTEL_CALLER_ID, EXOTEL_SUBDOMAIN (defaults to api.exotel.com).
 */
export class ExotelTelephonyProvider implements TelephonyProvider {
  readonly name = "exotel";

  private readonly sid = process.env["EXOTEL_SID"];
  private readonly apiKey = process.env["EXOTEL_API_KEY"];
  private readonly apiToken = process.env["EXOTEL_API_TOKEN"];
  private readonly callerId = process.env["EXOTEL_CALLER_ID"];
  private readonly subdomain = process.env["EXOTEL_SUBDOMAIN"] ?? "api.exotel.com";

  private assertConfigured() {
    const missing = ["EXOTEL_SID", "EXOTEL_API_KEY", "EXOTEL_API_TOKEN", "EXOTEL_CALLER_ID"].filter(
      (k) => !process.env[k],
    );
    if (missing.length > 0) {
      throw new Error(
        `ExotelTelephonyProvider is missing env vars: ${missing.join(", ")}. Set these to real credentials to place live calls.`,
      );
    }
  }

  private authHeader() {
    const token = Buffer.from(`${this.apiKey}:${this.apiToken}`).toString("base64");
    return `Basic ${token}`;
  }

  async dial(toE164: string, opts?: DialOptions): Promise<DialResult> {
    this.assertConfigured();
    const url = `https://${this.subdomain}/v1/Accounts/${this.sid}/Calls/connect.json`;
    // NOTE (unverified — confirm against your Exotel account's live docs before
    // relying on this): connect.json is documented primarily for bridging two
    // numbers (From answers first, then gets connected to To, or to the ExoML
    // fetched from Url instead of a direct bridge). For a pure AI-outbound call
    // with no human leg, some Exotel setups need only To + CallerId + Url as
    // below; others require a Flow configured in App Bazaar and a different
    // trigger. If Exotel rejects this shape, paste their error/docs back and
    // this gets fixed to match.
    const body = new URLSearchParams({
      To: toE164,
      CallerId: opts?.callerId ?? this.callerId!,
      ...(opts?.flowUrl ? { Url: opts.flowUrl } : {}),
      ...(opts?.statusCallbackUrl ? { StatusCallback: opts.statusCallbackUrl } : {}),
    });

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: this.authHeader(),
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const payload = (await res.json().catch(() => ({}))) as {
        Call?: { Sid?: string };
        RestException?: { Message?: string };
      };
      if (!res.ok || !payload.Call?.Sid) {
        return {
          providerCallId: "",
          status: "failed",
          error: payload.RestException?.Message ?? `Exotel responded ${res.status}`,
        };
      }
      return { providerCallId: payload.Call.Sid, status: "initiated" };
    } catch (err) {
      return {
        providerCallId: "",
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async hangup(providerCallId: string): Promise<void> {
    this.assertConfigured();
    const url = `https://${this.subdomain}/v1/Accounts/${this.sid}/Calls/${providerCallId}.json`;
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(),
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ Status: "completed" }),
    });
  }

  async transfer(_providerCallId: string, _toE164: string): Promise<void> {
    // Mid-call transfer needs the call to be running inside an Exotel App
    // Bazaar flow (ExoML) with a Dial/Passthru applet — a bare REST call
    // after dial can't redirect an in-progress leg. Wire this once the
    // ExoML flow for human handoff exists in the Exotel dashboard.
    throw new Error(
      "ExotelTelephonyProvider.transfer requires an ExoML call-flow with a handoff applet — not implemented yet.",
    );
  }
}
