export interface SynthesizedAudio {
  bytes: Uint8Array;
  contentType: string;
}

export interface TtsProvider {
  readonly name: string;
  synthesize(text: string, languageHint?: string): Promise<SynthesizedAudio>;
}

/**
 * ElevenLabs text-to-speech — plain REST call, returns raw MP3 bytes
 * directly (no polling). Requires ELEVENLABS_API_KEY. Voice defaults to
 * ElevenLabs' well-known public "Rachel" voice id; override with
 * ELEVENLABS_VOICE_ID once you've picked a Hindi/Hinglish-capable voice in
 * their library. https://elevenlabs.io/docs/api-reference/text-to-speech
 */
export class ElevenLabsTtsProvider implements TtsProvider {
  readonly name = "elevenlabs";

  async synthesize(text: string, _languageHint?: string): Promise<SynthesizedAudio> {
    const apiKey = process.env["ELEVENLABS_API_KEY"];
    if (!apiKey) throw new Error("ElevenLabsTtsProvider requires ELEVENLABS_API_KEY to be set.");
    const voiceId = process.env["ELEVENLABS_VOICE_ID"] ?? "21m00Tcm4TlvDq8ikWAM";

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "content-type": "application/json", accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
    });
    if (!res.ok) throw new Error(`ElevenLabs responded ${res.status}: ${await res.text()}`);

    return { bytes: new Uint8Array(await res.arrayBuffer()), contentType: "audio/mpeg" };
  }
}

/** Local dev/demo stand-in — returns a tiny silent MP3 instead of calling any API. */
export class MockTtsProvider implements TtsProvider {
  readonly name = "mock";
  async synthesize(_text: string): Promise<SynthesizedAudio> {
    return { bytes: new Uint8Array([0xff, 0xe3, 0x18, 0xc4]), contentType: "audio/mpeg" };
  }
}

export function getDefaultTtsProvider(): TtsProvider {
  return process.env["ELEVENLABS_API_KEY"] ? new ElevenLabsTtsProvider() : new MockTtsProvider();
}
