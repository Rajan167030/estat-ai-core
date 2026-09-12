import type { SynthesizedAudio } from "./tts";

interface StoredAudio extends SynthesizedAudio {
  expiresAt: number;
}

const TTL_MS = 10 * 60 * 1000;
const store = new Map<string, StoredAudio>();

function sweep() {
  const now = Date.now();
  for (const [id, audio] of store) {
    if (audio.expiresAt < now) store.delete(id);
  }
}

/** Caches synthesized audio in memory and returns an id to fetch it by — Exotel's <Play> needs a plain URL, not raw bytes in a webhook response. */
export function cacheAudio(audio: SynthesizedAudio): string {
  sweep();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  store.set(id, { ...audio, expiresAt: Date.now() + TTL_MS });
  return id;
}

export function getCachedAudio(id: string): SynthesizedAudio | undefined {
  return store.get(id);
}
