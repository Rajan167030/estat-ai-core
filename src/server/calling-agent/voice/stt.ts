import { groqRequest, hasGroqKey } from "../../groq/client";

export interface SttProvider {
  readonly name: string;
  /** Transcribes a publicly fetchable audio recording (e.g. Exotel's RecordingUrl). */
  transcribe(audioUrl: string, languageHint?: string): Promise<string>;
}

const LANGUAGE_CODES: Record<string, string> = {
  Hindi: "hi",
  English: "en",
  Hinglish: "hi",
  Marathi: "mr",
};

/**
 * Deepgram pre-recorded transcription API — a plain REST call, no SDK
 * needed. Requires DEEPGRAM_API_KEY. https://developers.deepgram.com/reference/speech-to-text-api/listen
 */
export class DeepgramSttProvider implements SttProvider {
  readonly name = "deepgram";

  async transcribe(audioUrl: string, languageHint = "Hinglish"): Promise<string> {
    const apiKey = process.env["DEEPGRAM_API_KEY"];
    if (!apiKey) throw new Error("DeepgramSttProvider requires DEEPGRAM_API_KEY to be set.");

    const language = LANGUAGE_CODES[languageHint] ?? "hi";
    const url = `https://api.deepgram.com/v1/listen?language=${language}&smart_format=true&punctuate=true`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Token ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ url: audioUrl }),
    });
    if (!res.ok) throw new Error(`Deepgram responded ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as {
      results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> };
    };
    return data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  }
}

/**
 * Groq-hosted Whisper transcription — same account/API key as the
 * conversation engine, so one GROQ_API_KEY covers both. Groq's endpoint is
 * OpenAI's audio API shape, which (unlike Deepgram) wants the actual audio
 * bytes uploaded, not a URL — so this fetches the recording first, then
 * re-uploads it as multipart form data.
 * https://console.groq.com/docs/speech-to-text
 */
export class GroqWhisperSttProvider implements SttProvider {
  readonly name = "groq";

  async transcribe(audioUrl: string, languageHint = "Hinglish"): Promise<string> {
    if (!hasGroqKey())
      throw new Error("GroqWhisperSttProvider requires GROQ_API_KEY (or GROQ_API_KEYS) to be set.");

    const recording = await fetch(audioUrl);
    if (!recording.ok)
      throw new Error(`Failed to fetch recording ${audioUrl}: ${recording.status}`);
    const audioBlob = await recording.blob();

    const form = new FormData();
    form.append("file", audioBlob, "recording.mp3");
    form.append("model", process.env["GROQ_WHISPER_MODEL"] ?? "whisper-large-v3-turbo");
    form.append("language", LANGUAGE_CODES[languageHint] ?? "hi");

    const res = await groqRequest("/openai/v1/audio/transcriptions", {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(`Groq Whisper responded ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { text?: string };
    return data.text ?? "";
  }
}

/** Local dev/demo stand-in — no real audio processing. */
export class MockSttProvider implements SttProvider {
  readonly name = "mock";
  async transcribe(_audioUrl: string): Promise<string> {
    return "[simulated lead reply — real deployment transcribes the actual recording here]";
  }
}

/** Groq first (same key as the conversation engine — one account to manage), then Deepgram, then mock. */
export function getDefaultSttProvider(): SttProvider {
  if (hasGroqKey()) return new GroqWhisperSttProvider();
  if (process.env["DEEPGRAM_API_KEY"]) return new DeepgramSttProvider();
  return new MockSttProvider();
}
