/**
 * Central Groq API client — every Groq call in this app (calling-agent
 * conversation, Whisper STT, AI insights, document vision) goes through
 * this instead of hitting fetch directly, so key rotation and rate-limit
 * handling live in exactly one place.
 *
 * Configure ONE key:
 *   GROQ_API_KEY=gsk_xxx
 * or several, comma-separated, to round-robin across separate Groq
 * accounts and multiply your effective rate limit:
 *   GROQ_API_KEYS=gsk_xxx,gsk_yyy,gsk_zzz
 * (GROQ_API_KEYS wins if both are set.)
 */

interface KeyState {
  key: string;
  cooldownUntil: number;
}

let keyStates: KeyState[] | undefined;
let roundRobinIndex = 0;

function loadKeyPool(): string[] {
  const multi = process.env["GROQ_API_KEYS"];
  if (multi) {
    return multi
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }
  const single = process.env["GROQ_API_KEY"];
  return single ? [single] : [];
}

function getKeyStates(): KeyState[] {
  keyStates ??= loadKeyPool().map((key) => ({ key, cooldownUntil: 0 }));
  return keyStates;
}

export function hasGroqKey(): boolean {
  return getKeyStates().length > 0;
}

export function groqKeyCount(): number {
  return getKeyStates().length;
}

/** Round-robins among keys that aren't currently cooling down from a 429; if every key is cooling down, uses whichever frees up soonest. */
function pickKey(): string | undefined {
  const states = getKeyStates();
  if (states.length === 0) return undefined;

  const now = Date.now();
  for (let i = 0; i < states.length; i++) {
    const idx = (roundRobinIndex + i) % states.length;
    if (states[idx]!.cooldownUntil <= now) {
      roundRobinIndex = (idx + 1) % states.length;
      return states[idx]!.key;
    }
  }
  return states.reduce((a, b) => (a.cooldownUntil < b.cooldownUntil ? a : b)).key;
}

function markCooldown(key: string, ms: number) {
  const entry = getKeyStates().find((s) => s.key === key);
  if (entry) entry.cooldownUntil = Date.now() + ms;
}

export interface GroqRequestOptions {
  /** How many keys/attempts to try before giving up. Defaults to one pass over every configured key. */
  maxRetries?: number;
}

/**
 * POSTs to a Groq API path (e.g. "/openai/v1/chat/completions"), adding the
 * auth header from the key pool. On a 429 it puts that key on cooldown
 * (honouring Retry-After when Groq sends one) and immediately retries with
 * the next key — with 2+ keys configured, one account's rate limit no
 * longer stalls the whole app. On a 5xx it just retries.
 */
export async function groqRequest(
  path: string,
  init: RequestInit,
  opts: GroqRequestOptions = {},
): Promise<Response> {
  const attempts = opts.maxRetries ?? Math.max(getKeyStates().length, 1);
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const key = pickKey();
    if (!key) {
      throw new Error(
        "No Groq API key configured — set GROQ_API_KEY (or GROQ_API_KEYS for multiple, comma-separated).",
      );
    }

    const res = await fetch(`https://api.groq.com${path}`, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        authorization: `Bearer ${key}`,
      },
    });

    if (res.status === 429) {
      const retryAfterSec = Number(res.headers.get("retry-after")) || 10;
      markCooldown(key, retryAfterSec * 1000);
      lastError = new Error(
        `Groq rate-limited (key ending ...${key.slice(-4)}), cooling down ${retryAfterSec}s`,
      );
      continue;
    }
    if (res.status >= 500) {
      lastError = new Error(`Groq responded ${res.status}`);
      continue;
    }
    return res;
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Groq request failed after retrying every configured key.");
}
