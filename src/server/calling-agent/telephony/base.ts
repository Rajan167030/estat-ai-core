export interface DialOptions {
  callerId?: string;
  /** Webhook the provider should POST call *status* events to (ringing/answered/completed). */
  statusCallbackUrl?: string;
  /** URL the provider fetches ExoML/call-flow instructions from once the call connects — this is what actually drives the AI conversation for a live call. */
  flowUrl?: string;
}

export interface DialResult {
  providerCallId: string;
  status: "initiated" | "failed";
  error?: string;
}

export interface TelephonyProvider {
  readonly name: string;
  dial(toE164: string, opts?: DialOptions): Promise<DialResult>;
  hangup(providerCallId: string): Promise<void>;
  transfer(providerCallId: string, toE164: string): Promise<void>;
}
