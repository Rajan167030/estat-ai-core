import type { DialOptions, DialResult, TelephonyProvider } from "./base";

/** Local dev / demo provider — no real call is placed, just a plausible async result. */
export class MockTelephonyProvider implements TelephonyProvider {
  readonly name = "mock";
  private seq = 0;

  async dial(toE164: string, _opts?: DialOptions): Promise<DialResult> {
    await sleep(120);
    this.seq += 1;
    if (!/^\+\d{8,15}$/.test(toE164)) {
      return { providerCallId: "", status: "failed", error: `Invalid E.164 number: ${toE164}` };
    }
    return { providerCallId: `mock-call-${Date.now()}-${this.seq}`, status: "initiated" };
  }

  async hangup(_providerCallId: string): Promise<void> {
    await sleep(20);
  }

  async transfer(_providerCallId: string, _toE164: string): Promise<void> {
    await sleep(20);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
