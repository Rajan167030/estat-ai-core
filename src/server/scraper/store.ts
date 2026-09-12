import type { ScrapedProject } from "./types";
import { keyOf } from "./normalize";

export interface ScraperStore {
  upsertMany(projects: ScrapedProject[]): Promise<{ inserted: number; updated: number }>;
  list(filter?: { source?: string; district?: string }): Promise<ScrapedProject[]>;
  get(source: string, sourceId: string): Promise<ScrapedProject | undefined>;
}

/**
 * Process-memory store — fine for local dev and for the demo server functions.
 * Swap for a real table/KV once this deploys somewhere with persistence
 * (the interface above is the only contract callers depend on).
 */
class InMemoryScraperStore implements ScraperStore {
  private readonly byKey = new Map<string, ScrapedProject>();

  async upsertMany(projects: ScrapedProject[]) {
    let inserted = 0;
    let updated = 0;
    for (const p of projects) {
      const key = keyOf(p);
      if (this.byKey.has(key)) updated++;
      else inserted++;
      this.byKey.set(key, p);
    }
    return { inserted, updated };
  }

  async list(filter?: { source?: string; district?: string }) {
    let out = [...this.byKey.values()];
    if (filter?.source) out = out.filter((p) => p.source === filter.source);
    if (filter?.district) out = out.filter((p) => p.district === filter.district);
    return out.sort((a, b) => a.projectName.localeCompare(b.projectName));
  }

  async get(source: string, sourceId: string) {
    return this.byKey.get(keyOf({ source, sourceId }));
  }
}

let singleton: ScraperStore | undefined;

export function getDefaultScraperStore(): ScraperStore {
  singleton ??= new InMemoryScraperStore();
  return singleton;
}
