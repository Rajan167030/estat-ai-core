import type { CallResult, LeadDialTarget, TranscriptTurn } from "../types";

export interface LiveCallSession {
  id: string;
  lead: LeadDialTarget;
  transcript: TranscriptTurn[];
  turn: number;
  providerCallId?: string;
  startedAt: string;
  result?: CallResult;
}

const sessions = new Map<string, LiveCallSession>();

export function createLiveSession(lead: LeadDialTarget): LiveCallSession {
  const session: LiveCallSession = {
    id: `LIVE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    lead,
    transcript: [],
    turn: 0,
    startedAt: new Date().toISOString(),
  };
  sessions.set(session.id, session);
  return session;
}

export function getLiveSession(id: string): LiveCallSession | undefined {
  return sessions.get(id);
}

export function deleteLiveSession(id: string): void {
  sessions.delete(id);
}

export function listLiveResults(): CallResult[] {
  return [...sessions.values()].map((s) => s.result).filter((r): r is CallResult => Boolean(r));
}
